import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { registerSchema } from "@/server/validators";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const user = await registerUser(parsed.data);

    await createAuditLog({
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "user",
      entityId: user.id,
      details: { email: user.email },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    logger.info({ userId: user.id }, "User registered successfully");

    return NextResponse.json(
      { message: "Registration successful", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error: any) {
    const message = error?.message || "";
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    logger.error({ error }, "Registration endpoint error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
