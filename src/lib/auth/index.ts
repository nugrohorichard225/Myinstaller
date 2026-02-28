import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { generateToken } from "@/lib/crypto";
import { createChildLogger } from "@/lib/logger";
import type { Role } from "@prisma/client";

const log = createChildLogger("auth");

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface SessionData {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) return { allowed: true };

  if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterMs = LOCKOUT_DURATION_MS - (now - record.lastAttempt);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true };
}

function recordLoginAttempt(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record) {
    record.count++;
    record.lastAttempt = now;
  } else {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
  }
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "USER",
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  log.info({ userId: user.id }, "User registered");
  return user;
}

export async function loginUser(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<SessionData> {
  const rateLimitKey = input.email.toLowerCase();
  const rateCheck = checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    throw new Error(
      `Too many login attempts. Try again in ${Math.ceil((rateCheck.retryAfterMs || 0) / 60000)} minutes.`
    );
  }

  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, isActive: true, passwordHash: true },
  });

  if (!user) {
    recordLoginAttempt(rateLimitKey);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is disabled. Contact an administrator.");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    recordLoginAttempt(rateLimitKey);
    throw new Error("Invalid email or password");
  }

  clearLoginAttempts(rateLimitKey);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });

  log.info({ userId: user.id }, "User logged in");

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    token,
    expiresAt,
  };
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user.isActive) return null;

  return session.user;
}

export async function logoutUser(token: string): Promise<void> {
  await db.session.delete({ where: { token } }).catch(() => {});
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
