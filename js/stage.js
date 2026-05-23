const DEFAULT_STAGE_ID = "first_forest";

let stageDefinitions = {};

export async function loadStageDefinitions() {
  const response = await fetch("data/stages.json");
  if (!response.ok) {
    throw new Error("Failed to load data/stages.json");
  }
  stageDefinitions = await response.json();
}

export function getAllStages() {
  return Object.values(stageDefinitions);
}

export function getStageDefinition(stageId) {
  return stageDefinitions[stageId] ?? stageDefinitions[DEFAULT_STAGE_ID] ?? null;
}

export function getCurrentStage(state) {
  return getStageDefinition(state.currentStageId ?? DEFAULT_STAGE_ID);
}

export function getStageEnemyIds(state) {
  const stage = getCurrentStage(state);
  return stage?.enemyIds ?? [];
}

export function changeStage(state, stageId) {
  const stage = getStageDefinition(stageId);
  if (!stage) {
    return "\u30B9\u30C6\u30FC\u30B8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002";
  }

  state.currentStageId = stage.id;
  return `${stage.name}\u3092\u9078\u629E\u3057\u307E\u3057\u305F\u3002`;
}

export function getDefaultStageId() {
  return DEFAULT_STAGE_ID;
}
