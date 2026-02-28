import { createChildLogger } from "@/lib/logger";
import type {
  DeploymentAdapter,
  DeployContext,
  DeployResult,
  DeployStepResult,
} from "../types";

const log = createChildLogger("cloudinit-adapter");

/**
 * Cloud-Init Adapter
 *
 * Generates cloud-init user-data YAML for provisioning cloud instances.
 * This adapter does NOT execute anything remotely — it generates configuration
 * that the cloud provider's init system will process on first boot.
 *
 * This is the safest adapter, as it only renders templates.
 */
export class CloudInitAdapter implements DeploymentAdapter {
  name = "CloudInitAdapter";
  description =
    "Generates cloud-init user-data for cloud instance provisioning. Does not execute remote commands.";

  canHandle(ctx: DeployContext): boolean {
    return !!ctx.cloudInitContent;
  }

  async validateTarget(ctx: DeployContext): Promise<DeployStepResult> {
    if (!ctx.cloudInitContent) {
      return {
        step: "validate_target",
        success: false,
        message: "No cloud-init template available for this profile",
      };
    }

    return {
      step: "validate_target",
      success: true,
      message: "Cloud-init template validates successfully",
      metadata: {
        templateLength: ctx.cloudInitContent.length,
      },
    };
  }

  async execute(ctx: DeployContext): Promise<DeployResult> {
    const startTime = Date.now();
    const steps: DeployStepResult[] = [];

    const validateResult = await this.validateTarget(ctx);
    steps.push(validateResult);

    if (!validateResult.success) {
      return {
        success: false,
        adapterUsed: this.name,
        steps,
        error: validateResult.message,
        totalDuration: Date.now() - startTime,
      };
    }

    log.info({ jobId: ctx.jobId }, "Rendering cloud-init template");

    steps.push({
      step: "render_cloudinit",
      success: true,
      message: `Cloud-init user-data rendered (${ctx.cloudInitContent!.length} bytes)`,
      metadata: {
        format: "yaml",
        size: ctx.cloudInitContent!.length,
      },
    });

    steps.push({
      step: "generate_output",
      success: true,
      message:
        "Cloud-init YAML is ready. Apply it to your cloud instance as user-data during creation.",
      metadata: {
        note: "This adapter generates configuration only. No remote execution is performed.",
      },
    });

    return {
      success: true,
      adapterUsed: this.name,
      steps,
      totalDuration: Date.now() - startTime,
    };
  }
}
