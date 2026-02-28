import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getJob, cancelJob } from "@/server/services/job.service";
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

    const cancelled = await cancelJob(id, user.id);

    await createAuditLog({
      userId: user.id,
      action: "JOB_CANCELLED",
      entityType: "job",
      entityId: id,
      details: {},
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ job: cancelled });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error cancelling job");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
