import { db } from "@/server/db";
import { createAuditLog } from "@/server/audit";
import { createChildLogger } from "@/lib/logger";
import type { Prisma, ProfileCategory } from "@prisma/client";

const log = createChildLogger("profile-service");

export async function listProfiles(options?: {
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}) {
  const where: Prisma.DeploymentProfileWhereInput = {};
  if (options?.category) where.category = options.category as never;
  if (options?.isActive !== undefined) where.isActive = options.isActive;
  if (options?.isFeatured !== undefined) where.isFeatured = options.isFeatured;
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
      { tags: { hasSome: [options.search] } },
    ];
  }

  return db.deploymentProfile.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
}

export async function getProfile(id: string) {
  return db.deploymentProfile.findUnique({ where: { id } });
}

export async function getProfileBySlug(slug: string) {
  return db.deploymentProfile.findUnique({ where: { slug } });
}

export async function createProfile(
  data: Prisma.DeploymentProfileCreateInput,
  actorId?: string
) {
  const profile = await db.deploymentProfile.create({ data });
  log.info({ profileId: profile.id }, "Profile created");
  await createAuditLog({
    actorId,
    action: "profile.created",
    entityType: "DeploymentProfile",
    entityId: profile.id,
    summary: `Created profile: ${profile.name}`,
  });
  return profile;
}

export async function updateProfile(
  id: string,
  data: Prisma.DeploymentProfileUpdateInput,
  actorId?: string
) {
  const profile = await db.deploymentProfile.update({ where: { id }, data });
  log.info({ profileId: profile.id }, "Profile updated");
  await createAuditLog({
    actorId,
    action: "profile.updated",
    entityType: "DeploymentProfile",
    entityId: profile.id,
    summary: `Updated profile: ${profile.name}`,
  });
  return profile;
}

export async function deleteProfile(id: string, actorId?: string) {
  const profile = await db.deploymentProfile.delete({ where: { id } });
  log.info({ profileId: id }, "Profile deleted");
  await createAuditLog({
    actorId,
    action: "profile.deleted",
    entityType: "DeploymentProfile",
    entityId: id,
    summary: `Deleted profile: ${profile.name}`,
  });
}

export async function duplicateProfile(id: string, actorId?: string) {
  const original = await db.deploymentProfile.findUniqueOrThrow({ where: { id } });
  const { id: _, createdAt, updatedAt, slug, ...rest } = original;
  const newSlug = `${slug}-copy-${Date.now()}`;
  const profile = await db.deploymentProfile.create({
    data: {
      ...rest,
      slug: newSlug,
      name: `${rest.name} (Copy)`,
      isFeatured: false,
      variablesSchema: rest.variablesSchema ?? undefined,
    } as Prisma.DeploymentProfileCreateInput,
  });
  await createAuditLog({
    actorId,
    action: "profile.duplicated",
    entityType: "DeploymentProfile",
    entityId: profile.id,
    summary: `Duplicated profile from ${original.name}`,
  });
  return profile;
}
