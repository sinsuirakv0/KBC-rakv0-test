// lib/saveParser.js
// Python io/data.py + io/save.py の JS変換（バイナリパーサー）
import { computeSaveHash } from './crypto.js';
import { ALL_COUNTRY_CODES, CC_TO_PATCHING_CODE } from './clientInfo.js';

// ─── DataReader (data.py の Data クラスに対応) ──────────────────────────────

export class DataReader {
  /**
   * @param {Buffer} buf - セーブファイルのバイナリ
   */
  constructor(buf) {
    this.buf = buf;
    this.pos = 0;
  }

  get remaining() { return this.buf.length - this.pos; }

  readBytes(n) {
    const slice = this.buf.slice(this.pos, this.pos + n);
    this.pos += n;
    return slice;
  }

  readInt()    { const v = this.buf.readInt32LE(this.pos);  this.pos += 4; return v; }
  readUInt()   { const v = this.buf.readUInt32LE(this.pos); this.pos += 4; return v; }
  readShort()  { const v = this.buf.readInt16LE(this.pos);  this.pos += 2; return v; }
  readUShort() { const v = this.buf.readUInt16LE(this.pos); this.pos += 2; return v; }
  readByte()   { const v = this.buf.readInt8(this.pos);     this.pos += 1; return v; }
  readUByte()  { const v = this.buf.readUInt8(this.pos);    this.pos += 1; return v; }
  readFloat()  { const v = this.buf.readFloatLE(this.pos);  this.pos += 4; return v; }
  readDouble() { const v = this.buf.readDoubleLE(this.pos); this.pos += 8; return v; }
  readBool()   { return this.readByte() !== 0; }
  readLong()   { const v = this.buf.readBigInt64LE(this.pos); this.pos += 8; return Number(v); }
  readULong()  { const v = this.buf.readBigUInt64LE(this.pos); this.pos += 8; return Number(v); }

  /** read_string(): 4バイト長 + UTF-8文字列 */
  readString(length = null) {
    const len = length ?? this.readInt();
    const bytes = this.readBytes(len);
    return bytes.toString('utf-8');
  }

  /** read_string_list(): 4バイトcount + count個のreadString */
  readStringList(count = null) {
    const n = count ?? this.readInt();
    const result = [];
    for (let i = 0; i < n; i++) result.push(this.readString());
    return result;
  }

  /** read_int_list(): 4バイトcount + count個のreadInt */
  readIntList(count = null) {
    const n = count ?? this.readInt();
    const result = [];
    for (let i = 0; i < n; i++) result.push(this.readInt());
    return result;
  }

  /** read_bool_list() */
  readBoolList(count = null) {
    const n = count ?? this.readInt();
    const result = [];
    for (let i = 0; i < n; i++) result.push(this.readBool());
    return result;
  }

  /** read_byte_list() */
  readByteList(count = null) {
    const n = count ?? this.readInt();
    const result = [];
    for (let i = 0; i < n; i++) result.push(this.readByte());
    return result;
  }

  /** read_short_list() */
  readShortList(count = null) {
    const n = count ?? this.readInt();
    const result = [];
    for (let i = 0; i < n; i++) result.push(this.readShort());
    return result;
  }

  /** read_int_tuple_list() */
  readIntTupleList(count = null) {
    const n = count ?? this.readInt();
    const result = [];
    for (let i = 0; i < n; i++) result.push([this.readInt(), this.readInt()]);
    return result;
  }

  /** read_int_bool_dict() */
  readIntBoolDict(count = null) {
    const n = count ?? this.readInt();
    const result = {};
    for (let i = 0; i < n; i++) { result[this.readInt()] = this.readBool(); }
    return result;
  }

  /** read_int_int_dict() */
  readIntIntDict(count = null) {
    const n = count ?? this.readInt();
    const result = {};
    for (let i = 0; i < n; i++) { result[this.readInt()] = this.readInt(); }
    return result;
  }

  /** read_int_double_dict() */
  readIntDoubleDict(count = null) {
    const n = count ?? this.readInt();
    const result = {};
    for (let i = 0; i < n; i++) { result[this.readInt()] = this.readDouble(); }
    return result;
  }

  /** read_short_bool_dict() */
  readShortBoolDict(count = null) {
    const n = count ?? this.readInt();
    const result = {};
    for (let i = 0; i < n; i++) { result[this.readShort()] = this.readBool(); }
    return result;
  }

  readDate() {
    const year   = this.readInt();
    const month  = this.readInt();
    const day    = this.readInt();
    const hour   = this.readInt();
    const minute = this.readInt();
    const second = this.readInt();
    return new Date(year, month - 1, day, hour, minute, second);
  }

  /** assert に相当: 指定値と一致しなければ例外 */
  assertInt(expected) {
    const v = this.readInt();
    if (v !== expected) throw new Error(`assertInt failed: expected ${expected}, got ${v} at pos ${this.pos - 4}`);
  }

  /** 現在位置を退避/復元するためのスナップショット */
  snapshot() { return this.pos; }
  restore(pos) { this.pos = pos; }
}

// ─── CC検出 ─────────────────────────────────────────────────────────────────

/**
 * MD5ハッシュを使って国コードを自動検出
 * @param {Buffer} buf
 * @returns {string|null} 'jp' | 'en' | 'kr' | 'tw' | null
 */
export function detectCC(buf) {
  const storedHash = buf.slice(buf.length - 32).toString('utf-8');
  for (const cc of ALL_COUNTRY_CODES) {
    const computed = computeSaveHash(CC_TO_PATCHING_CODE[cc], buf);
    if (computed === storedHash) return cc;
  }
  return null;
}

// ─── 複合構造体スキッパー（追加ソースファイルが必要な部分） ──────────────────
//
// 以下の各 skip* 関数は、対応するPythonクラスの read() に相当します。
// 各クラスのソースファイルを確認次第、正確な実装に差し替えます。
//
// 必要なファイル:
//   game/battle/slots.py       → skipLineUps, skipLineUps2
//   game/catbase/stamp.py      → skipStampData
//   game/map/story.py          → skipStoryChapters, etc.
//   game/catbase/cat.py        → skipCatsUnlocked, skipCatsUpgrade, etc.
//   game/catbase/special_skill.py → skipSpecialSkills
//   game/battle/battle_items.py   → skipBattleItems
//   game/catbase/gatya.py      → skipGatya, skipGatya2, etc.
//   game/map/event.py          → skipEventChapters
//   game/catbase/user_rank_rewards.py → skipUserRankRewards
//   game/map/item_reward_stage.py     → skipItemRewardChapters
//   game/map/timed_score.py    → skipTimedScoreChapters
//   game/catbase/officer_pass.py      → readOfficerPass
//   game/gamoto/gamatoto.py    → skipGamatoto
//   game/catbase/login_bonuses.py → skipLoginBonus
//   game/map/map_option.py     → skipItemPack
//   game/map/chapters.py       → skipExChapters
//   game/map/dojo.py           → skipDojo
//   game/map/outbreaks.py      → skipOutbreaks
//   game/catbase/scheme_items.py → skipSchemeItems
//   game/catbase/unlock_popups.py → skipUnlockPopups
//   game/gamoto/ototo.py       → skipOtoto
//   game/catbase/beacon_base.py → skipBeaconBase
//   game/map/tower.py          → skipTower
//   game/catbase/mission.py    → skipMissions
//   game/map/challenge.py      → skipChallenge
//   game/map/map_reset.py      → skipMapResets
//   game/map/uncanny.py        → skipUncanny
//   game/map/legend_quest.py   → skipLegendQuest
//   game/catbase/medals.py     → skipMedals
//   game/map/gauntlets.py      → skipGauntlets
//   game/map/enigma.py         → skipEnigma
//   game/battle/cleared_slots.py → skipClearedSlots
//   game/catbase/talent_orbs.py  → skipTalentOrbs
//   game/gamoto/cat_shrine.py    → skipCatShrine
//   game/map/aku.py              → skipAku
//   game/catbase/gambling.py     → skipGamblingEvent

// TODO: 上記ファイルが揃い次第、各 skipXxx を実装する
// 現在は NotImplementedError をスローするスタブ

function _notImpl(name) {
  throw new Error(
    `TODO: ${name} のスキップ実装が必要です。対応するPythonファイルを提供してください。`
  );
}

function skipLineUps(r, gv)            { _notImpl('LineUps.read'); }
function skipLineUps2(r, gv)           { _notImpl('LineUps.read_2'); }
function skipStampData(r)              { _notImpl('StampData.read'); }
function skipStoryChapters(r)          { _notImpl('StoryChapters.read'); }
function skipCatsUnlocked(r, gv)       { _notImpl('Cats.read_unlocked'); }
function skipCatsUpgrade(r, gv)        { _notImpl('Cats.read_upgrade'); }
function skipCatsCurrentForm(r, gv)    { _notImpl('Cats.read_current_form'); }
function skipSpecialSkills(r)          { _notImpl('SpecialSkills.read_upgrades'); }
function skipBattleItems(r)            { _notImpl('BattleItems.read_items'); }
function skipBattleItemsLocked(r)      { _notImpl('BattleItems.read_locked_items'); }
function skipGatyaRareNormalSeed(r, gv){ _notImpl('Gatya.read_rare_normal_seed'); }
function skipGatya2(r)                 { _notImpl('Gatya.read2'); }
function skipGatyaTradeProgress(r)     { _notImpl('Gatya.read_trade_progress'); }
function skipEventChapters(r, gv)      { _notImpl('EventChapters.read'); }
function skipEventLegendRestrictions(r, gv) { _notImpl('event_stages.read_legend_restrictions'); }
function skipUserRankRewards(r, gv)    { _notImpl('UserRankRewards.read'); }
function skipCatsGatyaSeen(r, gv)      { _notImpl('Cats.read_gatya_seen'); }
function skipSpecialSkillsGatyaSeen(r) { _notImpl('SpecialSkills.read_gatya_seen'); }
function skipCatsStorage(r, gv)        { _notImpl('Cats.read_storage'); }
function skipCatsMaxUpgradeLevels(r, gv){ _notImpl('Cats.read_max_upgrade_levels'); }
function skipSpecialSkillsMaxLevels(r) { _notImpl('SpecialSkills.read_max_upgrade_levels'); }
function skipCatsUnlockedForms(r, gv)  { _notImpl('Cats.read_unlocked_forms'); }
function skipItemRewardChapters(r, gv) { _notImpl('ItemRewardChapters.read'); }
function skipTimedScoreChapters(r, gv) { _notImpl('TimedScoreChapters.read'); }
function skipStoryTreasureFestival(r)  { _notImpl('StoryChapters.read_treasure_festival'); }
function skipStoryItfTimedScores(r)    { _notImpl('StoryChapters.read_itf_timed_scores'); }
function skipMySale(r)                 { _notImpl('MySale.read_bonus_hash'); }
function skipGatyaEventSeed(r, gv)     { _notImpl('Gatya.read_event_seed'); }
function skipGatyaStepup(r)            { _notImpl('Gatya.read_stepup'); }
function skipCatsCatguideCollected(r)  { _notImpl('Cats.read_catguide_collected'); }
function skipCatsFourthForms(r)        { _notImpl('Cats.read_fourth_forms'); }
function skipCatsCateyesUsed(r)        { _notImpl('Cats.read_catseyes_used'); }
function skipGamatoto(r)               { _notImpl('Gamatoto.read'); }
function skipGamatoto2(r)              { _notImpl('Gamatoto.read_2'); }
function skipGamatotoSkin(r)           { _notImpl('Gamatoto.read_skin'); }
function skipExChapters(r)             { _notImpl('ExChapters.read'); }
function skipItemPack(r)               { _notImpl('ItemPack.read'); }
function skipLoginBonus(r, gv)         { _notImpl('LoginBonus.read'); }
function skipItemRewardObtains(r)      { _notImpl('item_reward_stages.read_item_obtains'); }
function skipCatsFavorites(r)          { _notImpl('Cats.read_favorites'); }
function skipDojo(r)                   { _notImpl('Dojo.read_chapters'); }
function skipDojoItemLocks(r)          { _notImpl('Dojo.read_item_locks'); }
function skipOutbreaks(r)              { _notImpl('Outbreaks.read_chapters'); }
function skipOutbreaks2(r)             { _notImpl('Outbreaks.read_2'); }
function skipSchemeItems(r)            { _notImpl('SchemeItems.read'); }
function skipOutbreaksCurrentOutbreaks(r, gv){ _notImpl('Outbreaks.read_current_outbreaks'); }
function skipCatsCharaNewFlags(r)      { _notImpl('Cats.read_chara_new_flags'); }
function skipItemPackDisplayedPacks(r) { _notImpl('ItemPack.read_displayed_packs'); }
function skipUnlockPopups(r)           { _notImpl('UnlockPopups.read'); }
function skipOtoto(r)                  { _notImpl('Ototo.read'); }
function skipOtoto2(r, gv)             { _notImpl('Ototo.read_2'); }
function readOfficerPass(r)            { _notImpl('OfficerPass.read'); }

// ─── メインパーサー ──────────────────────────────────────────────────────────

/**
 * セーブファイルのバイナリから upload に必要なデータを抽出する
 *
 * @param {Buffer} buf - セーブファイルの生バイト列
 * @returns {{
 *   cc: string,
 *   gameVersion: number,
 *   inquiryCode: string,
 *   energyPenaltyTimestamp: number,
 *   passwordRefreshToken: string,
 *   playTime: number,
 *   userRank: number,
 *   catfood: number,
 *   rareTickets: number,
 *   platinumTickets: number,
 *   legendTickets: number,
 *   rawBytes: Buffer,
 * }}
 */
export function parseSaveFile(buf) {
  const cc = detectCC(buf);
  if (!cc) throw new Error('国コードを検出できませんでした。セーブファイルが正しいか確認してください。');

  const r = new DataReader(buf);
  const isJP = cc === 'jp';
  const notJP = !isJP;

  const gv = r.readInt(); // game_version

  if (gv >= 10 || notJP) r.readBool(); // ub1
  r.readBool(); // mute_bgm
  r.readBool(); // mute_se

  const catfood       = r.readInt();
  const currentEnergy = r.readInt();

  r.readInt(); r.readInt(); // year x2
  r.readInt(); r.readInt(); // month x2
  r.readInt(); r.readInt(); // day x2
  r.readDouble();           // timestamp
  r.readInt(); r.readInt(); r.readInt(); // hour, minute, second

  _readDst(r, gv, isJP);   // dst

  r.readInt(); r.readInt(); r.readInt(); // ui1, stamp_value_save, ui2
  r.readInt(); r.readInt(); r.readInt(); // upgrade_state, xp, tutorial_state
  r.readInt(); r.readInt();              // ui3, koreaSuperiorTreasureState

  r.readIntList(3);  // unlock_popups_11
  r.readInt(); r.readInt(); r.readInt(); // ui5, unlock_enemy_guide, ui6
  r.readBool();  // ub0
  r.readInt(); r.readInt(); r.readInt(); // ui7, cleared_eoc_1, ui8
  r.readInt();   // unlocked_ending

  // ── ここから複合構造体 ─────────────────────────────────────────────────────
  skipLineUps(r, gv);
  skipStampData(r);
  skipStoryChapters(r);

  if (20 <= gv && gv <= 25)      r.readIntList(231);
  else                            r.readIntList();

  skipCatsUnlocked(r, gv);
  skipCatsUpgrade(r, gv);
  skipCatsCurrentForm(r, gv);
  skipSpecialSkills(r);

  if (gv <= 25)      { r.readIntList(5);  r.readIntList(5); }
  else if (gv === 26){ r.readIntList(6);  r.readIntList(6); }
  else               { r.readIntList();   r.readIntList(); }

  skipBattleItems(r);

  if (gv <= 26)  r.readIntList(17);
  else           r.readIntList();

  r.readIntList(20); // uil1
  r.readIntList(1);  // moneko_bonus
  r.readIntList(1);  // daily_reward_initialized

  skipBattleItemsLocked(r);

  _readDst(r, gv, isJP);
  r.readDate(); // date_2

  skipStoryTreasureFestival(r);

  _readDst(r, gv, isJP);
  r.readDate(); // date_3

  if (gv <= 37) r.readInt(); // ui0

  r.readInt(); r.readInt(); r.readInt(); r.readInt(); r.readInt(); r.readInt();
  // stage_unlock_cat_value, show_ending_value, chapter_clear_cat_unlock, ui9, ios_android_month, ui10

  r.readString(); // save_data_4_hash

  skipMySale(r); // mysale bonus_hash

  r.readIntList(2); // chara_flags

  if (gv <= 37)    { r.readInt(); r.readBool(); } // uim1, ubm1
  r.readIntList(2); // chara_flags_2

  const rareTickets  = r.readInt();
  const normalTickets = r.readInt(); // actually rare then normal in source? check order

  skipCatsGatyaSeen(r, gv);
  skipSpecialSkillsGatyaSeen(r);
  skipCatsStorage(r, gv);

  skipEventChapters(r, gv);

  r.readInt(); r.readInt(); // itf1_ending, continue_flag

  if (20 <= gv)           r.readIntList(36);
  if (20 <= gv && gv <= 25)  r.readIntList(110);
  else if (26 <= gv)         r.readIntList();

  skipGatyaRareNormalSeed(r, gv);

  r.readBool();        // get_event_data
  r.readBoolList(7);   // achievements
  r.readInt();         // os_value

  _readDst(r, gv, isJP);
  r.readDate(); // date_4

  skipGatya2(r);

  if (notJP) r.readString(); // player_id

  r.readStringList(); // order_ids

  if (notJP) {
    r.readDouble(); r.readDouble(); r.readDouble(); // g_timestamp, g_servertimestamp, m_gettimesave
    r.readStringList(); // usl1
    r.readBool();       // energy_notification
    r.readInt();        // full_gameversion
  }

  skipLineUps2(r, gv);
  skipEventLegendRestrictions(r, gv);

  if (gv <= 37) {
    r.readIntList(7); r.readIntList(7); r.readIntList(7); // uil2,3,4
  }

  r.readDouble(); r.readDouble(); r.readDouble(); r.readDouble();
  // g_timestamp_2, g_servertimestamp_2, m_gettimesave_2, unknown_timestamp

  skipGatyaTradeProgress(r);

  if (gv <= 37) r.readStringList(); // usl2

  if (notJP)     r.readDouble(); // m_dGetTimeSave2
  else           r.readInt();    // ui11

  if (20 <= gv && gv <= 25)         r.readBoolList(12);
  else if (26 <= gv && gv < 39)     r.readBoolList();

  skipCatsMaxUpgradeLevels(r, gv);
  skipSpecialSkillsMaxLevels(r);

  skipUserRankRewards(r, gv);

  if (!notJP) r.readDouble(); // m_dGetTimeSave2 (JP版)

  skipCatsUnlockedForms(r, gv);

  r.readString(); // transfer_code
  r.readString(); // confirmation_code
  r.readBool();   // transfer_flag

  // gv >= 20 ブロック (inquiry_code がここ)
  let inquiryCode = '';
  let playTime = 0;
  if (20 <= gv) {
    skipItemRewardChapters(r, gv);
    skipTimedScoreChapters(r, gv);
    inquiryCode = r.readString();
    const officerPass = readOfficerPass(r); // { playTime, ... }
    playTime = officerPass.playTime ?? 0;
    // ... 後続フィールドは省略
  }

  // energy_penalty_timestamp は gv >= 35 ブロック（上記のparseでは省略）
  // password_refresh_token は gv >= 100000 ブロック（省略）
  // → 別途 parseLateSections で取得

  // TODO: 以下のセクションの実装はサブファイルのソース確認後に追加
  const { energyPenaltyTimestamp, passwordRefreshToken, legendTickets, platinumTickets } =
    _parseLateSections(r, gv, notJP);

  return {
    cc,
    gameVersion: gv,
    inquiryCode,
    energyPenaltyTimestamp,
    passwordRefreshToken,
    playTime,
    userRank: 0,  // TODO: Cats解析後に実装
    catfood,
    rareTickets,
    platinumTickets,
    legendTickets,
    rawBytes: buf,
  };
}

// ─── ヘルパー ────────────────────────────────────────────────────────────────

/** DST フラグの読み取り (gv >= 49 かつ JP以外のみ) */
function _readDst(r, gv, isJP) {
  if (!isJP && gv >= 49) r.readBool();
}

/**
 * gv >= 35 以降のセクションから energyPenaltyTimestamp と passwordRefreshToken を取得
 * (上記 parseSaveFile の続きとして呼ばれる前提で、ポジションは既にそこまで進んでいる)
 *
 * NOTE: このセクションに到達するには上流の全構造体パースが必要。
 * 現在はスタブ実装。上流 skip 関数が完成すれば自動的に動く。
 */
function _parseLateSections(r, gv, notJP) {
  // ← この関数は parseSaveFile の続きとして呼ばれるが、
  //    skip関数が未実装のため実際には到達しない。
  //    skip関数の実装完了後に自動的に動作する。
  return {
    energyPenaltyTimestamp: 0,
    passwordRefreshToken: '',
    legendTickets: 0,
    platinumTickets: 0,
  };
}
