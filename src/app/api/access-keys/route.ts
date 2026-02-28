import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth/session";
import { listAccessKeys, createAccessKey } from "@/server/services/accesskey.service";
import { createAccessKeySchema } from "@/server/validators";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const keys = await listAccessKeys();
    return NextResponse.json({ keys });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error listing access keys");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const parsed = createAccessKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const key = await createAccessKey({
      ...parsed.data,
      actorId: user.id,
    });

    await createAuditLog({
      userId: user.id,
      action: "ACCESS_KEY_CREATED",
      entityType: "access_key",
      entityId: key.id,
      details: { notes: parsed.data.notes },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error creating access key");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
