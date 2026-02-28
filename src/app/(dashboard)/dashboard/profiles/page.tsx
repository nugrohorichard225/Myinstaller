"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Search } from "lucide-react";

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
}

const categories = ["all", "WEB_SERVER", "DATABASE", "MONITORING", "SECURITY", "CUSTOM"];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);

    fetch(`/api/profiles?${params}`)
      .then((r) => r.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deployment Profiles</h1>
        <p className="text-muted-foreground">Available deployment configurations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <Button
              key={c}
              variant={category === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c)}
            >
              {c === "all" ? "All" : c.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No profiles found"
          description="No deployment profiles match your criteria."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <CardDescription>{profile.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{profile.category.replace("_", " ")}</Badge>
                  <Badge variant="secondary">{profile.osType}</Badge>
                  <Badge variant="secondary">{profile.scriptType}</Badge>
                </div>
                <div className="mt-auto pt-4">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/jobs/new?profileId=${profile.id}`}>
                      Use this Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
