# Contributing to CheckBookInCsvList

> English instructions first; 繁體中文版在下半部。

## English

### What This Project Is

`CheckBookInCsvList` is a Tampermonkey userscript that searches a personal book list from selected text on a web page. It supports CSV and OPDS sources.

### Before You Start

1. Read `readme.md` to understand installation and configuration.
2. Open an issue first for non-trivial behavior changes.
3. Avoid committing private CSV URLs, OPDS tokens, usernames, or passwords.

### Development

There is currently no build step. Edit `main.js` directly and test it in Tampermonkey.

Recommended checks:

```text
Install or update main.js in Tampermonkey
Select text on a normal web page
Verify CSV mode with a test CSV URL
Verify OPDS mode with a test search URL
Check empty results and network failures
```

### Code Style

- Keep the userscript installable as a single file.
- Match the surrounding JavaScript style.
- Keep user-facing text clear and primarily Traditional Chinese.
- Comments should explain tradeoffs, compatibility constraints, or non-obvious browser behavior.
- If you change configuration names or defaults, update `readme.md`.

### Pull Requests

Use a short title with a conventional prefix when possible:

```text
fix: handle empty OPDS results
feat: support another OPDS field
docs: clarify searchUrl template
chore: update project templates
```

Include what you tested. If you did not test something, say so.

### License of Contributions

By submitting a PR, you agree your changes are licensed under this project's GPL-3.0 license and that you have the right to grant that license.

---

## 繁體中文

### 這是什麼專案

`CheckBookInCsvList` 是 Tampermonkey userscript，用來在網頁上選取文字後查詢個人書庫清單。支援 CSV 與 OPDS 來源。

### 開始之前

1. 先讀 `readme.md`，了解安裝與設定方式。
2. 非小修的行為改動，請先開 issue 討論。
3. 不要提交私人 CSV URL、OPDS token、帳號或密碼。

### 開發方式

目前沒有 build step。直接改 `main.js`，再放進 Tampermonkey 測試。

建議檢查：

```text
在 Tampermonkey 安裝或更新 main.js
在一般網頁選取文字
用測試 CSV URL 驗證 CSV 模式
用測試搜尋 URL 驗證 OPDS 模式
檢查空結果與網路失敗狀態
```

### 程式碼風格

- 保持 userscript 單檔可安裝。
- 跟周圍 JavaScript 風格一致。
- 使用者可見文字清楚，並以繁體中文為主。
- 註解說明取捨、相容性限制或不直覺的瀏覽器行為。
- 改設定名稱或預設值時，同步更新 `readme.md`。

### Pull Requests

標題盡量短，能用 conventional prefix 更好：

```text
fix: handle empty OPDS results
feat: support another OPDS field
docs: clarify searchUrl template
chore: update project templates
```

請寫清楚測了什麼。沒測過的項目也請直接說。

### 貢獻的授權

送出 PR 即代表你同意改動採用本專案 GPL-3.0 授權，且你有權授權這個改動。
