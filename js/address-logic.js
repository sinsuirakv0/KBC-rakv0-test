/* KBC Address Tool - Logic */

/**
 * アドレス計算（進む/戻る）
 * @param {string} direction - 'forward' か 'back'
 */
function calcAddress(direction) {
  const resultEl = document.getElementById("result");
  const base = document.getElementById("baseAddr").value.trim();
  const n = parseInt(document.getElementById("nValue").value, 10);
  const step = parseInt(document.getElementById("step").value, 10);

  // バリデーション：16進数かどうか
  if (!/^[0-9A-Fa-f]+$/.test(base)) {
    resultEl.innerHTML = "<span style='color:#fca5a5;'>❌ 16進数のアドレスを入力してください。</span>";
    return;
  }

  // 計算処理
  const baseDec = BigInt("0x" + base); // 大きなアドレスに対応するためBigIntを使用
  const offset = BigInt(n) * BigInt(step);
  
  let nextAddr;
  if (direction === 'forward') {
    nextAddr = baseDec + offset;
  } else {
    nextAddr = baseDec - offset;
  }

  // 16進数文字列に戻す（元の長さを維持）
  const hexAddr = nextAddr.toString(16).toUpperCase().padStart(base.length, "0");
  const label = direction === 'forward' ? "進む" : "戻る";

  resultEl.innerHTML = `
    <button class="copy-btn" onclick="copyResult()">コピー</button>
    <div style="font-size:0.9rem; color:var(--muted); margin-bottom:5px;">${n}個目の${label}アドレス</div>
    <span id="addrText" style="color:var(--accent); font-family:monospace; font-size:1.4rem; letter-spacing:1px;">${hexAddr}</span>
  `;
}

/**
 * 結果をクリップボードにコピー
 */
function copyResult() {
  const addrText = document.getElementById("addrText");
  if (!addrText) return;

  navigator.clipboard.writeText(addrText.textContent).then(() => {
    const btn = document.querySelector(".copy-btn");
    const original = btn.innerText;
    btn.innerText = "✅ OK";
    btn.style.background = "var(--accent)";
    btn.style.color = "#fff";
    setTimeout(() => {
      btn.innerText = original;
      btn.style.background = "rgba(255,255,255,0.1)";
      btn.style.color = "var(--muted)";
    }, 1500);
  });
}
