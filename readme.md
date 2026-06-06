# 🚀 書庫數據比對工具

這是一個強大的油猴腳本 (Userscript)，讓你能在任何網頁上透過「選取文字」即時比對書庫資料。支援 Google 試算表 CSV 與 OPDS 兩種查詢模式，具備模糊搜尋、多結果顯示與可拖拽 UI。

---

## ✨ 功能特色

- **☁️ CSV 模式**：直接讀取 Google 試算表發佈的 CSV 連結，資料更新免改代碼。
- **📚 OPDS 模式**：可改用 OPDS 搜尋端點查詢書庫，支援 OPDS 1.x Atom/XML 與 OPDS 2 JSON 的常見回傳格式。
- **🔍 模糊比對系統**：整合 `Fuse.js` 引擎，即便網頁文字與清單有些微差異（如多餘空白、標點符號）也能搜尋成功。
- **🖱️ 智慧彈窗按鈕**：僅在選取文字時出現，不干擾正常網頁瀏覽。
- **🗔 可拖拽 UI**：結果面板可點擊標題列隨意移動，方便對照網頁內容。
- **🛠️ 高度自定義**：頂部參數區可快速修改搜尋欄位、模糊率（Threshold）與介面顏色。

---

## 🛠️ 事前準備與安裝

### 1. 安裝管理器
確保你的瀏覽器已安裝 [Tampermonkey](https://www.tampermonkey.net/) 擴充功能。

### 2. 設定 Google 試算表 (關鍵步驟)
為了讓腳本能存取資料，請依照以下步驟發佈你的表格：
1. 開啟你的 Google 試算表。
2. 點選 **檔案 (File)** > **共用 (Share)** > **發佈到網路 (Publish to web)**。
3. 在彈窗中：
   - 選擇「整個文件」或特定工作表。
   - 將格式改為 **逗號分隔值 (.csv)**。
4. 點擊「發佈」並複製產生的網址。

### 3. 安裝腳本
1. 在 Tampermonkey 中點選「新增腳本」。
2. 將本專案的 `main.js` 內容完整貼上。
3. **修改參數：** 在腳本最上方設定 `CONFIG_SEARCH_MODE`，再依模式填入 CSV 或 OPDS 網址。
4. 儲存 (Ctrl+S)。

---

## ⚙️ 參數自訂說明

在腳本頂部的 `使用者設定區塊` 可以根據需求調整：

| 變數名稱 | 說明 | 範例值 |
| :--- | :--- | :--- |
| `CONFIG_SEARCH_MODE` | 查詢模式，可用 `csv` 或 `opds` | `'csv'` |
| `CONFIG_CSV_URL` | Google 試算表發佈的 CSV 連結 | `'https://docs.google.com/...'` |
| `CONFIG_SEARCH_KEYS` | 要比對的欄位名稱 (需與試算表首列一致) | `['title', 'isbn', 'authors']` |
| `CONFIG_OPDS.searchUrl` | OPDS 搜尋網址，可使用 `{query}` 代表選取文字 | `'https://example.com/opds/search?q={query}'` |
| `CONFIG_OPDS.username` | OPDS Basic Auth 帳號，沒有登入需求可留空 | `''` |
| `CONFIG_OPDS.password` | OPDS Basic Auth 密碼，沒有登入需求可留空 | `''` |
| `CONFIG_FUZZY_THRESHOLD` | 模糊率 (0 為精準，0.4-0.5 推薦) | `0.45` |
| `CONFIG_UI.primaryColor` | UI 主題顏色 | `'#1a73e8'` |

### 模式範例

只使用 CSV：

```js
const CONFIG_SEARCH_MODE = 'csv';
const CONFIG_CSV_URL = 'https://docs.google.com/...';
```

只使用 OPDS：

```js
const CONFIG_SEARCH_MODE = 'opds';
const CONFIG_OPDS = {
    searchUrl: 'https://example.com/opds/search?q={query}',
    username: '',
    password: '',
    maxResults: 8
};
```

---

## 📖 使用教學

1. **選取文字**：在任何網頁上反白選取你想要比對的文字（例如書名、ISBN 或作者）。
2. **點擊搜尋**：滑鼠旁邊會出現一個藍色的 `🔍 比對資料` 按鈕。
3. **查看結果**：
   - 若有匹配，會出現白色浮動視窗顯示詳細資訊與「匹配度」。
   - 按住視窗頂部 **「📘 書庫比對結果」** 區域即可自由拖動。
4. **關閉視窗**：點擊右上角的 `×` 即可關閉結果。

---

## 🧰 技術細節

- **CSV 解析**: [PapaParse](https://www.papaparse.com/)
- **搜尋引擎**: [Fuse.js](https://fusejs.io/)
- **OPDS 解析**: 原生 `DOMParser` 與 JSON 解析
- **網路請求**: `GM_xmlhttpRequest` (處理跨網域資料抓取)
- **UI 樣式**: 純 CSS 注入 (Material Design 風格)

---

## 📜 免責聲明
本工具僅供個人自動化使用。請確保你發佈到網路的 Google 試算表不含敏感私密資訊，因為「發佈到網路」意即知道連結的人皆可讀取該 CSV 內容。
