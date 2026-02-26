/**
 * AI service abstraction — stubbed for scaffold phase.
 * No real AI calls. Wire these to your LLM/API when ready.
 */

import type {
  GenerationConfig,
  GeneratedContent,
  PolicyResult,
} from "@/types/ai";
import type { Tag } from "@/types/tag";

/**
 * Generate content from config. References FEED assets, guided by TRAIN context.
 */
export async function generateContent(
  _config: GenerationConfig
): Promise<GeneratedContent> {
  throw new Error("Not implemented — stub for scaffold phase");
}

/**
 * Refine existing content with a prompt.
 */
export async function refineWithPrompt(
  _contentId: string,
  _prompt: string
): Promise<GeneratedContent> {
  throw new Error("Not implemented — stub for scaffold phase");
}

/**
 * Apply policies to content. Returns pass/fail and violations.
 */
export async function applyPolicies(
  _content: GeneratedContent
): Promise<PolicyResult> {
  throw new Error("Not implemented — stub for scaffold phase");
}

/**
 * Suggest tags for generated content.
 */
export async function suggestTags(
  _content: GeneratedContent
): Promise<Tag[]> {
  throw new Error("Not implemented — stub for scaffold phase");
}
