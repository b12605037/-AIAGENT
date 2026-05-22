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

## 試算表欄位對照（第 1 列標題 · 共 22 欄 A–V）

**若你曾用舊版問卷填過資料，請清空資料列或開新分頁**，否則舊標題列會與新資料對不起來。程式會在標題不符時自動覆寫第 1 列。

| 欄 | 標題 | 對應問卷 |
|----|------|----------|
| A | timestamp | 寫入時間 |
| B | early_exit | 提早結束原因（完整填答為空） |
| C | screening_watched_condensed | 篩選：是否看過濃縮影片 |
| D | gender | 性別 |
| E | age | 年齡 |
| F | ntu_student | 是否台大學生 |
| G | favorite_condensed_types | Q1 最常觀賞濃縮類型 |
| H | favorite_condensed_other | Q1 其他說明 |
| I | watch_motivation | Q2 觀看動機 |
| J | watch_motivation_other | Q2 其他動機 |
| K | actions_after_condensed | Q3 觀看後行動 |
| L | actions_after_other | Q3 其他行動 |
| M | low_effort_no_action_reasons | Q3-1 未進一步行動原因 |
| N | high_effort_watch_reasons | Q3-2 驅動看原版原因 |
| O | high_effort_watch_frequency | Q3-2 實際看原版頻率 |
| P | discovered_via_condensed | Q4 透過濃縮接觸新內容 |
| Q | overall_impact_on_original | Q5 整體影響 |
| R | genres_attract_original | Q6 較易吸引去看的類型 |
| S | genres_attract_other | Q6 其他 |
| T | email | 選填 email（問卷結束後） |
| U | followup_motivation_json | Q2「視作品種類而定」追問紀錄 |
| V | followup_low_effort_json | Q3-1「視作品種類而異」追問紀錄 |

## 寫入時機

1. **問卷本體答完** → `phase: complete`（新增一列，email 可先空白）
2. **有填 email** → `phase: email` + `rowIndex`（**整列更新**，確保 email 在 T 欄、其餘答案不錯位）

## 本機開發

`vercel dev` + `.env.local`（見 [`.env.example`](.env.example)）。
