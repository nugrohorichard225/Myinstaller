import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getJobStats } from "@/server/services/job.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN";
    const stats = await getJobStats(isAdmin ? undefined : user.id);

    return NextResponse.json({ stats });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error getting job stats");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
