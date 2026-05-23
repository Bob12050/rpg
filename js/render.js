import { getEnhancementPreview } from "./craft.js";
import { getPlayerStats } from "./equipment.js";
import { getAllJobs, getCurrentJob } from "./job.js";

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

  renderBattle(state.battle);
  renderInventory(player);
  renderJobList(player);
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

function renderBattle(battle) {
  const enemy = battle?.enemy;

  setText("enemy-name", enemy ? enemy.name : "-");
  setText("enemy-level", enemy ? enemy.level : "-");
  setText("enemy-hp-text", enemy ? `${enemy.hp} / ${enemy.maxHp}` : "-");
  setBar("enemy-hp-bar", enemy ? enemy.hp : 0, enemy ? enemy.maxHp : 1);

  const logElement = document.getElementById("battle-log");
  if (!logElement) return;

  const lines = battle?.log?.length ? battle.log : ["\u6575\u3092\u63A2\u3057\u3066\u3044\u307E\u3059\u3002"];
  logElement.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
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
