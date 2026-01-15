/* * KBC DatFileCrypter - Logic Pro (Enhanced with Edit & Re-Encrypt) */

const KEY_BASE = "battlecats";

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

const SALTS = { 
    "jp": "battlecats", 
    "kr": "battlecatskr", 
    "en": "battlecatsen", 
    "tw": "battlecatstw" 
};

// 復号したテキストを保持するためのメモリ
let previewMemory = {};

function getSecretKey() {
    const hash = CryptoJS.MD5(KEY_BASE).toString();
    return CryptoJS.enc.Utf8.parse(hash.substring(0, 16));
}

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
 * ファイルの一括処理
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
                const encryptedSize = arrayBuffer.byteLength - 32;
                if (encryptedSize <= 0) throw new Error("File too small");
                const encryptedPart = CryptoJS.lib.WordArray.create(arrayBuffer.slice(0, encryptedSize));
                const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedPart }, key, { 
                    mode: CryptoJS.mode.ECB, 
                    padding: CryptoJS.pad.Pkcs7 
                });
                resultUint8 = wordToUint8Array(decrypted);
            } else {
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
            alert(`${file.name} の処理に失敗しました。`);
        }
    }
}

/**
 * 結果リストに行を追加
 */
function addResultRow(oldName, newName, uint8Data, mode) {
    const tbody = document.getElementById('resultList');
    const blob = new Blob([uint8Data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const row = document.createElement('tr');
    
    let actionButtons = "";
    if (mode === 'decrypt') {
        try {
            // テキストをメモリに保存（引数での破壊を防止）
            const textContent = new TextDecoder().decode(uint8Data);
            previewMemory[newName] = textContent;

            actionButtons = `
                <button class="btn-action view" onclick="initPreview('${newName}')">表示</button>
                <button class="btn-action copy" onclick="copyFromMemory('${newName}')">コピー</button>
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
 * プレビュー表示（初期化）
 */
let currentEditingKey = "";
function initPreview(name) {
    currentEditingKey = name;
    const container = document.getElementById('previewContainer');
    const area = document.getElementById('previewArea');
    const editBtn = document.getElementById('editToggleBtn');
    const saveBtn = document.getElementById('reEncryptBtn');

    // 状態をリセット
    area.readOnly = true;
    area.value = previewMemory[name];
    area.style.background = "transparent";
    if (editBtn) editBtn.textContent = "編集する";
    if (saveBtn) saveBtn.style.display = "none";

    document.getElementById('previewTitle').textContent = `Preview: ${name}`;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

/**
 * プレビュー内の編集モード切り替え
 */
function toggleEditMode() {
    const area = document.getElementById('previewArea');
    const editBtn = document.getElementById('editToggleBtn');
    const saveBtn = document.getElementById('reEncryptBtn');

    if (area.readOnly) {
        area.readOnly = false;
        area.style.background = "rgba(255,255,255,0.05)";
        editBtn.textContent = "戻る";
        if (saveBtn) saveBtn.style.display = "inline-block";
    } else {
        area.readOnly = true;
        area.style.background = "transparent";
        editBtn.textContent = "編集する";
        if (saveBtn) saveBtn.style.display = "none";
    }
}

/**
 * 編集されたテキストを再暗号化してダウンロード
 */
function saveAndReEncrypt() {
    const content = document.getElementById('previewArea').value;
    const locale = document.getElementById('locale').value;
    
    // 出力名の決定 (sale.tsv -> 002a...dat)
    let targetName = FILE_MAP[currentEditingKey] || currentEditingKey.replace(".tsv", ".dat");
    if (!targetName.endsWith(".dat")) targetName += ".dat";

    if (!confirm(`${targetName} として再暗号化して保存しますか？`)) return;

    try {
        const uint8Data = new TextEncoder().encode(content);
        const key = getSecretKey();
        const wordArrays = CryptoJS.lib.WordArray.create(uint8Data);
        
        const encrypted = CryptoJS.AES.encrypt(wordArrays, key, { 
            mode: CryptoJS.mode.ECB, 
            padding: CryptoJS.pad.Pkcs7 
        });

        const salt = SALTS[locale] || "battlecats";
        const saltWords = CryptoJS.enc.Utf8.parse(salt);
        const hash = CryptoJS.MD5(saltWords.concat(encrypted.ciphertext)).toString();
        const finalData = encrypted.ciphertext.concat(CryptoJS.enc.Utf8.parse(hash));
        
        const resultUint8 = wordToUint8Array(finalData);
        const blob = new Blob([resultUint8], { type: 'application/octet-stream' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = targetName;
        a.click();
    } catch (e) {
        alert("再暗号化エラー: " + e.message);
    }
}

function copyFromMemory(name) {
    const content = previewMemory[name];
    navigator.clipboard.writeText(content).then(() => {
        alert("コピーしました");
    }).catch(err => {
        alert("コピー失敗: " + err);
    });
}
