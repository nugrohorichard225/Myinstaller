import { createChildLogger } from "@/lib/logger";
import type {
  DeploymentAdapter,
  DeployContext,
  DeployResult,
  DeployStepResult,
} from "../types";
import { sleep } from "@/lib/utils";

const log = createChildLogger("simulation-adapter");

/**
 * Simulation Adapter
 *
 * Used for dry-run mode and any workflows that cannot be safely executed
 * in a generic, provider-agnostic way. This adapter simulates the entire
 * deployment pipeline with realistic timings and log output.
 *
 * Workflows that require provider-specific APIs (e.g., full OS reinstallation)
 * will always use this adapter until official provider integrations are built.
 */
export class SimulationAdapter implements DeploymentAdapter {
  name = "SimulationAdapter";
  description =
    "Simulates deployment steps without making real changes. Used for dry-run mode and unsupported provider-specific workflows.";

  canHandle(ctx: DeployContext): boolean {
    return ctx.dryRun;
  }

  async validateTarget(ctx: DeployContext): Promise<DeployStepResult> {
    log.info({ jobId: ctx.jobId }, "Simulating target validation");
    await sleep(500);
    return {
      step: "validate_target",
      success: true,
      message: `[SIMULATION] Target ${ctx.target.host}:${ctx.target.port} configuration looks valid`,
      duration: 500,
      metadata: {
        host: ctx.target.host,
        port: ctx.target.port,
        username: ctx.target.username,
        simulated: true,
      },
    };
  }

  async execute(ctx: DeployContext): Promise<DeployResult> {
    const startTime = Date.now();
    const steps: DeployStepResult[] = [];

    // Step 1: Validate target
    const validateResult = await this.validateTarget(ctx);
    steps.push(validateResult);

    // Step 2: Test connectivity
    await sleep(800);
    steps.push({
      step: "test_connectivity",
      success: true,
      message: `[SIMULATION] SSH connectivity to ${ctx.target.host} would be tested`,
      duration: 800,
      metadata: { simulated: true },
    });

    // Step 3: Render script
    await sleep(300);
    steps.push({
      step: "render_script",
      success: true,
      message: `[SIMULATION] Script rendered for profile "${ctx.profileName}" (${ctx.scriptContent.length} bytes)`,
      duration: 300,
      metadata: {
        scriptLength: ctx.scriptContent.length,
        profileSlug: ctx.profileSlug,
        simulated: true,
      },
    });

    // Step 4: Upload script
    await sleep(600);
    steps.push({
      step: "upload_script",
      success: true,
      message: `[SIMULATION] Script would be uploaded to /tmp/myinstaller_${ctx.jobId}.sh`,
      duration: 600,
      metadata: { simulated: true },
    });

    // Step 5: Execute script
    await sleep(2000);
    steps.push({
      step: "execute_script",
      success: true,
      message: `[SIMULATION] Script execution simulated successfully`,
      duration: 2000,
      metadata: {
        simulated: true,
        extraPackages: ctx.extraPackages,
        postInstallCmds: ctx.postInstallCmds.length,
      },
    });

    // Step 6: Install extra packages
    if (ctx.extraPackages.length > 0) {
      await sleep(1000);
      steps.push({
        step: "install_packages",
        success: true,
        message: `[SIMULATION] Would install packages: ${ctx.extraPackages.join(", ")}`,
        duration: 1000,
        metadata: { simulated: true, packages: ctx.extraPackages },
      });
    }

    // Step 7: Post-install commands
    if (ctx.postInstallCmds.length > 0) {
      await sleep(500);
      steps.push({
        step: "post_install_commands",
        success: true,
        message: `[SIMULATION] Would execute ${ctx.postInstallCmds.length} post-install commands`,
        duration: 500,
        metadata: { simulated: true, commandCount: ctx.postInstallCmds.length },
      });
    }

    // Step 8: Reboot (if requested)
    if (ctx.autoReboot) {
      await sleep(3000);
      steps.push({
        step: "reboot",
        success: true,
        message: `[SIMULATION] System reboot would be triggered`,
        duration: 3000,
        metadata: { simulated: true },
      });
    }

    // Step 9: Health check
    if (ctx.healthCheck) {
      await sleep(1000);
      steps.push({
        step: "health_check",
        success: true,
        message: `[SIMULATION] Post-deployment health check passed`,
        duration: 1000,
        metadata: { simulated: true },
      });
    }

    // Step 10: Cleanup
    await sleep(200);
    steps.push({
      step: "cleanup",
      success: true,
      message: `[SIMULATION] Temporary files cleaned up`,
      duration: 200,
      metadata: { simulated: true },
    });

    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      adapterUsed: this.name,
      steps,
      totalDuration,
    };
  }
}
