const MAX_BODY_BYTES = 32 * 1024;
const ALLOWED_ACTIONS = new Set(["verify", "check", "submit"]);

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

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return json({ ok: false, message: "不支援的請求方式。" }, 405);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ ok: false, message: "拒絕跨站請求。" }, 403);
  }

  const mediaType = (request.headers.get("Content-Type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "text/plain" && mediaType !== "application/json") {
    return json({ ok: false, message: "不支援的資料格式。" }, 415);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, message: "資料內容過大。" }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, message: "資料內容過大。" }, 413);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, message: "資料格式錯誤。" }, 400);
  }

  if (!body || Array.isArray(body) || typeof body !== "object" ||
      !ALLOWED_ACTIONS.has(body.action)) {
    return json({ ok: false, message: "無效的操作。" }, 400);
  }

  let upstreamUrl;
  try {
    upstreamUrl = new URL(env.UPSTREAM_URL);
  } catch {
    return json({ ok: false, message: "服務尚未完成設定。" }, 503);
  }
  if (upstreamUrl.protocol !== "https:") {
    return json({ ok: false, message: "服務設定無效。" }, 503);
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
      body: rawBody,
      redirect: "follow",
      signal: controller.signal
    });

    const responseText = await upstreamResponse.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      return json({ ok: false, message: "後端回傳格式異常。" }, 502);
    }

    return json(responseBody, upstreamResponse.ok ? 200 : 502);
  } catch {
    return json({ ok: false, message: "服務暫時無法使用，請稍後再試。" }, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
