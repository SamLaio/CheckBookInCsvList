// ==UserScript==
// @name         書庫數據比對工具
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  選取文字後與 Google 發布的 CSV 比對 title, isbn, authors
// @author       Gemini
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.6.2/fuse.min.js
// @connect      docs.google.com
// @connect      googleusercontent.com
// ==/UserScript==

/*
 * ==========================================
 * 📖 事前設定說明 (Instructions)
 * ==========================================
 * 1. 準備 Google 試算表：
 *    - 在 Google Sheet 第一列建立標頭（例如：title, isbn, authors）。
 *    - 填入你的書籍或資料。
 *
 * 2. 發佈 CSV 網址：
 *    - 點選「檔案」 > 「共用」 > 「發佈到網路」。
 *    - 選擇「整個文件」或特定工作表，格式請務必選擇「逗號分隔值 (.csv)」。
 *    - 點擊「發佈」並複製產生的網址，貼到下方的 CONFIG_CSV_URL 中。
 *
 * 3. 欄位匹配：
 *    - 確保下方的 CONFIG_SEARCH_KEYS 內容與你試算表第一列的文字完全一致。
 *
 * 4. 更新頻率：
 *    - 當你修改試算表內容後，Google 通常需要 5 分鐘左右才會更新發佈的 CSV。
 *    - 重新整理網頁即可同步最新資料。
 * ==========================================
 */

(function() {
    'use strict';

    // ==========================================
    // ⚙️ 使用者設定區塊 (User Settings)
    // ==========================================

    // [1] Google 試算表 CSV 連結
    const CONFIG_CSV_URL = '你的CSV網址';

    // [2] 要搜尋與顯示的欄位 (請與試算表標頭一致)
    // 腳本會默認第一個欄位為「標題」，其餘顯示在下方資訊區
    const CONFIG_SEARCH_KEYS = ['title', 'isbn', 'authors'];

    // [3] 模糊比對比例 (Threshold)
    // 0.0 為絕對精準，0.4~0.5 推薦，1.0 為亂對一通
    const CONFIG_FUZZY_THRESHOLD = 0.45;

    // [4] 介面視覺設定
    const CONFIG_UI = {
        primaryColor: '#1a73e8',       // 按鈕與標題的主題顏色
        panelWidth: '320px',           // 彈窗寬度
        maxResults: 8,                 // 搜尋結果顯示上限
        panelTitle: '📘 雲端清單比對結果'
    };

    // ==========================================
    // 🚀 核心邏輯區塊 (Logic)
    // ==========================================

    let fuse;

    // 非同步載入 CSV 數據
    function loadCloudData() {
        GM_xmlhttpRequest({
            method: "GET",
            url: CONFIG_CSV_URL,
            headers: { "Cache-Control": "no-cache" },
            onload: function(response) {
                Papa.parse(response.responseText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        const options = {
                            keys: CONFIG_SEARCH_KEYS,
                            threshold: CONFIG_FUZZY_THRESHOLD,
                            includeScore: true
                        };
                        fuse = new Fuse(results.data, options);
                        console.log("✅ 數據庫已更新，共載入 " + results.data.length + " 筆。");
                    }
                });
            },
            onerror: function() {
                console.error("❌ 無法從連結抓取資料，請確認 CSV 網址是否正確。");
            }
        });
    }
    loadCloudData();

    // 注入 UI 樣式
    GM_addStyle(`
        #csv-search-btn {
            position: absolute; z-index: 10000; padding: 10px 18px;
            background: ${CONFIG_UI.primaryColor}; color: white; border: none; border-radius: 50px;
            cursor: pointer; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-family: sans-serif; font-size: 14px; font-weight: 600;
            transition: transform 0.1s;
        }
        #csv-search-btn:active { transform: scale(0.9); }

        #csv-result-panel {
            position: absolute; width: ${CONFIG_UI.panelWidth}; max-height: 480px;
            background: #ffffff; border-radius: 12px; z-index: 10001;
            display: none; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border: 1px solid #e0e0e0; overflow: hidden;
        }

        .csv-header {
            padding: 14px 18px; background: #fdfdfd; border-bottom: 1px solid #f0f0f0;
            display: flex; justify-content: space-between; align-items: center;
            cursor: move; user-select: none;
        }
        .csv-header-title { font-size: 14px; font-weight: bold; color: #202124; pointer-events: none; }
        .csv-close { cursor: pointer; font-size: 22px; color: #dadce0; line-height: 1; }
        .csv-close:hover { color: #5f6368; }

        .csv-list { overflow-y: auto; padding: 0; margin: 0; list-style: none; background: #fff; }
        .csv-item { padding: 16px; border-bottom: 1px solid #f8f9fa; transition: background 0.2s; }
        .csv-item:hover { background: #fcfcfc; }
        .csv-item:last-child { border-bottom: none; }

        .csv-item-title { color: ${CONFIG_UI.primaryColor}; font-weight: bold; font-size: 15px; margin-bottom: 6px; line-height: 1.4; }
        .csv-item-info { color: #5f6368; font-size: 12px; line-height: 1.6; }
        .csv-item-info strong { color: #3c4043; }
        
        .csv-score-tag {
            display: inline-block; padding: 2px 8px; background: #e8f0fe;
            color: #1967d2; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 8px;
        }
    `);

    // 初始化元件
    const btn = document.createElement('button');
    btn.id = 'csv-search-btn';
    btn.innerHTML = '🔍 比對資料';
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'csv-result-panel';
    panel.innerHTML = `
        <div class="csv-header" id="csv-drag-handle">
            <span class="csv-header-title">${CONFIG_UI.panelTitle}</span>
            <span class="csv-close">×</span>
        </div>
        <ul class="csv-list" id="csv-list-content"></ul>
    `;
    document.body.appendChild(panel);

    panel.querySelector('.csv-close').onclick = () => panel.style.display = 'none';

    // 視窗拖拽功能
    let isDragging = false, offset = { x: 0, y: 0 };
    const handle = panel.querySelector('#csv-drag-handle');
    handle.onmousedown = (e) => {
        isDragging = true;
        offset.x = e.clientX - panel.offsetLeft;
        offset.y = e.clientY - panel.offsetTop;
    };
    document.onmousemove = (e) => {
        if (isDragging) {
            panel.style.left = (e.clientX - offset.x) + 'px';
            panel.style.top = (e.clientY - offset.y) + 'px';
        }
    };
    document.onmouseup = () => isDragging = false;

    // 滑鼠選取監聽
    document.addEventListener('mouseup', (e) => {
        setTimeout(() => {
            const selection = window.getSelection().toString().trim();
            // 限制選取長度，避免選取整面文字時誤觸
            if (selection.length > 0 && selection.length < 150) {
                btn.style.left = e.pageX + 'px';
                btn.style.top = (e.pageY + 20) + 'px';
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        }, 50);
    });

    // 搜尋動作
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const text = window.getSelection().toString().trim();
        if (!fuse) return;

        const results = fuse.search(text).slice(0, CONFIG_UI.maxResults);
        const listContent = document.getElementById('csv-list-content');
        listContent.innerHTML = '';

        if (results.length > 0) {
            results.forEach(res => {
                const item = res.item;
                const score = Math.round((1 - res.score) * 100);
                const li = document.createElement('li');
                li.className = 'csv-item';
                
                // 根據設定的 Key 自動生成詳細內容
                let detailHtml = '';
                CONFIG_SEARCH_KEYS.forEach((key, index) => {
                    if (index > 0) { // 跳過第一個作為標題的 Key
                        detailHtml += `<strong>${key}：</strong>${item[key] || '---'}<br>`;
                    }
                });

                li.innerHTML = `
                    <div class="csv-score-tag">相似度 ${score}%</div>
                    <div class="csv-item-title">${item[CONFIG_SEARCH_KEYS[0]] || '無標題'}</div>
                    <div class="csv-item-info">${detailHtml}</div>
                `;
                listContent.appendChild(li);
            });
            panel.style.left = e.pageX + 'px';
            panel.style.top = (e.pageY + 15) + 'px';
            panel.style.display = 'flex';
        } else {
            btn.innerHTML = '❌ 查無相符資料';
            setTimeout(() => { btn.innerHTML = '🔍 比對資料'; btn.style.display = 'none'; }, 1200);
        }
        btn.style.display = 'none';
    });

})();