/**
 * AI service types — used by /lib/ai.ts and the workbench store.
 */

import type { Tag } from "./tag";

export interface GenerationConfig {
  promptId?: string;
  exemplaryAssetIds?: string[];
  policyIds?: string[];
  deliverableType: string;
  options?: Record<string, unknown>;
}

export interface GeneratedContent {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO 8601
}

export interface PolicyResult {
  passed: boolean;
  violations?: string[];
  appliedPolicies: string[];
}
