import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getJob, retryJob } from "@/server/services/job.service";
import { addDeploymentJob } from "@/server/queue";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const job = await getJob(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && job.ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const retried = await retryJob(id, user.id);

    try {
      await addDeploymentJob({
        jobId: retried.id,
        profileId: retried.profileId,
        dryRun: retried.dryRun,
      });
    } catch (queueError) {
      logger.warn({ error: queueError }, "Failed to re-queue job");
    }

    await createAuditLog({
      userId: user.id,
      action: "JOB_RETRIED",
      entityType: "job",
      entityId: id,
      details: {},
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ job: retried });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error retrying job");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
