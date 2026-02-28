"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Job {
  id: string;
  targetHost: string;
  status: string;
  dryRun: boolean;
  createdAt: string;
  profile: { name: string };
  user: { name: string; email: string };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/jobs?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">All Jobs</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Jobs</h1>
        <p className="text-muted-foreground">{total} total deployment jobs</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={<Play className="h-12 w-12" />} title="No jobs" description="No deployment jobs have been created yet." />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{job.targetHost}</p>
                  {job.dryRun && <Badge variant="outline" className="text-xs">Dry Run</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {job.profile.name} &middot; {job.user.name} ({job.user.email})
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {formatRelativeTime(new Date(job.createdAt))}
                </span>
                <StatusBadge status={job.status as any} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
