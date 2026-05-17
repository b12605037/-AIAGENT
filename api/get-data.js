const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async (req, res) => {
  try {
    // 1. 填入你的 Google Sheet 試算表網址中的那串超長 ID
    const docID = '把這一串換成你的GoogleSheet網址中間那一長串代碼'; 
    
    // 2. 填入你的分頁工作表 ID（預設通常是 '0'，或者是網址最後面 gid= 後面的數字）
    const sheetID = '0'; 

    const doc = new GoogleSpreadsheet(docID);

    // 3. 關鍵安全寫法：讓程式直接去 Vercel 後台抓你塞進去的秘密，GitHub 上完全看不到密碼
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // 自動處理換行符號
    });

    // 4. 載入試算表資料並讀取
    await doc.loadInfo();
    const sheet = doc.sheetsById[sheetID];
    const rows = await sheet.getRows();
    
    const result = [];
    for (let row of rows) {
      result.push(row._rawData);
    }

    // 5. 成功的話，把資料用 JSON 格式回傳
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    // 失敗的話，回傳錯誤訊息
    return res.status(500).json({ success: false, error: error.message });
  }
};
