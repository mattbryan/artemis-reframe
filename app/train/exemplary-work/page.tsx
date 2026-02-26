/**
 * TRAIN: Best-in-class tagged asset library.
 *
 * Purpose: Curate exemplary content that calibrates the AI. Each asset is
 * tagged for discoverability. Links ExemplaryAsset ↔ Tag (many-to-many).
 * Referenced by the Workbench during content generation.
 */

import { ExemplaryWorkContent } from "./ExemplaryWorkContent";

export default function ExemplaryWorkPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Exemplary Work</h1>
        <p className="text-muted-foreground">
          Best-in-class tagged assets used to calibrate AI output.
        </p>
      </header>

      <ExemplaryWorkContent />
    </div>
  );
}
