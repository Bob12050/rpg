import { update } from "./state.js";
import { getPlayerStats } from "./equipment.js";
import { addLootToInventory, rollLootForEnemy } from "./loot.js";
import { calculateSkillDamage, getSkillDefinition } from "./skill.js";
import { getDefaultStageId, getStageDefinition, getStageEnemyIds } from "./stage.js";

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

  update((state) => {
    const stageId = state.currentStageId ?? getDefaultStageId();
    const stage = getStageDefinition(stageId);
    const progress = ensureStageProgress(state, stageId);
    const requiredDefeats = getBossRequiredDefeats(stage);
    const shouldSpawnBoss = Boolean(
      stage?.bossId && progress.normalDefeatCount >= requiredDefeats
    );

    const definition = shouldSpawnBoss
      ? getBossDefinition(stage.bossId) ?? getNormalEnemyDefinition(state)
      : getNormalEnemyDefinition(state);

    if (!definition) return;

    state.battle = {
      stageId,
      enemy: createEnemy(definition),
      log: [definition.isBoss ? `${definition.name}が立ちはだかった。` : `${definition.name}が現れた。`],
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
      pushLog(battle, "HPが0です。回復してから戦おう。");
      return;
    }

    if (enemy.hp <= 0) {
      pushLog(battle, "敵はもう倒れている。次の敵を探そう。");
      return;
    }

    const stats = getPlayerStats(player);
    const playerDamage = Math.max(1, stats.atk + player.level * 2);
    enemy.hp = Math.max(0, enemy.hp - playerDamage);
    pushLog(battle, `${enemy.name}に${playerDamage}ダメージ。`);

    if (enemy.hp <= 0) {
      grantRewards(state, player, enemy, battle);
      return;
    }

    const enemyDamage = Math.max(1, enemy.attack - stats.def);
    player.hp = Math.max(0, player.hp - enemyDamage);
    pushLog(battle, `${enemy.name}から${enemyDamage}ダメージ。`);

    if (player.hp <= 0) {
      pushLog(battle, "倒れてしまった。回復して立て直そう。");
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
      pushLog(battle, "HPが0です。回復してから戦おう。");
      return;
    }

    if (enemy.hp <= 0) {
      pushLog(battle, "敵はもう倒れている。次の敵を探そう。");
      return;
    }

    const skill = getSkillDefinition(skillId);
    if (!skill) {
      pushLog(battle, "スキルが見つかりません。");
      return;
    }

    if (player.mp < skill.mpCost) {
      pushLog(battle, `MPが足りず、${skill.name}を使えない。`);
      return;
    }

    const stats = getPlayerStats(player);
    const skillDamage = calculateSkillDamage(skill, player, stats);
    player.mp = Math.max(0, player.mp - skill.mpCost);
    enemy.hp = Math.max(0, enemy.hp - skillDamage);
    pushLog(battle, `${skill.name}！ ${enemy.name}に${skillDamage}ダメージ。`);

    if (enemy.hp <= 0) {
      grantRewards(state, player, enemy, battle);
      return;
    }

    const enemyDamage = Math.max(1, enemy.attack - stats.def);
    player.hp = Math.max(0, player.hp - enemyDamage);
    pushLog(battle, `${enemy.name}から${enemyDamage}ダメージ。`);

    if (player.hp <= 0) {
      pushLog(battle, "倒れてしまった。回復して立て直そう。");
    }
  });
}

export function gainTestExp() {
  update((state) => {
    grantExp(state.player, 5, state.battle);
    state.player.gold += 3;
  });
}

function getNormalEnemyDefinition(state) {
  const stageEnemyIds = getStageEnemyIds(state);
  const candidates = enemyDefinitions.filter(
    (enemy) => stageEnemyIds.includes(enemy.id) && !enemy.isBoss
  );
  const normalEnemies = enemyDefinitions.filter((enemy) => !enemy.isBoss);
  const pool = candidates.length ? candidates : normalEnemies.length ? normalEnemies : enemyDefinitions;

  if (!pool.length) return null;

  const definition = pool[nextEnemyIndex % pool.length];
  nextEnemyIndex += 1;
  return definition;
}

function getBossDefinition(bossId) {
  return enemyDefinitions.find((enemy) => enemy.id === bossId && enemy.isBoss);
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
    isBoss: Boolean(definition.isBoss),
  };
}

function grantRewards(state, player, enemy, battle) {
  grantExp(player, enemy.exp, battle);
  player.gold += enemy.gold;
  pushLog(battle, `${enemy.name}を倒した。`);
  pushLog(battle, `EXP ${enemy.exp} / ${enemy.gold}G を得た。`);
  updateStageProgressAfterVictory(state, enemy, battle);

  const drops = rollLootForEnemy(enemy.id);
  addLootToInventory(player, drops);

  if (!drops.length) {
    pushLog(battle, "ドロップはなかった。");
    return;
  }

  for (const drop of drops) {
    pushLog(battle, `${drop.name} x${drop.quantity} を拾った。`);
  }
}

function updateStageProgressAfterVictory(state, enemy, battle) {
  const stageId = battle?.stageId ?? state.currentStageId ?? getDefaultStageId();
  const stage = getStageDefinition(stageId);
  const progress = ensureStageProgress(state, stageId);

  if (enemy.isBoss) {
    progress.normalDefeatCount = 0;
    pushLog(battle, "ボスを倒した。討伐数がリセットされた。");
    return;
  }

  progress.normalDefeatCount += 1;

  if (!stage?.bossId) return;

  const requiredDefeats = getBossRequiredDefeats(stage);
  const remaining = Math.max(0, requiredDefeats - progress.normalDefeatCount);

  if (remaining <= 0) {
    pushLog(battle, "次の戦闘でボスが出現する。");
  } else {
    pushLog(battle, `ボスまであと${remaining}体。`);
  }
}

function ensureStageProgress(state, stageId) {
  if (!state.stageProgress) {
    state.stageProgress = {};
  }

  if (!state.stageProgress[stageId]) {
    state.stageProgress[stageId] = { normalDefeatCount: 0 };
  }

  const count = Number(state.stageProgress[stageId].normalDefeatCount);
  state.stageProgress[stageId].normalDefeatCount = Number.isFinite(count)
    ? Math.max(0, Math.floor(count))
    : 0;

  return state.stageProgress[stageId];
}

function getBossRequiredDefeats(stage) {
  const value = Number(stage?.bossRequiredDefeats);
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 5;
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
    pushLog(battle, `Lv ${player.level} に上がった。`);
  }
}

function pushLog(battle, message) {
  if (!battle) return;
  battle.log.push(message);
  battle.log = battle.log.slice(-6);
}
