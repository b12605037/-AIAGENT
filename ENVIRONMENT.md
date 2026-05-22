# 環境變數（Vercel / 本機）

## Gemini（`/api/chat`）

| 變數 | 說明 |
|------|------|
| `GEMINI_API_KEY` | Google AI Studio / Gemini API 金鑰 |

## Google Sheets（`/api/save`）

| 變數 | 說明 |
|------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account 的 `client_email` |
| `GOOGLE_PRIVATE_KEY` | Service account 的 `private_key` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | 試算表 ID |
| `GOOGLE_SHEETS_SHEET_NAME` | 分頁名稱，預設 `Sheet1` |

**欄位標題**：首次寫入時若 A1 不是 `timestamp`，會自動寫入第 1 列標題（22 欄）。

`timestamp` · `early_exit` · `screening_watched_condensed` · `gender` · `age` · `ntu_student` · `favorite_condensed_types` · `favorite_condensed_other` · `watch_motivation` · `watch_motivation_other` · `actions_after_condensed` · `actions_after_other` · `low_effort_no_action_reasons` · `high_effort_watch_reasons` · `high_effort_watch_frequency` · `discovered_via_condensed` · `overall_impact_on_original` · `genres_attract_original` · `genres_attract_other` · `email` · `followup_motivation_json` · `followup_low_effort_json`

**寫入時機**：
- 問卷本體答完 → `phase: complete`（append 一列，`email` 可為空）
- 選填 email → `phase: email`（更新同一列的 `email` 欄）

## 本機開發

`vercel dev` + `.env.local`（見 [`.env.example`](.env.example)）。
