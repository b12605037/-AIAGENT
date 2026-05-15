# 環境變數（Vercel / 本機）

## Gemini（`/api/chat`）

| 變數 | 說明 |
|------|------|
| `GEMINI_API_KEY` | Google AI Studio / Gemini API 金鑰 |

## Google Sheets（`/api/save`）

於 Google Cloud 建立專案、啟用 **Google Sheets API**，建立 **Service Account**，下載 JSON 金鑰；將試算表分享給該 Service Account 的 email（具「編輯者」權限）。

| 變數 | 說明 |
|------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account 的 `client_email` |
| `GOOGLE_PRIVATE_KEY` | Service account 的 `private_key`（整段含 `-----BEGIN...`；在 Vercel 可保留 `\n` 或實際換行） |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | 試算表 ID（網址 `.../d/{ID}/edit` 中間那段） |
| `GOOGLE_SHEETS_SHEET_NAME` | 分頁名稱，預設 `Sheet1` |

建議試算表第一列（A1 起）標題與欄位順序一致（共 18 欄）：

1. `timestamp`  
2. `early_exit`  
3. `gender`  
4. `ntu_student`  
5. `video_types`  
6. `condensed_exposure`  
7. `subscription`  
8. `condensed_frequency`  
9. `after_condensed`  
10. `after_condensed_followup`  
11. `reasons_original`  
12. `reasons_original_other`  
13. `reasons_no_original`  
14. `reasons_no_original_other`  
15. `interest_likelihood`  
16. `subscription_recent`  
17. `perceived_effect`  
18. `scenario_json`

## 本機開發

若需在本機測 API，可使用 [Vercel CLI](https://vercel.com/docs/cli) `vercel dev`。將 [`.env.example`](.env.example) 複製為 `.env.local` 後填入數值（勿將 `.env` / `.env.local` commit）。
