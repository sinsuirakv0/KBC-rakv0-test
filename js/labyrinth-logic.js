/* KBC Labyrinth Simulator - Logic */

let summary = {};
let chart;

/**
 * 階層に応じた減少キャラ数の範囲を取得
 */
function getLossRange(floor) {
  if (1 <= floor && floor <= 9) return [3, 5];
  if (floor === 10) return [7, 9];
  if ((11 <= floor && floor <= 19) || (21 <= floor && floor <= 29)) return [3, 5];
  if (floor === 20 || floor === 30) return [7, 9];
  if ((31 <= floor && floor <= 39) || (41 <= floor && floor <= 49) || (51 <= floor && floor <= 59)) return [4, 6];
  if (floor === 40 || floor === 50 || floor === 60) return [7, 9];
  if ((61 <= floor && floor <= 69) || (71 <= floor && floor <= 79) ||
      (81 <= floor && floor <= 89) || (91 <= floor && floor <= 98)) return [5, 7];
  if (floor === 70 || floor === 80 || floor === 90 || floor === 99) return [7, 9];
  return [0, 0];
}

/**
 * シミュレーション実行
 */
function simulate() {
  const reserveCharsStart = parseInt(document.getElementById("chars").value) || 0;
  const floorStart = parseInt(document.getElementById("floor").value) || 1;
  const simCount = parseInt(document.getElementById("count").value) || 1000;
  const winRateValue = parseFloat(document.getElementById("winrate").value) || 100;

  if (winRateValue < 1 || winRateValue > 100) {
    alert("勝率は1〜100%の範囲で入力してください。");
    return;
  }

  const winRate = winRateValue / 100;
  let totalFloors = 0;
  summary = {};

  for (let i = 0; i < simCount; i++) {
    let reserveChars = reserveCharsStart;
    let floor = floorStart;
    let currentChars = 10;
    let defeated = false;

    while (floor <= 99) {
      if (Math.random() > winRate) {
        defeated = true;
        reserveChars -= 2;
        if (reserveChars < 0) reserveChars = 0;
        if (reserveChars + currentChars < 10) break;
        continue;
      }

      let [minLoss, maxLoss] = getLossRange(floor);
      let loss = minLoss + Math.floor(Math.random() * (maxLoss - minLoss + 1));
      currentChars -= loss;
      if (currentChars < 0) currentChars = 0;
      if (currentChars > 0 && Math.random() < 0.6) currentChars += 1;

      let need = 10 - currentChars;
      if (need > 0) {
        if (reserveChars >= need) {
          reserveChars -= need;
          currentChars += need;
        } else {
          break;
        }
      }
      floor++;
    }

    let reachedFloor = floor;
    if (!defeated && floor === 100) {
      reachedFloor = reserveChars >= 10 - currentChars ? 100 : 99;
    }

    totalFloors += reachedFloor;
    summary[reachedFloor] = (summary[reachedFloor] || 0) + 1;
  }

  // 結果表示
  const expected = (totalFloors / simCount).toFixed(2);
  document.getElementById("result").innerHTML = `到達階層期待値：<span style="color:var(--accent); font-size:1.5rem;">${expected}</span> 層`;

  // テーブル更新
  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";
  Object.keys(summary).map(Number).sort((a, b) => a - b).forEach(k => {
    let row = document.createElement("tr");
    row.innerHTML = `<td>${k}層</td><td>${summary[k]}回</td>`;
    tbody.appendChild(row);
  });

  drawChart(summary);
}

/**
 * 円グラフ描画
 */
function drawChart(summary) {
  const labels = [];
  const data = [];
  Object.entries(summary).sort((a,b) => a[0]-b[0]).forEach(([floor, count]) => {
    labels.push(`${floor}層`);
    data.push(count);
  });

  if (chart) chart.destroy();
  const ctx = document.getElementById("resultChart").getContext("2d");
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: labels.map((_, i) => `hsla(${i * 137.5 % 360}, 70%, 60%, 0.8)`),
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#e6f0fb', font: { size: 11 } } }
      }
    }
  });
}

/**
 * CSV出力
 */
function downloadCSV() {
  if (!summary || Object.keys(summary).length === 0) {
    alert("先にシミュレーションを実行してください。");
    return;
  }
  let csv = "クリア階層,到達回数\n";
  Object.keys(summary).map(Number).sort((a, b) => a - b).forEach(k => {
    csv += `${k},${summary[k]}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "labyrinth_sim_result.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// 初期化（フォーム送信イベント）
window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("simForm");
    if(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            simulate();
        });
    }
});
