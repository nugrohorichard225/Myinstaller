"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Play, CheckCircle, XCircle, Clock, Layers } from "lucide-react";

interface DashboardData {
  users: { total: number; active: number; admins: number } | null;
  jobs: { total: number; pending: number; running: number; completed: number; failed: number } | null;
  queue: { waiting: number; active: number; completed: number; failed: number } | null;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Users</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Users"
            value={data?.users?.total ?? 0}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Active Users"
            value={data?.users?.active ?? 0}
            icon={<Users className="h-4 w-4" />}
            variant="success"
          />
          <StatsCard
            title="Admins"
            value={data?.users?.admins ?? 0}
            icon={<Users className="h-4 w-4" />}
            variant="warning"
          />
        </div>
      </div>

      {/* Job Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Jobs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total"
            value={data?.jobs?.total ?? 0}
            icon={<Play className="h-4 w-4" />}
          />
          <StatsCard
            title="Pending"
            value={data?.jobs?.pending ?? 0}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsCard
            title="Running"
            value={data?.jobs?.running ?? 0}
            icon={<Play className="h-4 w-4" />}
            variant="warning"
          />
          <StatsCard
            title="Completed"
            value={data?.jobs?.completed ?? 0}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatsCard
            title="Failed"
            value={data?.jobs?.failed ?? 0}
            icon={<XCircle className="h-4 w-4" />}
            variant="destructive"
          />
        </div>
      </div>

      {/* Queue Health */}
      {data?.queue && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Health</CardTitle>
            <CardDescription>BullMQ deployment queue status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-center">
              <div>
                <p className="text-2xl font-bold">{data.queue.waiting}</p>
                <p className="text-sm text-muted-foreground">Waiting</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.queue.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{data.queue.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{data.queue.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
