import { getEnhancementPreview } from "./craft.js";
import { getPlayerStats } from "./equipment.js";
import { getAllJobs, getCurrentJob } from "./job.js";
import { getSkillsForCurrentJob } from "./skill.js";
import { getAllStages } from "./stage.js";

export function render(state) {
  const player = state.player;
  if (!player) return;
  const stats = getPlayerStats(player);
  const job = getCurrentJob(player);

  setText("p-name", player.name);
  setText("p-job", job?.name ?? player.job);
  setText("p-level", player.level);
  setText("hp-text", `${player.hp} / ${player.maxHp}`);
  setText("mp-text", `${player.mp} / ${player.maxMp}`);
  setText("exp-text", `${player.exp} / ${player.expToNext}`);
  setText("p-gold", player.gold);
  setText("p-atk", stats.atk);
  setText("p-def", stats.def);
  setText("equipped-weapon", formatEquipmentName(stats.weapon));
  setText("equipped-armor", formatEquipmentName(stats.armor));
  renderEquippedActions(player, stats);

  setBar("hp-bar", player.hp, player.maxHp);
  setBar("mp-bar", player.mp, player.maxMp);
  setBar("exp-bar", player.exp, player.expToNext);

  renderBattle(state.battle, player);
  renderInventory(player);
  renderJobList(player);
  renderStageList(state);
}

export function flash(message) {
  const element = document.getElementById("toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");
  clearTimeout(element.hideTimer);
  element.hideTimer = setTimeout(() => element.classList.remove("show"), 1600);
}

export function setSaveIndicator(message) {
  setText("save-indicator", message);
}

function renderBattle(battle, player) {
  const enemy = battle?.enemy;

  setText("enemy-name", enemy ? formatEnemyName(enemy) : "-");
  setText("enemy-level", enemy ? enemy.level : "-");
  setText("enemy-hp-text", enemy ? `${enemy.hp} / ${enemy.maxHp}` : "-");
  setBar("enemy-hp-bar", enemy ? enemy.hp : 0, enemy ? enemy.maxHp : 1);

  const logElement = document.getElementById("battle-log");
  if (!logElement) return;

  const lines = battle?.log?.length ? battle.log : ["\u6575\u3092\u63A2\u3057\u3066\u3044\u307E\u3059\u3002"];
  logElement.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");

  renderSkillActions(player);
}

function renderSkillActions(player) {
  const element = document.getElementById("skill-actions");
  if (!element) return;

  const skills = getSkillsForCurrentJob(player);
  if (!skills.length) {
    element.innerHTML = "";
    return;
  }

  element.innerHTML = skills.map((skill) => `
    <button class="button skill-button" data-skill-id="${escapeHtml(skill.id)}">
      ${escapeHtml(skill.name)} <span>MP ${skill.mpCost}</span>
    </button>
  `).join("");
}

function renderInventory(player) {
  const element = document.getElementById("inventory-list");
  if (!element) return;

  const inventory = player.inventory;
  const materials = Object.values(inventory?.materials ?? {});
  const equipment = inventory?.equipment ?? [];

  if (!materials.length && !equipment.length) {
    element.innerHTML = `<p class="inventory-empty">${escapeHtml("\u307E\u3060\u4F55\u3082\u6301\u3063\u3066\u3044\u307E\u305B\u3093\u3002")}</p>`;
    return;
  }

  const materialRows = materials.map((item) => `
    <div class="inventory-item">
      <span>${escapeHtml(item.name)}</span>
      <strong>x${item.quantity}</strong>
    </div>
  `);

  const equipmentRows = equipment.map((item) => `
    <div class="inventory-item">
      <div class="inventory-main">
        <span>${escapeHtml(formatEquipmentName(item))}</span>
        <small>${escapeHtml(formatEnhancementCost(player, item))}</small>
      </div>
      <div class="item-actions">
        <button class="mini-button" data-action="equip" data-instance-id="${escapeHtml(item.instanceId)}">
          ${escapeHtml("\u88C5\u5099")}
        </button>
        <button class="mini-button" data-action="enhance" data-instance-id="${escapeHtml(item.instanceId)}">
          ${escapeHtml("\u5F37\u5316")}
        </button>
      </div>
    </div>
  `);

  element.innerHTML = [...materialRows, ...equipmentRows].join("");
}

function renderJobList(player) {
  const element = document.getElementById("job-list");
  if (!element) return;

  const currentJobId = player.jobId;
  const rows = getAllJobs().map((job) => {
    const isCurrent = job.id === currentJobId;
    return `
      <div class="job-option ${isCurrent ? "current" : ""}">
        <div class="job-option-main">
          <span>${escapeHtml(job.name)}</span>
          <small>HP ${job.baseHp} / MP ${job.baseMp} / ATK ${job.baseAtk} / DEF ${job.baseDef}</small>
        </div>
        <button
          class="mini-button"
          data-job-id="${escapeHtml(job.id)}"
          ${isCurrent ? "disabled" : ""}
        >
          ${escapeHtml(isCurrent ? "\u9078\u629E\u4E2D" : "\u9078\u629E")}
        </button>
      </div>
    `;
  });

  element.innerHTML = rows.join("");
}

function renderStageList(state) {
  const element = document.getElementById("stage-list");
  if (!element) return;

  const currentStageId = state.currentStageId;
  const rows = getAllStages().map((stage) => {
    const isCurrent = stage.id === currentStageId;
    return `
      <div class="stage-option ${isCurrent ? "current" : ""}">
        <div class="stage-option-main">
          <span>${escapeHtml(stage.name)}</span>
          <small>Lv ${stage.recommendedLevel} / ${escapeHtml(stage.description)} / ${escapeHtml(formatBossProgress(state, stage))}</small>
        </div>
        <button
          class="mini-button"
          data-stage-id="${escapeHtml(stage.id)}"
          ${isCurrent ? "disabled" : ""}
        >
          ${escapeHtml(isCurrent ? "\u9078\u629E\u4E2D" : "\u9078\u629E")}
        </button>
      </div>
    `;
  });

  element.innerHTML = rows.join("");
}

function formatBossProgress(state, stage) {
  if (!stage?.bossId) return "ボスなし";

  const requiredDefeats = getBossRequiredDefeats(stage);
  const currentCount = getNormalDefeatCount(state, stage.id);
  const bossIsActive = state.battle?.stageId === stage.id
    && state.battle?.enemy?.isBoss
    && state.battle?.enemy?.hp > 0;

  if (bossIsActive) return "ボス出現中";
  if (currentCount >= requiredDefeats) return "次の戦闘でボス出現";

  return `ボスまであと ${requiredDefeats - currentCount}体`;
}

function getNormalDefeatCount(state, stageId) {
  const count = Number(state.stageProgress?.[stageId]?.normalDefeatCount);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

function getBossRequiredDefeats(stage) {
  const value = Number(stage?.bossRequiredDefeats);
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 5;
}

function formatEnemyName(enemy) {
  if (!enemy.isBoss) return enemy.name;

  const phaseLabel = enemy.bossPhase ? ` 第${enemy.bossPhase}形態` : "";
  return `【BOSS${phaseLabel}】${enemy.name}`;
}

function renderEquippedActions(player, stats) {
  setEnhanceButton("btn-enhance-weapon", stats.weapon, player);
  setEnhanceButton("btn-enhance-armor", stats.armor, player);
}

function setEnhanceButton(id, item, player) {
  const button = document.getElementById(id);
  if (!button) return;

  if (!item) {
    button.dataset.instanceId = "";
    button.disabled = true;
    button.textContent = "\u5F37\u5316";
    return;
  }

  button.dataset.instanceId = item.instanceId;
  button.disabled = false;
  button.textContent = "\u5F37\u5316";
  button.title = formatEnhancementCost(player, item);
}

function formatEnhancementCost(player, item) {
  const preview = getEnhancementPreview(player, item);
  if (!preview.nextLevel) return preview.message;

  return `+${preview.nextLevel}: ${preview.materialName} x${preview.materials} / ${preview.gold}G`;
}

function formatEquipmentName(item) {
  if (!item) return "-";
  const level = item.enhanceLevel ?? 0;
  return level > 0 ? `${item.name} +${level}` : item.name;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setBar(id, value, max) {
  const element = document.getElementById(id);
  if (!element) return;

  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  element.style.width = `${ratio * 100}%`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}
