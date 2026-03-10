-- ============================================================
-- nyanko status editor
-- ============================================================

local SEARCH_PATTERN = "0;800;300000;3;200;0;17"
local REFINE_VALUE   = 300000
local SEARCH_RANGE   = gg.REGION_C_BSS

-- ============================================================
-- STATUS
-- ============================================================
local STATUS = {
  {offset=  -24, name="体力"},
  {offset=  -20, name="KB数"},
  {offset=  -16, name="速度(x2)"},
  {offset=  -12, name="攻撃力"},
  {offset=   -8, name="攻撃終了～移動(pf)"},
  {offset=   -4, name="射程(x4)"},
  {offset=    0, name="お金(x100)"},
  {offset=    4, name="再生産(pf)"},
  {offset=    8, name="当たり判定の位置(x4)"},
  {offset=   12, name="当たり判定の幅(x4)"},
  {offset=   16, name="赤い敵"},
  {offset=   20, name="???"},
  {offset=   24, name="範囲攻撃(単=0/範=1)"},
  {offset=   28, name="攻撃感知～攻撃発生(f)"},
  {offset=   32, name="最小レイヤー 手前50 奥0"},
  {offset=   36, name="最大レイヤー"},
  {offset=   40, name="浮いている敵"},
  {offset=   44, name="黒い敵"},
  {offset=   48, name="メタルな敵"},
  {offset=   52, name="無属性"},
  {offset=   56, name="天使"},
  {offset=   60, name="エイリアン"},
  {offset=   64, name="ゾンビ"},
  {offset=   68, name="めっぽう強い"},
  {offset=   72, name="ふっとばす"},
  {offset=   76, name="動きを止める 確率(%)"},
  {offset=   80, name="動きを止める 時間(f)"},
  {offset=   84, name="動きを遅くする 確率(%)"},
  {offset=   88, name="動きを遅くする 時間(f)"},
  {offset=   92, name="打たれ強い"},
  {offset=   96, name="超ダメージ"},
  {offset=  100, name="クリティカル 確率(%)"},
  {offset=  104, name="ターゲット限定"},
  {offset=  108, name="撃破時お金アップ"},
  {offset=  112, name="城破壊が得意"},
  {offset=  116, name="波動攻撃 確率(%)"},
  {offset=  120, name="波動Lv"},
  {offset=  124, name="攻撃力ダウン 確率(%)"},
  {offset=  128, name="攻撃力ダウン 時間(f)"},
  {offset=  132, name="攻撃力ダウン 割合(%) (割合/100)x攻撃力"},
  {offset=  136, name="攻撃力アップ 体力割合(%)"},
  {offset=  140, name="攻撃力アップ 増加割合(%) (1+x/100)x攻撃力"},
  {offset=  144, name="生き残る 確率(%)"},
  {offset=  148, name="メタル"},
  {offset=  152, name="遠方攻撃 最短射程(x4)"},
  {offset=  156, name="遠方攻撃 最短～最長距離(x4)"},
  {offset=  160, name="波動ダメージ無効"},
  {offset=  164, name="波動ストッパー"},
  {offset=  168, name="ふっとばす無効"},
  {offset=  172, name="動きを止める無効"},
  {offset=  176, name="動きを遅くする無効"},
  {offset=  180, name="攻撃力ダウン無効"},
  {offset=  184, name="ゾンビキラー"},
  {offset=  188, name="魔女キラー"},
  {offset=  192, name="魔女"},
  {offset=  196, name="Attacks before"},
  {offset=  200, name="衝撃波無効"},
  {offset=  204, name="Time before dying"},
  {offset=  208, name="Unit state"},
  {offset=  212, name="攻撃力 二撃目"},
  {offset=  216, name="攻撃力 三撃目"},
  {offset=  220, name="攻撃発生 二撃目(f)"},
  {offset=  224, name="攻撃発生 三撃目(f)"},
  {offset=  228, name="効果能力 一撃目"},
  {offset=  232, name="効果能力 二撃目"},
  {offset=  236, name="効果能力 三撃目"},
  {offset=  240, name="生産アニメ -1:unit 0:モンハン"},
  {offset=  244, name="昇天エフェクト"},
  {offset=  248, name="生産アニメ2"},
  {offset=  252, name="昇天エフェクト2 1:無効 2:有効"},
  {offset=  256, name="バリアブレイカー 確率(%)"},
  {offset=  260, name="ワープ 確率(%)"},
  {offset=  264, name="ワープ 時間(f)"},
  {offset=  268, name="ワープ 最短射程(x4)"},
  {offset=  272, name="ワープ 最短～最長距離(x4)"},
  {offset=  276, name="ワープ無効"},
  {offset=  280, name="使徒"},
  {offset=  284, name="使徒キラー"},
  {offset=  288, name="古代種"},
  {offset=  292, name="古代の呪い無効"},
  {offset=  296, name="超打たれ強い"},
  {offset=  300, name="極ダメージ"},
  {offset=  304, name="渾身の一撃 確率(%)"},
  {offset=  308, name="渾身の一撃 増加割合(%) 1+(x/100)"},
  {offset=  312, name="攻撃無効 確率(%)"},
  {offset=  316, name="攻撃無効 時間(f)(x25)"},
  {offset=  320, name="烈波攻撃 確率(%)"},
  {offset=  324, name="烈波攻撃 最短射程(div4)"},
  {offset=  328, name="烈波攻撃 最短～最長距離(div4)"},
  {offset=  332, name="烈波Lv"},
  {offset=  336, name="毒撃ダメージ無効"},
  {offset=  340, name="烈波ダメージ無効"},
  {offset=  344, name="呪い"},
  {offset=  348, name="呪い 時間(f)"},
  {offset=  352, name="小波動 波動ONの時のみ"},
  {offset=  356, name="シールドブレイカー 確率(%)"},
  {offset=  360, name="悪魔"},
  {offset=  364, name="超生命体特攻"},
  {offset=  368, name="魂攻撃"},
  {offset=  372, name="遠方攻撃 二撃目"},
  {offset=  376, name="遠方攻撃 二撃目 最短射程"},
  {offset=  380, name="遠方攻撃 二撃目 最短～最長距離"},
  {offset=  384, name="遠方攻撃 三撃目"},
  {offset=  388, name="遠方攻撃 三撃目 最短射程"},
  {offset=  392, name="遠方攻撃 三撃目 最短～最長距離"},
  {offset=  396, name="超獣特攻"},
  {offset=  400, name="超獣特攻 確率(%)"},
  {offset=  404, name="超獣特攻 攻撃無効(f)"},
  {offset=  408, name="小烈波 烈波ONの時のみ"},
  {offset=  412, name="烈波カウンター"},
  {offset=  416, name="召喚 unit番号"},
  {offset=  420, name="超賢者特攻"},
  {offset=  424, name="メタルキラー"},
  {offset=  428, name="爆波 確率(%)"},
  {offset=  432, name="爆波 範囲の前方(x4)"},
  {offset=  436, name="爆波 範囲の後方(x4)"},
  {offset=  440, name="爆波無効"},
}

-- ============================================================
-- 検索・リファイン
-- ============================================================
gg.clearResults()
gg.setRanges(SEARCH_RANGE)
gg.searchNumber(SEARCH_PATTERN, gg.TYPE_DWORD)

local results = gg.getResults(99999)
gg.clearResults()

if not results or #results == 0 then
  gg.alert("自動検索で見つかりませんでした\n手動で入力してください")
  local inp = gg.prompt(
    {"検索パターン", "リファイン値（コスト値）"},
    {SEARCH_PATTERN, tostring(REFINE_VALUE)},
    {"text", "number"}
  )
  if not inp then
    gg.toast("キャンセルされました")
    return
  end
  SEARCH_PATTERN = inp[1]
  REFINE_VALUE   = math.floor(tonumber(inp[2]) or 0)

  gg.clearResults()
  gg.setRanges(SEARCH_RANGE)
  gg.searchNumber(SEARCH_PATTERN, gg.TYPE_DWORD)
  results = gg.getResults(99999)
  gg.clearResults()

  if not results or #results == 0 then
    gg.alert("見つかりませんでした\nスクリプトを終了します")
    return
  end
end

gg.toast("検索: " .. #results .. "件ヒット", true)

local refined = {}
for _, r in ipairs(results) do
  if r.value == REFINE_VALUE then
    table.insert(refined, {address = r.address})
  end
end

if #refined == 0 then
  gg.alert("リファイン失敗\nコスト値 [" .. REFINE_VALUE .. "] に一致するものがありませんでした\n(検索結果: " .. #results .. "件)")
  return
end

gg.toast("対象: " .. #refined .. "件", true)

local baseAddr    = refined[1].address
local baseAddrHex = string.format("0x%X", baseAddr)

-- ============================================================
-- バックアップ
-- ============================================================
local backup = {}
for _, ref in ipairs(refined) do
  local readList = {}
  for _, s in ipairs(STATUS) do
    table.insert(readList, {address = ref.address + s.offset, flags = gg.TYPE_DWORD})
  end
  table.insert(backup, {baseAddr = ref.address, vals = gg.getValues(readList)})
end

-- ============================================================
-- リストに保存
-- ============================================================
local function saveToList()
  local listItems = {}
  for _, s in ipairs(STATUS) do
    table.insert(listItems, {
      address = baseAddr + s.offset,
      flags   = gg.TYPE_DWORD,
      name    = s.name
    })
  end
  gg.clearResults()
  gg.addListItems(listItems)
  gg.toast("リストに追加しました (" .. #listItems .. "件)")
end

-- ============================================================
-- セーブ・ロード (gg.saveVariable / gg.loadVariable)
-- ============================================================
local SAVE_KEY = "nyanko_saves_v1"

-- 保存データ全体を取得（なければ空テーブル）
local function getSaves()
  local ok, data = pcall(gg.loadVariable, SAVE_KEY)
  if ok and type(data) == "table" then
    return data
  end
  return {}
end

-- 現在値をスナップショット（offset→value のテーブル）
local function snapshot()
  local snap = {}
  for _, s in ipairs(STATUS) do
    local r = gg.getValues({{address = refined[1].address + s.offset, flags = gg.TYPE_DWORD}})
    if r and r[1] then
      snap[tostring(s.offset)] = r[1].value
    end
  end
  return snap
end

-- セーブメニュー
local function menuSave()
  local saves = getSaves()

  -- スロット名一覧（最大10件）+ 新規
  local slotNames = {}
  for i = 1, 10 do
    slotNames[i] = saves[tostring(i)] and saves[tostring(i)].label or "（空き）"
  end

  local items = {}
  for i = 1, 10 do
    table.insert(items, "スロット " .. i .. ": " .. slotNames[i])
  end
  table.insert(items, "-- キャンセル --")

  local sc = gg.choice(items, nil, "保存するスロットを選択")
  if sc == nil or sc == #items then return end

  -- 名前入力
  local inp = gg.prompt({"セーブ名"}, {slotNames[sc] == "（空き）" and "" or slotNames[sc]}, {"text"})
  if not inp or inp[1] == "" then return end

  saves[tostring(sc)] = {label = inp[1], data = snapshot()}
  local ok, err = pcall(gg.saveVariable, saves, SAVE_KEY)
  if ok then
    gg.toast("セーブしました: " .. inp[1])
  else
    gg.alert("セーブ失敗: " .. tostring(err))
  end
end

-- ロードメニュー
local function menuLoad()
  local saves = getSaves()

  local items = {}
  local validSlots = {}
  for i = 1, 10 do
    local slot = saves[tostring(i)]
    if slot then
      table.insert(items, "スロット " .. i .. ": " .. slot.label)
      table.insert(validSlots, i)
    end
  end

  if #items == 0 then
    gg.alert("セーブデータがありません")
    return
  end

  table.insert(items, "-- キャンセル --")

  while true do
    local sc = gg.choice(items, nil, "ロードするスロットを選択")
    if sc == nil or sc == #items then return end

    local slotIdx = validSlots[sc]
    local slot = saves[tostring(slotIdx)]
    if not slot then return end

    -- 保存内容をプレビュー表示
    -- offset→name のマップを作る
    local offsetToName = {}
    for _, s in ipairs(STATUS) do
      offsetToName[tostring(s.offset)] = s.name
    end

    -- 保存値の一覧を作る
    local previewItems = {}
    for _, s in ipairs(STATUS) do
      local val = slot.data[tostring(s.offset)]
      if val ~= nil then
        table.insert(previewItems, s.name .. " = " .. tostring(val))
      end
    end
    table.insert(previewItems, ">> このデータをロードする <<")
    table.insert(previewItems, "-- 戻る --")

    local pc = gg.choice(previewItems, nil, "[" .. slot.label .. "] の内容")
    if pc == nil or pc == #previewItems then
      -- 戻る → スロット選択に戻る
    elseif pc == #previewItems - 1 then
      -- ロード実行
      local editList = {}
      for _, ref in ipairs(refined) do
        for offsetStr, val in pairs(slot.data) do
          table.insert(editList, {
            address = ref.address + tonumber(offsetStr),
            flags   = gg.TYPE_DWORD,
            value   = math.floor(tonumber(val) or 0)
          })
        end
      end
      gg.setValues(editList)
      gg.toast("ロードしました: " .. slot.label .. " (" .. #editList .. "件)")
      return
    end
    -- 戻るを選んだ場合はスロット選択ループを継続
  end
end

-- ============================================================
-- 書き換え
-- ============================================================
local function applyEdit(offset, val)
  local editList = {}
  for _, ref in ipairs(refined) do
    table.insert(editList, {
      address = ref.address + offset,
      flags   = gg.TYPE_DWORD,
      value   = math.floor(tonumber(val) or 0)
    })
  end
  gg.setValues(editList)
  gg.toast("書き換えました (" .. #editList .. "件)")
end

-- ============================================================
-- メニュー定義
-- ============================================================
local MAIN_MENU = {
  "ステータスを変更する",
  "元の値に戻す",
  "セーブ",
  "ロード",
  "リストに保存",
  "スクリプトを終了"
}

local CONFIRM_MENU = {
  "はい",
  "いいえ"
}

-- スクロール位置記憶
local lastMainPos   = nil
local lastStatusPos = nil

-- どこにいたか: "main" or "status"
local currentScreen = "main"

-- ============================================================
-- メインループ
-- ============================================================
while true do

  -- ステータス画面から非表示になった場合はステータスに直接戻る
  if currentScreen == "status" then

    -- 現在値を読む
    local readList = {}
    for _, s in ipairs(STATUS) do
      table.insert(readList, {address = refined[1].address + s.offset, flags = gg.TYPE_DWORD})
    end
    local cur = gg.getValues(readList)

    local items = {"<< メニューに戻る"}
    for i, s in ipairs(STATUS) do
      local v = cur[i] and tostring(cur[i].value) or "?"
      table.insert(items, s.name .. "  [" .. v .. "]")
    end

    local sc = gg.choice(items, lastStatusPos, "ステータス一覧  対象: " .. #refined .. "件")

    if sc == nil then
      -- 画面外タップ → 非表示
      gg.setVisible(false)
    elseif sc == 1 then
      -- メニューに戻る
      currentScreen = "main"
    else
      lastStatusPos = sc
      local i = sc - 1
      local s  = STATUS[i]
      local cv = cur[i] and tostring(cur[i].value) or "0"
      local inp = gg.prompt({s.name .. " (offset " .. s.offset .. ")"}, {cv}, {"number"})
      if inp and inp[1] ~= nil then
        applyEdit(s.offset, inp[1])
      end
    end

  else
    -- メイン画面

    local mc = gg.choice(
      MAIN_MENU,
      lastMainPos,
      "コストアドレス: " .. baseAddrHex .. "\n対象: " .. #refined .. "件"
    )

    if mc == nil then
      -- 画面外タップ → 非表示
      gg.setVisible(false)

    elseif mc == 1 then
      lastMainPos   = mc
      currentScreen = "status"

    elseif mc == 2 then
      lastMainPos = mc
      for _, bk in ipairs(backup) do
        gg.setValues(bk.vals)
      end
      gg.toast("元の値に戻しました")

    elseif mc == 3 then
      lastMainPos = mc
      menuSave()

    elseif mc == 4 then
      lastMainPos = mc
      menuLoad()

    elseif mc == 5 then
      lastMainPos = mc
      saveToList()

    elseif mc == 6 then
      local cf = gg.choice(CONFIRM_MENU, nil, "本当に終了しますか？")
      if cf == 1 then
        saveToList()
        gg.clearResults()
        os.exit()
      end
    end

  end

  -- 非表示中は待機、再表示で同じ画面に戻る
  while not gg.isVisible() do
    gg.sleep(500)
  end

end
