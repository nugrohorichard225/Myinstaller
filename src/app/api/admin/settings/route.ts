import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings, updateSetting } from "@/server/services/user.service";
import { updateSettingSchema } from "@/server/validators";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error getting settings");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = updateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    await updateSetting(parsed.data.key, parsed.data.value, admin.id);

    await createAuditLog({
      userId: admin.id,
      action: "SETTING_UPDATED",
      entityType: "setting",
      entityId: parsed.data.key,
      details: { key: parsed.data.key },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ success: true, key: parsed.data.key });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error updating setting");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
