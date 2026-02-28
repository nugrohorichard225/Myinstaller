"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Loader2, Key } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessKeyCode, setAccessKeyCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRedeemKey = async () => {
    if (!accessKeyCode.trim()) return;
    setRedeemLoading(true);
    setRedeemMessage(null);

    try {
      const res = await fetch("/api/access-keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessKeyCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setRedeemMessage({ type: "success", text: "Access key redeemed successfully!" });
        setAccessKeyCode("");
      } else {
        setRedeemMessage({ type: "error", text: data.error || "Failed to redeem key" });
      }
    } catch {
      setRedeemMessage({ type: "error", text: "Network error" });
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user?.role || ""} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Contact an administrator to update your profile information.
          </p>
        </CardContent>
      </Card>

      {/* Access Key Redemption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Redeem Access Key
          </CardTitle>
          <CardDescription>
            Enter an access key code to unlock additional features or permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {redeemMessage && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                redeemMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {redeemMessage.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              {redeemMessage.text}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Enter access key code"
              value={accessKeyCode}
              onChange={(e) => setAccessKeyCode(e.target.value)}
              className="font-mono"
            />
            <Button onClick={handleRedeemKey} disabled={!accessKeyCode.trim() || redeemLoading}>
              {redeemLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redeem
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
