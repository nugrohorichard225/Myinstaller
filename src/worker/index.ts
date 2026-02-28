import { Worker, type Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { DEPLOYMENT_QUEUE_NAME, getQueueConnection } from "../server/queue";
import { executeDeployment } from "../server/deploy";
import { renderShellScript, renderCloudInit } from "../server/deploy/renderers/script.renderer";
import { decrypt } from "../lib/crypto";
import type { DeployContext, DeployTarget } from "../server/deploy/types";

const db = new PrismaClient();

console.log("🚀 MyInstaller Worker starting...");

async function updateJobStatus(
  jobId: string,
  status: string,
  extra?: { progress?: number; errorSummary?: string; adapterUsed?: string }
) {
  const data: Record<string, unknown> = { status };
  if (extra?.progress !== undefined) data.progress = extra.progress;
  if (extra?.errorSummary) data.errorSummary = extra.errorSummary;
  if (extra?.adapterUsed) data.adapterUsed = extra.adapterUsed;

  if (status === "COMPLETED" || status === "DRY_RUN_COMPLETED") {
    data.completedAt = new Date();
    data.progress = 100;
  }
  if (status === "FAILED") data.failedAt = new Date();
  if (status === "VALIDATING") data.startedAt = new Date();

  await db.deploymentJob.update({ where: { id: jobId }, data });
}

async function addLog(
  jobId: string,
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS",
  message: string,
  step?: string,
  metadata?: Record<string, unknown>
) {
  await db.deploymentJobLog.create({
    data: {
      jobId,
      level,
      message,
      step,
      metadata: metadata as object,
    },
  });
}

async function processDeployment(bullJob: Job) {
  const { jobId } = bullJob.data as { jobId: string };
  console.log(`📦 Processing job: ${jobId}`);

  try {
    // Load job from database
    const job = await db.deploymentJob.findUniqueOrThrow({
      where: { id: jobId },
      include: { profile: true },
    });

    // Check if cancelled
    if (job.status === "CANCELLED") {
      await addLog(jobId, "WARN", "Job was cancelled before processing", "init");
      return;
    }

    // Phase 1: Validating
    await updateJobStatus(jobId, "VALIDATING", { progress: 5 });
    await addLog(jobId, "INFO", "Starting job validation", "validate");
    await bullJob.updateProgress(5);

    // Extract credential
    let credential = "";
    try {
      const jobOptions = job.jobOptions as Record<string, unknown> | null;
      const encryptedCred = jobOptions?.credentialEncrypted as string;
      if (encryptedCred) {
        credential = decrypt(encryptedCred);
      }
    } catch {
      await updateJobStatus(jobId, "FAILED", {
        errorSummary: "Failed to decrypt credentials",
      });
      await addLog(jobId, "ERROR", "Failed to decrypt credentials", "validate");
      return;
    }

    await addLog(jobId, "SUCCESS", "Job validation passed", "validate");
    await bullJob.updateProgress(15);

    // Phase 2: Connecting
    await updateJobStatus(jobId, "CONNECTING", { progress: 20 });
    await addLog(jobId, "INFO", `Connecting to ${job.targetHost}:${job.targetPort}`, "connect");
    await bullJob.updateProgress(20);

    // Phase 3: Rendering
    await updateJobStatus(jobId, "RENDERING", { progress: 30 });
    await addLog(jobId, "INFO", `Rendering scripts for profile: ${job.profile.name}`, "render");

    const scriptContent = renderShellScript(job.profile.scriptTemplate || "#!/bin/bash\necho 'No script template'", {
      profileName: job.profile.name,
      profileSlug: job.profile.slug,
      variables: {},
      extraPackages: job.extraPackages,
      envVars: (job.envVars as Record<string, string>) || {},
      postInstallCmds: job.postInstallCmds,
      autoReboot: job.autoReboot,
    });

    const cloudInitContent = job.profile.cloudInitTemplate
      ? renderCloudInit(job.profile.cloudInitTemplate, {
          profileName: job.profile.name,
          profileSlug: job.profile.slug,
        })
      : undefined;

    await addLog(jobId, "SUCCESS", `Script rendered (${scriptContent.length} bytes)`, "render");
    await bullJob.updateProgress(40);

    // Phase 4: Provisioning
    await updateJobStatus(jobId, "PROVISIONING", { progress: 50 });
    await addLog(jobId, "INFO", "Starting deployment execution", "provision");

    const target: DeployTarget = {
      host: job.targetHost,
      port: job.targetPort,
      username: job.targetUser,
      authMethod: job.authMethod as "password" | "private_key",
      credential,
      sudo: (job.jobOptions as Record<string, unknown>)?.sudo === true,
    };

    const deployCtx: DeployContext = {
      jobId: job.id,
      target,
      profileSlug: job.profile.slug,
      profileName: job.profile.name,
      scriptContent,
      cloudInitContent,
      dryRun: job.dryRun,
      autoReboot: job.autoReboot,
      healthCheck: job.healthCheck,
      extraPackages: job.extraPackages,
      envVars: (job.envVars as Record<string, string>) || {},
      postInstallCmds: job.postInstallCmds,
    };

    const result = await executeDeployment(deployCtx);

    // Log each step
    for (const step of result.steps) {
      await addLog(
        jobId,
        step.success ? "INFO" : "ERROR",
        step.message,
        step.step,
        step.metadata
      );
    }

    await bullJob.updateProgress(90);

    // Phase 5: Complete or fail
    if (result.success) {
      const finalStatus = job.dryRun ? "DRY_RUN_COMPLETED" : "COMPLETED";
      await updateJobStatus(jobId, finalStatus, {
        progress: 100,
        adapterUsed: result.adapterUsed,
      });
      await addLog(
        jobId,
        "SUCCESS",
        `Deployment ${job.dryRun ? "(dry-run) " : ""}completed successfully in ${result.totalDuration}ms`,
        "complete",
        { adapterUsed: result.adapterUsed, totalDuration: result.totalDuration }
      );
    } else {
      await updateJobStatus(jobId, "FAILED", {
        errorSummary: result.error || "Deployment failed",
        adapterUsed: result.adapterUsed,
      });
      await addLog(jobId, "ERROR", `Deployment failed: ${result.error}`, "error");
    }

    await bullJob.updateProgress(100);
    console.log(`✅ Job ${jobId} processed: ${result.success ? "SUCCESS" : "FAILED"}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Job ${jobId} error:`, errorMessage);

    await updateJobStatus(jobId, "FAILED", { errorSummary: errorMessage });
    await addLog(jobId, "ERROR", `Worker error: ${errorMessage}`, "worker_error");
    throw error;
  }
}

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);

const worker = new Worker(DEPLOYMENT_QUEUE_NAME, processDeployment, {
  connection: getQueueConnection(),
  concurrency,
});

worker.on("completed", (job) => {
  console.log(`✅ BullMQ job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ BullMQ job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err.message);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down worker gracefully...");
  await worker.close();
  await db.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down worker gracefully...");
  await worker.close();
  await db.$disconnect();
  process.exit(0);
});

console.log(`✅ Worker started with concurrency: ${concurrency}`);
