"use client";

import { useProprietaryDocs } from "@/lib/hooks/useProprietaryDocs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProprietaryIntelContent() {
  const { data, isLoading, error } = useProprietaryDocs();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <div className="space-y-4">
      {data.map((doc) => (
        <Card key={doc.id}>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">{doc.title}</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{doc.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
