import { logger } from "./logger";

type JobType = "activity-log" | "notification" | "analytics" | "billing";

type QueueJob = {
  id: string;
  type: JobType;
  payload: unknown;
  attempts: number;
};

type Handler = (payload: unknown) => Promise<void>;

const MAX_ATTEMPTS = 3;
const queue: QueueJob[] = [];
const deadLetter: QueueJob[] = [];
const handlers = new Map<JobType, Handler>();

let workerStarted = false;

export function registerJobHandler(type: JobType, handler: Handler) {
  handlers.set(type, handler);
}

export function enqueueJob(type: JobType, payload: unknown) {
  queue.push({
    id: crypto.randomUUID(),
    type,
    payload,
    attempts: 0,
  });
}

async function processOne(job: QueueJob) {
  const handler = handlers.get(job.type);
  if (!handler) {
    deadLetter.push(job);
    logger.error({ jobId: job.id, type: job.type }, "Missing queue handler; moved to DLQ");
    return;
  }

  try {
    await handler(job.payload);
  } catch (error) {
    job.attempts += 1;
    if (job.attempts >= MAX_ATTEMPTS) {
      deadLetter.push(job);
      logger.error({ err: error, jobId: job.id, type: job.type }, "Queue job failed permanently; moved to DLQ");
      return;
    }
    queue.push(job);
    logger.warn({ err: error, jobId: job.id, type: job.type, attempts: job.attempts }, "Queue job failed; retrying");
  }
}

export function startQueueWorker() {
  if (workerStarted) return;
  workerStarted = true;

  setInterval(async () => {
    const job = queue.shift();
    if (!job) return;
    await processOne(job);
  }, 250);
}

export function getDeadLetterJobs() {
  return [...deadLetter];
}
