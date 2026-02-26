/**
 * Brand & Philosophy mutations — all writes via InstantDB transact.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { BrandScreenshotMemoryType, BrandLogoContext } from "@/types/brand";
import type { ToneDimension } from "@/types/brand";
import type { ColorIntent } from "@/types/brand";
import type { ExamplePair } from "@/types/brand";

const now = () => Date.now();

/** Create the single MVP brand and its one-to-one voice + visual. Call when no brand exists. */
export async function createBrand(): Promise<string> {
  const brandId = id();
  const voiceId = id();
  const visualId = id();
  const ts = now();

  const defaultToneDimensions: ToneDimension[] = [
    { axis: "formal-conversational", label1: "Formal", label2: "Conversational", value: 5 },
    { axis: "reserved-warm", label1: "Reserved", label2: "Warm", value: 5 },
    { axis: "data-led-story-led", label1: "Data-led", label2: "Story-led", value: 5 },
    { axis: "concise-expansive", label1: "Concise", label2: "Expansive", value: 5 },
    { axis: "traditional-contemporary", label1: "Traditional", label2: "Contemporary", value: 5 },
  ];

  await db.transact([
    db.tx.brand[brandId].update({
      name: "",
      legalName: "",
      tagline: "",
      marketPositionStatement: "",
      geographicMarkets: "",
      assetClassFocus: "",
      essenceStatement: "",
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    }),
    db.tx.brandVoice[voiceId].update({
      brandId,
      toneDimensions: JSON.stringify(defaultToneDimensions),
      vocabularyPreferred: "",
      vocabularyAvoided: "",
      jargonStandards: "",
      sentenceRhythm: "",
      examplePairs: "[]",
    }),
    db.tx.brandVisual[visualId].update({
      brandId,
      logoUsageNotes: "",
      colorIntents: "[]",
      typographyIntent: "",
      layoutPersonality: "",
    }),
    db.tx.brand[brandId].link({ voice: voiceId, visual: visualId }),
  ]);

  return brandId;
}

export async function updateBrand(
  brandId: string,
  updates: Partial<{
    name: string;
    legalName: string;
    tagline: string;
    marketPositionStatement: string;
    geographicMarkets: string;
    assetClassFocus: string;
    essenceStatement: string;
  }>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates, updatedAt: now() };
  await db.transact(db.tx.brand[brandId].update(payload));
}

export async function updateBrandVoice(
  voiceId: string,
  updates: Partial<{
    toneDimensions: string;
    vocabularyPreferred: string;
    vocabularyAvoided: string;
    jargonStandards: string;
    sentenceRhythm: string;
    examplePairs: string;
  }>
): Promise<void> {
  await db.transact(db.tx.brandVoice[voiceId].update(updates));
}

export async function updateBrandVisual(
  visualId: string,
  updates: Partial<{
    logoUsageNotes: string;
    colorIntents: string;
    typographyIntent: string;
    layoutPersonality: string;
  }>
): Promise<void> {
  await db.transact(db.tx.brandVisual[visualId].update(updates));
}

export async function createBrandScreenshot(params: {
  brandId: string;
  url: string;
  caption: string;
  memoryType: BrandScreenshotMemoryType;
  order: number;
}): Promise<string> {
  const screenshotId = id();
  await db.transact([
    db.tx.brandScreenshot[screenshotId].update({
      brandId: params.brandId,
      url: params.url,
      caption: params.caption,
      memoryType: params.memoryType,
      order: params.order,
    }),
    db.tx.brand[params.brandId].link({ screenshots: screenshotId }),
  ]);
  return screenshotId;
}

export async function updateBrandScreenshot(
  screenshotId: string,
  updates: Partial<{ caption: string; memoryType: BrandScreenshotMemoryType; order: number }>
): Promise<void> {
  await db.transact(db.tx.brandScreenshot[screenshotId].update(updates));
}

export async function deleteBrandScreenshot(screenshotId: string): Promise<void> {
  await db.transact(db.tx.brandScreenshot[screenshotId].delete());
}

export async function reorderBrandScreenshots(
  brandId: string,
  screenshotIdsInOrder: string[]
): Promise<void> {
  const ops = screenshotIdsInOrder.map((sid, index) =>
    db.tx.brandScreenshot[sid].update({ order: index })
  );
  await db.transact(ops);
}

export async function createBrandLogo(params: {
  brandId: string;
  url: string;
  context: BrandLogoContext;
  order: number;
}): Promise<string> {
  const logoId = id();
  await db.transact([
    db.tx.brandLogo[logoId].update({
      brandId: params.brandId,
      url: params.url,
      context: params.context,
      order: params.order,
    }),
    db.tx.brand[params.brandId].link({ logos: logoId }),
  ]);
  return logoId;
}

export async function updateBrandLogo(
  logoId: string,
  updates: Partial<{ context: BrandLogoContext; order: number }>
): Promise<void> {
  await db.transact(db.tx.brandLogo[logoId].update(updates));
}

export async function deleteBrandLogo(logoId: string): Promise<void> {
  await db.transact(db.tx.brandLogo[logoId].delete());
}

export async function createBrandPersona(brandId: string, order: number): Promise<string> {
  const personaId = id();
  await db.transact([
    db.tx.brandPersona[personaId].update({
      brandId,
      name: "",
      personaType: "",
      priorities: "",
      resonantLanguage: "",
      avoidedLanguage: "",
      dealContexts: "",
      order,
    }),
    db.tx.brand[brandId].link({ personas: personaId }),
  ]);
  return personaId;
}

export async function updateBrandPersona(
  personaId: string,
  updates: Partial<{
    name: string;
    personaType: string;
    priorities: string;
    resonantLanguage: string;
    avoidedLanguage: string;
    dealContexts: string;
    order: number;
  }>
): Promise<void> {
  await db.transact(db.tx.brandPersona[personaId].update(updates));
}

export async function deleteBrandPersona(personaId: string): Promise<void> {
  await db.transact(db.tx.brandPersona[personaId].delete());
}

export async function reorderBrandPersonas(
  brandId: string,
  personaIdsInOrder: string[]
): Promise<void> {
  const ops = personaIdsInOrder.map((pid, index) =>
    db.tx.brandPersona[pid].update({ order: index })
  );
  await db.transact(ops);
}
