import { google } from 'googleapis';

/** 欄位順序須與 flattenRow() 完全一致（共 22 欄，A–V） */
const SHEET_HEADERS = [
  'timestamp',
  'early_exit',
  'screening_watched_condensed',
  'gender',
  'age',
  'ntu_student',
  'favorite_condensed_types',
  'favorite_condensed_other',
  'watch_motivation',
  'watch_motivation_other',
  'actions_after_condensed',
  'actions_after_other',
  'low_effort_no_action_reasons',
  'high_effort_watch_reasons',
  'high_effort_watch_frequency',
  'discovered_via_condensed',
  'overall_impact_on_original',
  'genres_attract_original',
  'genres_attract_other',
  'email',
  'followup_motivation_json',
  'followup_low_effort_json',
];

const ANSWER_KEYS = [
  'screening_watched',
  'gender',
  'age',
  'ntu_student',
  'favorite_condensed_types',
  'favorite_condensed_other',
  'watch_motivation',
  'watch_motivation_other',
  'actions_after_condensed',
  'actions_after_other',
  'low_effort_no_action_reasons',
  'high_effort_watch_reasons',
  'high_effort_watch_frequency',
  'discovered_via_condensed',
  'overall_impact_on_original',
  'genres_attract_original',
  'genres_attract_other',
  'email',
];

function columnLetter(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

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

/** 只取出問卷欄位，避免多餘 key 干擾對應 */
function normalizeAnswers(raw) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const key of ANSWER_KEYS) {
    if (a[key] !== undefined && a[key] !== null) {
      out[key] = a[key];
    }
  }
  return out;
}

function flattenRow(payload) {
  const a = normalizeAnswers(payload.answers);
  const f = payload.followups || {};
  const ts = payload.timestamp || new Date().toISOString();
  const early = payload.early_exit || '';
  const email = payload.email ?? a.email ?? '';

  return [
    ts,
    early,
    a.screening_watched ?? '',
    a.gender ?? '',
    a.age ?? '',
    a.ntu_student ?? '',
    joinArr(a.favorite_condensed_types),
    a.favorite_condensed_other ?? '',
    a.watch_motivation ?? '',
    a.watch_motivation_other ?? '',
    joinArr(a.actions_after_condensed),
    a.actions_after_other ?? '',
    joinArr(a.low_effort_no_action_reasons),
    joinArr(a.high_effort_watch_reasons),
    a.high_effort_watch_frequency ?? '',
    joinArr(a.discovered_via_condensed),
    a.overall_impact_on_original ?? '',
    joinArr(a.genres_attract_original),
    a.genres_attract_other ?? '',
    email,
    serializeJson(f.motivation ?? payload.followup_motivation),
    serializeJson(f.low_effort ?? payload.followup_low_effort),
  ];
}

function parseRowIndex(updatedRange) {
  if (!updatedRange) return null;
  const m = String(updatedRange).match(/![A-Z]+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function headersMatch(current) {
  if (!current || current[0] !== 'timestamp') return false;
  if (current.length < SHEET_HEADERS.length) return false;
  return SHEET_HEADERS.every((h, i) => current[i] === h);
}

async function ensureHeaders(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:1`,
  });
  const current = res.data.values?.[0] || [];

  if (!headersMatch(current)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    });
  }
}

const DATA_RANGE = `A:V`;

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

  const phase = payload.phase || 'complete';
  const rowValues = flattenRow(payload);

  if (rowValues.length !== SHEET_HEADERS.length) {
    return res.status(500).json({
      ok: false,
      error: `Column count mismatch: ${rowValues.length} vs ${SHEET_HEADERS.length}`,
    });
  }

  try {
    const sheets = getSheetsClient();
    await ensureHeaders(sheets, spreadsheetId, sheetName);

    const rowIndex = parseInt(payload.rowIndex, 10);

    if (phase === 'email' && rowIndex > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${DATA_RANGE}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
      });
      return res.status(200).json({ ok: true, rowIndex });
    }

    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!${DATA_RANGE}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowValues] },
    });

    const newRowIndex = parseRowIndex(appendRes.data.updates?.updatedRange);

    return res.status(200).json({ ok: true, rowIndex: newRowIndex });
  } catch (e) {
    console.error('save.js error', e);
    return res.status(500).json({ ok: false, error: e.message || 'Save failed' });
  }
}
