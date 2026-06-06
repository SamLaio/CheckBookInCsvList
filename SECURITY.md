# Security Policy / 資安政策

## English

### Scope

This userscript can access configured CSV and OPDS endpoints through Tampermonkey permissions. Security issues include:

- Leaking configured CSV URLs, OPDS tokens, usernames, or passwords
- Sending selected page text to an unexpected host
- Executing untrusted data returned by CSV or OPDS sources
- Breaking page isolation in a way that exposes private page content

### Out of Scope

- Issues caused by intentionally sharing a private CSV or OPDS URL publicly
- Tampermonkey or browser vulnerabilities unrelated to this script
- Problems caused by installing modified copies from untrusted sources
- Public OPDS endpoints that intentionally expose their catalogs

### Reporting

Do not open public issues for security bugs that include private URLs, credentials, or exploitable details.

Instead, contact the maintainer privately and include:

- What you found
- How to reproduce it
- What data or capability is exposed
- Browser, Tampermonkey version, and script version or commit

### Notes for Users

- OPDS Basic Auth credentials in `main.js` are stored as plain script text.
- Treat private OPDS tokens and unpublished CSV URLs like passwords.
- Only install the script from a source you trust.

---

## 繁體中文

### 範圍

這支 userscript 會透過 Tampermonkey 權限存取你設定的 CSV 與 OPDS 端點。資安問題包含：

- 洩漏已設定的 CSV URL、OPDS token、帳號或密碼
- 把網頁上選取的文字送到非預期主機
- 執行 CSV 或 OPDS 回傳的不可信資料
- 破壞頁面隔離，導致私人頁面內容外洩

### 不在範圍

- 使用者主動公開分享私人 CSV 或 OPDS URL 導致的問題
- 與本腳本無關的 Tampermonkey 或瀏覽器漏洞
- 安裝不可信來源修改版造成的問題
- 原本就公開的 OPDS 目錄內容

### 回報方式

如果資安問題包含私人 URL、帳密或可利用細節，請不要開公開 issue。

請私下聯絡維護者，並提供：

- 你發現了什麼
- 怎麼重現
- 哪些資料或能力被暴露
- 瀏覽器、Tampermonkey 版本、腳本版本或 commit

### 使用者提醒

- 寫在 `main.js` 裡的 OPDS Basic Auth 帳密是明文腳本文字。
- 私人 OPDS token 與未公開 CSV URL 請當成密碼保護。
- 只從你信任的來源安裝腳本。
