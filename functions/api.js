const MAX_BODY_BYTES = 32 * 1024;
const WINDOW_MS = 60 * 1000;
const LIMITS = { verify: 12, check: 30, submit: 10 };
const buckets = new Map();

const ATTENDANCE = new Set(["本人預計出席", "將委託代理人出席", "目前尚未確定", "無法出席"]);
const STANCES = new Set(["原則支持", "支持但有修正建議", "不支持", "尚需進一步了解"]);
const ELECTION_TOPICS = new Set(["分棟選任", "不分區承續委員", "自願參選", "住戶推舉", "候選不足強制輪值", "停止輪值"]);
const DUTY_TOPICS = new Set(["自願拒任150%", "推舉拒任50%", "輪值拒任100%", "中途辭任", "重大怠職", "基準額計算"]);
const UNSAFE_TEXT = /<\s*script|javascript:|data:text\/html|on(?:error|load)\s*=/i;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

function finish(ctx, data, status, outcome) {
  console.log(JSON.stringify({
    event: "privacy_proxy",
    timestamp: new Date().toISOString(),
    request_id: ctx.requestId,
    action: ctx.action,
    outcome,
    status,
    elapsed_ms: Date.now() - ctx.startedAt
  }));
  return json(data, status);
}

function rateAllowed(request, action) {
  const now = Date.now();
  if (buckets.size > 2048) {
    for (const [key, value] of buckets) {
      if (value.expiresAt <= now) buckets.delete(key);
    }
  }
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = ip + "|" + action + "|" + Math.floor(now / WINDOW_MS);
  const item = buckets.get(key) || { count: 0, expiresAt: now + WINDOW_MS };
  item.count += 1;
  buckets.set(key, item);
  return item.count <= (LIMITS[action] || 10);
}

function token(value) {
  return typeof value === "string" && value.length >= 16 && value.length <= 1024 &&
    !CONTROL_CHARS.test(value) ? value : null;
}

function comment(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.length > 2000 || CONTROL_CHARS.test(value) ||
      UNSAFE_TEXT.test(value) || /^[=+\-@]/.test(value.trim())) return null;
  return value.trim();
}

function topics(value, allowed) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 8 ||
      value.some(item => typeof item !== "string" || !allowed.has(item))) return null;
  return [...new Set(value)];
}

function sanitize(body) {
  if (!body || Array.isArray(body) || typeof body !== "object") return null;

  if (body.action === "verify") {
    const unit = typeof body.unit === "string" ? body.unit.trim().toUpperCase() : "";
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!/^[A-Z0-9店-]{1,16}$/u.test(unit) || !/^TY-\d{4}$/.test(code)) return null;
    return { action: "verify", unit, code };
  }

  if (body.action === "check") {
    const sessionToken = token(body.token);
    return sessionToken ? { action: "check", token: sessionToken } : null;
  }

  if (body.action === "submit") {
    const sessionToken = token(body.token);
    const electionTopics = topics(body.election_topics, ELECTION_TOPICS);
    const dutyTopics = topics(body.duty_topics, DUTY_TOPICS);
    const electionComment = comment(body.election_comment);
    const dutyComment = comment(body.duty_comment);
    const otherComment = comment(body.other_comment);
    if (!sessionToken || !ATTENDANCE.has(body.attendance) ||
        !STANCES.has(body.election_stance) || !STANCES.has(body.duty_stance) ||
        electionTopics === null || dutyTopics === null ||
        electionComment === null || dutyComment === null || otherComment === null) return null;
    return {
      action: "submit",
      token: sessionToken,
      attendance: body.attendance,
      election_stance: body.election_stance,
      election_topics: electionTopics,
      election_comment: electionComment,
      duty_stance: body.duty_stance,
      duty_topics: dutyTopics,
      duty_comment: dutyComment,
      other_comment: otherComment
    };
  }

  return null;
}

async function handleApi(request, env) {
  const ctx = {
    startedAt: Date.now(),
    requestId: request.headers.get("CF-Ray") || crypto.randomUUID(),
    action: "unknown"
  };

  if (request.method !== "POST") {
    return finish(ctx, { ok: false, message: "不支援的請求方式。" }, 405, "method_rejected");
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) {
    return finish(ctx, { ok: false, message: "拒絕跨站請求。" }, 403, "origin_rejected");
  }

  const mediaType = (request.headers.get("Content-Type") || "").split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "text/plain" && mediaType !== "application/json") {
    return finish(ctx, { ok: false, message: "不支援的資料格式。" }, 415, "type_rejected");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return finish(ctx, { ok: false, message: "資料內容過大。" }, 413, "size_rejected");
  }

  let raw;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return finish(ctx, { ok: false, message: "資料格式錯誤。" }, 400, "json_rejected");
  }

  ctx.action = typeof raw?.action === "string" ? raw.action : "unknown";
  const body = sanitize(raw);
  if (!body) {
    return finish(ctx, { ok: false, message: "輸入內容或操作無效。" }, 400, "content_rejected");
  }

  if (!rateAllowed(request, body.action)) {
    return finish(ctx, { ok: false, message: "操作過於頻繁，請稍後再試。" }, 429, "rate_limited");
  }

  let upstreamUrl;
  try {
    upstreamUrl = new URL(env.UPSTREAM_URL);
  } catch {
    return finish(ctx, { ok: false, message: "服務尚未完成設定。" }, 503, "config_missing");
  }
  if (upstreamUrl.protocol !== "https:" || !env.UPSTREAM_HOST ||
      upstreamUrl.hostname !== env.UPSTREAM_HOST) {
    return finish(ctx, { ok: false, message: "服務設定無效。" }, 503, "host_rejected");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: controller.signal
    });

    const responseText = await upstreamResponse.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      return finish(ctx, { ok: false, message: "後端回傳格式異常。" }, 502, "upstream_invalid");
    }

    return finish(ctx, responseBody, upstreamResponse.ok ? 200 : 502,
      upstreamResponse.ok ? "upstream_ok" : "upstream_error");
  } catch {
    return finish(ctx, { ok: false, message: "服務暫時無法使用，請稍後再試。" }, 502, "upstream_failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function onRequest({ request, env }) {
  return handleApi(request, env);
}
