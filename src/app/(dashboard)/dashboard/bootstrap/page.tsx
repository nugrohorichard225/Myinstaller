"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CodeBlockWithCopy } from "@/components/shared/code-block";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Terminal, Download, FileText } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export default function BootstrapPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [targetHost, setTargetHost] = useState("");
  const [outputFormat, setOutputFormat] = useState<"shell" | "cloud-init">("shell");
  const [includeHardening, setIncludeHardening] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<{
    script: string;
    filename: string;
    bootstrapCommand: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedProfile || !targetHost) return;
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile,
          targetHost,
          outputFormat,
          includeHardening,
          dryRun,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bootstrap Generator</h1>
        <p className="text-muted-foreground">Generate deployment scripts for manual execution</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select a profile and configure the output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Deployment Profile</Label>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile.id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedProfile === profile.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span>{profile.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {profile.category}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bs-host">Target Host</Label>
              <Input
                id="bs-host"
                placeholder="192.168.1.100"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Output Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={outputFormat === "shell" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOutputFormat("shell")}
                >
                  <Terminal className="mr-1 h-3 w-3" />
                  Shell Script
                </Button>
                <Button
                  variant={outputFormat === "cloud-init" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOutputFormat("cloud-init")}
                >
                  <FileText className="mr-1 h-3 w-3" />
                  Cloud-Init
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Include Hardening</p>
                <p className="text-xs text-muted-foreground">Add security hardening steps</p>
              </div>
              <Switch checked={includeHardening} onCheckedChange={setIncludeHardening} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Dry Run Script</p>
                <p className="text-xs text-muted-foreground">Preview only, no changes</p>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!selectedProfile || !targetHost || generating}
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Script
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Script</CardTitle>
                <CardDescription>
                  {result ? result.filename : "Configure and generate to see output"}
                </CardDescription>
              </div>
              {result && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <CodeBlockWithCopy code={result.script} language="bash" maxHeight="400px" />
                {result.bootstrapCommand && (
                  <div className="space-y-2">
                    <Label>Quick Bootstrap Command</Label>
                    <CodeBlockWithCopy code={result.bootstrapCommand} language="bash" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
                <Terminal className="mr-2 h-4 w-4" />
                No script generated yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
