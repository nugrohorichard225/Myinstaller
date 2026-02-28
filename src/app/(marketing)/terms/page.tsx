export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground">
            By using MyInstaller, you agree to these terms. If you do not agree, do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Nature of the Service</h2>
          <p className="text-sm text-muted-foreground">
            MyInstaller is a self-hosted automation platform. It generates scripts, manages deployment jobs,
            and provides tools for server provisioning. It does NOT:
          </p>
          <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1 mt-2">
            <li>Provide operating system licenses or product keys</li>
            <li>Bypass hosting provider restrictions or terms of service</li>
            <li>Guarantee the safety or success of any deployment operation</li>
            <li>Provide warranty of any kind</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
          <p className="text-sm text-muted-foreground">You are solely responsible for:</p>
          <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1 mt-2">
            <li>Having legal authorization to manage target servers</li>
            <li>Maintaining valid licenses for all deployed software</li>
            <li>Complying with your hosting provider&apos;s terms</li>
            <li>Creating backups before running any deployment</li>
            <li>Reviewing generated scripts before execution</li>
            <li>Securing your MyInstaller instance and credentials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data and Security</h2>
          <p className="text-sm text-muted-foreground">
            MyInstaller stores credentials encrypted. However, as a self-hosted platform,
            the security of the deployment depends on your infrastructure security,
            environment configuration, and operational practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground">
            MyInstaller is provided &quot;as is&quot; without warranties. The authors and contributors
            are not liable for any damages arising from the use of this software, including
            but not limited to data loss, service interruption, or security breaches.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Prohibited Uses</h2>
          <p className="text-sm text-muted-foreground">You may not use MyInstaller to:</p>
          <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1 mt-2">
            <li>Access servers without authorization</li>
            <li>Deploy pirated or unlicensed software</li>
            <li>Bypass security restrictions or provider controls</li>
            <li>Conduct any illegal activities</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
