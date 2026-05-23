import { update } from "./state.js";
import { getPlayerStats } from "./equipment.js";
import { addLootToInventory, rollLootForEnemy } from "./loot.js";
import { calculateSkillDamage, getSkillDefinition } from "./skill.js";

let enemyDefinitions = [];
let nextEnemyIndex = 0;

export async function loadEnemies() {
  const response = await fetch("data/enemies.json");
  if (!response.ok) {
    throw new Error("Failed to load data/enemies.json");
  }
  enemyDefinitions = await response.json();
}

export function startNextBattle() {
  if (!enemyDefinitions.length) return;

  const definition = enemyDefinitions[nextEnemyIndex % enemyDefinitions.length];
  nextEnemyIndex += 1;

  update((state) => {
    state.battle = {
      stageId: "first_forest",
      enemy: createEnemy(definition),
      log: [`${definition.name}\u304C\u73FE\u308C\u305F\u3002`],
    };
  });
}

export function attackEnemy() {
  update((state) => {
    const player = state.player;
    const battle = state.battle;
    const enemy = battle?.enemy;
    if (!player || !battle || !enemy) return;

    if (player.hp <= 0) {
      pushLog(battle, "HP\u304C0\u3067\u3059\u3002\u56DE\u5FA9\u3057\u3066\u304B\u3089\u6226\u304A\u3046\u3002");
      return;
    }

    if (enemy.hp <= 0) {
      pushLog(battle, "\u6575\u306F\u3082\u3046\u5012\u308C\u3066\u3044\u308B\u3002\u6B21\u306E\u6575\u3092\u63A2\u305D\u3046\u3002");
      return;
    }

    const stats = getPlayerStats(player);
    const playerDamage = Math.max(1, stats.atk + player.level * 2);
    enemy.hp = Math.max(0, enemy.hp - playerDamage);
    pushLog(battle, `${enemy.name}\u306B${playerDamage}\u30C0\u30E1\u30FC\u30B8\u3002`);

    if (enemy.hp <= 0) {
      grantRewards(player, enemy, battle);
      return;
    }

    const enemyDamage = Math.max(1, enemy.attack - stats.def);
    player.hp = Math.max(0, player.hp - enemyDamage);
    pushLog(battle, `${enemy.name}\u304B\u3089${enemyDamage}\u30C0\u30E1\u30FC\u30B8\u3002`);

    if (player.hp <= 0) {
      pushLog(battle, "\u5012\u308C\u3066\u3057\u307E\u3063\u305F\u3002\u56DE\u5FA9\u3057\u3066\u7ACB\u3066\u76F4\u305D\u3046\u3002");
    }
  });
}

export function useSkill(skillId) {
  update((state) => {
    const player = state.player;
    const battle = state.battle;
    const enemy = battle?.enemy;
    if (!player || !battle || !enemy) return;

    if (player.hp <= 0) {
      pushLog(battle, "HP\u304C0\u3067\u3059\u3002\u56DE\u5FA9\u3057\u3066\u304B\u3089\u6226\u304A\u3046\u3002");
      return;
    }

    if (enemy.hp <= 0) {
      pushLog(battle, "\u6575\u306F\u3082\u3046\u5012\u308C\u3066\u3044\u308B\u3002\u6B21\u306E\u6575\u3092\u63A2\u305D\u3046\u3002");
      return;
    }

    const skill = getSkillDefinition(skillId);
    if (!skill) {
      pushLog(battle, "\u30B9\u30AD\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
      return;
    }

    if (player.mp < skill.mpCost) {
      pushLog(battle, `MP\u304C\u8DB3\u308A\u305A\u3001${skill.name}\u3092\u4F7F\u3048\u306A\u3044\u3002`);
      return;
    }

    const stats = getPlayerStats(player);
    const skillDamage = calculateSkillDamage(skill, player, stats);
    player.mp = Math.max(0, player.mp - skill.mpCost);
    enemy.hp = Math.max(0, enemy.hp - skillDamage);
    pushLog(battle, `${skill.name}\uFF01 ${enemy.name}\u306B${skillDamage}\u30C0\u30E1\u30FC\u30B8\u3002`);

    if (enemy.hp <= 0) {
      grantRewards(player, enemy, battle);
      return;
    }

    const enemyDamage = Math.max(1, enemy.attack - stats.def);
    player.hp = Math.max(0, player.hp - enemyDamage);
    pushLog(battle, `${enemy.name}\u304B\u3089${enemyDamage}\u30C0\u30E1\u30FC\u30B8\u3002`);

    if (player.hp <= 0) {
      pushLog(battle, "\u5012\u308C\u3066\u3057\u307E\u3063\u305F\u3002\u56DE\u5FA9\u3057\u3066\u7ACB\u3066\u76F4\u305D\u3046\u3002");
    }
  });
}

export function gainTestExp() {
  update((state) => {
    grantExp(state.player, 5, state.battle);
    state.player.gold += 3;
  });
}

function createEnemy(definition) {
  return {
    id: definition.id,
    name: definition.name,
    level: definition.level,
    hp: definition.maxHp,
    maxHp: definition.maxHp,
    attack: definition.attack,
    exp: definition.exp,
    gold: definition.gold,
  };
}

function grantRewards(player, enemy, battle) {
  grantExp(player, enemy.exp, battle);
  player.gold += enemy.gold;
  pushLog(battle, `${enemy.name}\u3092\u5012\u3057\u305F\u3002`);
  pushLog(battle, `EXP ${enemy.exp} / ${enemy.gold}G \u3092\u5F97\u305F\u3002`);

  const drops = rollLootForEnemy(enemy.id);
  addLootToInventory(player, drops);

  if (!drops.length) {
    pushLog(battle, "\u30C9\u30ED\u30C3\u30D7\u306F\u306A\u304B\u3063\u305F\u3002");
    return;
  }

  for (const drop of drops) {
    pushLog(battle, `${drop.name} x${drop.quantity} \u3092\u62FE\u3063\u305F\u3002`);
  }
}

function grantExp(player, amount, battle) {
  player.exp += amount;

  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level += 1;
    player.maxHp += 5;
    player.maxMp += 2;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.expToNext = Math.floor(player.expToNext * 1.3);
    pushLog(battle, `Lv ${player.level} \u306B\u4E0A\u304C\u3063\u305F\u3002`);
  }
}

function pushLog(battle, message) {
  if (!battle) return;
  battle.log.push(message);
  battle.log = battle.log.slice(-6);
}
