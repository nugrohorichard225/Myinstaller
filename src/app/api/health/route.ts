import { NextResponse } from "next/server";
import { getQueueHealth } from "@/server/queue";
import { db } from "@/server/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const health: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
  };

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch {
    health.database = "disconnected";
    health.status = "degraded";
  }

  // Check queue
  try {
    const queueHealth = await getQueueHealth();
    health.queue = queueHealth;
  } catch {
    health.queue = "disconnected";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
