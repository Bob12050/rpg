import { getDefaultJobId, getJobDefinition } from "./job.js";

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
    const player = normalizePlayer(await loadInitialPlayer());
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
  const player = normalizePlayer(await loadInitialPlayer());
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
    player: normalizePlayer(state.player),
    battle: state.battle ?? null,
  };
}

function normalizePlayer(player) {
  if (!player) return null;
  const jobId = player.jobId ?? getDefaultJobId();
  const job = getJobDefinition(jobId);
  const maxHp = player.maxHp ?? job?.baseHp ?? 30;
  const maxMp = player.maxMp ?? job?.baseMp ?? 10;

  return {
    ...player,
    jobId,
    job: player.job ?? job?.name ?? "\u6226\u58EB",
    hp: player.hp ?? maxHp,
    maxHp,
    mp: player.mp ?? maxMp,
    maxMp,
    baseAtk: player.baseAtk ?? job?.baseAtk ?? 5,
    baseDef: player.baseDef ?? job?.baseDef ?? 0,
    equipment: {
      weapon: player.equipment?.weapon ?? null,
      armor: player.equipment?.armor ?? null,
    },
    inventory: {
      materials: player.inventory?.materials ?? {},
      equipment: normalizeEquipmentInventory(player.inventory?.equipment ?? []),
    },
  };
}

function normalizeEquipmentInventory(items) {
  return items.map((item, index) => ({
    ...item,
    instanceId: item.instanceId ?? `${item.id ?? "equipment"}_legacy_${index}`,
    enhanceLevel: item.enhanceLevel ?? 0,
  }));
}

function notify() {
  for (const fn of listeners) {
    fn(gameState);
  }
}
