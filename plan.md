## 現有架構 vs 目標架構

```
現在：
前端 (index.html) → api/chat.js → Gemini

目標：
前端 (index.html) → api/chat.js → Gemini（只在開放題）
                  → api/answer.js → 儲存答案
                  → DB（Google Sheets）
```

---

## 需求清單

### 1. 前端 UI

**版面：**

- 上方固定 header bar，放問卷標題
- 中間對話區塊，置中、有最大寬度（約 600–700px），RWD 自適應
- 機器人有頭貼 + 名稱
- 下方輸入區固定在底部

**互動元件：**

- Quick Reply 按鈕（選擇題、個人資料題）
- 一般文字輸入框（開放式情境題）
- 輸入框只在需要文字輸入時才出現，選擇題時隱藏

---

### 2. 對話流程控制

前端需要維護一個**狀態機**，控制現在在哪一題：

```javascript
const state = {
  stage: "intro",        // 目前階段
  turnCount: 0,          // 情境題已追問幾輪
  answers: {},           // 收集到的所有答案
  scenarioHistory: []    // 情境題的對話歷史（給 Gemini 用）
}
```

流程順序：

```
intro → 個人資料題 → 結構化問題（選擇題）→ 情境題（AI對話）→ 結束
```

---

### 3. 後端 API

**現有的 `api/chat.js` 改造：**

- 接收前面收集到的答案（`answers`）和對話歷史（`history`）
- 把這些資訊帶入 system prompt，讓 Gemini 知道受訪者的背景
- 控制追問邏輯和收尾判斷

**新增 `api/save.js`：**

- 接收完整的填答資料
- 寫入 MongoDB 或 Google Sheets

---

### 4. Gemini System Prompt 設計

這是最關鍵的部分，讓 AI 能讀到前面收集的資訊：

```
你是一個問卷訪談助理，正在進行一份關於「濃縮影片消費行為」的研究訪談。

受訪者基本資料：
- 年齡：{answers.age}
- 是否有串流平台訂閱：{answers.subscription}
- 觀看濃縮片頻率：{answers.frequency}

你現在要針對以下情境題進行訪談：
「{情境題內容}」

規則：
1. 語氣輕鬆、自然，像朋友在聊天
2. 每次只問一個追問，不要一次問很多
3. 如果受訪者已經說明了行為和原因，就收尾，不要繼續追問
4. 最多追問 2 輪，之後一定要收尾
5. 不能評價受訪者的答案
6. 不能討論與問卷無關的話題
7. 收尾時說：「謝謝你的分享！」然後輸出 [END]
```

當前端偵測到回應包含 `[END]`，就自動進入下一題。

---

### 5. 資料儲存

填答完成後，把以下資料一次送出：

```json
{
  "timestamp": "2026-05-16T10:00:00",
  "answers": {
    "age": "18-22",
    "subscription": "有，自己付費",
    "frequency": "一週幾次",
    "q3": "兩個都看，但先看濃縮",
    ...
  },
  "scenario_1": {
    "history": [...],
    "summary": "受訪者表示會說有看過但不提濃縮版，原因是懶得解釋"
  }
}
```

`summary` 可以在收尾時順便叫 Gemini 幫你生成，省去後續人工整理的時間。

---

## 開發順序建議

```
第一步：改前端 UI（版面、對話泡泡、頭貼、Quick Reply 按鈕）
第二步：實作狀態機（流程控制、題目順序）
第三步：改造 api/chat.js（帶入 answers + system prompt）
第四步：實作情境題的 [END] 偵測和追問邏輯
第五步：新增 api/save.js + 串接資料庫
第六步：測試完整流程 + 部署
```

