/**
 * FEED: Photography, illustration, and design elements.
 *
 * Purpose: Raw visual assets used by the system. Referenced during
 * content generation and composition.
 */

import { ElementalAssetsContent } from "./ElementalAssetsContent";

export default function ElementalAssetsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 bg-[#0a0d1a]">
      <ElementalAssetsContent />
    </div>
  );
}
