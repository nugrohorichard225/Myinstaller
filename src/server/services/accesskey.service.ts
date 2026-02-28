import { db } from "@/server/db";
import { generateAccessKeyCode } from "@/lib/crypto";
import { createAuditLog } from "@/server/audit";
import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("accesskey-service");

export async function createAccessKey(input: {
  maxRedemptions?: number;
  expiresAt?: string;
  notes?: string;
  actorId: string;
}) {
  const code = generateAccessKeyCode();

  const key = await db.accessKey.create({
    data: {
      code,
      maxRedemptions: input.maxRedemptions ?? 1,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      notes: input.notes,
    },
  });

  log.info({ keyId: key.id }, "Access key created");

  await createAuditLog({
    actorId: input.actorId,
    action: "accesskey.created",
    entityType: "AccessKey",
    entityId: key.id,
    summary: `Generated access key: ${code}`,
  });

  return key;
}

export async function redeemAccessKey(code: string, userId: string) {
  const key = await db.accessKey.findUnique({ where: { code } });

  if (!key) throw new Error("Invalid access key");
  if (key.status !== "ACTIVE") throw new Error("Access key is no longer active");
  if (key.expiresAt && key.expiresAt < new Date()) throw new Error("Access key has expired");
  if (key.redeemedCount >= key.maxRedemptions) throw new Error("Access key has reached max redemptions");

  // Check if user already redeemed this key
  const existing = await db.accessKeyRedemption.findFirst({
    where: { accessKeyId: key.id, userId },
  });
  if (existing) throw new Error("You have already redeemed this access key");

  // Create redemption and update count
  await db.$transaction([
    db.accessKeyRedemption.create({
      data: { accessKeyId: key.id, userId },
    }),
    db.accessKey.update({
      where: { id: key.id },
      data: {
        redeemedCount: { increment: 1 },
        status: key.redeemedCount + 1 >= key.maxRedemptions ? "EXPIRED" : "ACTIVE",
      },
    }),
  ]);

  log.info({ keyId: key.id, userId }, "Access key redeemed");

  await createAuditLog({
    actorId: userId,
    action: "accesskey.redeemed",
    entityType: "AccessKey",
    entityId: key.id,
    summary: `Redeemed access key: ${code}`,
  });

  return { success: true };
}

export async function listAccessKeys(options?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options?.status) where.status = options.status;

  const [items, total] = await Promise.all([
    db.accessKey.findMany({
      where,
      include: { redemptions: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.accessKey.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function revokeAccessKey(id: string, actorId: string) {
  const key = await db.accessKey.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  await createAuditLog({
    actorId,
    action: "accesskey.revoked",
    entityType: "AccessKey",
    entityId: id,
    summary: `Revoked access key: ${key.code}`,
  });

  return key;
}
