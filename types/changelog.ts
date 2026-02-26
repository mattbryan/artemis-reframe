/**
 * ChangelogEntry — version history for content.
 * Links to exactly one asset type per entry (exemplaryAsset, elementalAsset, or proprietaryDoc).
 */

export interface ChangelogEntry {
  id: string;
  message: string;
  createdAt: string; // ISO 8601
  metadata?: Record<string, unknown>;
  /** Exactly one of these will be set per entry */
  exemplaryAssetId?: string;
  elementalAssetId?: string;
  proprietaryDocId?: string;
}
