import { createEquipmentItem } from "./equipment.js";

let lootTables = {};

export async function loadLootTables() {
  const response = await fetch("data/loot.json");
  if (!response.ok) {
    throw new Error("Failed to load data/loot.json");
  }
  lootTables = await response.json();
}

export function rollLootForEnemy(enemyId) {
  const table = lootTables[enemyId] ?? [];
  const drops = [];

  for (const entry of table) {
    if (Math.random() > entry.chance) continue;

    const quantity = randomInt(entry.minQuantity ?? 1, entry.maxQuantity ?? 1);
    drops.push({
      id: entry.itemId,
      name: entry.name,
      type: entry.type,
      quantity,
    });
  }

  return drops;
}

export function addLootToInventory(player, drops) {
  ensureInventory(player);

  for (const drop of drops) {
    if (drop.type === "equipment") {
      const equipment = createEquipmentItem(drop.id);
      if (equipment) {
        player.inventory.equipment.push(equipment);
      }
      continue;
    }

    const current = player.inventory.materials[drop.id] ?? {
      id: drop.id,
      name: drop.name,
      quantity: 0,
    };

    current.quantity += drop.quantity;
    player.inventory.materials[drop.id] = current;
  }
}

function ensureInventory(player) {
  player.inventory ??= {};
  player.inventory.materials ??= {};
  player.inventory.equipment ??= [];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
