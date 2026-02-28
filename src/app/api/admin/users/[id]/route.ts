import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { updateUserRole, toggleUserActive } from "@/server/services/user.service";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    let user;
    if (body.role) {
      user = await updateUserRole(id, body.role, admin.id);
    }
    if (typeof body.isActive === "boolean") {
      user = await toggleUserActive(id, body.isActive, admin.id);
    }

    if (!user) {
      return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
    }

    await createAuditLog({
      userId: admin.id,
      action: "USER_UPDATED",
      entityType: "user",
      entityId: id,
      details: body,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error updating user");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
