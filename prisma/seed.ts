import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data ────────────────────────────────────────────────────
  await prisma.deploymentJobLog.deleteMany();
  await prisma.deploymentJob.deleteMany();
  await prisma.accessKeyRedemption.deleteMany();
  await prisma.accessKey.deleteMany();
  await prisma.targetCredential.deleteMany();
  await prisma.savedTarget.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.deploymentProfile.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const userPasswordHash = await bcrypt.hash("User1234!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@myinstaller.local",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Jane Developer",
      email: "jane@example.com",
      passwordHash: userPasswordHash,
      role: "USER",
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Bob Operator",
      email: "bob@example.com",
      passwordHash: userPasswordHash,
      role: "USER",
      isActive: true,
    },
  });

  console.log("  ✅ Users created");

  // ── Deployment Profiles ────────────────────────────────────────────────────
  const profiles = await Promise.all([
    prisma.deploymentProfile.create({
      data: {
        slug: "ubuntu-2404-minimal",
        name: "Ubuntu 24.04 Minimal",
        osFamily: "Ubuntu",
        osVersion: "24.04 LTS",
        category: "LINUX_BASE",
        description: "Minimal Ubuntu 24.04 LTS server setup with essential packages and security updates.",
        longDescription: "This profile sets up a clean Ubuntu 24.04 LTS server with essential system packages, enables automatic security updates, configures basic firewall rules, and applies minimal hardening. Ideal as a starting point for any Ubuntu-based deployment.",
        scriptTemplate: `#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# MyInstaller — Ubuntu 24.04 Minimal Setup
# This script is fully transparent. Review before running.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== MyInstaller: Ubuntu 24.04 Minimal Setup ==="
echo "Date: $(date -u)"

echo "→ Updating package lists..."
apt-get update -qq

echo "→ Upgrading existing packages..."
apt-get upgrade -y -qq

echo "→ Installing essential packages..."
apt-get install -y -qq \\
  curl wget git vim htop tmux \\
  ufw fail2ban \\
  unattended-upgrades apt-listchanges

echo "→ Configuring automatic security updates..."
dpkg-reconfigure -plow unattended-upgrades

echo "→ Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw --force enable

echo "→ Enabling fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

echo "→ Setting timezone to UTC..."
timedatectl set-timezone UTC

echo "=== Setup complete ==="
`,
        cloudInitTemplate: `#cloud-config
package_update: true
package_upgrade: true
packages:
  - curl
  - wget
  - git
  - vim
  - htop
  - tmux
  - ufw
  - fail2ban
  - unattended-upgrades

runcmd:
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw --force enable
  - systemctl enable fail2ban
  - systemctl start fail2ban
  - timedatectl set-timezone UTC
`,
        estimatedDuration: 180,
        isFeatured: true,
        isActive: true,
        tags: ["ubuntu", "minimal", "base", "lts"],
        createdBy: admin.id,
      },
    }),

    prisma.deploymentProfile.create({
      data: {
        slug: "debian-12-base",
        name: "Debian 12 Base",
        osFamily: "Debian",
        osVersion: "12 Bookworm",
        category: "LINUX_BASE",
        description: "Clean Debian 12 Bookworm base setup with essential tools and security configuration.",
        scriptTemplate: `#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
echo "=== MyInstaller: Debian 12 Base Setup ==="
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl wget git vim htop ufw fail2ban
ufw default deny incoming && ufw default allow outgoing && ufw allow ssh && ufw --force enable
systemctl enable fail2ban && systemctl start fail2ban
echo "=== Setup complete ==="
`,
        estimatedDuration: 150,
        isFeatured: false,
        isActive: true,
        tags: ["debian", "bookworm", "base"],
        createdBy: admin.id,
      },
    }),

    prisma.deploymentProfile.create({
      data: {
        slug: "alpine-latest-minimal",
        name: "Alpine Latest Minimal",
        osFamily: "Alpine",
        osVersion: "Latest",
        category: "LINUX_BASE",
        description: "Lightweight Alpine Linux setup for minimal resource footprint.",
        scriptTemplate: `#!/bin/sh
set -eu
echo "=== MyInstaller: Alpine Minimal Setup ==="
apk update && apk upgrade
apk add curl wget git vim htop
echo "=== Setup complete ==="
`,
        estimatedDuration: 60,
        isFeatured: false,
        isActive: true,
        tags: ["alpine", "minimal", "lightweight"],
        createdBy: admin.id,
      },
    }),

    prisma.deploymentProfile.create({
      data: {
        slug: "ubuntu-docker-ready",
        name: "Ubuntu Docker Ready",
        osFamily: "Ubuntu",
        osVersion: "24.04 LTS",
        category: "LINUX_DOCKER",
        description: "Ubuntu 24.04 with Docker CE and Docker Compose pre-installed and configured.",
        longDescription: "This profile sets up Ubuntu 24.04 with Docker CE, Docker Compose v2, and configures the Docker daemon with recommended production settings. Includes log rotation, storage configuration, and optional non-root user access.",
        scriptTemplate: `#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
echo "=== MyInstaller: Ubuntu Docker Ready Setup ==="

echo "→ Installing prerequisites..."
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg lsb-release

echo "→ Adding Docker GPG key..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "→ Adding Docker repository..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "→ Installing Docker..."
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "→ Configuring Docker daemon..."
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "storage-driver": "overlay2"
}
EOF

echo "→ Starting Docker..."
systemctl enable docker
systemctl start docker

echo "→ Verifying Docker installation..."
docker --version
docker compose version

echo "=== Docker setup complete ==="
`,
        estimatedDuration: 300,
        isFeatured: true,
        isActive: true,
        tags: ["ubuntu", "docker", "containers"],
        createdBy: admin.id,
      },
    }),

    prisma.deploymentProfile.create({
      data: {
        slug: "ubuntu-hardened",
        name: "Ubuntu Hardened",
        osFamily: "Ubuntu",
        osVersion: "24.04 LTS",
        category: "LINUX_HARDENED",
        description: "Security-hardened Ubuntu 24.04 with SSH hardening, fail2ban, UFW, and kernel tuning.",
        scriptTemplate: `#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
echo "=== MyInstaller: Ubuntu Hardened Setup ==="

apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq ufw fail2ban unattended-upgrades

# SSH Hardening
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config

# Firewall
ufw default deny incoming && ufw default allow outgoing && ufw allow ssh && ufw --force enable

# Fail2ban
systemctl enable fail2ban && systemctl start fail2ban

# Kernel hardening
cat >> /etc/sysctl.d/99-hardening.conf <<'SYSCTL'
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
SYSCTL
sysctl -p /etc/sysctl.d/99-hardening.conf

echo "=== Hardening complete ==="
`,
        estimatedDuration: 240,
        isFeatured: true,
        isActive: true,
        tags: ["ubuntu", "hardened", "security"],
        createdBy: admin.id,
      },
    }),

    prisma.deploymentProfile.create({
      data: {
        slug: "windows-server-eval-placeholder",
        name: "Windows Server Evaluation Placeholder",
        osFamily: "Windows",
        osVersion: "Server 2022",
        category: "WINDOWS_TEMPLATE",
        description: "Placeholder profile for Windows Server. This profile requires your own valid license and a provider that supports Windows installation.",
        longDescription: "⚠️ IMPORTANT: This is a PLACEHOLDER profile.\n\nMyInstaller does NOT provide Windows licenses or product keys.\nMyInstaller does NOT bypass provider reinstall restrictions.\n\nThis profile exists to demonstrate the architecture for Windows-based workflows.\nActual Windows deployment requires:\n- A valid Windows Server license\n- A provider that officially supports Windows installation\n- Provider-specific API integration (not yet implemented)\n\nUse dry-run/simulation mode to preview the workflow.",
        scriptTemplate: `# Windows Server deployment requires provider-specific integration.
# This is a placeholder / simulation template.
# TODO: Implement provider-specific Windows deployment adapter.
echo "This profile requires provider-specific integration."
echo "Use dry-run mode to simulate the workflow."
`,
        estimatedDuration: 600,
        isFeatured: false,
        isActive: true,
        tags: ["windows", "placeholder", "evaluation"],
        createdBy: admin.id,
      },
    }),

    prisma.deploymentProfile.create({
      data: {
        slug: "generic-cloud-init",
        name: "Generic Cloud-Init Custom",
        osFamily: "Any",
        osVersion: "Any",
        category: "CLOUD_INIT",
        description: "Custom cloud-init user-data template with variable substitution. Apply when creating a new cloud instance.",
        cloudInitTemplate: `#cloud-config
# MyInstaller — Generic Cloud-Init Template
# Customize variables: {{HOSTNAME}}, {{TIMEZONE}}, {{SSH_KEY}}

hostname: {{HOSTNAME}}
timezone: {{TIMEZONE}}

package_update: true
package_upgrade: true

packages:
  - curl
  - wget
  - git
  - vim
  - htop

users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - {{SSH_KEY}}

runcmd:
  - echo "Cloud-init provisioning by MyInstaller complete" >> /var/log/myinstaller.log
`,
        variablesSchema: {
          HOSTNAME: { type: "string", description: "Server hostname", default: "my-server" },
          TIMEZONE: { type: "string", description: "Timezone", default: "UTC" },
          SSH_KEY: { type: "string", description: "SSH public key for deploy user" },
        },
        estimatedDuration: 120,
        isFeatured: false,
        isActive: true,
        tags: ["cloud-init", "custom", "generic"],
        createdBy: admin.id,
      },
    }),
  ]);

  console.log("  ✅ Profiles created");

  // ── Sample Jobs ────────────────────────────────────────────────────────────
  const jobStatuses = [
    { status: "COMPLETED", progress: 100, completedAt: new Date(Date.now() - 86400000) },
    { status: "COMPLETED", progress: 100, completedAt: new Date(Date.now() - 172800000) },
    { status: "FAILED", progress: 45, failedAt: new Date(Date.now() - 43200000), errorSummary: "SSH connection timed out after 30 seconds" },
    { status: "QUEUED", progress: 0 },
    { status: "DRY_RUN_COMPLETED", progress: 100, completedAt: new Date(Date.now() - 3600000) },
    { status: "COMPLETED", progress: 100, completedAt: new Date(Date.now() - 259200000) },
    { status: "CANCELLED", progress: 0 },
    { status: "FAILED", progress: 20, failedAt: new Date(Date.now() - 7200000), errorSummary: "Invalid credentials provided" },
    { status: "COMPLETED", progress: 100, completedAt: new Date(Date.now() - 432000000) },
    { status: "DRY_RUN_COMPLETED", progress: 100, completedAt: new Date(Date.now() - 600000) },
  ] as const;

  const targets = [
    { label: "Production Web Server", host: "203.0.113.10", user: "root" },
    { label: "Staging API Server", host: "198.51.100.25", user: "deploy" },
    { label: "Dev Environment", host: "192.0.2.50", user: "root" },
    { label: "Database Server", host: "203.0.113.42", user: "admin" },
    { label: "CI/CD Runner", host: "198.51.100.100", user: "root" },
  ];

  const jobs = [];
  for (let i = 0; i < 10; i++) {
    const target = targets[i % targets.length];
    const statusInfo = jobStatuses[i];
    const profile = profiles[i % profiles.length];

    const job = await prisma.deploymentJob.create({
      data: {
        ownerId: i < 5 ? user1.id : i < 8 ? user2.id : admin.id,
        profileId: profile.id,
        targetLabel: target.label,
        targetHost: target.host,
        targetPort: 22,
        targetUser: target.user,
        authMethod: "password",
        status: statusInfo.status as any,
        progress: statusInfo.progress,
        dryRun: statusInfo.status === "DRY_RUN_COMPLETED",
        autoReboot: i % 3 === 0,
        healthCheck: true,
        completedAt: "completedAt" in statusInfo ? statusInfo.completedAt : null,
        failedAt: "failedAt" in statusInfo ? statusInfo.failedAt : null,
        errorSummary: "errorSummary" in statusInfo ? statusInfo.errorSummary : null,
        adapterUsed: statusInfo.status === "DRY_RUN_COMPLETED" ? "SimulationAdapter" : "GenericSSHAdapter",
        startedAt: statusInfo.progress > 0 ? new Date(Date.now() - 86400000 * (i + 1)) : null,
        createdAt: new Date(Date.now() - 86400000 * (i + 1)),
      },
    });
    jobs.push(job);
  }
  console.log("  ✅ Jobs created");

  // ── Sample Logs ────────────────────────────────────────────────────────────
  const logSteps = [
    { level: "INFO", message: "Job validation started", step: "validate" },
    { level: "SUCCESS", message: "Job validation passed", step: "validate" },
    { level: "INFO", message: "Connecting to target server...", step: "connect" },
    { level: "SUCCESS", message: "SSH connection established", step: "connect" },
    { level: "INFO", message: "Rendering deployment script...", step: "render" },
    { level: "SUCCESS", message: "Script rendered (2048 bytes)", step: "render" },
    { level: "INFO", message: "Uploading script to target...", step: "upload" },
    { level: "SUCCESS", message: "Script uploaded successfully", step: "upload" },
    { level: "INFO", message: "Executing deployment script...", step: "execute" },
    { level: "INFO", message: "Installing packages: curl, wget, git, vim, htop", step: "execute" },
    { level: "INFO", message: "Configuring firewall rules...", step: "execute" },
    { level: "SUCCESS", message: "Firewall configured successfully", step: "execute" },
    { level: "INFO", message: "Running health check...", step: "health_check" },
    { level: "SUCCESS", message: "Health check passed — all services responding", step: "health_check" },
    { level: "INFO", message: "Cleaning up temporary files...", step: "cleanup" },
    { level: "SUCCESS", message: "Deployment completed successfully", step: "complete" },
  ];

  for (const job of jobs.slice(0, 5)) {
    const logsToAdd = job.status === "FAILED" ? logSteps.slice(0, 6) : logSteps;
    for (let i = 0; i < logsToAdd.length; i++) {
      const log = logsToAdd[i];
      await prisma.deploymentJobLog.create({
        data: {
          jobId: job.id,
          level: log.level as any,
          message: log.message,
          step: log.step,
          createdAt: new Date(Date.now() - 86400000 + i * 15000),
        },
      });
    }
  }

  // Add failure logs
  for (const job of jobs.filter((j) => j.status === "FAILED")) {
    await prisma.deploymentJobLog.create({
      data: {
        jobId: job.id,
        level: "ERROR",
        message: job.errorSummary || "Deployment failed",
        step: "error",
      },
    });
  }

  console.log("  ✅ Job logs created");

  // ── Access Keys ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.accessKey.create({
      data: {
        code: "DEMO-1234-ABCD-EFGH",
        status: "ACTIVE",
        maxRedemptions: 10,
        redeemedCount: 2,
        notes: "Demo key for testing",
      },
    }),
    prisma.accessKey.create({
      data: {
        code: "BETA-5678-IJKL-MNOP",
        status: "ACTIVE",
        maxRedemptions: 50,
        redeemedCount: 12,
        notes: "Beta access key",
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    }),
    prisma.accessKey.create({
      data: {
        code: "VIP-9012-QRST-UVWX",
        status: "ACTIVE",
        maxRedemptions: 5,
        redeemedCount: 0,
        notes: "VIP early access",
      },
    }),
    prisma.accessKey.create({
      data: {
        code: "OLD-3456-YYYY-ZZZZ",
        status: "EXPIRED",
        maxRedemptions: 1,
        redeemedCount: 1,
        notes: "Expired key",
      },
    }),
    prisma.accessKey.create({
      data: {
        code: "REVK-7890-DEAD-BEEF",
        status: "REVOKED",
        maxRedemptions: 10,
        redeemedCount: 3,
        notes: "Revoked key",
      },
    }),
  ]);
  console.log("  ✅ Access keys created");

  // ── System Settings ────────────────────────────────────────────────────────
  await Promise.all([
    prisma.systemSetting.create({
      data: { key: "maintenance_mode", value: false },
    }),
    prisma.systemSetting.create({
      data: { key: "queue_enabled", value: true },
    }),
    prisma.systemSetting.create({
      data: { key: "allow_registration", value: true },
    }),
    prisma.systemSetting.create({
      data: { key: "default_log_retention_days", value: 30 },
    }),
    prisma.systemSetting.create({
      data: { key: "default_dry_run_risky", value: true },
    }),
  ]);
  console.log("  ✅ System settings created");

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  const auditEntries = [
    { action: "user.registered", summary: "Admin user registered", actorId: admin.id },
    { action: "user.registered", summary: "Jane Developer registered", actorId: user1.id },
    { action: "user.registered", summary: "Bob Operator registered", actorId: user2.id },
    { action: "profile.created", summary: "Created Ubuntu 24.04 Minimal profile", actorId: admin.id },
    { action: "profile.created", summary: "Created Docker Ready profile", actorId: admin.id },
    { action: "job.created", summary: "Created deployment job for Production Web Server", actorId: user1.id },
    { action: "job.completed", summary: "Deployment job completed successfully", actorId: null },
    { action: "accesskey.created", summary: "Generated access key DEMO-1234", actorId: admin.id },
    { action: "setting.updated", summary: "Updated maintenance_mode to false", actorId: admin.id },
    { action: "user.login", summary: "Admin user logged in", actorId: admin.id },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        summary: entry.summary,
        createdAt: new Date(Date.now() - Math.random() * 604800000),
      },
    });
  }
  console.log("  ✅ Audit logs created");

  console.log("");
  console.log("🎉 Seed complete!");
  console.log("");
  console.log("  📧 Admin login:  admin@myinstaller.local / Admin123!");
  console.log("  📧 User login:   jane@example.com / User1234!");
  console.log("  📧 User login:   bob@example.com / User1234!");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
