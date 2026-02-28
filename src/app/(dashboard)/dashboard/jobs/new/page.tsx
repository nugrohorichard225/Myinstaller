"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Server,
  Layers,
  Settings,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  osType: string;
  isPublic: boolean;
}

const steps = [
  { id: 1, label: "Target", icon: Server },
  { id: 2, label: "Profile", icon: Layers },
  { id: 3, label: "Options", icon: Settings },
  { id: 4, label: "Review", icon: CheckCircle },
];

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [targetHost, setTargetHost] = useState("");
  const [targetPort, setTargetPort] = useState("22");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [sshUsername, setSshUsername] = useState("root");
  const [authMethod, setAuthMethod] = useState<"password" | "key">("password");
  const [sshPassword, setSshPassword] = useState("");
  const [sshKey, setSshKey] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [notes, setNotes] = useState("");

  // Legal acknowledgements
  const [ackOwnership, setAckOwnership] = useState(false);
  const [ackLegal, setAckLegal] = useState(false);
  const [ackRisk, setAckRisk] = useState(false);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(console.error);
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const canProceed = () => {
    switch (step) {
      case 1:
        return targetHost.trim().length > 0;
      case 2:
        return !!selectedProfileId;
      case 3:
        return true;
      case 4:
        return ackOwnership && ackLegal && ackRisk;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetHost,
          targetPort: parseInt(targetPort),
          profileId: selectedProfileId,
          sshUsername,
          authMethod,
          sshPassword: authMethod === "password" ? sshPassword : undefined,
          sshKey: authMethod === "key" ? sshKey : undefined,
          dryRun,
          notes,
          acknowledgeOwnership: ackOwnership,
          acknowledgeLegal: ackLegal,
          acknowledgeRisk: ackRisk,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create job");
        return;
      }

      router.push(`/dashboard/jobs/${data.job.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Deployment Job</h1>
          <p className="text-sm text-muted-foreground">Configure and launch a deployment</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              disabled={step < s.id}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : step > s.id
                  ? "bg-primary/20 text-primary cursor-pointer"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Target */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Target Server</CardTitle>
            <CardDescription>
              Enter the details of the server you want to deploy to. You must own or be explicitly authorized to manage
              this server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetHost">Hostname / IP Address</Label>
              <Input
                id="targetHost"
                placeholder="192.168.1.100 or server.example.com"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetPort">SSH Port</Label>
              <Input
                id="targetPort"
                type="number"
                value={targetPort}
                onChange={(e) => setTargetPort(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sshUsername">SSH Username</Label>
              <Input
                id="sshUsername"
                value={sshUsername}
                onChange={(e) => setSshUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <div className="flex gap-4">
                <Button
                  variant={authMethod === "password" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("password")}
                  type="button"
                >
                  Password
                </Button>
                <Button
                  variant={authMethod === "key" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("key")}
                  type="button"
                >
                  SSH Key
                </Button>
              </div>
            </div>
            {authMethod === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="sshPassword">SSH Password</Label>
                <Input
                  id="sshPassword"
                  type="password"
                  placeholder="Enter SSH password"
                  value={sshPassword}
                  onChange={(e) => setSshPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Credentials are encrypted with AES-256-GCM and never stored in plaintext.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="sshKey">SSH Private Key</Label>
                <Textarea
                  id="sshKey"
                  placeholder="Paste your SSH private key here"
                  rows={5}
                  value={sshKey}
                  onChange={(e) => setSshKey(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Keys are encrypted at rest and deleted after deployment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Profile */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Profile</CardTitle>
            <CardDescription>Choose a deployment profile to use for this job.</CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No profiles available. Ask an admin to create one.
              </p>
            ) : (
              <div className="grid gap-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
                      selectedProfileId === profile.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{profile.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {profile.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      <p className="text-xs text-muted-foreground">OS: {profile.osType}</p>
                    </div>
                    {selectedProfileId === profile.id && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Options */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Job Options</CardTitle>
            <CardDescription>Configure additional options for the deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="space-y-1">
                <p className="font-medium">Dry Run / Simulation Mode</p>
                <p className="text-sm text-muted-foreground">
                  Simulate the deployment without making any changes to the target server.
                  Recommended for first-time deployments.
                </p>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this deployment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Review your deployment configuration before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="font-mono">{targetHost}:{targetPort}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">User</p>
                  <p>{sshUsername}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Profile</p>
                  <p>{selectedProfile?.name || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <Badge variant={dryRun ? "outline" : "default"}>
                    {dryRun ? "Dry Run" : "Live"}
                  </Badge>
                </div>
              </div>
              {notes && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-5 w-5" />
                Legal Acknowledgements
              </CardTitle>
              <CardDescription>
                You must accept all acknowledgements before deploying.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ackOwnership"
                  checked={ackOwnership}
                  onCheckedChange={(v) => setAckOwnership(!!v)}
                />
                <label htmlFor="ackOwnership" className="text-sm leading-relaxed cursor-pointer">
                  I confirm that I <strong>legally own or am explicitly authorized</strong> to manage the target server.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ackLegal"
                  checked={ackLegal}
                  onCheckedChange={(v) => setAckLegal(!!v)}
                />
                <label htmlFor="ackLegal" className="text-sm leading-relaxed cursor-pointer">
                  I understand that deploying to <strong>unauthorized systems is illegal</strong> and may violate local,
                  national, or international law.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ackRisk"
                  checked={ackRisk}
                  onCheckedChange={(v) => setAckRisk(!!v)}
                />
                <label htmlFor="ackRisk" className="text-sm leading-relaxed cursor-pointer">
                  I acknowledge that this deployment <strong>may modify the target system</strong> and I accept full
                  responsibility for any consequences.
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dryRun ? "Start Dry Run" : "Deploy Now"}
          </Button>
        )}
      </div>
    </div>
  );
}
