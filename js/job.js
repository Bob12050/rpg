const DEFAULT_JOB_ID = "warrior";

let jobDefinitions = {};

export async function loadJobDefinitions() {
  const response = await fetch("data/jobs.json");
  if (!response.ok) {
    throw new Error("Failed to load data/jobs.json");
  }
  jobDefinitions = await response.json();
}

export function getJobDefinition(jobId) {
  return jobDefinitions[jobId] ?? jobDefinitions[DEFAULT_JOB_ID] ?? null;
}

export function getCurrentJob(player) {
  return getJobDefinition(player?.jobId ?? DEFAULT_JOB_ID);
}

export function getDefaultJobId() {
  return DEFAULT_JOB_ID;
}
