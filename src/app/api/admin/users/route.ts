import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/server/services/user.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error listing users");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
