/**
 * FEED: Research docs, perspectives, operational philosophy.
 *
 * Purpose: Proprietary documents that inform content generation.
 * Research, perspectives, and operational philosophy feed into prompts
 * and provide context for AI output.
 */

import { ProprietaryIntelContent } from "./ProprietaryIntelContent";

export default function ProprietaryIntelPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Proprietary Intel</h1>
        <p className="text-muted-foreground">
          Research docs, perspectives, and operational philosophy.
        </p>
      </header>

      <ProprietaryIntelContent />
    </div>
  );
}
