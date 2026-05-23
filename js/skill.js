import { getCurrentJob } from "./job.js";

let skillDefinitions = {};

export async function loadSkillDefinitions() {
  const response = await fetch("data/skills.json");
  if (!response.ok) {
    throw new Error("Failed to load data/skills.json");
  }
  skillDefinitions = await response.json();
}

export function getSkillDefinition(skillId) {
  return skillDefinitions[skillId] ?? null;
}

export function getSkillsForCurrentJob(player) {
  const job = getCurrentJob(player);
  const skillIds = job?.skillIds ?? [];
  return skillIds.map(getSkillDefinition).filter(Boolean);
}

export function calculateSkillDamage(skill, player, stats) {
  if (skill.kind === "magicFlat") {
    return Math.max(
      1,
      Math.floor((skill.flatDamage ?? 0) + stats.atk * (skill.powerMultiplier ?? 0) + player.level * (skill.levelBonus ?? 0))
    );
  }

  return Math.max(
    1,
    Math.floor(stats.atk * (skill.powerMultiplier ?? 1) + player.level * (skill.levelBonus ?? 0))
  );
}
