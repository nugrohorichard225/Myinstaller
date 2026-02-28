import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth/session";
import { listProfiles, createProfile } from "@/server/services/profile.service";
import { createProfileSchema } from "@/server/validators";
import { createAuditLog } from "@/server/audit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const _user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") as string | undefined;
    const search = searchParams.get("search") || undefined;

    const profiles = await listProfiles({
      category: category || undefined,
      isActive: true,
      search,
    });

    return NextResponse.json({ profiles });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error listing profiles");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const parsed = createProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const profile = await createProfile(
      parsed.data as any,
      user.id
    );

    await createAuditLog({
      userId: user.id,
      action: "PROFILE_CREATED",
      entityType: "profile",
      entityId: profile.id,
      details: { name: profile.name, slug: profile.slug },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "Unauthorized" || error?.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    logger.error({ error }, "Error creating profile");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
