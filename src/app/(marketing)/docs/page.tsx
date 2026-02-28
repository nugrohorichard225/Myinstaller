import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    content: `MyInstaller is a self-hosted web platform for automated OS deployment and provisioning. It provides a web UI for managing deployment profiles, creating jobs, generating bootstrap commands, and tracking execution.

The platform supports SSH-based automation, cloud-init generation, and comes with a built-in dry-run/simulation mode for workflows that cannot be safely automated in a generic way.`,
  },
  {
    id: "supported-workflows",
    title: "Supported Workflows",
    content: `**Fully Supported:**
- Post-install package setup via SSH
- Service initialization and configuration
- Docker installation and setup
- System hardening (firewall, SSH config, kernel tuning)
- Cloud-init user-data generation
- User and service account creation
- Script generation and deployment
- Health checks and validation

**Simulation Mode Only:**
- Full OS reinstallation (requires provider-specific API)
- Boot configuration changes
- Disk partitioning
- Provider-specific workflows without official API support`,
  },
  {
    id: "limitations",
    title: "Limitations",
    content: `MyInstaller does **not** and will **never**:
- Provide OS licenses or product keys
- Bypass provider reinstall restrictions
- Perform unauthorized access to systems
- Include keygens, cracks, or patchers
- Modify bootloaders without explicit support
- Execute hidden or obfuscated commands

The platform is designed for transparency. All generated scripts can be reviewed before execution.`,
  },
  {
    id: "creating-a-job",
    title: "Creating a Job",
    content: `1. Navigate to **Dashboard → Jobs → New Job**
2. Enter target server details (IP, port, credentials)
3. Select a deployment profile
4. Configure options (dry run, auto reboot, extra packages)
5. Review the summary and legal acknowledgements
6. Submit the job to the queue

Jobs are processed by the background worker. You can track progress in real-time from the job detail page.`,
  },
  {
    id: "access-keys",
    title: "Using Access Keys",
    content: `Access keys can be provided by administrators to grant platform access.

To redeem an access key:
1. Log in to your account
2. Go to **Dashboard → Settings**
3. Enter your access key code
4. Click **Redeem**

Access keys may have usage limits or expiration dates.`,
  },
  {
    id: "cloud-init",
    title: "Using Cloud-Init",
    content: `MyInstaller can generate cloud-init user-data YAML for provisioning new cloud instances.

1. Go to **Dashboard → Bootstrap**
2. Select a profile with cloud-init support
3. Fill in template variables
4. Copy the generated YAML
5. Use it as user-data when creating a cloud instance through your provider's interface

Cloud-init templates are fully transparent and can be reviewed before use.`,
  },
  {
    id: "dry-run",
    title: "Dry Run Mode",
    content: `Dry run mode simulates a deployment without making any real changes. It:
- Validates target configuration
- Renders all scripts
- Simulates execution steps with realistic timings
- Generates log output showing what would happen
- Flags any unsupported steps

Use dry run mode to:
- Test deployment profiles before real execution
- Preview what a job will do
- Train new team members
- Validate workflows for dangerous operations`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    content: `**Job stuck in "Queued" status:**
- Check that the worker process is running
- Check Redis connectivity
- Check the admin panel for queue health

**SSH connection errors:**
- Verify the target IP and port
- Check that SSH is enabled on the target
- Verify credentials (password or key)
- Check firewall rules on the target

**Job failed with "Invalid credentials":**
- Re-enter the password or SSH key
- Ensure the user exists on the target server
- Check if password authentication is enabled in SSH config`,
  },
  {
    id: "legal",
    title: "Legal Boundaries",
    content: `MyInstaller operates within strict legal boundaries:

- **You** are responsible for having legal access to target servers
- **You** must hold valid licenses for all software deployed
- **You** must comply with your hosting provider's terms of service
- **You** are responsible for data backups before any deployment

MyInstaller provides the automation framework. The legal responsibility for how it's used rests with the operator.`,
  },
  {
    id: "faq",
    title: "FAQ",
    content: `**Q: Does MyInstaller provide Windows licenses?**
A: No. MyInstaller is an automation tool. You must provide your own valid licenses.

**Q: Can MyInstaller reinstall my VPS operating system?**
A: Generic OS reinstallation requires provider-specific API integration. MyInstaller supports post-install automation and has simulation mode for reinstall workflows. Provider-specific adapters can be added when official APIs are available.

**Q: Is MyInstaller safe to use?**
A: Yes. All generated scripts are transparent, reviewable, and never contain hidden behavior. Dry-run mode is available for testing. However, deployment operations can modify your server, so always back up first.

**Q: Can I use MyInstaller with any cloud provider?**
A: MyInstaller works with any server accessible via SSH. Cloud-init generation works with any provider that supports user-data. Provider-specific features require dedicated adapter development.

**Q: How do I add custom profiles?**
A: Admins can create custom deployment profiles through the admin panel. Profiles include shell script templates, cloud-init templates, and variable schemas.`,
  },
];

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Everything you need to know about setting up, configuring, and using MyInstaller.
      </p>

      {/* Table of Contents */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-primary hover:underline"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-2xl font-bold mb-4 scroll-mt-20">{section.title}</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {section.content.split("\n\n").map((para, i) => {
                if (para.startsWith("**") && para.includes(":**")) {
                  // Bold heading paragraphs
                  return (
                    <div key={i} className="mb-3">
                      {para.split("\n").map((line, j) => {
                        if (line.startsWith("- ")) {
                          return (
                            <p key={j} className="text-sm text-muted-foreground ml-4">
                              • {line.slice(2)}
                            </p>
                          );
                        }
                        if (line.startsWith("**Q:")) {
                          return (
                            <p key={j} className="font-semibold mt-4">
                              {line.replace(/\*\*/g, "")}
                            </p>
                          );
                        }
                        if (line.startsWith("A:")) {
                          return (
                            <p key={j} className="text-sm text-muted-foreground">
                              {line}
                            </p>
                          );
                        }
                        return (
                          <p key={j} className="text-sm font-medium">
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      })}
                    </div>
                  );
                }
                if (para.match(/^\d\./)) {
                  return (
                    <div key={i} className="space-y-1 mb-3">
                      {para.split("\n").map((line, j) => (
                        <p key={j} className="text-sm text-muted-foreground">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      ))}
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm text-muted-foreground mb-3">
                    {para.replace(/\*\*/g, "")}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
