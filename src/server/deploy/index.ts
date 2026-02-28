import { createChildLogger } from "@/lib/logger";
import type { DeployContext, DeployResult } from "./types";
import { SimulationAdapter } from "./adapters/simulation.adapter";
import { GenericSSHAdapter } from "./adapters/ssh.adapter";
import { CloudInitAdapter } from "./adapters/cloudinit.adapter";
import type { DeploymentAdapter } from "./types";

const log = createChildLogger("deploy-engine");

/**
 * Deployment Engine
 *
 * Orchestrates the deployment process by selecting the appropriate adapter
 * and executing the deployment steps. The engine enforces safety boundaries
 * and ensures transparent operation.
 *
 * Adapter selection priority:
 * 1. SimulationAdapter (always used for dry-run)
 * 2. CloudInitAdapter (when cloud-init template is available)
 * 3. GenericSSHAdapter (for SSH-based deployments)
 *
 * SAFETY NOTE: This engine does NOT support:
 * - Full OS reinstallation (requires provider-specific API)
 * - Disk partitioning or formatting
 * - Bootloader modifications
 * - Any operation that could bypass provider restrictions
 *
 * These workflows are automatically routed to SimulationAdapter.
 */

const adapters: DeploymentAdapter[] = [
  new SimulationAdapter(),
  new CloudInitAdapter(),
  new GenericSSHAdapter(),
];

export function selectAdapter(ctx: DeployContext): DeploymentAdapter {
  // Always use simulation for dry-run
  if (ctx.dryRun) {
    return adapters[0]; // SimulationAdapter
  }

  // Try each adapter in priority order
  for (const adapter of adapters) {
    if (adapter.canHandle(ctx)) {
      return adapter;
    }
  }

  // Fallback to simulation with a warning
  log.warn(
    { jobId: ctx.jobId },
    "No suitable adapter found. Falling back to simulation mode."
  );
  return adapters[0];
}

export async function executeDeployment(ctx: DeployContext): Promise<DeployResult> {
  log.info(
    { jobId: ctx.jobId, dryRun: ctx.dryRun, profile: ctx.profileSlug },
    "Starting deployment"
  );

  const adapter = selectAdapter(ctx);
  log.info(
    { jobId: ctx.jobId, adapter: adapter.name },
    "Selected deployment adapter"
  );

  try {
    const result = await adapter.execute(ctx);

    if (result.success) {
      log.info(
        { jobId: ctx.jobId, adapter: adapter.name, duration: result.totalDuration },
        "Deployment completed successfully"
      );
    } else {
      log.error(
        { jobId: ctx.jobId, adapter: adapter.name, error: result.error },
        "Deployment failed"
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error(
      { jobId: ctx.jobId, error: errorMessage },
      "Deployment engine error"
    );

    return {
      success: false,
      adapterUsed: adapter.name,
      steps: [
        {
          step: "engine_error",
          success: false,
          message: `Deployment engine error: ${errorMessage}`,
        },
      ],
      error: errorMessage,
      totalDuration: 0,
    };
  }
}
