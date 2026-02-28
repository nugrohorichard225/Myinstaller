import { db } from "@/server/db";
import { createAuditLog } from "@/server/audit";
import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("user-service");

export async function listUsers(options?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options?.role) where.role = options.role;
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { deploymentJobs: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.user.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateUserRole(
  userId: string,
  role: "USER" | "ADMIN",
  actorId: string
) {
  const user = await db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  log.info({ userId, role }, "User role updated");

  await createAuditLog({
    actorId,
    action: "user.role_changed",
    entityType: "User",
    entityId: userId,
    summary: `Changed role to ${role} for ${user.email}`,
  });

  return user;
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean,
  actorId: string
) {
  const user = await db.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });

  log.info({ userId, isActive }, "User active status changed");

  await createAuditLog({
    actorId,
    action: isActive ? "user.enabled" : "user.disabled",
    entityType: "User",
    entityId: userId,
    summary: `${isActive ? "Enabled" : "Disabled"} user: ${user.email}`,
  });

  return user;
}

export async function getUserStats() {
  const [totalUsers, activeUsers, admins, totalJobs, completedJobs, failedJobs] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: "ADMIN" } }),
      db.deploymentJob.count(),
      db.deploymentJob.count({ where: { status: { in: ["COMPLETED", "DRY_RUN_COMPLETED"] } } }),
      db.deploymentJob.count({ where: { status: "FAILED" } }),
    ]);

  return {
    totalUsers,
    activeUsers,
    admins,
    totalJobs,
    completedJobs,
    failedJobs,
    successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
  };
}

export async function getSettings() {
  const settings = await db.systemSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function updateSetting(key: string, value: unknown, actorId: string) {
  await db.systemSetting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });

  await createAuditLog({
    actorId,
    action: "setting.updated",
    entityType: "SystemSetting",
    entityId: key,
    summary: `Updated setting: ${key}`,
  });
}
