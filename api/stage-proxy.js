export default async function handler(req, res) {
  const { type = 'ND', num = '000' } = req.query;
  const url = `https://ponosgames.com/information/appli/battlecats/stage/${type}${num}.html`;

  try {
    const response = await fetch(url);
    let html = await response.text();

    // スクリプトを注入（必要に応じてステージ数を調整）
    const injection = `
      <script>
        setCurrentStageIndex(120);
        for(let i = 0; i < 120; i++){
          enableData('stage'+i+'_enemy_list');
          enableData('stage'+i+'_enemy_list_1');
          enableData('stage'+i+'_no_continue');
        }
      </script>
    `;

    // </body> の直前にスクリプトを挿入
    html = html.replace('</body>', `${injection}</body>`);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
  } catch (err) {
    console.error('ステージ取得エラー:', err);
    res.status(500).send('ステージ情報の取得に失敗しました');
  }
}
