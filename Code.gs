const CONFIG = {
  CODES_SHEET: '住戶代碼',
  RESPONSES_SHEET: '回覆資料',
  TOKEN_TTL_SECONDS: 1800,
  ALLOW_UPDATE: true
};

function doGet() {
  return json_({ok:true, service:'tianyue-feedback', time:new Date().toISOString()});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '').toLowerCase();
    if (action === 'verify') return verify_(body);
    if (action === 'check') return check_(body);
    if (action === 'submit') return submit_(body);
    return json_({ok:false, message:'未知操作'});
  } catch (err) {
    return json_({ok:false, message:'伺服器處理失敗：' + err.message});
  }
}

function verify_(body) {
  const unit = normUnit_(body.unit);
  const code = normCode_(body.code);
  if (!unit || !/^TY-\d{4}$/.test(code)) return json_({ok:false, message:'戶號或驗證碼格式不正確'});

  const info = lookupHousehold_(unit, code);
  if (!info) return json_({ok:false, message:'戶號或驗證碼不正確'});

  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('sess:' + token, JSON.stringify({
    unit: info.unit,
    building: info.building,
    address: info.address,
    issuedAt: Date.now()
  }), CONFIG.TOKEN_TTL_SECONDS);

  return json_({ok:true, token:token, unit:info.unit, building:info.building, expiresIn:CONFIG.TOKEN_TTL_SECONDS});
}

function check_(body) {
  const session = getSession_(body.token);
  if (!session) return json_({ok:false, message:'驗證已逾時'});
  return json_({ok:true, unit:session.unit, building:session.building, expiresIn:CONFIG.TOKEN_TTL_SECONDS});
}

function submit_(body) {
  const session = getSession_(body.token);
  if (!session) return json_({ok:false, message:'驗證已逾時，請重新登入'});

  const attendance = clean_(body.attendance, 40);
  const electionStance = clean_(body.election_stance, 40);
  const dutyStance = clean_(body.duty_stance, 40);
  if (!attendance || !electionStance || !dutyStance) return json_({ok:false, message:'請完成必填項目'});

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.RESPONSES_SHEET);
  if (!sh) throw new Error('找不到「回覆資料」工作表');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let updated = false;
    if (CONFIG.ALLOW_UPDATE && sh.getLastRow() >= 2) {
      const values = sh.getRange(2, 1, sh.getLastRow()-1, 14).getValues();
      for (let i = values.length - 1; i >= 0; i--) {
        if (String(values[i][1]).trim() === session.unit && String(values[i][12]).trim() === 'active') {
          sh.getRange(i + 2, 13).setValue('superseded');
          updated = true;
          break;
        }
      }
    }

    const id = Utilities.getUuid();
    sh.appendRow([
      new Date(),
      session.unit,
      session.building,
      attendance,
      electionStance,
      joinList_(body.election_topics),
      clean_(body.election_comment, 2000),
      dutyStance,
      joinList_(body.duty_topics),
      clean_(body.duty_comment, 2000),
      clean_(body.other_comment, 3000),
      'web',
      'active',
      id
    ]);
    return json_({ok:true, updated:updated, responseId:id});
  } finally {
    lock.releaseLock();
  }
}

function lookupHousehold_(unit, code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.CODES_SHEET);
  if (!sh) throw new Error('找不到「住戶代碼」工作表');
  if (sh.getLastRow() < 2) return null;
  const rows = sh.getRange(2, 1, sh.getLastRow()-1, 5).getValues();
  for (const r of rows) {
    const active = r[4] === true || String(r[4]).toUpperCase() === 'TRUE' || String(r[4]) === '1';
    if (active && normUnit_(r[0]) === unit && normCode_(r[1]) === code) {
      return {unit:normUnit_(r[0]), building:String(r[2]||''), address:String(r[3]||'')};
    }
  }
  return null;
}

function getSession_(token) {
  token = String(token || '').trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const cache = CacheService.getScriptCache();
  const raw = cache.get('sess:' + token);
  if (!raw) return null;
  cache.put('sess:' + token, raw, CONFIG.TOKEN_TTL_SECONDS);
  return JSON.parse(raw);
}

function normUnit_(v) {
  let s = String(v || '').trim().toUpperCase().replace(/\s+/g,'');
  s = s.replace(/^店([A-I])$/i, (_,x) => '店' + x.toUpperCase());
  return s;
}
function normCode_(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g,'').replace(/[－–—﹣]/g,'-').replace(/^ＴＹ/,'TY');
}
function clean_(v, maxLen) {
  return String(v == null ? '' : v).trim().slice(0, maxLen || 1000);
}
function joinList_(v) {
  if (!Array.isArray(v)) return '';
  return v.map(x => clean_(x, 80)).filter(Boolean).join('、');
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
