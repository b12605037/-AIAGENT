import { google } from 'googleapis';

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY',
    );
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

function serializeAnswers(answers) {
  if (!answers || typeof answers !== 'object') return '';
  try {
    return JSON.stringify(answers);
  } catch {
    return String(answers);
  }
}

function flattenRow(payload) {
  const a = payload.answers || {};
  const ts = payload.timestamp || new Date().toISOString();
  const early = payload.early_exit || '';
  const scenario = payload.scenario
    ? serializeAnswers(payload.scenario)
    : '';

  const joinArr = (v) =>
    Array.isArray(v) ? v.join(' | ') : v != null ? String(v) : '';

  return [
    ts,
    early,
    a.gender ?? '',
    a.ntu_student ?? '',
    joinArr(a.video_types),
    a.condensed_exposure ?? '',
    a.subscription ?? '',
    a.condensed_frequency ?? '',
    a.after_condensed ?? '',
    a.after_condensed_followup ?? '',
    joinArr(a.reasons_original),
    a.reasons_original_other ?? '',
    joinArr(a.reasons_no_original),
    a.reasons_no_original_other ?? '',
    a.interest_likelihood ?? '',
    a.subscription_recent ?? '',
    a.perceived_effect ?? '',
    scenario,
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
    const range = `${sheetName}!A:R`;
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
