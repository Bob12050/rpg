let enhancementRules = {};

export async function loadEnhancementRules() {
  const response = await fetch("data/enhancement.json");
  if (!response.ok) {
    throw new Error("Failed to load data/enhancement.json");
  }
  enhancementRules = await response.json();
}

export function enhanceEquipment(player, instanceId) {
  const item = findEquipmentItem(player, instanceId);
  if (!item) {
    return "\u5F37\u5316\u3059\u308B\u88C5\u5099\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002";
  }

  const preview = getEnhancementPreview(player, item);
  if (!preview.canEnhance) {
    return preview.message;
  }

  const material = player.inventory.materials[preview.materialId];
  material.quantity -= preview.materials;
  if (material.quantity <= 0) {
    delete player.inventory.materials[preview.materialId];
  }

  player.gold -= preview.gold;
  item.enhanceLevel = preview.nextLevel;

  if (item.slot === "weapon") {
    item.atk = (item.atk ?? 0) + preview.atkIncrease;
  }

  if (item.slot === "armor") {
    item.def = (item.def ?? 0) + preview.defIncrease;
  }

  return `${formatEquipmentName(item)}\u306B\u5F37\u5316\u3057\u305F\u3002`;
}

export function getEnhancementPreview(player, item) {
  const rule = enhancementRules.default ?? {};
  const currentLevel = item?.enhanceLevel ?? 0;
  const nextLevel = currentLevel + 1;
  const materialId = rule.materialId;
  const materialName = rule.materialName ?? materialId;
  const gold = (rule.baseGold ?? 0) + (rule.goldPerLevel ?? 0) * currentLevel;
  const materials = (rule.baseMaterials ?? 1) + (rule.materialPerLevel ?? 1) * currentLevel;
  const ownedMaterials = player.inventory?.materials?.[materialId]?.quantity ?? 0;
  const ownedGold = player.gold ?? 0;

  if (!item) {
    return {
      canEnhance: false,
      message: "\u5F37\u5316\u3059\u308B\u88C5\u5099\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    };
  }

  if (!materialId) {
    return {
      canEnhance: false,
      message: "\u5F37\u5316\u8A2D\u5B9A\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    };
  }

  if (ownedMaterials < materials) {
    return {
      canEnhance: false,
      nextLevel,
      materialId,
      materialName,
      materials,
      gold,
      atkIncrease: item.slot === "weapon" ? rule.atkPerLevel ?? 0 : 0,
      defIncrease: item.slot === "armor" ? rule.defPerLevel ?? 0 : 0,
      message: `${materialName}\u304C\u8DB3\u308A\u307E\u305B\u3093\u3002`,
    };
  }

  if (ownedGold < gold) {
    return {
      canEnhance: false,
      nextLevel,
      materialId,
      materialName,
      materials,
      gold,
      atkIncrease: item.slot === "weapon" ? rule.atkPerLevel ?? 0 : 0,
      defIncrease: item.slot === "armor" ? rule.defPerLevel ?? 0 : 0,
      message: "\u30B4\u30FC\u30EB\u30C9\u304C\u8DB3\u308A\u307E\u305B\u3093\u3002",
    };
  }

  return {
    canEnhance: true,
    nextLevel,
    materialId,
    materialName,
    materials,
    gold,
    atkIncrease: item.slot === "weapon" ? rule.atkPerLevel ?? 0 : 0,
    defIncrease: item.slot === "armor" ? rule.defPerLevel ?? 0 : 0,
    message: "\u5F37\u5316\u3067\u304D\u307E\u3059\u3002",
  };
}

function findEquipmentItem(player, instanceId) {
  return player.inventory?.equipment?.find((item) => item.instanceId === instanceId) ?? null;
}

function formatEquipmentName(item) {
  const level = item.enhanceLevel ?? 0;
  return level > 0 ? `${item.name} +${level}` : item.name;
}
