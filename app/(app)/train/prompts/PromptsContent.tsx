"use client";

import { usePrompts } from "@/lib/hooks/usePrompts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PromptsContent() {
  const { data, isLoading, error } = usePrompts();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <div className="space-y-4">
      {data.map((prompt) => (
        <Card key={prompt.id}>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">{prompt.name}</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{prompt.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
