// SERVER ONLY — do not import in client components or pages

import Anthropic from "@anthropic-ai/sdk";
import type {
  GenerationConfig,
  GeneratedContent,
  PolicyResult,
} from "@/types/ai";
import type { GeneratedOutputContent } from "@/types/generation";
import type { Tag } from "@/types/tag";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AI_MODEL = "claude-sonnet-4-6";
export const AI_MAX_TOKENS = 8096;

/**
 * Generate content from config. Calls Anthropic API, parses and validates JSON response.
 */
export async function generateContent(
  config: GenerationConfig
): Promise<GeneratedContent> {
  if (!config.systemPrompt || !config.userPrompt) {
    throw new Error("GenerationConfig requires systemPrompt and userPrompt");
  }
  const response = await client.messages.create({
    model: config.model ?? AI_MODEL,
    max_tokens: config.maxTokens ?? AI_MAX_TOKENS,
    system: config.systemPrompt,
    messages: [{ role: "user", content: config.userPrompt }],
  });

  const rawText =
    response.content[0]?.type === "text"
      ? (response.content[0] as { type: "text"; text: string }).text
      : response.content
          .filter((block) => block.type === "text")
          .map((block) => (block as { type: "text"; text: string }).text)
          .join("");

  const cleaned = rawText
    .replace(/^```json\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: GeneratedOutputContent;
  try {
    console.log(
      `Response length: ${rawText.length} chars, finish_reason: ${(response as { stop_reason?: string }).stop_reason}`
    );
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `AI returned invalid JSON. Cleaned (first 500): ${cleaned.slice(0, 500)}`
    );
  }

  if (!parsed.targetType || !parsed.headline || !Array.isArray(parsed.sections)) {
    throw new Error(
      `AI response missing required fields. Got keys: ${Object.keys(parsed).join(", ")}`
    );
  }

  return {
    id: crypto.randomUUID(),
    content: JSON.stringify(parsed),
    metadata: {
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      targetType: config.targetType,
    },
    createdAt: new Date().toISOString(),
  };
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
