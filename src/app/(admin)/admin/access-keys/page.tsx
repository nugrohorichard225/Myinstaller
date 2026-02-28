"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlockWithCopy } from "@/components/shared/code-block";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Key, Copy, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AccessKey {
  id: string;
  code: string;
  label: string;
  maxRedemptions: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count: { redemptions: number };
}

export default function AdminAccessKeysPage() {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("10");
  const [newKeyCode, setNewKeyCode] = useState("");

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/access-keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/access-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, maxRedemptions: parseInt(maxRedemptions) }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKeyCode(data.key.code);
        setLabel("");
        setMaxRedemptions("10");
        await fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Access Keys</h1>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Keys</h1>
          <p className="text-muted-foreground">Manage registration and feature access keys</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Key
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Access Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="keyLabel">Label</Label>
                <Input
                  id="keyLabel"
                  placeholder="e.g., Beta Access"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                <Input
                  id="maxRedemptions"
                  type="number"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!label.trim() || creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Newly Created Key */}
      {newKeyCode && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle className="text-emerald-600 dark:text-emerald-400">Key Created!</CardTitle>
            <CardDescription>Copy this key now — it won&apos;t be shown again in full.</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlockWithCopy code={newKeyCode} language="text" />
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewKeyCode("")}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <EmptyState
          icon={<Key className="h-12 w-12" />}
          title="No access keys"
          description="Create your first access key to enable user registration."
        />
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{key.label}</p>
                  <Badge variant={key.isActive ? "default" : "secondary"}>
                    {key.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {key.code.substring(0, 8)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {key._count.redemptions} / {key.maxRedemptions} redemptions
                  &middot; Created {formatDateTime(new Date(key.createdAt))}
                  {key.expiresAt && ` · Expires ${formatDateTime(new Date(key.expiresAt))}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
