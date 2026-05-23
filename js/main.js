import { getState, initGame, load, resetGame, save, subscribe, update } from "./state.js";
import { equipItem, loadEquipmentDefinitions, unequipItem } from "./equipment.js";
import { flash, render, setSaveIndicator } from "./render.js";
import { attackEnemy, gainTestExp, loadEnemies, startNextBattle } from "./battle.js";
import { loadLootTables } from "./loot.js";

subscribe((state) => {
  render(state);
  setSaveIndicator("\u672A\u4FDD\u5B58");
});

wireButtons();
boot();

function wireButtons() {
  on("btn-damage", () => {
    update((state) => {
      state.player.hp = Math.max(0, state.player.hp - 10);
    });
    flash("HP\u304C10\u6E1B\u3063\u305F\u3002");
  });

  on("btn-heal", () => {
    update((state) => {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
    });
    flash("HP\u304C10\u56DE\u5FA9\u3057\u305F\u3002");
  });

  on("btn-exp", () => {
    gainTestExp();
    flash("EXP\u3068\u30B4\u30FC\u30EB\u30C9\u3092\u5F97\u305F\u3002");
  });

  on("btn-save", () => {
    if (save()) {
      setSaveIndicator("\u4FDD\u5B58\u6E08\u307F");
      flash("\u30BB\u30FC\u30D6\u3057\u307E\u3057\u305F\u3002");
    } else {
      flash("\u30BB\u30FC\u30D6\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
    }
  });

  on("btn-load", () => {
    if (load()) {
      if (!getState().battle) startNextBattle();
      setSaveIndicator("\u30ED\u30FC\u30C9\u6E08\u307F");
      flash("\u30ED\u30FC\u30C9\u3057\u307E\u3057\u305F\u3002");
    } else {
      flash("\u30BB\u30FC\u30D6\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002");
    }
  });

  on("btn-reset", async () => {
    await resetGame();
    startNextBattle();
    setSaveIndicator("\u521D\u671F\u5316\u6E08\u307F");
    flash("\u6700\u521D\u304B\u3089\u59CB\u3081\u307E\u3057\u305F\u3002");
  });

  on("btn-attack", () => {
    attackEnemy();
  });

  on("btn-next-enemy", () => {
    startNextBattle();
  });

  on("inventory-list", (event) => {
    const button = event.target.closest("[data-action='equip']");
    if (!button) return;

    update((state) => {
      const message = equipItem(state.player, button.dataset.instanceId);
      state.uiMessage = message;
      flash(message);
    });
  });

  on("btn-unequip-weapon", () => {
    update((state) => {
      const message = unequipItem(state.player, "weapon");
      state.uiMessage = message;
      flash(message);
    });
  });

  on("btn-unequip-armor", () => {
    update((state) => {
      const message = unequipItem(state.player, "armor");
      state.uiMessage = message;
      flash(message);
    });
  });
}

async function boot() {
  try {
    await loadEquipmentDefinitions();
    await loadEnemies();
    await loadLootTables();
    await initGame();
    if (!getState().battle) startNextBattle();
  } catch (error) {
    console.error(error);
    flash("\u30C7\u30FC\u30BF\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

function on(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener("click", handler);
}
