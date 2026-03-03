/**
 * FEED: Attribute schema definitions for elemental assets.
 *
 * Purpose: Define attribute schemas that drive dynamic forms during
 * asset upload. SchemaDefinition fields specify name, type, required, etc.
 * ElementalAsset links to SchemaDefinition (many-to-one).
 */

import { SchemaDefinitionsContent } from "./SchemaDefinitionsContent";

export default function AssetSchemasPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Asset Schemas</h1>
        <p className="text-muted-foreground">
          Attribute schema definitions for elemental assets.
        </p>
      </header>

      <SchemaDefinitionsContent />
    </div>
  );
}
