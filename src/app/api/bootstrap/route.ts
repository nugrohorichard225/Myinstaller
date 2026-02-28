import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { bootstrapGeneratorSchema } from "@/server/validators";
import { generateBootstrapCommand, renderShellScript, renderCloudInit, generateDryRunScript } from "@/server/deploy/renderers/script.renderer";
import { getProfile } from "@/server/services/profile.service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = bootstrapGeneratorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { profileId, type, variables } = parsed.data;

    const profile = await getProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const template = (profile.scriptTemplate as string) || "#!/bin/bash\necho 'No template defined'";
    let script: string;
    let filename: string;

    if (type === "dry_run") {
      script = generateDryRunScript(profile.name);
      filename = `dryrun-${profile.slug}.sh`;
    } else if (type === "cloud_init") {
      script = renderCloudInit(template, { profileName: profile.name, profileSlug: profile.slug, variables: variables as Record<string, string> });
      filename = `cloud-init-${profile.slug}.yaml`;
    } else {
      script = renderShellScript(template, { profileName: profile.name, profileSlug: profile.slug, variables: variables as Record<string, string> });
      filename = `bootstrap-${profile.slug}.sh`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const bootstrapCommand = generateBootstrapCommand(script, baseUrl, profile.slug);

    return NextResponse.json({
      script,
      filename,
      bootstrapCommand,
      profile: {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        category: profile.category,
      },
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error({ error }, "Error generating bootstrap script");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
