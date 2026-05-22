// =====================================================================
// main.js  ―― 全体の起動とつなぎ込み
// 役割：データを読んで状態を初期化し、render を「状態の変化」に購読させ、
// ボタンを state.js の update につなぐ。
//
// ここがM0の肝：ボタンを押す → update で状態を変える → 自動で render される。
// この「状態を変えれば画面が追従する」一方通行が、設計原則1・2が動いている証拠。
// =====================================================================

import { initGame, update, subscribe, save, load, resetGame } from "./state.js";
import { render, flash } from "./render.js";

// 1) 状態が変わったら、必ず render を呼ぶ（購読）
subscribe(render);

// 2) ボタンを状態変更につなぐ
function wireButtons() {
  // ダメージ：HPを10減らす
  on("btn-damage", () => {
    update((s) => {
      s.player.hp = Math.max(0, s.player.hp - 10);
    });
    flash("10ダメージを受けた");
  });

  // 回復：HPを10回復（最大値を超えない）
  on("btn-heal", () => {
    update((s) => {
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
    });
    flash("HPが10回復した");
  });

  // 経験値：5得る。expToNext を超えたらレベルアップ
  on("btn-exp", () => {
    update((s) => {
      const p = s.player;
      p.exp += 5;
      p.gold += 3;
      while (p.exp >= p.expToNext) {
        p.exp -= p.expToNext;
        p.level += 1;
        p.maxHp += 5;
        p.maxMp += 2;
        p.hp = p.maxHp;       // レベルアップで全回復
        p.mp = p.maxMp;
        p.expToNext = Math.floor(p.expToNext * 1.3);
      }
    });
    flash("経験値とゴールドを得た");
  });

  // セーブ
  on("btn-save", () => {
    flash(save() ? "セーブしました" : "セーブに失敗しました");
  });

  // ロード
  on("btn-load", () => {
    flash(load() ? "ロードしました" : "セーブデータがありません");
  });

  // リセット
  on("btn-reset", async () => {
    await resetGame();
    flash("最初の状態に戻しました");
  });
}

function on(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", handler);
}

// 3) 起動
async function boot() {
  wireButtons();
  try {
    await initGame();   // データ読み込み → 状態初期化 → 最初の描画
  } catch (e) {
    console.error(e);
    const el = document.getElementById("toast");
    if (el) {
      el.textContent = "データの読み込みに失敗しました";
      el.classList.add("show");
    }
  }
}

boot();

// 4) PWA：Service Worker を登録（オフライン対応。失敗しても無視）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
