"use client";

import { useExemplaryAssets } from "@/lib/hooks/useExemplaryAssets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExemplaryWorkContent() {
  const { data, isLoading, error } = useExemplaryAssets();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.map((asset) => (
        <Card key={asset.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{asset.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{asset.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {asset.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
