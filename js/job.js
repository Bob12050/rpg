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

export function getAllJobs() {
  return Object.values(jobDefinitions);
}

export function changeJob(player, jobId) {
  const job = getJobDefinition(jobId);
  if (!job) {
    return "\u8077\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002";
  }

  player.jobId = job.id;
  player.job = job.name;
  return `${job.name}\u306B\u5909\u66F4\u3057\u307E\u3057\u305F\u3002`;
}

export function getDefaultJobId() {
  return DEFAULT_JOB_ID;
}
