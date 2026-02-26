/**
 * Safe parse/stringify for brand JSON fields (toneDimensions, colorIntents, examplePairs).
 */

import type { ToneDimension } from "@/types/brand";
import type { ColorIntent } from "@/types/brand";
import type { ExamplePair } from "@/types/brand";

export function parseToneDimensions(raw: string): ToneDimension[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ToneDimension =>
        x != null &&
        typeof x === "object" &&
        typeof x.axis === "string" &&
        typeof x.label1 === "string" &&
        typeof x.label2 === "string" &&
        typeof x.value === "number" &&
        x.value >= 1 &&
        x.value <= 10
    );
  } catch {
    return [];
  }
}

export function parseColorIntents(raw: string): ColorIntent[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ColorIntent =>
        x != null &&
        typeof x === "object" &&
        typeof x.hex === "string" &&
        typeof x.name === "string" &&
        typeof x.intent === "string"
    );
  } catch {
    return [];
  }
}

export function parseExamplePairs(raw: string): ExamplePair[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ExamplePair =>
        x != null &&
        typeof x === "object" &&
        typeof x.label === "string" &&
        typeof x.onBrand === "string" &&
        typeof x.offBrand === "string"
    );
  } catch {
    return [];
  }
}
