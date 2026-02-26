/**
 * DeliverableConfig — configuration for AI content generation in the Workbench.
 */

import type { GenerationConfig } from "./ai";

export interface DeliverableConfig extends GenerationConfig {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
}
