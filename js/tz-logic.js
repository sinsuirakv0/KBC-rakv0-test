/* KBC World Time - Advanced Logic */
(function(){
  const JST_TZ = 'Asia/Tokyo';
  const SAMOA_TZ = 'Pacific/Pago_Pago';
  const KIRITIMATI_TZ = 'Pacific/Kiritimati';

  let serverBaseDate = null;
  let baseTimestamp = Date.now();
  let changeableCards = [];
  let activeCardId = null;

  // DOM Elements
  const jstTimeEl = document.getElementById('jst-time');
  const jstDateEl = document.getElementById('jst-date');
  const samoaTimeEl = document.getElementById('samoa-time');
  const samoaDateEl = document.getElementById('samoa-date');
  const kiriTimeEl = document.getElementById('kiri-time');
  const kiriDateEl = document.getElementById('kiri-date');
  const kiriPlusTimeEl = document.getElementById('kiri-plus-time');
  const kiriPlusDateEl = document.getElementById('kiri-plus-date');
  const addCardBtn = document.getElementById('addCard');
  const changeablesContainer = document.getElementById('changeablesContainer');
  const activeCardLabel = document.getElementById('activeCardLabel');
  const manualDatetime = document.getElementById('manualDatetime');
  const applyManualBtn = document.getElementById('applyManual');
  const resetToNowBtn = document.getElementById('resetToNow');
  const tzListEl = document.getElementById('tzList');
  const tzSearch = document.getElementById('tzSearch');

  // --- Core Functions ---
  function formatByTZ(dateObj, timeZone) {
    try {
      const fmt = new Intl.DateTimeFormat('ja-JP', {
        year:'numeric',month:'2-digit',day:'2-digit',
        hour:'2-digit',minute:'2-digit',second:'2-digit',
        hour12:false,timeZone
      });
      const p = {}; fmt.formatToParts(dateObj).forEach(x=>p[x.type]=x.value);
      return {date:`${p.year}/${p.month}/${p.day}`, time:`${p.hour}:${p.minute}:${p.second}`};
    } catch { return {date:'N/A', time:'N/A'}; }
  }

  function getVirtualNow(){
    if(!serverBaseDate) return new Date();
    const elapsed = Date.now() - baseTimestamp;
    return new Date(serverBaseDate.getTime() + elapsed);
  }

  async function syncServerTime(){
    try {
      const res = await fetch(`https://worldtimeapi.org/api/timezone/${JST_TZ}`,{mode:'cors'});
      const data = await res.json();
      serverBaseDate = new Date(data.datetime);
    } catch { serverBaseDate = new Date(); }
    baseTimestamp = Date.now();
    if(manualDatetime) manualDatetime.value = toDatetimeLocalValue(serverBaseDate);
  }

  function toDatetimeLocalValue(date){
    const fmt = new Intl.DateTimeFormat('sv',{timeZone:JST_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    return fmt.format(date).replace(' ','T');
  }

  // --- Render ---
  function renderFixedCards(){
    const now = getVirtualNow();
    const jst = formatByTZ(now, JST_TZ);
    jstTimeEl.textContent = jst.time;
    jstDateEl.textContent = `${jst.date} (Asia/Tokyo)`;

    const sam = formatByTZ(now, SAMOA_TZ);
    samoaTimeEl.textContent = sam.time;
    samoaDateEl.textContent = sam.date;

    const k = formatByTZ(now, KIRITIMATI_TZ);
    kiriTimeEl.textContent = k.time;
    kiriDateEl.textContent = k.date;

    const jstNow = new Date(now.toLocaleString("en-US", { timeZone: JST_TZ }));
    const jstPlus36 = new Date(jstNow.getTime() + 36 * 60 * 60 * 1000);
    const kPlus = formatByTZ(jstPlus36, KIRITIMATI_TZ);
    kiriPlusTimeEl.textContent = kPlus.time;
    kiriPlusDateEl.textContent = `${kPlus.date} (JST +36h / Pacific/Kiritimati)`;
  }

  // --- Changeable Cards Logic ---
  function createChangeableCard(tz=JST_TZ,label='Asia/Tokyo',id){
    id = id || 'ch-' + Math.random().toString(36).slice(2,7);
    const el = document.createElement('div');
    el.className = 'card-inner-item'; // スタイル調整用
    el.style.background = "var(--glass)";
    el.style.padding = "12px";
    el.style.borderRadius = "8px";
    el.style.marginBottom = "8px";
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div style="font-size:13px;">
          <b style="color:var(--accent)">Custom</b>: <span class="tz-label">${label}</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <label style="font-size:12px;cursor:pointer;"><input type="radio" name="activeCardRadio" ${activeCardId===id?'checked':''}> 選択</label>
          <button class="removeCard" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;">×</button>
        </div>
      </div>
      <div class="big-time" style="font-size:18px;margin:4px 0;">--:--:--</div>
      <div class="small tz-date" style="font-size:11px;opacity:0.7;">----</div>`;
    
    changeablesContainer.appendChild(el);
    const cardObj = {id,tz,label,el};
    changeableCards.push(cardObj);

    el.querySelector('input[type="radio"]').onchange = () => { activeCardId = id; activeCardLabel.textContent = label; saveState(); };
    el.querySelector('.removeCard').onclick = () => {
      el.remove();
      changeableCards = changeableCards.filter(c => c.id !== id);
      if(activeCardId === id) { activeCardId = null; activeCardLabel.textContent = 'なし'; }
      saveState();
    };
    updateChangeableCardDisplay(cardObj);
    saveState();
  }

  function updateChangeableCardDisplay(c){
    const now=getVirtualNow();
    const f=formatByTZ(now,c.tz);
    c.el.querySelector('.big-time').textContent=f.time;
    c.el.querySelector('.tz-date').textContent=f.date+' ('+c.tz+')';
    c.el.querySelector('.tz-label').textContent=c.tz;
  }

  // --- Timezone List Rendering ---
  async function renderTimezoneList() {
    const zones = Intl.supportedValuesOf('timeZone');
    tzListEl.innerHTML = '';
    zones.forEach(zone => {
      const row = document.createElement('div');
      row.className = 'tz-row';
      row.innerHTML = `<div class="tz-name">${zone}</div><div class="tz-time">---</div>`;
      row.onclick = () => {
        if(activeCardId) {
          const card = changeableCards.find(c => c.id === activeCardId);
          if(card) { card.tz = zone; card.label = zone; updateChangeableCardDisplay(card); saveState(); }
        }
      };
      tzListEl.appendChild(row);
    });
  }

  function updateTzListTimes() {
    const now = getVirtualNow();
    tzListEl.querySelectorAll('.tz-row').forEach(row => {
      const tz = row.querySelector('.tz-name').textContent;
      const f = formatByTZ(now, tz);
      row.querySelector('.tz-time').textContent = f.time;
    });
  }

  // --- Events & Persistence ---
  function saveState(){ localStorage.setItem('worldtime_state', JSON.stringify({cards: changeableCards.map(c=>({id:c.id,tz:c.tz,label:c.label})), active: activeCardId})); }
  function loadState(){
    const data = JSON.parse(localStorage.getItem('worldtime_state') || '{}');
    if(data.cards) data.cards.forEach(c => createChangeableCard(c.tz, c.label, c.id));
    if(data.active) { activeCardId = data.active; const c = changeableCards.find(x=>x.id===data.active); if(c) activeCardLabel.textContent = c.label; }
  }

  tzSearch.oninput = () => {
    const q = tzSearch.value.toLowerCase();
    tzListEl.querySelectorAll('.tz-row').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  applyManualBtn.onclick = () => { if(manualDatetime.value){ serverBaseDate = new Date(manualDatetime.value+':00+09:00'); baseTimestamp = Date.now(); } };
  resetToNowBtn.onclick = syncServerTime;
  addCardBtn.onclick = () => createChangeableCard();

  // --- Init ---
  async function init(){
    await syncServerTime();
    loadState();
    if(changeableCards.length===0) createChangeableCard();
    renderTimezoneList();
    setInterval(() => { renderFixedCards(); changeableCards.forEach(updateChangeableCardDisplay); updateTzListTimes(); }, 1000);
  }
  init();
})();

