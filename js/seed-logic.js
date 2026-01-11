/* Seed-Calculator Logic */
const MAX_U32 = 0xFFFFFFFF;
let forwardCancel=false, backCancel=false, distCancel = false;

function toU32(v){
  let n = Number(v);
  if(!Number.isFinite(n)) return NaN;
  n = Math.floor(n);
  n = n >>> 0;
  if(n===0) return 1;
  return n;
}
function isValidSeed(n){ return n>=1 && n<=MAX_U32; }

function xorshift32(x){
  x ^= (x << 13) >>> 0;
  x ^= x >>> 17;
  x ^= (x << 15) >>> 0;
  return x >>> 0;
}
function prevXorshift32(x){
  x ^= (x << 15) >>> 0;
  x ^= (x << 30) >>> 0;
  x ^= x >>> 17;
  x ^= (x << 13) >>> 0;
  x ^= (x << 26) >>> 0;
  return x >>> 0;
}

async function calcLoop(seed, n, fn, mode, progressEl, textEl, cancelFlag){
  seed = toU32(seed);
  const total = n*2;
  let current = seed;

  if(mode==='fast'){
    for(let i=0;i<total;i++){
      if(cancelFlag.value) break;
      current = fn(current);
    }
    progressEl.value = 100;
    textEl.textContent = `進行: 100.00%`;
    return current;
  } else {
    const chunk = mode==='normal' ? Math.max(1, Math.floor(total/1000)) : Math.max(1, Math.floor(total/200));
    for(let i=0;i<total;i++){
      if(cancelFlag.value) break;
      current = fn(current);
      if(i%chunk===0){
        const percent = (i+1)/total*100;
        progressEl.value = percent;
        textEl.textContent = `進行: ${percent.toFixed(2)}%`;
        await new Promise(r=>setTimeout(r,0));
      }
    }
    progressEl.value = 100;
    textEl.textContent = `進行: 100.00%`;
    return current;
  }
}

// 順方向
document.getElementById('btn-forward').addEventListener('click',async()=>{
  forwardCancel={value:false};
  let seed = toU32(document.getElementById('forward-seed').value);
  let n = Math.floor(document.getElementById('forward-n').value);
  let mode = document.getElementById('forward-mode').value;
  if(!isValidSeed(seed)||n<0){ alert('入力エラー'); return; }
  const out = document.getElementById('forward-out');
  const progText = document.getElementById('forward-progress-text');
  const prog = document.getElementById('forward-progress');
  out.textContent='計算中...';
  let res = await calcLoop(seed,n,xorshift32,mode,prog,progText,forwardCancel);
  out.textContent = forwardCancel.value ? 'キャンセル' : `結果: ${res}`;
});

// 逆方向
document.getElementById('btn-back').addEventListener('click',async()=>{
  backCancel={value:false};
  let seed = toU32(document.getElementById('back-seed').value);
  let n = Math.floor(document.getElementById('back-n').value);
  let mode = document.getElementById('back-mode').value;
  if(!isValidSeed(seed)||n<0){ alert('入力エラー'); return; }
  const out = document.getElementById('back-out');
  const progText = document.getElementById('back-progress-text');
  const prog = document.getElementById('back-progress');
  out.textContent='計算中...';
  let res = await calcLoop(seed,n,prevXorshift32,mode,prog,progText,backCancel);
  out.textContent = backCancel.value ? 'キャンセル' : `結果: ${res}`;
});

// 探索
document.getElementById('btn-dist').addEventListener('click',async()=>{
  distCancel={value:false};
  let a = toU32(document.getElementById('dist-a').value);
  let b = toU32(document.getElementById('dist-b').value);
  let dir = document.getElementById('dist-dir').value;
  let mode = document.getElementById('dist-mode').value;
  if(!isValidSeed(a)||!isValidSeed(b)){ alert('入力エラー'); return; }
  const out = document.getElementById('dist-out');
  const prog = document.getElementById('dist-progress');
  const percent = document.getElementById('dist-percent');
  out.textContent='探索中...';
  prog.value=0; percent.textContent='0.00';
  let current = a; let steps = 0;
  let fn = dir==='forward'? xorshift32 : prevXorshift32;
  const chunk = mode==='fast'? 0xFFFFFFFF : (mode==='normal'? 500000 : 50000);
  const maxSteps = 0x100000000;
  while(steps<maxSteps){
    if(distCancel.value){ out.textContent='キャンセル'; break; }
    for(let i=0;i<chunk && steps<maxSteps;i++){
      current = fn(current); steps++;
      if(current===b){
        out.textContent=`到達! 距離: ${Math.floor(steps/2)}ロール`;
        prog.value=100; percent.textContent='100.00';
        return;
      }
    }
    const p = steps/maxSteps*100;
    prog.value = p; percent.textContent = p.toFixed(2);
    if(mode!=='fast') await new Promise(r=>setTimeout(r,0));
  }
  if(current!==b) out.textContent='到達できません';
});

// キャンセル・コピーボタンの一括設定
document.getElementById('btn-forward-cancel').onclick = () => forwardCancel.value=true;
document.getElementById('btn-back-cancel').onclick = () => backCancel.value=true;
document.getElementById('btn-dist-cancel').onclick = () => distCancel.value=true;

const copyResult = async (id) => {
  const txt = document.getElementById(id).textContent.replace(/^結果:\s*|^到達!\s*/,'');
  await navigator.clipboard.writeText(txt).catch(()=>{alert('コピー失敗')});
};
document.getElementById('btn-forward-copy').onclick = () => copyResult('forward-out');
document.getElementById('btn-back-copy').onclick = () => copyResult('back-out');
document.getElementById('btn-dist-copy').onclick = () => copyResult('dist-out');

// テーマ切替
document.getElementById('theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const isDark = getComputedStyle(root).getPropertyValue('--bg').trim() === '#0b1220';
  if (isDark) {
    root.style.setProperty('--bg', '#f5f7fb');
    root.style.setProperty('--card', '#ffffff');
    root.style.setProperty('--text', '#0b1220');
    root.style.setProperty('--muted', '#555');
    root.style.setProperty('--accent', '#2563eb');
    document.body.style.background = 'linear-gradient(180deg, #f5f7fb 0%, #dbeafe 60%)';
    document.getElementById('theme-toggle').textContent = 'ライトモード';
  } else {
    root.style.setProperty('--bg', '#0b1220');
    root.style.setProperty('--card', '#071427');
    root.style.setProperty('--text', '#e6f0fb');
    root.style.setProperty('--muted', '#9fb0c8');
    root.style.setProperty('--accent', '#3b82f6');
    document.body.style.background = 'linear-gradient(180deg, #051026 0%, #081428 60%)';
    document.getElementById('theme-toggle').textContent = 'ダークモード';
  }
});
