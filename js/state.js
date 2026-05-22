const SAVE_KEY = "rpg_save_v1";

let gameState = {
  player: null,
  battle: null,
};

const listeners = [];

export function getState() {
  return gameState;
}

export function update(updater) {
  updater(gameState);
  notify();
}

export function subscribe(fn) {
  listeners.push(fn);
}

function notify() {
  for (const fn of listeners) fn(gameState);
}

export async function loadInitialPlayer() {
  const res = await fetch("data/player.json");
  if (!res.ok) throw new Error("player.json の読み込みに失敗しました");
  return await res.json();
}

export async function initGame() {
  const saved = loadFromStorage();
  if (saved) {
    gameState = normalizeState(saved);
  } else {
    const player = await loadInitialPlayer();
    gameState = { player, battle: null };
  }
  notify();
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    return true;
  } catch (e) {
    console.error("セーブ失敗", e);
    return false;
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("ロード失敗", e);
    return null;
  }
}

export function load() {
  const saved = loadFromStorage();
  if (saved) {
    gameState = normalizeState(saved);
    notify();
    return true;
  }
  return false;
}

export async function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  const player = await loadInitialPlayer();
  gameState = { player, battle: null };
  notify();
}

function normalizeState(state) {
  return {
    player: state.player ?? null,
    battle: state.battle ?? null,
  };
}
