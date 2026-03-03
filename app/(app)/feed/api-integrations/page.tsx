/**
 * FEED: CRM and pipeline integrations, ingestion configuration.
 *
 * Purpose: Configure external integrations (CRM, pipelines). Define
 * ingestion settings and data flows. Placeholder for future integration
 * with CRE-specific systems.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiIntegrationsPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">API Integrations</h1>
        <p className="text-muted-foreground">
          CRM and pipeline integrations, ingestion configuration.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Integration list and configuration will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
