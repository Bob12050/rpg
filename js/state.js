// =====================================================================
// state.js  ―― 【設計原則1】状態は1か所（Single Source of Truth）
// ゲームの状態はすべて、この gameState 1つに集約する。
// 状態を変える窓口（update）と、変化を知らせる仕組み（subscribe/notify）も
// ここに置く。画面の描画は render.js が担当し、ここでは一切DOMを触らない。
// =====================================================================

const SAVE_KEY = "rpg_save_v1";

// ゲームの全状態。これが「唯一の正」。
let gameState = {
  player: null,   // data/player.json を読み込んで入れる
};

// 状態が変わったときに呼ぶ関数たち（render.js が登録する）
const listeners = [];

// --- 読み取り ---
export function getState() {
  return gameState;
}

// --- 変更の窓口（ここを通して状態を変える） ---
// updater(state) の中で state を書き換える。変更後は自動で全体に通知。
export function update(updater) {
  updater(gameState);
  notify();
}

// --- 変化を購読する（render.js が「描き直して」と登録する） ---
export function subscribe(fn) {
  listeners.push(fn);
}

// --- 全リスナーに「状態が変わったよ」と知らせる ---
function notify() {
  for (const fn of listeners) fn(gameState);
}

// --- 初期データの読み込み（原則3：数値は外部データから） ---
export async function loadInitialPlayer() {
  const res = await fetch("data/player.json");
  if (!res.ok) throw new Error("player.json の読み込みに失敗しました");
  return await res.json();
}

// --- ゲーム開始：セーブがあれば復元、なければ初期データ ---
export async function initGame() {
  const saved = loadFromStorage();
  if (saved) {
    gameState = saved;
  } else {
    const player = await loadInitialPlayer();
    gameState = { player };
  }
  notify();
}

// --- セーブ（原則1：状態が1か所だから、まるごと保存するだけ） ---
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    return true;
  } catch (e) {
    console.error("セーブ失敗", e);
    return false;
  }
}

// --- ロード（保存データを読み出す。無ければ null） ---
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("ロード失敗", e);
    return null;
  }
}

// --- 手動ロード（ボタン用） ---
export function load() {
  const saved = loadFromStorage();
  if (saved) {
    gameState = saved;
    notify();
    return true;
  }
  return false;
}

// --- リセット（初期データに戻す） ---
export async function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  const player = await loadInitialPlayer();
  gameState = { player };
  notify();
}
