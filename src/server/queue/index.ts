import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getQueueConnection(): ConnectionOptions {
  return getRedisConnection() as unknown as ConnectionOptions;
}

export const DEPLOYMENT_QUEUE_NAME = "deployment-jobs";

let deploymentQueue: Queue | null = null;

export function getDeploymentQueue(): Queue {
  if (!deploymentQueue) {
    deploymentQueue = new Queue(DEPLOYMENT_QUEUE_NAME, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    });
  }
  return deploymentQueue;
}

export async function addDeploymentJob(data: {
  jobId: string;
  profileId: string;
  dryRun: boolean;
}) {
  const queue = getDeploymentQueue();
  return queue.add("deploy", data, {
    jobId: data.jobId,
  });
}

export async function getQueueHealth() {
  try {
    const queue = getDeploymentQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      healthy: true,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  } catch {
    return {
      healthy: false,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
}
