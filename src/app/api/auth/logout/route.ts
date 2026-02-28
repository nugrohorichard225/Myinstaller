import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";
import { getSessionToken } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken();

    if (token) {
      await logoutUser(token);
    }

    const response = NextResponse.json({ message: "Logged out" }, { status: 200 });

    response.cookies.set("myinstaller_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    logger.error({ error }, "Logout endpoint error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
