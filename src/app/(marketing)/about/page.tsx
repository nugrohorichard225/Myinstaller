import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Server, Code, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">About MyInstaller</h1>
      <p className="text-lg text-muted-foreground mb-8">
        MyInstaller is a self-hosted web platform for automated OS deployment and provisioning
        on servers you own or are explicitly authorized to manage.
      </p>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Safe by Design</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every feature is built with safety boundaries. No license bypass, no provider exploits,
            no hidden behavior. Simulation mode for risky workflows.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Server className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Self-Hosted</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Run MyInstaller on your own infrastructure. Your data stays with you.
            No external dependencies beyond what you choose to integrate.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Code className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Extensible</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Clean adapter pattern architecture. Add provider-specific integrations
            through official APIs when available. Modular and maintainable.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Team Ready</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Role-based access control, audit logging, and access key management.
            Ready for individual operators and small teams alike.
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">What This Is</h2>
      <ul className="list-disc ml-6 space-y-2 text-muted-foreground mb-8">
        <li>An automation tool for provisioning servers you legally control</li>
        <li>A deployment job manager with queue, logging, and status tracking</li>
        <li>A script and cloud-init generator with transparent, reviewable output</li>
        <li>A self-hosted alternative to cloud-specific provisioning dashboards</li>
      </ul>

      <h2 className="text-2xl font-bold mb-4">What This Is Not</h2>
      <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
        <li>Not an OS license provider — you supply your own licenses</li>
        <li>Not a tool for unauthorized access to systems</li>
        <li>Not a provider restriction bypass tool</li>
        <li>Not a replacement for proper backup and disaster recovery</li>
      </ul>
    </div>
  );
}
