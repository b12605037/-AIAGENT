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
| `GOOGLE_PRIVATE_KEY` | Service account 的 `private_key` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | 試算表 ID |
| `GOOGLE_SHEETS_SHEET_NAME` | 分頁名稱，預設 `Sheet1` |

**欄位標題**：首次寫入時，`/api/save` 會自動在第 1 列寫入標題（若 A1 不是 `timestamp`）。若你已有舊資料列、沒有標題，可手動在第 1 列插入一行，或清空試算表後再測一次。

標題順序（31 欄）：

`timestamp` · `early_exit` · `gender` · `age` · `ntu_student` · `condensed_watched_types` · `condensed_watched_other` · `streaming_watch_types` · `condensed_source_types` · `condensed_source_other` · `condensed_frequency` · `contact_channels` · `contact_channels_other` · `subscription` · `subscription_reasons` · `subscription_reasons_other` · `after_condensed` · `after_condensed_followup` · `reasons_original` · `reasons_original_other` · `reasons_no_original` · `reasons_no_original_other` · `willingness_drama` · `willingness_movie` · `willingness_variety` · `willingness_anime` · `willingness_reality` · `overall_willingness_impact` · `followup_q2_json` · `followup_q9_json` · `followup_q10_json`

## 本機開發

`vercel dev` + `.env.local`（見 [`.env.example`](.env.example)）。
