/* KBC 周回計算機 - Logic (Fixed) */

function calc() {
  const use = parseFloat(document.getElementById('use').value) || 0;
  const count = parseFloat(document.getElementById('count').value) || 0;
  const unit = parseInt(document.getElementById('unit').value) || 1150;

  const ene_value = Math.round(use * count);
  const ship_value = Math.trunc(ene_value / unit);
  const cats_value = Math.trunc(ship_value * 30);

  document.getElementById('ene').value = ene_value;
  document.getElementById('ship').value = ship_value;
  document.getElementById('cats').value = cats_value;
}

function X() {
  const food = parseInt(document.getElementById('food').value) || 0;
  const ships = parseInt(document.getElementById('s1').value) || 0;
  const use_en = parseFloat(document.getElementById('use_en').value) || 0;
  const unit = parseInt(document.getElementById('unit2').value) || 1150;

  if (use_en <= 0) {
    document.getElementById('how').value = 0;
    return;
  }

  const food2 = Math.trunc(food / 30);
  const totalShips = food2 + ships + 1;
  const how_value = Math.trunc((totalShips * unit) / use_en);

  document.getElementById('how').value = how_value;
}

// ページ読み込み時にボタンと関数をしっかり接続する
document.addEventListener('DOMContentLoaded', () => {
  const btn1 = document.getElementById('calcBtn1');
  const btn2 = document.getElementById('calcBtn2');
  
  if(btn1) btn1.addEventListener('click', calc);
  if(btn2) btn2.addEventListener('click', X);
});

