"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Users, Shield, ShieldOff, UserX, UserCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { jobs: number; sessions: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"role" | "active">("role");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchUsers();
    setActionUser(null);
  };

  const handleToggleActive = async (user: User) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    await fetchUsers();
    setActionUser(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Users</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">{users.length} registered users</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{user.name}</p>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                {!user.isActive && <Badge variant="destructive">Disabled</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user._count.jobs} jobs &middot; Joined {formatDateTime(new Date(user.createdAt))}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionUser(user);
                  setActionType("role");
                }}
              >
                {user.role === "ADMIN" ? (
                  <><ShieldOff className="mr-1 h-3 w-3" /> Demote</>
                ) : (
                  <><Shield className="mr-1 h-3 w-3" /> Promote</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionUser(user);
                  setActionType("active");
                }}
              >
                {user.isActive ? (
                  <><UserX className="mr-1 h-3 w-3" /> Disable</>
                ) : (
                  <><UserCheck className="mr-1 h-3 w-3" /> Enable</>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!actionUser}
        onOpenChange={() => setActionUser(null)}
        title={actionType === "role" ? "Change User Role" : "Toggle User Status"}
        description={
          actionType === "role"
            ? `Are you sure you want to ${actionUser?.role === "ADMIN" ? "demote" : "promote"} ${actionUser?.name}?`
            : `Are you sure you want to ${actionUser?.isActive ? "disable" : "enable"} ${actionUser?.name}?`
        }
        onConfirm={() => {
          if (!actionUser) return;
          actionType === "role" ? handleToggleRole(actionUser) : handleToggleActive(actionUser);
        }}
        confirmLabel="Confirm"
      />
    </div>
  );
}
