/**
 * BGM設定リスト
 * ここに 000.ogg 形式の番号と、表示したい曲名を追加してください。
 */
const tracks = [
    { id: "000", title: "日本侵略！" },
    { id: "001", title: "集まれ！にゃんこ軍団" },
    { id: "002", title: "チャレンジステージ" },
    { id: "003", title: "狂乱のテーマ" },
    // 必要に応じて 180番まで追加
];

const listContainer = document.getElementById('music-list-container');
const countBadge = document.getElementById('track-count');

/**
 * 再生時間を取得して表示を更新する関数
 */
function updateDuration(id) {
    const audio = new Audio(`audio/${id}.ogg`);
    audio.addEventListener('loadedmetadata', () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
        const durationDisplay = document.getElementById(`time-${id}`);
        if (durationDisplay) {
            durationDisplay.innerText = `${minutes}:${seconds}`;
        }
    });
}

/**
 * リストを描画する関数
 */
function renderMusicList() {
    countBadge.innerText = `${tracks.length} Tracks`;
    listContainer.innerHTML = ''; // 初期化

    tracks.forEach(track => {
        const filePath = `audio/${track.id}.ogg`;
        
        const row = document.createElement('div');
        row.className = 'bgm-row';
        row.innerHTML = `
            <div class="bgm-number">${track.id}</div>
            <div class="bgm-title">${track.title}</div>
            <div class="bgm-duration" id="time-${track.id}">--:--</div>
            <div class="bgm-controls">
                <a href="player.html?id=${track.id}" title="再生">
                    <span class="material-icons">play_circle</span>
                </a>
                <a href="${filePath}" download="${track.id}_${track.title}.ogg" title="ダウンロード">
                    <span class="material-icons">download</span>
                </a>
            </div>
        `;
        listContainer.appendChild(row);

        // 時間取得を開始
        updateDuration(track.id);
    });
}

// 実行
document.addEventListener('DOMContentLoaded', renderMusicList);
