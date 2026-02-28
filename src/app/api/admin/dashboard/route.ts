import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getUserStats } from "@/server/services/user.service";
import { getJobStats } from "@/server/services/job.service";
import { getQueueHealth } from "@/server/queue";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await requireAdmin();

    const [userStats, jobStats, queueHealth] = await Promise.allSettled([
      getUserStats(),
      getJobStats(),
      getQueueHealth(),
    ]);

    return NextResponse.json({
      users: userStats.status === "fulfilled" ? userStats.value : null,
      jobs: jobStats.status === "fulfilled" ? jobStats.value : null,
      queue: queueHealth.status === "fulfilled" ? queueHealth.value : null,
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error getting admin dashboard stats");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
