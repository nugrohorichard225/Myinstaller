import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { listJobs, createJob, getJobStats } from "@/server/services/job.service";
import { createJobSchema } from "@/server/validators";
import { addDeploymentJob } from "@/server/queue";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;

    const isAdmin = user.role === "ADMIN";
    const userId = isAdmin ? undefined : user.id;

    const result = await listJobs({
      ownerId: userId,
      status: status as any,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error listing jobs");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const job = await createJob({
      ...parsed.data,
      ownerId: user.id,
      envVars: parsed.data.envVars as Record<string, string> | undefined,
    });

    // Add to queue
    try {
      await addDeploymentJob({
        jobId: job.id,
        profileId: parsed.data.profileId,
        dryRun: parsed.data.dryRun || false,
      });
    } catch (queueError) {
      logger.warn({ error: queueError, jobId: job.id }, "Failed to add job to queue - job created but not queued");
    }

    await createAuditLog({
      userId: user.id,
      action: "JOB_CREATED",
      entityType: "job",
      entityId: job.id,
      details: {
        profileId: parsed.data.profileId,
        targetHost: parsed.data.targetHost,
        dryRun: parsed.data.dryRun || false,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error creating job");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
