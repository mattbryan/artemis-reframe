import type { ExemplaryAsset } from "@/types/asset";

export const exemplaryAssetsFixture: ExemplaryAsset[] = [
  {
    id: "ex-1",
    type: "exemplary",
    title: "Sample Listing Page",
    description: "Best-in-class CRE listing layout",
    tags: ["cre-listing", "hero-image"],
    schema_version: "1.0",
    created_at: "2024-01-15T10:00:00Z",
    metadata: { vertical: "CRE" },
  },
  {
    id: "ex-2",
    type: "exemplary",
    title: "Brand Voice Example",
    description: "Exemplary copy tone",
    tags: ["brand-voice"],
    schema_version: "1.0",
    created_at: "2024-01-14T14:30:00Z",
    metadata: {},
  },
];
