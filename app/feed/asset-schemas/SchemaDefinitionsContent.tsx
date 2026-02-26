"use client";

import { useSchemaDefinitions } from "@/lib/hooks/useSchemaDefinitions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SchemaDefinitionsContent() {
  const { data, isLoading, error } = useSchemaDefinitions();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <div className="space-y-4">
      {data.map((schema) => (
        <Card key={schema.id}>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">{schema.name}</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {schema.fields.map((f) => (
                <li key={f.id}>
                  {f.name} ({f.type})
                  {f.required && " *"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
