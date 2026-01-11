/* KBC Secret Script - 共通ファイル */

window.addEventListener('DOMContentLoaded', () => {
    /* ===== XORSHIFT32 ロジック ===== */
    function randomUint32() {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] >>> 0;
    }
    function xorshift32_step(x) {
        x = x >>> 0;
        x ^= (x << 13) >>> 0;
        x ^= x >>> 17;
        x ^= (x << 15) >>> 0;
        return x >>> 0;
    }
    function stepMatrix() {
        const mat = new Uint32Array(32);
        for (let j = 0; j < 32; j++) mat[j] = xorshift32_step(1 << j) >>> 0;
        return mat;
    }
    function applyMatrix(mat, v) {
        let out = 0 >>> 0;
        let x = v >>> 0;
        while (x) {
            const lsb = x & -x;
            const idx = 31 - Math.clz32(lsb);
            out ^= mat[idx];
            x &= x - 1;
        }
        return out >>> 0;
    }
    function composeMatrices(A, B) {
        const R = new Uint32Array(32);
        for (let j = 0; j < 32; j++) R[j] = applyMatrix(B, A[j]) >>> 0;
        return R;
    }
    function matrixPow(mat, n) {
        let result = new Uint32Array(32);
        for (let j = 0; j < 32; j++) result[j] = (1 << j) >>> 0;
        let base = mat;
        let e = n >>> 0;
        while (e > 0) {
            if (e & 1) result = composeMatrices(result, base);
            e = Math.floor(e / 2);
            if (e > 0) base = composeMatrices(base, base);
        }
        return result;
    }
    function advanceXorshift32(seed, n) {
        n = n >>> 0;
        if (n === 0) return seed >>> 0;
        const M = stepMatrix();
        const Mpow = matrixPow(M, n);
        return applyMatrix(Mpow, seed) >>> 0;
    }

    /* ===== ロゴクリックトリガー ===== */
    let clickTimes = [];
    let overlayOpen = false;
    // IDでもクラスでも探せるように強化
    const logo = document.getElementById("logo") || document.querySelector(".logo img") || document.querySelector(".header-left img");

    if (logo) {
        logo.style.cursor = "pointer";
        logo.addEventListener("click", () => {
            const now = Date.now();
            clickTimes.push(now);
            clickTimes = clickTimes.filter(t => now - t < 1000);
            if (clickTimes.length >= 5 && !overlayOpen) {
                clickTimes = [];
                showSecretPrompt();
            }
        });
    }

    /* ===== シークレット画面の表示 ===== */
    function showSecretPrompt() {
        overlayOpen = true;

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.background = "rgba(0,0,0,0.88)";
        overlay.style.color = "#fff";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = 9999;
        overlay.style.fontFamily = "JetBrains Mono, monospace";
        overlay.style.textAlign = "center";
        overlay.style.padding = "20px";

        const card = document.createElement("div");
        card.style.maxWidth = "520px";
        card.style.width = "100%";
        card.style.background = "#071427";
        card.style.borderRadius = "12px";
        card.style.padding = "20px";
        card.style.boxShadow = "0 8px 40px rgba(2,6,23,0.6)";
        card.style.color = "#e6f0fb";

        function hex32(n) {
            return "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
        }

        card.innerHTML = `
            <h2 style="margin:0 0 8px;color:#3b82f6;">KBC Secret Access</h2>
            <p style="margin:0 0 12px;color:#9fb0c8;font-size:14px;">こんにちは</p>
            <div style="text-align:left;margin-bottom:12px;">
                <div style="font-size:12px;color:#9fb0c8;">CODE A</div>
                <div style="font-weight:700;margin:6px 0;" id="kbcA"></div>
                <div style="font-size:12px;color:#8ea0b8;" id="kbcAhex"></div>
                <div style="height:10px;"></div>
                <div style="font-size:12px;color:#9fb0c8;">CODE B</div>
                <div style="font-weight:700;margin:6px 0;" id="kbcB"></div>
                <div style="font-size:12px;color:#8ea0b8;" id="kbcBhex"></div>
            </div>
            <input id="kbcInput" placeholder="答えはここに" style="width:80%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit;font-size:14px;">
            <div style="height:10px;"></div>
            <button id="kbcVerify" style="padding:10px 18px;border-radius:8px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-weight:600;">確認</button>
            <button id="kbcClose" style="margin-left:8px;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:#9fb0c8;cursor:pointer;">閉じる</button>
            <p id="kbcMsg" style="margin-top:12px;color:#fca5a5;display:none;"></p>
        `;
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const inputEl = card.querySelector("#kbcInput");
        const verifyBtn = card.querySelector("#kbcVerify");
        const closeBtn = card.querySelector("#kbcClose");
        const msgEl = card.querySelector("#kbcMsg");
        const codeAEl = card.querySelector("#kbcA");
        const codeAHexEl = card.querySelector("#kbcAhex");
        const codeBEl = card.querySelector("#kbcB");
        const codeBHexEl = card.querySelector("#kbcBhex");

        let codeA, codeB, correctAnswer;

        function regenerateCodes() {
            codeA = randomUint32();
            const tmp = new Uint32Array(1);
            crypto.getRandomValues(tmp);
            const targetStep = tmp[0] >>> 0;
            codeB = advanceXorshift32(codeA, targetStep);
            correctAnswer = Math.floor(targetStep / 2) >>> 0;

            codeAEl.textContent = codeA;
            codeAHexEl.textContent = hex32(codeA);
            codeBEl.textContent = codeB;
            codeBHexEl.textContent = hex32(codeB);
        }

        regenerateCodes();

        function showMsg(m, ok = false) {
            msgEl.style.display = "block";
            msgEl.style.color = ok ? "#a7f3d0" : "#fca5a5";
            msgEl.textContent = m;
        }

        function closeOverlay() {
            if (!overlayOpen) return;
            overlayOpen = false;
            overlay.remove();
        }

        verifyBtn.addEventListener("click", () => {
            const raw = inputEl.value.trim();
            if (!/^\d+$/.test(raw)) {
                showMsg("整数を入力してください。");
                return;
            }
            const v = parseInt(raw, 10) >>> 0;
            if (v === correctAnswer) {
                showMsg("認証成功！移動します…", true);
                setTimeout(() => {
                    closeOverlay();
                    window.location.href = "secret-index.html";
                }, 600);
            } else {
                showMsg("コードが違いますよ笑。");
                regenerateCodes();
                inputEl.value = "";
                inputEl.focus();
            }
        });

        closeBtn.addEventListener("click", closeOverlay);
        overlay.addEventListener("click", e => { if (e.target === overlay) closeOverlay(); });
        inputEl.focus();
    }
});
