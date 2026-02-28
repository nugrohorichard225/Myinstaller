import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { redeemAccessKey } from "@/server/services/accesskey.service";
import { redeemAccessKeySchema } from "@/server/validators";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = redeemAccessKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await redeemAccessKey(parsed.data.code, user.id);

    await createAuditLog({
      userId: user.id,
      action: "ACCESS_KEY_REDEEMED",
      entityType: "access_key",
      entityId: "unknown",
      details: { code: parsed.data.code },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ message: "Access key redeemed successfully", result });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error redeeming access key");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
