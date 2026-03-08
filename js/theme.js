/**
 * KBC テーマ切り替えスクリプト
 * 全ページ共通。<nav class="nav"> に自動でボタンを挿入します。
 */
(function () {
  const STORAGE_KEY = 'kbc-theme';

  // ---- ボタンUIを挿入 ----
  const nav = document.querySelector('.nav');
  if (nav) {
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'テーマ切り替え');
    switcher.innerHTML = `
      <button class="theme-btn" data-theme="original" title="サイト本来の色" aria-label="オリジナルテーマ">🎨</button>
      <button class="theme-btn" data-theme="light"    title="ライトモード"    aria-label="ライトモード">☀️</button>
      <button class="theme-btn" data-theme="dark"     title="ダークモード"    aria-label="ダークモード">🌙</button>
    `;
    nav.appendChild(switcher);
  }

  // ---- テーマ適用 ----
  function applyTheme(theme) {
    if (theme === 'original') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem(STORAGE_KEY, theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  // ---- ボタンにイベント登録 ----
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  // ---- 保存済みテーマを復元 ----
  applyTheme(localStorage.getItem(STORAGE_KEY) || 'original');
})();
