/* KBC 効率計算機 - Logic */

/**
 * メインの効率計算
 */
function calculate() {
  const before = parseFloat(document.getElementById("beforeValue").value);
  const after = parseFloat(document.getElementById("afterValue").value);
  const h = parseFloat(document.getElementById("hours").value) || 0;
  const m = parseFloat(document.getElementById("minutes").value) || 0;
  const s = parseFloat(document.getElementById("seconds").value) || 0;

  const resultBox = document.getElementById("resultBox");

  if (isNaN(before) || isNaN(after)) {
    resultBox.innerHTML = "<span style='color:#fca5a5;'>数値を正しく入力してください。</span>";
    return;
  }

  const diff = after - before;
  const totalSeconds = h * 3600 + m * 60 + s;

  if (totalSeconds <= 0) {
    resultBox.innerHTML = "<span style='color:#fca5a5;'>時間を入力してください。</span>";
    return;
  }

  const perHour = diff / (totalSeconds / 3600);
  const perMinute = diff / (totalSeconds / 60);
  const perSecond = diff / totalSeconds;

  resultBox.innerHTML = `
    <div style="font-size:0.8rem; color:var(--muted); margin-bottom:5px;">計算結果</div>
    <div style="display:grid; grid-template-columns: 80px 1fr; gap:5px;">
      <span>差分：</span><b style="color:var(--accent);">${diff.toLocaleString()}</b>
      <span>毎時：</span><b>${perHour.toFixed(2).toLocaleString()}</b>
      <span>毎分：</span><b>${perMinute.toFixed(2).toLocaleString()}</b>
      <span>毎秒：</span><b>${perSecond.toFixed(4)}</b>
    </div>
  `;
}

/**
 * 結果をクリップボードにコピー
 */
function copyResult() {
  const text = document.getElementById("resultBox").innerText;
  if (text.includes("入力してください")) return;
  
  navigator.clipboard.writeText(text).then(() => {
    alert("結果をコピーしました！");
  });
}

/* ---- 電卓機能 ---- */
let calcExpression = "";

function appendCalc(v) {
  const display = document.getElementById("calcDisplay");
  if (calcExpression === "0") calcExpression = "";
  calcExpression += v;
  display.innerText = calcExpression;
}

function clearCalc() {
  calcExpression = "";
  document.getElementById("calcDisplay").innerText = "0";
}

function calculateCalc() {
  const display = document.getElementById("calcDisplay");
  try {
    // 簡易的な計算実行
    const result = eval(calcExpression);
    display.innerText = result;
    calcExpression = result.toString();
  } catch {
    display.innerText = "Error";
    calcExpression = "";
  }
}

function toggleCalculator() {
  const c = document.getElementById("calculator");
  const isHidden = (c.style.display === "none" || c.style.display === "");
  c.style.display = isHidden ? "block" : "none";
}
