import { google } from 'googleapis';

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

  // 🛠️ 終極安全防呆：去除頭尾可能不小心加到的雙引號，並把所有可能的換行格式一次修正
  privateKey = privateKey.replace(/^"|"$/g, ''); 
  privateKey = privateKey.replace(/\\n/g, '\n'); 

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY',
    );
  }

  // 🛠️ 額外防呆：確保金鑰開頭跟結尾格式完全正確，不管 Vercel 怎麼讀都不會壞
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
  }
  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    privateKey = `${privateKey}\n-----END PRIVATE KEY-----\n`;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

function serializeJson(v) {
  if (v == null) return '';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function joinArr(v) {
  return Array.isArray(v) ? v.join(' | ') : v != null ? String(v) : '';
}

function flattenRow(payload) {
  const a = payload.answers || {};
  const f = payload.followups || {};
  const ts = payload.timestamp || new Date().toISOString();
  const early = payload.early_exit || '';

  const w = a.willingness_by_type || {};

  return [
    ts,
    early,
    a.gender ?? '',
    a.ntu_student ?? '',
    joinArr(a.video_types),
    joinArr(a.condensed_source_types),
    a.condensed_source_other ?? '',
    a.condensed_frequency ?? '',
    joinArr(a.contact_channels),
    a.contact_channels_other ?? '',
    a.subscription ?? '',
    joinArr(a.subscription_reasons),
    a.subscription_reasons_other ?? '',
    a.after_condensed ?? '',
    a.after_condensed_followup ?? '',
    joinArr(a.reasons_original),
    a.reasons_original_other ?? '',
    joinArr(a.reasons_no_original),
    a.reasons_no_original_other ?? '',
    w.tv_series ?? '',
    w.movie ?? '',
    a.overall_willingness_impact ?? '',
    serializeJson(f.q9 ?? a.followup_q9),
    serializeJson(f.q10 ?? a.followup_q10),
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  if (!spreadsheetId) {
    return res
      .status(500)
      .json({ ok: false, error: 'Missing GOOGLE_SHEETS_SPREADSHEET_ID' });
  }

  let payload;
  try {
    payload =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  try {
    const sheets = getSheetsClient();
    const range = `${sheetName}!A:X`;
    const values = [flattenRow(payload)];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('save.js error', e);
    return res.status(500).json({ ok: false, error: e.message || 'Save failed' });
  }
}
