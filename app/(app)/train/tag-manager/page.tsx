/**
 * TRAIN: Taxonomy and metadata management for Exemplary Work.
 *
 * Purpose: Manage tags used to categorize exemplary assets. Tags enable
 * filtering and discovery. Used in ExemplaryAsset ↔ Tag (many-to-many).
 */

import { TagManagerContent } from "./TagManagerContent";

export default function TagManagerPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Tag Manager</h1>
        <p className="text-muted-foreground">
          Taxonomy and metadata management for Exemplary Work.
        </p>
      </header>

      <TagManagerContent />
    </div>
  );
}
