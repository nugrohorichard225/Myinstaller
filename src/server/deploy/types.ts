/**
 * Deployment Engine — Adapter Interfaces
 *
 * These interfaces define the contract for deployment adapters.
 * Each adapter handles a specific deployment mechanism (SSH, cloud-init, simulation).
 */

export interface DeployTarget {
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "private_key";
  credential: string;
  sudo: boolean;
}

export interface DeployContext {
  jobId: string;
  target: DeployTarget;
  profileSlug: string;
  profileName: string;
  scriptContent: string;
  cloudInitContent?: string;
  dryRun: boolean;
  autoReboot: boolean;
  healthCheck: boolean;
  extraPackages: string[];
  envVars: Record<string, string>;
  postInstallCmds: string[];
}

export interface DeployStepResult {
  step: string;
  success: boolean;
  message: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface DeployResult {
  success: boolean;
  adapterUsed: string;
  steps: DeployStepResult[];
  error?: string;
  totalDuration: number;
}

export interface DeploymentAdapter {
  name: string;
  description: string;

  /** Check if this adapter can handle the given context */
  canHandle(ctx: DeployContext): boolean;

  /** Validate target connectivity and configuration */
  validateTarget(ctx: DeployContext): Promise<DeployStepResult>;

  /** Execute the deployment */
  execute(ctx: DeployContext): Promise<DeployResult>;
}
