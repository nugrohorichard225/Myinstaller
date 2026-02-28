import { db } from "@/server/db";
import { createAuditLog } from "@/server/audit";
import { encrypt, maskCredential } from "@/lib/crypto";
import { createChildLogger } from "@/lib/logger";
import type { JobStatus, Prisma } from "@prisma/client";

const log = createChildLogger("job-service");

export async function createJob(input: {
  ownerId: string;
  profileId: string;
  targetLabel: string;
  targetHost: string;
  targetPort: number;
  targetUser: string;
  authMethod: string;
  credential: string;
  providerLabel?: string;
  regionLabel?: string;
  dryRun: boolean;
  autoReboot: boolean;
  healthCheck: boolean;
  extraPackages: string[];
  envVars?: Record<string, string>;
  postInstallCmds: string[];
  notes?: string;
  sudo?: boolean;
}) {
  // Encrypt credential before storing
  const encryptedCredential = encrypt(input.credential);
  const maskedPreview = maskCredential(
    input.credential,
    input.authMethod === "password" ? "password" : "key"
  );

  const job = await db.deploymentJob.create({
    data: {
      ownerId: input.ownerId,
      profileId: input.profileId,
      targetLabel: input.targetLabel,
      targetHost: input.targetHost,
      targetPort: input.targetPort,
      targetUser: input.targetUser,
      authMethod: input.authMethod,
      providerLabel: input.providerLabel,
      regionLabel: input.regionLabel,
      status: "QUEUED",
      dryRun: input.dryRun,
      autoReboot: input.autoReboot,
      healthCheck: input.healthCheck,
      extraPackages: input.extraPackages,
      envVars: input.envVars as object,
      postInstallCmds: input.postInstallCmds,
      notes: input.notes,
      jobOptions: {
        sudo: input.sudo ?? false,
        credentialMasked: maskedPreview,
        credentialEncrypted: encryptedCredential,
      },
    },
    include: { profile: true },
  });

  log.info({ jobId: job.id, dryRun: input.dryRun }, "Job created");

  await createAuditLog({
    actorId: input.ownerId,
    action: "job.created",
    entityType: "DeploymentJob",
    entityId: job.id,
    summary: `Created ${input.dryRun ? "dry-run " : ""}job for ${input.targetLabel}`,
  });

  return job;
}

export async function getJob(id: string, ownerId?: string) {
  const where: Prisma.DeploymentJobWhereInput = { id };
  if (ownerId) where.ownerId = ownerId;

  return db.deploymentJob.findFirst({
    where,
    include: { profile: true, logs: { orderBy: { createdAt: "asc" } } },
  });
}

export async function listJobs(options: {
  ownerId?: string;
  status?: JobStatus;
  profileId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.DeploymentJobWhereInput = {};
  if (options.ownerId) where.ownerId = options.ownerId;
  if (options.status) where.status = options.status;
  if (options.profileId) where.profileId = options.profileId;
  if (options.search) {
    where.OR = [
      { targetLabel: { contains: options.search, mode: "insensitive" } },
      { targetHost: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.deploymentJob.findMany({
      where,
      include: { profile: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.deploymentJob.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  extra?: {
    progress?: number;
    errorSummary?: string;
    adapterUsed?: string;
  }
) {
  const data: Prisma.DeploymentJobUpdateInput = { status };
  if (extra?.progress !== undefined) data.progress = extra.progress;
  if (extra?.errorSummary) data.errorSummary = extra.errorSummary;
  if (extra?.adapterUsed) data.adapterUsed = extra.adapterUsed;

  if (status === "COMPLETED" || status === "DRY_RUN_COMPLETED") {
    data.completedAt = new Date();
    data.progress = 100;
  }
  if (status === "FAILED") {
    data.failedAt = new Date();
  }
  if (status === "VALIDATING" && !data.startedAt) {
    data.startedAt = new Date();
  }

  return db.deploymentJob.update({ where: { id }, data });
}

export async function addJobLog(input: {
  jobId: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
  step?: string;
  metadata?: Record<string, unknown>;
}) {
  return db.deploymentJobLog.create({
    data: {
      jobId: input.jobId,
      level: input.level,
      message: input.message,
      step: input.step,
      metadata: input.metadata as object,
    },
  });
}

export async function getJobLogs(jobId: string) {
  return db.deploymentJobLog.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });
}

export async function cancelJob(id: string, actorId: string) {
  const job = await db.deploymentJob.findUniqueOrThrow({ where: { id } });

  if (!["QUEUED", "VALIDATING"].includes(job.status)) {
    throw new Error("Only queued or validating jobs can be cancelled");
  }

  const updated = await updateJobStatus(id, "CANCELLED");

  await addJobLog({
    jobId: id,
    level: "WARN",
    message: "Job cancelled by user",
    step: "cancellation",
  });

  await createAuditLog({
    actorId,
    action: "job.cancelled",
    entityType: "DeploymentJob",
    entityId: id,
    summary: "Job cancelled",
  });

  return updated;
}

export async function retryJob(id: string, actorId: string) {
  const job = await db.deploymentJob.findUniqueOrThrow({
    where: { id },
    include: { profile: true },
  });

  if (job.status !== "FAILED") {
    throw new Error("Only failed jobs can be retried");
  }

  const updated = await db.deploymentJob.update({
    where: { id },
    data: {
      status: "QUEUED",
      progress: 0,
      errorSummary: null,
      startedAt: null,
      completedAt: null,
      failedAt: null,
    },
  });

  await addJobLog({
    jobId: id,
    level: "INFO",
    message: "Job retried by user",
    step: "retry",
  });

  await createAuditLog({
    actorId,
    action: "job.retried",
    entityType: "DeploymentJob",
    entityId: id,
    summary: "Job retried",
  });

  return updated;
}

export async function getJobStats(ownerId?: string) {
  const where: Prisma.DeploymentJobWhereInput = {};
  if (ownerId) where.ownerId = ownerId;

  const [total, queued, running, completed, failed] = await Promise.all([
    db.deploymentJob.count({ where }),
    db.deploymentJob.count({ where: { ...where, status: "QUEUED" } }),
    db.deploymentJob.count({
      where: {
        ...where,
        status: { in: ["VALIDATING", "CONNECTING", "RENDERING", "PROVISIONING", "REBOOTING", "VERIFYING"] },
      },
    }),
    db.deploymentJob.count({
      where: { ...where, status: { in: ["COMPLETED", "DRY_RUN_COMPLETED"] } },
    }),
    db.deploymentJob.count({ where: { ...where, status: "FAILED" } }),
  ]);

  return { total, queued, running, completed, failed };
}
