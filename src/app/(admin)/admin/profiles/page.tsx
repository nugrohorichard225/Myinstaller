"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Layers, Loader2, Trash2, Edit } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface Profile {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  osType: string;
  isPublic: boolean;
  scriptType: string;
  createdAt: string;
  _count?: { jobs: number };
}

const categoryOptions = ["WEB_SERVER", "DATABASE", "MONITORING", "SECURITY", "CUSTOM"];

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CUSTOM");
  const [osType, setOsType] = useState("ubuntu-22.04");
  const [scriptType, setScriptType] = useState("bash");
  const [isPublic, setIsPublic] = useState(true);
  const [scriptContent, setScriptContent] = useState("");
  const [packages, setPackages] = useState("");

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          osType,
          scriptType,
          isPublic,
          scriptContent,
          packages: packages.split(",").map((p) => p.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setName(""); setDescription(""); setScriptContent(""); setPackages("");
        await fetchProfiles();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/profiles/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    await fetchProfiles();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Profiles</h1>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Profiles</h1>
          <p className="text-muted-foreground">{profiles.length} profiles configured</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Profile
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Profile</CardTitle>
            <CardDescription>Define a new deployment configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g., LAMP Stack" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>OS Type</Label>
                <Input value={osType} onChange={(e) => setOsType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Script Type</Label>
                <select
                  value={scriptType}
                  onChange={(e) => setScriptType(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="bash">Bash</option>
                  <option value="cloud-init">Cloud-Init</option>
                  <option value="ansible">Ansible</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Packages (comma separated)</Label>
              <Input placeholder="nginx, php, mysql-server" value={packages} onChange={(e) => setPackages(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Script Content</Label>
              <Textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="#!/bin/bash&#10;# Your deployment script here"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label>Publicly visible</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!name.trim() || creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profiles.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No profiles"
          description="Create your first deployment profile."
        />
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between rounded-xl border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{profile.name}</p>
                  <Badge variant="outline">{profile.category.replace("_", " ")}</Badge>
                  <Badge variant="secondary">{profile.osType}</Badge>
                  {!profile.isPublic && <Badge variant="destructive">Private</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(profile.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Profile"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
