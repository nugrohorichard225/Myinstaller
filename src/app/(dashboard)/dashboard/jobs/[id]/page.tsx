"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CodeBlockWithCopy } from "@/components/shared/code-block";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ArrowLeft, RotateCw, XCircle, Clock, Server, Layers, ScrollText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Job {
  id: string;
  targetHost: string;
  targetPort: number;
  status: string;
  dryRun: boolean;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  options: Record<string, unknown>;
  profile: { id: string; name: string; slug: string; category: string };
  user: { name: string; email: string };
}

interface LogEntry {
  id: string;
  level: string;
  message: string;
  details: unknown;
  timestamp: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const fetchJobData = async () => {
    try {
      const [jobRes, logsRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch(`/api/jobs/${id}/logs`),
      ]);
      const jobData = await jobRes.json();
      const logsData = await logsRes.json();
      setJob(jobData.job || null);
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
    // Auto-refresh for running jobs
    const interval = setInterval(() => {
      if (job?.status === "RUNNING" || job?.status === "QUEUED" || job?.status === "PENDING") {
        fetchJobData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, job?.status]);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/jobs/${id}/cancel`, { method: "POST" });
      await fetchJobData();
    } finally {
      setActionLoading(false);
      setCancelOpen(false);
    }
  };

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
      await fetchJobData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  const canCancel = ["PENDING", "QUEUED", "RUNNING"].includes(job.status);
  const canRetry = ["FAILED", "CANCELLED"].includes(job.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{job.targetHost}</h1>
              <StatusBadge status={job.status as any} />
              {job.dryRun && <Badge variant="outline">Dry Run</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">Job ID: {job.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canRetry && (
            <Button onClick={handleRetry} disabled={actionLoading} variant="outline">
              <RotateCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          {canCancel && (
            <Button onClick={() => setCancelOpen(true)} disabled={actionLoading} variant="destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Job Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Host</span>
              <span className="font-mono">{job.targetHost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Port</span>
              <span className="font-mono">{job.targetPort}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retries</span>
              <span>{job.retryCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateTime(new Date(job.createdAt))}</span>
            </div>
            {job.startedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started</span>
                <span>{formatDateTime(new Date(job.startedAt))}</span>
              </div>
            )}
            {job.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{formatDateTime(new Date(job.completedAt))}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{job.profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline">{job.profile.category}</Badge>
            </div>
          </CardContent>
        </Card>

        {job.errorMessage && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono text-destructive">{job.errorMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Deployment Logs
          </CardTitle>
          <CardDescription>
            {logs.length} log {logs.length === 1 ? "entry" : "entries"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No logs yet. Logs will appear here once the job starts.
            </p>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm max-h-[600px] overflow-y-auto space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={
                      log.level === "ERROR"
                        ? "text-destructive"
                        : log.level === "WARN"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : log.level === "DEBUG"
                        ? "text-muted-foreground"
                        : ""
                    }
                  >
                    [{log.level}]
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Job"
        description="Are you sure you want to cancel this deployment job? This action cannot be undone."
        onConfirm={handleCancel}
        confirmLabel="Cancel Job"
        variant="destructive"
      />
    </div>
  );
}
