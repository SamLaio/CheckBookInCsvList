// ==UserScript==
// @name         書庫數據比對工具
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  選取文字後使用 CSV 或 OPDS 查詢書庫資料
// @author       Gemini
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.6.2/fuse.min.js
// @connect      docs.google.com
// @connect      googleusercontent.com
// @connect      *
// ==/UserScript==

/*
 * ==========================================
 * 📖 事前設定說明 (Instructions)
 * ==========================================
 * 1. 選擇查詢模式：
 *    - CONFIG_SEARCH_MODE = 'csv'：使用 Google 試算表 CSV。
 *    - CONFIG_SEARCH_MODE = 'opds'：使用 OPDS 搜尋 API。
 *
 * 2. 準備 Google 試算表：
 *    - 在 Google Sheet 第一列建立標頭（例如：title, isbn, authors）。
 *    - 填入你的書籍或資料。
 *
 * 3. 發佈 CSV 網址：
 *    - 點選「檔案」 > 「共用」 > 「發佈到網路」。
 *    - 選擇「整個文件」或特定工作表，格式請務必選擇「逗號分隔值 (.csv)」。
 *    - 點擊「發佈」並複製產生的網址，貼到下方的 CONFIG_CSV_URL 中。
 *
 * 4. 欄位匹配：
 *    - 確保下方的 CONFIG_SEARCH_KEYS 內容與你試算表第一列的文字完全一致。
 *
 * 5. OPDS 搜尋：
 *    - 將 CONFIG_OPDS.searchUrl 改成你的 OPDS 搜尋網址。
 *    - searchUrl 可使用 {query} 佔位符，例如：https://example.com/opds/search?q={query}
 *
 * 6. 更新頻率：
 *    - 當你修改試算表內容後，Google 通常需要 5 分鐘左右才會更新發佈的 CSV。
 *    - 重新整理網頁即可同步最新資料。
 * ==========================================
 */

(function() {
    'use strict';

    const SCRIPT_VERSION = '1.10';

    // ==========================================
    // ⚙️ 使用者設定區塊 (User Settings)
    // ==========================================

    // [1] 查詢模式：'csv' 或 'opds'
    const CONFIG_SEARCH_MODE = 'csv';

    // [2] Google 試算表 CSV 連結
    const CONFIG_CSV_URL = '你的CSV網址';

    // [3] 要搜尋與顯示的欄位 (請與試算表標頭一致)
    // 腳本會默認第一個欄位為「標題」，其餘顯示在下方資訊區
    const CONFIG_SEARCH_KEYS = ['title', 'isbn', 'authors'];

    // [4] OPDS 查詢設定
    // searchUrl 支援 {query} 佔位符，例如：https://example.com/opds/search?q={query}
    const CONFIG_OPDS = {
        searchUrl: '你的OPDS搜尋網址',
        username: '',
        password: '',
        maxResults: 8
    };

    // [5] 模糊比對比例 (Threshold)
    // 0.0 為絕對精準，0.4~0.5 推薦，1.0 為亂對一通
    const CONFIG_FUZZY_THRESHOLD = 0.45;

    // [6] 介面視覺設定
    const CONFIG_UI = {
        primaryColor: '#1a73e8',       // 按鈕與標題的主題顏色
        panelWidth: '380px',           // 彈窗寬度
        maxResults: 8,                 // 搜尋結果顯示上限
        panelTitle: `📘 書庫比對結果 v${SCRIPT_VERSION}`
    };

    // ==========================================
    // 🚀 核心邏輯區塊 (Logic)
    // ==========================================

    let fuse;
    let csvLoadState = 'idle';

    function isCsvMode() {
        return CONFIG_SEARCH_MODE === 'csv';
    }

    function isOpdsMode() {
        return CONFIG_SEARCH_MODE === 'opds';
    }

    // 非同步載入 CSV 數據
    function loadCloudData() {
        if (!isCsvMode()) {
            csvLoadState = 'skipped';
            return;
        }

        if (!CONFIG_CSV_URL || CONFIG_CSV_URL === '你的CSV網址') {
            csvLoadState = 'skipped';
            return;
        }

        csvLoadState = 'loading';
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
                        csvLoadState = 'ready';
                        console.log("✅ 數據庫已更新，共載入 " + results.data.length + " 筆。");
                    }
                });
            },
            onerror: function() {
                csvLoadState = 'error';
                console.error("❌ 無法從連結抓取資料，請確認 CSV 網址是否正確。");
            }
        });
    }
    loadCloudData();

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function buildOpdsSearchUrl(query) {
        const encodedQuery = encodeURIComponent(query);
        if (CONFIG_OPDS.searchUrl.includes('{query}')) {
            return CONFIG_OPDS.searchUrl.replaceAll('{query}', encodedQuery);
        }

        const separator = CONFIG_OPDS.searchUrl.includes('?') ? '&' : '?';
        return `${CONFIG_OPDS.searchUrl}${separator}q=${encodedQuery}`;
    }

    function getOpdsHeaders() {
        const headers = { Accept: 'application/opds+json, application/json, application/atom+xml, application/xml, text/xml' };
        if (CONFIG_OPDS.username && CONFIG_OPDS.password) {
            headers.Authorization = 'Basic ' + btoa(`${CONFIG_OPDS.username}:${CONFIG_OPDS.password}`);
        }
        return headers;
    }

    function getResponseHeader(responseHeaders, headerName) {
        const targetName = headerName.toLowerCase();
        const lines = String(responseHeaders || '').split('\n');
        const headerLine = lines.find((line) => line.toLowerCase().startsWith(`${targetName}:`));
        if (!headerLine) return '';
        return headerLine.slice(headerLine.indexOf(':') + 1).trim();
    }

    function requestOpds(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: getOpdsHeaders(),
                timeout: 20000,
                onload: (response) => {
                    const status = Number(response.status || 0);
                    if (status < 200 || status >= 300) {
                        reject(new Error(`HTTP ${status || '未知狀態'}`));
                        return;
                    }

                    resolve({
                        body: response.responseText || '',
                        contentType: getResponseHeader(response.responseHeaders, 'content-type')
                    });
                },
                onerror: () => reject(new Error('網路錯誤或 @connect 未允許此網域')),
                ontimeout: () => reject(new Error('連線逾時'))
            });
        });
    }

    function pickFirst(...values) {
        return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';
    }

    function formatAuthors(authorValue) {
        if (!authorValue) return '';
        if (Array.isArray(authorValue)) {
            return authorValue.map((author) => typeof author === 'string' ? author : author.name).filter(Boolean).join(', ');
        }
        if (typeof authorValue === 'object') return authorValue.name || '';
        return String(authorValue);
    }

    function parseOpdsJson(body) {
        const data = JSON.parse(body);
        const publications = data.publications || data.items || data.navigation || [];
        return publications.map((publication) => {
            const metadata = publication.metadata || publication;
            const links = publication.links || [];
            const link = links.find((item) => item.rel === 'http://opds-spec.org/acquisition' || item.rel === 'alternate') || links[0] || {};

            return {
                title: pickFirst(metadata.title, publication.title),
                authors: formatAuthors(pickFirst(metadata.author, metadata.authors, publication.author)),
                isbn: pickFirst(metadata.identifier, metadata.isbn, metadata['dc:identifier']),
                link: link.href || ''
            };
        }).filter((item) => item.title);
    }

    function decodeXmlText(value) {
        return String(value || '')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&quot;', '"')
            .replaceAll('&apos;', "'")
            .replaceAll('&amp;', '&')
            .trim();
    }

    function getXmlTagText(block, tagName) {
        const openTagStart = block.indexOf(`<${tagName}`);
        if (openTagStart === -1) return '';

        const openTagEnd = block.indexOf('>', openTagStart);
        if (openTagEnd === -1) return '';

        const closeTag = `</${tagName}>`;
        const closeTagStart = block.indexOf(closeTag, openTagEnd + 1);
        if (closeTagStart === -1) return '';

        return decodeXmlText(block.slice(openTagEnd + 1, closeTagStart));
    }

    function getXmlAttribute(tagText, attributeName) {
        const attributeStart = tagText.indexOf(`${attributeName}=`);
        if (attributeStart === -1) return '';

        const quoteStart = attributeStart + attributeName.length + 1;
        const quote = tagText[quoteStart];
        if (quote !== '"' && quote !== "'") return '';

        const valueStart = quoteStart + 1;
        const valueEnd = tagText.indexOf(quote, valueStart);
        if (valueEnd === -1) return '';

        return decodeXmlText(tagText.slice(valueStart, valueEnd));
    }

    function findXmlLink(block, preferAcquisition) {
        let cursor = 0;
        let fallback = '';

        while (cursor < block.length) {
            const linkStart = block.indexOf('<link', cursor);
            if (linkStart === -1) break;

            const linkEnd = block.indexOf('>', linkStart);
            if (linkEnd === -1) break;

            const linkTag = block.slice(linkStart, linkEnd + 1);
            const href = getXmlAttribute(linkTag, 'href');
            const rel = getXmlAttribute(linkTag, 'rel');
            if (href && !fallback) fallback = href;
            if (href && (!preferAcquisition || rel.includes('acquisition'))) return href;

            cursor = linkEnd + 1;
        }

        return fallback;
    }

    function parseOpdsXmlFallback(body) {
        const items = [];
        let cursor = 0;

        while (cursor < body.length) {
            const entryStart = body.indexOf('<entry', cursor);
            if (entryStart === -1) break;

            const entryOpenEnd = body.indexOf('>', entryStart);
            const entryEnd = body.indexOf('</entry>', entryOpenEnd + 1);
            if (entryOpenEnd === -1 || entryEnd === -1) break;

            const entry = body.slice(entryOpenEnd + 1, entryEnd);
            const authorBlock = getXmlTagText(entry, 'author');
            const item = {
                title: getXmlTagText(entry, 'title'),
                authors: getXmlTagText(authorBlock, 'name') || decodeXmlText(authorBlock),
                isbn: getXmlTagText(entry, 'dc:identifier') || getXmlTagText(entry, 'identifier'),
                link: findXmlLink(entry, true)
            };

            if (item.title) items.push(item);
            cursor = entryEnd + 8;
        }

        return items;
    }

    function parseOpdsXml(body) {
        const fallbackItems = parseOpdsXmlFallback(body);
        if (fallbackItems.length > 0 || body.includes('<feed')) return fallbackItems;

        throw new Error(`OPDS XML 格式不支援或無法解析：${body.slice(0, 120)}`);
    }

    function parseOpdsResponse(body, contentType) {
        const trimmedBody = body.trim();
        if (!trimmedBody) {
            throw new Error('OPDS 回應是空白內容');
        }

        try {
            if (contentType.includes('json') || trimmedBody.startsWith('{') || trimmedBody.startsWith('[')) {
                return parseOpdsJson(trimmedBody);
            }
            return parseOpdsXml(trimmedBody);
        } catch (error) {
            const fallbackItems = parseOpdsXmlFallback(trimmedBody);
            if (fallbackItems.length > 0 || trimmedBody.includes('<feed')) {
                console.warn('OPDS 解析失敗，已改用容錯 XML 解析。', error);
                return fallbackItems;
            }

            throw error;
        }
    }

    async function searchOpds(query) {
        if (!isOpdsMode() || !CONFIG_OPDS.searchUrl || CONFIG_OPDS.searchUrl === '你的OPDS搜尋網址') {
            return { state: 'skipped', items: [] };
        }

        let stage = '建立查詢網址';
        try {
            const url = buildOpdsSearchUrl(query);
            stage = '送出 OPDS 請求';
            const response = await requestOpds(url);
            stage = '解析 OPDS 回應';
            return {
                state: 'ready',
                items: parseOpdsResponse(response.body, response.contentType).slice(0, CONFIG_OPDS.maxResults)
            };
        } catch (error) {
            console.error(error);
            return { state: 'error', items: [], message: `v${SCRIPT_VERSION} ${stage}失敗：${error.message || '未知錯誤'}` };
        }
    }

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
        .csv-empty {
            padding: 14px 16px; color: #80868b; font-size: 12px; line-height: 1.5;
            border-bottom: 1px solid #f8f9fa;
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

    function getSelectionText() {
        return window.getSelection()?.toString().trim() || '';
    }

    function getSelectionRect(selection) {
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) return rect;

        return Array.from(range.getClientRects()).find((item) => item.width > 0 || item.height > 0) || null;
    }

    function isSelectionInsideTool(selection) {
        const node = selection?.anchorNode;
        const element = node?.nodeType === 1 ? node : node?.parentElement;
        return Boolean(element && (btn.contains(element) || panel.contains(element)));
    }

    function clampPosition(value, min, max) {
        if (max < min) return min;
        return Math.min(Math.max(value, min), max);
    }

    function showSearchButton(rect, fallbackX, fallbackY) {
        btn.style.display = 'block';
        btn.style.visibility = 'hidden';

        const buttonWidth = btn.offsetWidth || 120;
        const buttonHeight = btn.offsetHeight || 40;
        const viewportPadding = 8;
        const minLeft = window.scrollX + viewportPadding;
        const maxLeft = window.scrollX + window.innerWidth - buttonWidth - viewportPadding;
        const minTop = window.scrollY + viewportPadding;
        const maxTop = window.scrollY + window.innerHeight - buttonHeight - viewportPadding;

        const baseLeft = rect
            ? window.scrollX + rect.left + (rect.width / 2) - (buttonWidth / 2)
            : fallbackX;
        let baseTop = rect
            ? window.scrollY + rect.bottom + 8
            : fallbackY + 20;

        if (rect && baseTop > maxTop) {
            baseTop = window.scrollY + rect.top - buttonHeight - 8;
        }

        btn.style.left = clampPosition(baseLeft, minLeft, maxLeft) + 'px';
        btn.style.top = clampPosition(baseTop, minTop, maxTop) + 'px';
        btn.style.visibility = 'visible';
    }

    function updateSearchButton(fallbackX = window.scrollX + 20, fallbackY = window.scrollY + 20) {
        const selection = window.getSelection();
        const selectionText = getSelectionText();

        // 限制選取長度，避免選取整面文字時誤觸。
        if (!selectionText || selectionText.length >= 150 || isSelectionInsideTool(selection)) {
            btn.style.display = 'none';
            return;
        }

        showSearchButton(getSelectionRect(selection), fallbackX, fallbackY);
    }

    // 滑鼠選取監聽
    document.addEventListener('mouseup', (e) => {
        setTimeout(() => updateSearchButton(e.pageX, e.pageY), 50);
    });

    document.addEventListener('selectionchange', () => {
        setTimeout(() => updateSearchButton(), 80);
    });

    function getCsvResults(text) {
        if (!fuse) return [];
        return fuse.search(text).slice(0, CONFIG_UI.maxResults).map((res) => ({
            item: res.item,
            score: Math.round((1 - res.score) * 100)
        }));
    }

    function renderList(listContent, state, items, renderItem, message = '') {
        if (state === 'loading') {
            listContent.insertAdjacentHTML('beforeend', '<li class="csv-empty">查詢中...</li>');
            return;
        }

        if (state === 'skipped') {
            listContent.insertAdjacentHTML('beforeend', '<li class="csv-empty">未啟用。</li>');
            return;
        }

        if (state === 'error') {
            const detail = message ? `：${escapeHtml(message)}` : '，請確認網址、權限或 @connect 設定。';
            listContent.insertAdjacentHTML('beforeend', `<li class="csv-empty">查詢失敗${detail}</li>`);
            return;
        }

        if (items.length === 0) {
            listContent.insertAdjacentHTML('beforeend', '<li class="csv-empty">查無相符資料。</li>');
            return;
        }

        items.forEach((item) => listContent.appendChild(renderItem(item)));
    }

    function createCsvItem(result) {
        const item = result.item;
        const li = document.createElement('li');
        li.className = 'csv-item';

        let detailHtml = '';
        CONFIG_SEARCH_KEYS.forEach((key, index) => {
            if (index > 0) {
                detailHtml += `<strong>${escapeHtml(key)}：</strong>${escapeHtml(item[key] || '---')}<br>`;
            }
        });

        li.innerHTML = `
            <div class="csv-score-tag">相似度 ${result.score}%</div>
            <div class="csv-item-title">${escapeHtml(item[CONFIG_SEARCH_KEYS[0]] || '無標題')}</div>
            <div class="csv-item-info">${detailHtml}</div>
        `;
        return li;
    }

    function createOpdsItem(item) {
        const li = document.createElement('li');
        li.className = 'csv-item';

        const details = [
            item.authors ? `<strong>authors：</strong>${escapeHtml(item.authors)}<br>` : '',
            item.isbn ? `<strong>identifier：</strong>${escapeHtml(item.isbn)}<br>` : ''
        ].join('');

        li.innerHTML = `
            <div class="csv-score-tag">OPDS</div>
            <div class="csv-item-title">${escapeHtml(item.title || '無標題')}</div>
            <div class="csv-item-info">${details || '---'}</div>
        `;
        return li;
    }

    function renderResults(csvResults, opdsState) {
        const listContent = document.getElementById('csv-list-content');
        listContent.innerHTML = '';

        if (isCsvMode()) {
            renderList(listContent, fuse ? 'ready' : csvLoadState, csvResults, createCsvItem);
        }

        if (isOpdsMode()) {
            renderList(listContent, opdsState.state, opdsState.items, createOpdsItem, opdsState.message);
        }
    }

    function showPanel(pageX, pageY) {
        panel.style.left = pageX + 'px';
        panel.style.top = (pageY + 15) + 'px';
        panel.style.display = 'flex';
    }

    // 搜尋動作
    btn.addEventListener('mousedown', async (e) => {
        e.preventDefault();
        const text = getSelectionText();
        const csvResults = isCsvMode() ? getCsvResults(text) : [];

        if (!isCsvMode() && !isOpdsMode()) return;

        renderResults(csvResults, { state: isOpdsMode() ? 'loading' : 'skipped', items: [] });
        showPanel(e.pageX, e.pageY);
        btn.style.display = 'none';

        const opdsState = await searchOpds(text);
        renderResults(csvResults, opdsState);

        const csvHasNoResults = !isCsvMode() || csvResults.length === 0;
        const opdsHasNoResults = !isOpdsMode() || opdsState.items.length === 0;
        if (csvHasNoResults && opdsHasNoResults && opdsState.state !== 'error') {
            btn.innerHTML = '❌ 查無相符資料';
            setTimeout(() => { btn.innerHTML = '🔍 比對資料'; btn.style.display = 'none'; }, 1200);
        }
    });

})();
