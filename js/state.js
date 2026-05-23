import { getDefaultJobId, getJobDefinition } from "./job.js";
import { getAllStages, getDefaultStageId } from "./stage.js";

const SAVE_KEY = "solo_hack_rpg_save_v1";

let gameState = {
  player: null,
  battle: null,
  currentStageId: getDefaultStageId(),
  stageProgress: createStageProgress(),
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
    gameState = createInitialState(player);
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
  gameState = createInitialState(player);
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

function createInitialState(player) {
  return {
    player,
    battle: null,
    currentStageId: getDefaultStageId(),
    stageProgress: createStageProgress(),
  };
}

function normalizeState(state) {
  const currentStageId = state.currentStageId ?? getDefaultStageId();

  return {
    player: normalizePlayer(state.player),
    battle: state.battle ?? null,
    currentStageId,
    stageProgress: normalizeStageProgress(state.stageProgress, currentStageId),
  };
}

function createStageProgress() {
  const progress = {};
  const stages = getAllStages();

  if (!stages.length) {
    progress[getDefaultStageId()] = { normalDefeatCount: 0 };
    return progress;
  }

  for (const stage of stages) {
    progress[stage.id] = { normalDefeatCount: 0 };
  }

  return progress;
}

function normalizeStageProgress(savedProgress = {}, currentStageId = getDefaultStageId()) {
  const progress = {};
  const stageIds = new Set(getAllStages().map((stage) => stage.id));
  stageIds.add(currentStageId);
  stageIds.add(getDefaultStageId());

  for (const stageId of Object.keys(savedProgress ?? {})) {
    stageIds.add(stageId);
  }

  for (const stageId of stageIds) {
    const savedCount = savedProgress?.[stageId]?.normalDefeatCount;
    progress[stageId] = {
      normalDefeatCount: normalizeCount(savedCount),
    };
  }

  return progress;
}

function normalizeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
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
    job: player.job ?? job?.name ?? "戦士",
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
