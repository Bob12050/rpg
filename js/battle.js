import { update } from "./state.js";

let enemyDefinitions = [];

export async function loadEnemies() {
  const res = await fetch("data/enemies.json");
  if (!res.ok) throw new Error("enemies.json の読み込みに失敗しました");
  enemyDefinitions = await res.json();
}

export function startFirstBattle() {
  const enemy = enemyDefinitions[0];
  if (!enemy) return;

  update((s) => {
    s.battle = {
      stageId: "first_forest",
      enemy: createEnemy(enemy),
      log: [`${enemy.name}が現れた`],
    };
  });
}

export function attackEnemy() {
  update((s) => {
    const p = s.player;
    const battle = s.battle;
    const enemy = battle?.enemy;
    if (!p || !battle || !enemy) return;

    if (p.hp <= 0) {
      pushLog(battle, "HPが0です。回復してから戦おう");
      return;
    }

    if (enemy.hp <= 0) {
      pushLog(battle, "敵はもう倒れている");
      return;
    }

    const playerDamage = Math.max(1, 7 + p.level * 2);
    enemy.hp = Math.max(0, enemy.hp - playerDamage);
    pushLog(battle, `${enemy.name}に${playerDamage}ダメージ`);

    if (enemy.hp <= 0) {
      grantRewards(p, enemy, battle);
      return;
    }

    const enemyDamage = Math.max(1, enemy.attack);
    p.hp = Math.max(0, p.hp - enemyDamage);
    pushLog(battle, `${enemy.name}から${enemyDamage}ダメージ`);

    if (p.hp <= 0) {
      pushLog(battle, "倒れてしまった。回復して立て直そう");
    }
  });
}

function createEnemy(def) {
  return {
    id: def.id,
    name: def.name,
    level: def.level,
    hp: def.maxHp,
    maxHp: def.maxHp,
    attack: def.attack,
    exp: def.exp,
    gold: def.gold,
  };
}

function grantRewards(player, enemy, battle) {
  player.exp += enemy.exp;
  player.gold += enemy.gold;
  pushLog(battle, `${enemy.name}を倒した`);
  pushLog(battle, `EXP ${enemy.exp} / ${enemy.gold}G を得た`);

  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level += 1;
    player.maxHp += 5;
    player.maxMp += 2;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.expToNext = Math.floor(player.expToNext * 1.3);
    pushLog(battle, `Lv ${player.level} に上がった`);
  }
}

function pushLog(battle, message) {
  battle.log.push(message);
  battle.log = battle.log.slice(-5);
}
