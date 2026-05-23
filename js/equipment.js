import { getCurrentJob } from "./job.js";

let equipmentDefinitions = {};

export async function loadEquipmentDefinitions() {
  const response = await fetch("data/equipment.json");
  if (!response.ok) {
    throw new Error("Failed to load data/equipment.json");
  }
  equipmentDefinitions = await response.json();
}

export function createEquipmentItem(itemId) {
  const definition = equipmentDefinitions[itemId];
  if (!definition) return null;

  return {
    instanceId: `${itemId}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    id: definition.id,
    name: definition.name,
    slot: definition.slot,
    atk: definition.atk ?? 0,
    def: definition.def ?? 0,
    image: definition.image ?? null,
    enhanceLevel: 0,
  };
}

export function equipItem(player, instanceId) {
  ensureEquipmentState(player);

  const item = findEquipmentItem(player, instanceId);
  if (!item) {
    return "\u88C5\u5099\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002";
  }

  const normalized = normalizeEquipmentItem(item);
  if (!normalized.slot) {
    return "\u3053\u306E\u30A2\u30A4\u30C6\u30E0\u306F\u88C5\u5099\u3067\u304D\u307E\u305B\u3093\u3002";
  }

  Object.assign(item, normalized);
  player.equipment[normalized.slot] = item.instanceId;
  return `${item.name}\u3092\u88C5\u5099\u3057\u305F\u3002`;
}

export function unequipItem(player, slot) {
  ensureEquipmentState(player);

  if (!player.equipment[slot]) {
    return "\u5916\u3059\u88C5\u5099\u304C\u3042\u308A\u307E\u305B\u3093\u3002";
  }

  player.equipment[slot] = null;
  return "\u88C5\u5099\u3092\u5916\u3057\u305F\u3002";
}

export function getPlayerStats(player) {
  const weapon = getEquippedItem(player, "weapon");
  const armor = getEquippedItem(player, "armor");
  const job = getCurrentJob(player);

  return {
    atk: (job?.baseAtk ?? player.baseAtk ?? 1) + (weapon?.atk ?? 0),
    def: (job?.baseDef ?? player.baseDef ?? 0) + (armor?.def ?? 0),
    weapon,
    armor,
    job,
  };
}

export function getEquippedItem(player, slot) {
  const instanceId = player.equipment?.[slot];
  if (!instanceId) return null;
  const item = findEquipmentItem(player, instanceId);
  return item ? normalizeEquipmentItem(item) : null;
}

export function getEquipmentDisplayItem(item) {
  return item ? normalizeEquipmentItem(item) : null;
}

function findEquipmentItem(player, instanceId) {
  return player.inventory?.equipment?.find((item) => item.instanceId === instanceId) ?? null;
}

function normalizeEquipmentItem(item) {
  const definition = equipmentDefinitions[item.id] ?? {};

  return {
    ...item,
    name: item.name ?? definition.name ?? item.id,
    slot: item.slot ?? definition.slot ?? null,
    atk: item.atk ?? definition.atk ?? 0,
    def: item.def ?? definition.def ?? 0,
    image: item.image ?? definition.image ?? null,
    enhanceLevel: item.enhanceLevel ?? 0,
  };
}

function ensureEquipmentState(player) {
  player.baseAtk ??= 5;
  player.baseDef ??= 0;
  player.equipment ??= {};
  player.equipment.weapon ??= null;
  player.equipment.armor ??= null;
  player.inventory ??= {};
  player.inventory.equipment ??= [];
}
