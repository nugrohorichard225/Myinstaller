import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { loginSchema } from "@/server/validators";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await loginUser({
      ...parsed.data,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    await createAuditLog({
      userId: result.user.id,
      action: "USER_LOGIN",
      entityType: "user",
      entityId: result.user.id,
      details: { email: result.user.email },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set("myinstaller_session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    const message = error?.message || "";
    if (
      message.includes("Invalid email") ||
      message.includes("Too many login") ||
      message.includes("Account is disabled")
    ) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    logger.error({ error }, "Login endpoint error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
