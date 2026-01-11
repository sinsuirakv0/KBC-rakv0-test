/* KBC Metadata Analyzer - Logic */

// プレイタイムの換算レート (1秒で30増加)
const PLAYTIME_RATE = 30;

/**
 * 秒を「時間、分、秒」の形式に変換
 */
function formatTimeHours(totalSeconds) {
    totalSeconds = Math.round(totalSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (hours > 0) parts.push(`${hours.toLocaleString()}時間`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}分`);
    parts.push(`${seconds}秒`);

    return parts.join('');
}

/**
 * JSONデータを分析
 */
function analyzeData(data) {
    let itemSummary = {};

    if (data.managedItemDetails && Array.isArray(data.managedItemDetails)) {
        data.managedItemDetails.forEach(detail => {
            const type = detail.managedItemType;
            const amount = detail.amount || 0;
            const action = detail.detailType;

            if (!itemSummary[type]) {
                itemSummary[type] = { get: 0, use: 0, net: 0 };
            }

            if (action === 'get') {
                itemSummary[type].get += amount;
            } else if (action === 'use') {
                itemSummary[type].use += amount;
            }
        });
    }

    for (const type in itemSummary) {
        itemSummary[type].net = itemSummary[type].get - itemSummary[type].use;
    }
    return itemSummary;
}

/**
 * ファイル読み込み処理
 */
function handleFileRead() {
    const fileInput = document.getElementById('jsonFile');
    const resultsDiv = document.getElementById('results');
    const file = fileInput.files[0];

    if (!file) {
        resultsDiv.innerHTML = '<p class="error">ファイルが選択されていません。</p>';
        return;
    }

    resultsDiv.innerHTML = `<p style="color:var(--accent);">解析中... (${file.name})</p>`;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const summary = analyzeData(data);
            displayResults(summary, data);
        } catch (error) {
            resultsDiv.innerHTML = `<p class="error">解析失敗: 有効なJSON形式ではありません。<br><small>${error.message}</small></p>`;
        }
    };
    reader.readAsText(file);
}

/**
 * 結果をHTMLに描画
 */
function displayResults(summary, data) {
    const resultsDiv = document.getElementById('results');
    let html = '';

    // 1. ユーザー情報サマリー
    const rank = data.rank !== undefined ? data.rank.toLocaleString() : 'N/A';
    const playTimeStr = data.playTime !== undefined ? formatTimeHours(data.playTime / PLAYTIME_RATE) : 'N/A';
    const rawPlayTime = data.playTime !== undefined ? data.playTime.toLocaleString() : '---';

    html += `
        <div class="summary-block">
            <div class="summary-item">
                <h4>総プレイ時間 (${PLAYTIME_RATE}倍換算)</h4>
                <strong>${playTimeStr}</strong>
                <span class="sub-text">生データ: ${rawPlayTime}</span>
            </div>
            <div class="summary-item">
                <h4>ユーザーランク</h4>
                <strong>${rank}</strong>
                <span class="sub-text">RANK DATA</span>
            </div>
        </div>
    `;

    // 2. アイテム集計テーブル
    html += '<h3 style="margin-top:30px; font-size:16px; color:var(--muted);">アイテム別 取得/使用履歴</h3>';
    
    const itemTypes = Object.keys(summary).sort();
    if (itemTypes.length > 0) {
        html += `
            <div style="overflow-x: auto;">
                <table class="analyzer-table">
                    <thead>
                        <tr>
                            <th>アイテム</th>
                            <th>取得 (GET)</th>
                            <th>使用 (USE)</th>
                            <th>純増減</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        itemTypes.forEach(type => {
            const item = summary[type];
            const netColor = item.net >= 0 ? 'var(--accent)' : '#ff6b6b';
            html += `
                <tr>
                    <td>${type}</td>
                    <td>${item.get.toLocaleString()}</td>
                    <td>${item.use.toLocaleString()}</td>
                    <td style="color: ${netColor}; font-weight: bold;">${item.net.toLocaleString()}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
    } else {
        html += '<p class="muted">アイテムの使用履歴が見つかりませんでした。</p>';
    }

    // 3. 署名情報
    if (data.signature_v1) {
        html += `
            <div style="margin-top:20px; padding:10px; background:var(--glass); border-radius:5px; font-size:11px; color:var(--muted);">
                署名: <span style="word-break:break-all;">${data.signature_v1}</span>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
}

// イベント設定
window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('readFileButton');
    if(btn) btn.onclick = handleFileRead;
});
