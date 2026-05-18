import { google } from 'googleapis';

const SHEET_HEADERS = [
  'timestamp',
  'early_exit',
  'gender',
  'age',
  'ntu_student',
  'condensed_watched_types',
  'condensed_watched_other',
  'streaming_watch_types',
  'condensed_source_types',
  'condensed_source_other',
  'condensed_frequency',
  'contact_channels',
  'contact_channels_other',
  'subscription',
  'subscription_reasons',
  'subscription_reasons_other',
  'after_condensed',
  'after_condensed_followup',
  'reasons_original',
  'reasons_original_other',
  'reasons_no_original',
  'reasons_no_original_other',
  'willingness_drama',
  'willingness_movie',
  'willingness_variety',
  'willingness_anime',
  'willingness_reality',
  'overall_willingness_impact',
  'followup_q2_json',
  'followup_q9_json',
  'followup_q10_json',
];

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

  privateKey = privateKey.replace(/^"|"$/g, '');
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY',
    );
  }

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
    a.age ?? '',
    a.ntu_student ?? '',
    joinArr(a.condensed_watched_types),
    a.condensed_watched_other ?? '',
    joinArr(a.streaming_watch_types),
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
    w.drama ?? '',
    w.movie ?? '',
    w.variety ?? '',
    w.anime ?? '',
    w.reality ?? '',
    a.overall_willingness_impact ?? '',
    serializeJson(f.q2 ?? a.followup_q2),
    serializeJson(f.q9 ?? a.followup_q9),
    serializeJson(f.q10 ?? a.followup_q10),
  ];
}

async function ensureHeaders(sheets, spreadsheetId, sheetName) {
  const headerRange = `${sheetName}!A1`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:AE1`,
  });
  const firstCell = res.data.values?.[0]?.[0];
  if (firstCell !== 'timestamp') {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    });
  }
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
    await ensureHeaders(sheets, spreadsheetId, sheetName);

    const range = `${sheetName}!A:AE`;
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
