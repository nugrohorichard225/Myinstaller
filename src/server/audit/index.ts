import { db } from "@/server/db";
import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("audit");

export interface AuditEntry {
  actorId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId || entry.userId || null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        summary: entry.summary,
        metadata: (entry.metadata || entry.details || {}) as object,
      },
    });
    log.debug({ action: entry.action }, "Audit log created");
  } catch (error) {
    log.error({ error, entry }, "Failed to create audit log");
  }
}

export async function getAuditLogs(options: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  actorId?: string;
}) {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options.action) where.action = options.action;
  if (options.entityType) where.entityType = options.entityType;
  if (options.actorId) where.actorId = options.actorId;

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.auditLog.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
