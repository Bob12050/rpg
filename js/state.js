const SAVE_KEY = "solo_hack_rpg_save_v1";

let gameState = {
  player: null,
  battle: null,
};

const listeners = [];

export function getState() {
  return gameState;
}

export function subscribe(fn) {
  listeners.push(fn);
}

export function update(updater) {
  updater(gameState);
  notify();
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
  } catch (error) {
    console.error("Save failed", error);
    return false;
  }
}

export function load() {
  const saved = loadFromStorage();
  if (!saved) return false;

  gameState = normalizeState(saved);
  notify();
  return true;
}

export async function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  const player = await loadInitialPlayer();
  gameState = { player, battle: null };
  notify();
}

async function loadInitialPlayer() {
  const response = await fetch("data/player.json");
  if (!response.ok) {
    throw new Error("Failed to load data/player.json");
  }
  return response.json();
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Load failed", error);
    return null;
  }
}

function normalizeState(state) {
  return {
    player: state.player ?? null,
    battle: state.battle ?? null,
  };
}

function notify() {
  for (const fn of listeners) {
    fn(gameState);
  }
}
