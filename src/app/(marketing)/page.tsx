import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Shield,
  Terminal,
  Cloud,
  ListChecks,
  Activity,
  Lock,
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const features = [
  {
    icon: Server,
    title: "Deployment Profiles",
    description: "Pre-built and custom profiles for Ubuntu, Debian, Alpine, Docker, and more.",
  },
  {
    icon: ListChecks,
    title: "Job Queue",
    description: "Queue, track, and manage deployment jobs with real-time status and logging.",
  },
  {
    icon: Terminal,
    title: "SSH Automation",
    description: "Secure SSH-based script execution on servers you own and control.",
  },
  {
    icon: Cloud,
    title: "Cloud-Init Generation",
    description: "Generate cloud-init user-data YAML for provisioning cloud instances.",
  },
  {
    icon: Shield,
    title: "Dry Run Simulator",
    description: "Simulate deployments without making changes. Validate before you commit.",
  },
  {
    icon: Activity,
    title: "Audit Logs",
    description: "Full audit trail of all actions, deployments, and configuration changes.",
  },
  {
    icon: Lock,
    title: "Safe Provider Abstraction",
    description: "Clean architecture with adapter pattern. No provider lock-in or unsafe shortcuts.",
  },
  {
    icon: Settings,
    title: "Admin Controls",
    description: "User management, access keys, profiles, settings, and system monitoring.",
  },
];

const steps = [
  { number: "01", title: "Connect Target", description: "Add your server details — IP, SSH credentials, provider info." },
  { number: "02", title: "Choose Profile", description: "Select a deployment profile or create a custom one." },
  { number: "03", title: "Generate & Run", description: "Generate bootstrap commands, cloud-init, or queue a deployment job." },
  { number: "04", title: "Track Logs", description: "Monitor real-time job progress with structured logs." },
  { number: "05", title: "Verify Result", description: "Automated health checks confirm successful deployment." },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Self-Hosted • Open Source • Secure
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Automated OS Deployment for{" "}
              <span className="text-primary">Servers You Control</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              A self-hosted platform for safe, automated provisioning and post-install
              setup on your own VPS, cloud instances, and dedicated servers.
              No license bypass. No provider exploits. Just clean automation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline">
                  View Docs
                </Button>
              </Link>
            </div>
            {/* Code Preview */}
            <div className="max-w-2xl mx-auto rounded-2xl bg-zinc-950 dark:bg-zinc-900 border overflow-hidden text-left shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-zinc-500 ml-2">terminal</span>
              </div>
              <pre className="p-4 text-sm">
                <code className="text-zinc-100 font-mono">
                  <span className="text-zinc-500"># Clone and start MyInstaller</span>{"\n"}
                  <span className="text-emerald-400">$</span> git clone https://github.com/you/myinstaller.git{"\n"}
                  <span className="text-emerald-400">$</span> cd myinstaller{"\n"}
                  <span className="text-emerald-400">$</span> docker compose up -d{"\n"}
                  <span className="text-emerald-400">$</span> npm run db:migrate && npm run db:seed{"\n"}
                  <span className="text-emerald-400">$</span> npm run dev{"\n"}
                  {"\n"}
                  <span className="text-zinc-500"># ✅ MyInstaller running at http://localhost:3000</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Complete deployment automation with safety built in from the ground up.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="rounded-xl bg-primary/10 p-3 w-fit mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Five simple steps from target to verified deployment.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-3xl font-bold text-primary/20 mb-2">{step.number}</div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Notice */}
      <section className="container mx-auto px-4 py-24">
        <Card className="max-w-3xl mx-auto border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <CardTitle>Important Legal Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <p>MyInstaller is an <strong>automation tool</strong>, not an OS license provider.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <p>It does <strong>not</strong> provide Windows product keys or any software licenses.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <p>It does <strong>not</strong> bypass provider reinstall restrictions or terms of service.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">You are responsible for:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>License compliance for all software deployed</li>
                  <li>Provider terms of service compliance</li>
                  <li>Data backups before any deployment</li>
                  <li>Confirming server ownership or explicit authorization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate?</h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
            Set up MyInstaller in minutes. Self-hosted, transparent, and extensible.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Read the Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
