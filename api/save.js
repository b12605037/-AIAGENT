import { google } from 'googleapis';

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

  // 終極安全防呆：先把可能包在外面的雙引號去掉，再把所有可能的換行偏方一次修正
  privateKey = privateKey.replace(/^"|"$/g, ''); // 去除頭尾可能不小心加到的雙引號
  privateKey = privateKey.replace(/\\n/g, '\n'); // 處理字面上的 \n

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY',
    );
  }

  // 額外防呆：確保金鑰開頭跟結尾格式完全正確
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

// ----------------------------------------------------
// 下方的 serializeJson, flattenRow, handler 等等全部保持原樣，不用動
// ----------------------------------------------------
