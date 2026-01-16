// --- 180曲のデータ定義 (サンプル) ---
const musicData = [
    { id: 1, title: "The Wrath of God", file: "bgm001.ogg", artist: "Battle Cats", time: "03:40" },
    { id: 2, title: "From Beethoven 9", file: "bgm002.ogg", artist: "Evangelion", time: "02:56" },
    // ここに180曲分を追加
];

let currentIndex = -1;
let sleepTimer = null;
const audio = document.getElementById('main-audio');

// --- 1. リストの自動生成 ---
const listContainer = document.getElementById('music-list');
function renderList() {
    document.getElementById('track-count').innerText = `BGMリスト (${musicData.length}曲)`;
    musicData.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = 'bgm-item'; // CSSは以前作成したものを使用
        li.innerHTML = `
            <div class="bgm-icon" onclick="loadTrack(${index})"><span class="material-icons">play_arrow</span></div>
            <div class="bgm-info" onclick="loadTrack(${index})">
                <span class="bgm-title">${track.title}</span>
                <span class="bgm-meta">${track.time}</span>
            </div>
            <div class="bgm-actions">
                <a href="audio/${track.file}" download="${track.title}.ogg" class="action-link"><span class="material-icons">file_download</span></a>
            </div>
        `;
        listContainer.appendChild(li);
    });
}

// --- 2. 再生・読み込み機能 ---
function loadTrack(index) {
    currentIndex = index;
    const track = musicData[index];
    audio.src = `audio/${track.file}`;
    
    // UI更新
    document.getElementById('player-title').innerText = track.title;
    document.getElementById('mini-title').innerText = track.title;
    document.getElementById('player-track-index').innerText = `#${index + 1}/${musicData.length}`;
    
    // お気に入り状態の反映
    updateFavUI(track.title);
    
    audio.play();
    document.getElementById('mini-player').style.display = 'flex';
}

function togglePlay() {
    if (audio.paused) audio.play(); else audio.pause();
}

// --- 3. イベントリスナー ---
document.getElementById('main-play-btn').onclick = togglePlay;
document.getElementById('mini-play-btn').onclick = (e) => { e.stopPropagation(); togglePlay(); };
document.getElementById('next-btn').onclick = () => { if(currentIndex < musicData.length -1) loadTrack(currentIndex + 1); };
document.getElementById('prev-btn').onclick = () => { if(currentIndex > 0) loadTrack(currentIndex - 1); };

// フルプレイヤー開閉
function openFull() { document.getElementById('full-player').classList.add('active'); }
function closeFull() { document.getElementById('full-player').classList.remove('active'); }
document.getElementById('mini-player').onclick = openFull;
document.getElementById('close-player').onclick = (e) => { e.stopPropagation(); closeFull(); };

// --- 4. ストレージ機能 (お気に入り) ---
function updateFavUI(title) {
    const favs = JSON.parse(localStorage.getItem('kbc_favs')) || [];
    const icon = document.querySelector('#fav-btn .material-icons');
    icon.innerText = favs.includes(title) ? 'favorite' : 'favorite_border';
}

document.getElementById('fav-btn').onclick = () => {
    const title = document.getElementById('player-title').innerText;
    let favs = JSON.parse(localStorage.getItem('kbc_favs')) || [];
    if (favs.includes(title)) favs = favs.filter(t => t !== title);
    else favs.push(title);
    localStorage.setItem('kbc_favs', JSON.stringify(favs));
    updateFavUI(title);
};

// --- 5. タイマー機能 ---
document.getElementById('timer-btn').onclick = () => {
    const mins = prompt("停止タイマー(分):", "30");
    if (mins) {
        if (sleepTimer) clearTimeout(sleepTimer);
        sleepTimer = setTimeout(() => { audio.pause(); alert("停止しました"); }, mins * 60000);
    }
};

// 初期化
renderList();
