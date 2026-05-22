// =====================================================================
// render.js  ―― 【設計原則2】描画は1か所（状態 → 画面）
// 「今の状態」を受け取って、画面を描き直すだけ。
// ここでは状態を変更しない（一方通行）。状態を変えるのは state.js の update。
// =====================================================================

// 画面を描く（state を受け取り、DOMに反映するだけ）
export function render(state) {
  const p = state.player;
  if (!p) return;

  setText("p-name", p.name);
  setText("p-job", p.job);
  setText("p-level", p.level);

  setText("hp-text", `${p.hp} / ${p.maxHp}`);
  setBar("hp-bar", p.hp, p.maxHp);

  setText("mp-text", `${p.mp} / ${p.maxMp}`);
  setBar("mp-bar", p.mp, p.maxMp);

  setText("exp-text", `${p.exp} / ${p.expToNext}`);
  setBar("exp-bar", p.exp, p.expToNext);

  setText("p-gold", p.gold);

  renderBattle(state.battle);
}

// --- 小さな補助関数 ---
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setBar(id, value, max) {
  const el = document.getElementById(id);
  if (!el) return;
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  el.style.width = (ratio * 100) + "%";
}

function renderBattle(battle) {
  const enemy = battle?.enemy;
  const hasEnemy = Boolean(enemy);

  setText("enemy-name", hasEnemy ? enemy.name : "―");
  setText("enemy-level", hasEnemy ? enemy.level : "―");
  setText("enemy-hp-text", hasEnemy ? `${enemy.hp} / ${enemy.maxHp}` : "―");
  setBar("enemy-hp-bar", hasEnemy ? enemy.hp : 0, hasEnemy ? enemy.maxHp : 1);

  const logEl = document.getElementById("battle-log");
  if (logEl) {
    const lines = battle?.log?.length ? battle.log : ["まだ敵はいない"];
    logEl.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

// 画面下にメッセージを一瞬出す（操作の手応え用）
export function flash(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 1600);
}
