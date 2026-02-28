import { z } from "zod";

// ── Auth Validators ──────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Job Validators ───────────────────────────────────────────────────────────

export const createJobSchema = z.object({
  // Target
  targetLabel: z.string().min(1, "Target label is required").max(100),
  targetHost: z
    .string()
    .min(1, "IP or hostname is required")
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      "Invalid IP address or hostname"
    ),
  targetPort: z.coerce.number().int().min(1).max(65535).default(22),
  targetUser: z.string().min(1).max(64).default("root"),
  authMethod: z.enum(["password", "private_key"]),
  credential: z.string().min(1, "Credential is required"),
  providerLabel: z.string().optional(),
  regionLabel: z.string().optional(),

  // Profile
  profileId: z.string().min(1, "Profile is required"),

  // Options
  dryRun: z.boolean().default(false),
  autoReboot: z.boolean().default(false),
  healthCheck: z.boolean().default(true),
  extraPackages: z.array(z.string().max(100)).max(50).default([]),
  envVars: z.record(z.string(), z.string()).optional(),
  postInstallCmds: z
    .array(
      z
        .string()
        .max(500)
        .refine((cmd) => !cmd.includes("rm -rf /"), {
          message: "Dangerous command detected",
        })
        .refine((cmd) => !cmd.includes("dd if="), {
          message: "Dangerous command detected",
        })
        .refine((cmd) => !cmd.includes("mkfs"), {
          message: "Potentially destructive command. Use with caution.",
        })
    )
    .max(20)
    .default([]),
  notes: z.string().max(2000).optional(),
  sudo: z.boolean().default(false),

  // Legal acknowledgements
  ownershipConfirmed: z.literal(true, {
    error: "You must confirm server ownership",
  }),
  dataLossConfirmed: z.literal(true, {
    error: "You must acknowledge potential data loss",
  }),
  complianceConfirmed: z.literal(true, {
    error: "You must confirm licensing compliance",
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

// ── Profile Validators ───────────────────────────────────────────────────────

export const createProfileSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  osFamily: z.string().min(1).max(50),
  osVersion: z.string().min(1).max(50),
  category: z.enum([
    "LINUX_BASE",
    "LINUX_DOCKER",
    "LINUX_HARDENED",
    "WINDOWS_TEMPLATE",
    "RDP_READY",
    "CLOUD_INIT",
    "CUSTOM_PROVISION",
    "RECOVERY",
    "DIAGNOSTICS",
  ]),
  description: z.string().min(1).max(500),
  longDescription: z.string().max(5000).optional(),
  scriptTemplate: z.string().max(50000).optional(),
  cloudInitTemplate: z.string().max(50000).optional(),
  variablesSchema: z.any().optional(),
  estimatedDuration: z.coerce.number().int().min(10).max(7200).default(300),
  visibility: z.enum(["public", "private"]).default("public"),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

// ── Access Key Validators ────────────────────────────────────────────────────

export const createAccessKeySchema = z.object({
  maxRedemptions: z.coerce.number().int().min(1).max(1000).default(1),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const redeemAccessKeySchema = z.object({
  code: z.string().min(1, "Access key code is required"),
});

// ── Settings Validators ──────────────────────────────────────────────────────

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

// ── Bootstrap Generator Validators ───────────────────────────────────────────

export const bootstrapGeneratorSchema = z.object({
  profileId: z.string().min(1),
  type: z.enum(["shell", "cloud_init", "post_install", "first_boot", "hardening", "dry_run"]),
  variables: z.record(z.string(), z.string()).optional(),
});
