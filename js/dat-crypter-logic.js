/* * KBC DatFileCrypter - Logic Pro (Layout Optimized)
 * 依存関係: CryptoJS (MD5, AES, enc-Utf8, lib-WordArray, mode-ECB, pad-Pkcs7)
 */

const KEY_BASE = "battlecats";

// 特定のファイル名のマッピング定義
const FILE_MAP = {
    "002a4b18244f32d7833fd81bc833b97f.dat": "sale.tsv",
    "09b1058188348630d98a08e0f731f6bd.dat": "gatya.tsv",
    "408f66def075926baea9466e70504a3b.dat": "item.tsv",
    "523af537946b79c4f8369ed39ba78605.dat": "ad.tsv",
    "sale.tsv": "002a4b18244f32d7833fd81bc833b97f.dat",
    "gatya.tsv": "09b1058188348630d98a08e0f731f6bd.dat",
    "item.tsv": "408f66def075926baea9466e70504a3b.dat",
    "ad.tsv": "523af537946b79c4f8369ed39ba78605.dat"
};

// 国別のソルト定義
const SALTS = { 
    "jp": "battlecats", 
    "kr": "battlecatskr", 
    "en": "battlecatsen", 
    "tw": "battlecatstw" 
};

/**
 * 共通鍵の生成 (MD5ハッシュの先頭16文字を使用)
 */
function getSecretKey() {
    const hash = CryptoJS.MD5(KEY_BASE).toString();
    return CryptoJS.enc.Utf8.parse(hash.substring(0, 16));
}

/**
 * CryptoJSのWordArrayをバイナリ(Uint8Array)に変換
 */
function wordToUint8Array(wordArray) {
    const l = wordArray.sigBytes;
    const words = wordArray.words;
    const result = new Uint8Array(l);
    for (let i = 0; i < l; i++) {
        result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return result;
}

/**
 * ファイルの一括処理（暗号化/復号）
 * @param {string} mode - 'encrypt' または 'decrypt'
 */
async function processAll(mode) {
    const fileInput = document.getElementById('fileInput');
    const locale = document.getElementById('locale').value;
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert("ファイルを選択してください。");
        return;
    }

    const key = getSecretKey();

    for (let file of files) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            let resultUint8;
            let outputName = FILE_MAP[file.name] || (mode === 'decrypt' ? file.name + ".tsv" : file.name + ".dat");

            if (mode === 'decrypt') {
                // 復号処理: 末尾32バイト（署名）を除いた部分をAES復号
                const encryptedSize = arrayBuffer.byteLength - 32;
                if (encryptedSize <= 0) throw new Error("File too small");
                const encryptedPart = CryptoJS.lib.WordArray.create(arrayBuffer.slice(0, encryptedSize));
                const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedPart }, key, { 
                    mode: CryptoJS.mode.ECB, 
                    padding: CryptoJS.pad.Pkcs7 
                });
                resultUint8 = wordToUint8Array(decrypted);
            } else {
                // 暗号化処理: AES暗号化後、ソルトを用いたMD5署名を末尾に付与
                const wordArrays = CryptoJS.lib.WordArray.create(arrayBuffer);
                const encrypted = CryptoJS.AES.encrypt(wordArrays, key, { 
                    mode: CryptoJS.mode.ECB, 
                    padding: CryptoJS.pad.Pkcs7 
                });
                const salt = SALTS[locale] || "battlecats";
                const saltWords = CryptoJS.enc.Utf8.parse(salt);
                const hash = CryptoJS.MD5(saltWords.concat(encrypted.ciphertext)).toString();
                const finalData = encrypted.ciphertext.concat(CryptoJS.enc.Utf8.parse(hash));
                resultUint8 = wordToUint8Array(finalData);
            }
            addResultRow(file.name, outputName, resultUint8, mode);
        } catch (e) {
            console.error("Processing error:", e);
            alert(`${file.name} の処理に失敗しました。ファイル形式やモードを確認してください。`);
        }
    }
}

/**
 * 結果リストに行を追加 (三点リーダー省略レイアウト対応)
 */
function addResultRow(oldName, newName, uint8Data, mode) {
    const tbody = document.getElementById('resultList');
    const blob = new Blob([uint8Data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const row = document.createElement('tr');
    
    let actionButtons = "";
    if (mode === 'decrypt') {
        try {
            // テキストとしてデコードし、Base64で一時保存（特殊文字対策）
            const textContent = new TextDecoder().decode(uint8Data);
            const safeText = btoa(unescape(encodeURIComponent(textContent))); 
            actionButtons = `
                <button class="btn-action view" onclick="showPreview('${newName}', '${safeText}')">表示</button>
                <button class="btn-action copy" onclick="copyFromBase64('${safeText}')">コピー</button>
            `;
        } catch (e) {
            actionButtons = `<span class="muted" style="font-size:10px;">プレビュー不可</span>`;
        }
    }

    row.innerHTML = `
        <td><div class="name-column" title="${oldName}">${oldName}</div></td>
        <td><div class="name-column" title="${newName}"><strong>${newName}</strong></div></td>
        <td class="status-column"><span class="status-badge ${mode}">${mode === 'decrypt' ? '復号' : '暗号'}</span></td>
        <td class="action-column">
            ${actionButtons}
            <a href="${url}" download="${newName}" class="btn-action download">保存</a>
        </td>
    `;
    tbody.prepend(row);
}

/**
 * プレビューエリアに内容を表示
 */
function showPreview(name, base64Content) {
    const container = document.getElementById('previewContainer');
    const area = document.getElementById('previewArea');
    const content = decodeURIComponent(escape(atob(base64Content)));
    
    document.getElementById('previewTitle').textContent = `Preview: ${name}`;
    container.style.display = 'block';
    area.value = content;
    container.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 内容をクリップボードにコピー
 */
function copyFromBase64(base64Content) {
    const content = decodeURIComponent(escape(atob(base64Content)));
    navigator.clipboard.writeText(content).then(() => {
        alert("クリップボードにコピーしました");
    }).catch(err => {
        alert("コピーに失敗しました: " + err);
    });
}

/**
 * 初期化処理
 */
window.addEventListener('DOMContentLoaded', () => {
    // ボタン等への動的なイベント割り当てが必要な場合はここに記述
});

