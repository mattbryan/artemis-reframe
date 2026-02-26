import type { ChangelogEntry } from "@/types/changelog";

export const changelogEntriesFixture: ChangelogEntry[] = [
  {
    id: "ch-1",
    message: "Initial creation",
    createdAt: "2024-01-15T10:00:00Z",
    exemplaryAssetId: "ex-1",
  },
  {
    id: "ch-2",
    message: "Updated copy",
    createdAt: "2024-01-16T11:30:00Z",
    elementalAssetId: "ea-1",
  },
];
