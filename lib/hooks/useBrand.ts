"use client";

/**
 * useBrand — single source for active brand and all related entities.
 *
 * This hook is the designated integration point for the future generation layer.
 * Brand Context Block assembly will consume { brand, voice, visual, screenshots, personas }
 * from here. Do not wire any AI generation, prompt assembly, or Brand Context Block
 * compilation in this data layer; that integration is future work.
 */

import { useMemo, useEffect } from "react";
import { db } from "@/lib/db";
import { useBrandStore } from "@/store/brandStore";
import type {
  Brand,
  BrandVoice,
  BrandVisual,
  BrandScreenshot,
  BrandLogo,
  BrandPersona,
} from "@/types/brand";

function mapBrand(b: {
  id: string;
  name?: string;
  legalName?: string;
  tagline?: string;
  marketPositionStatement?: string;
  geographicMarkets?: string;
  assetClassFocus?: string;
  essenceStatement?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}): Brand {
  return {
    id: b.id,
    name: b.name ?? "",
    legalName: b.legalName ?? "",
    tagline: b.tagline ?? "",
    marketPositionStatement: b.marketPositionStatement ?? "",
    geographicMarkets: b.geographicMarkets ?? "",
    assetClassFocus: b.assetClassFocus ?? "",
    essenceStatement: b.essenceStatement ?? "",
    isActive: Boolean(b.isActive),
    createdAt: typeof b.createdAt === "number" ? b.createdAt : 0,
    updatedAt: typeof b.updatedAt === "number" ? b.updatedAt : 0,
  };
}

function mapVoice(v: {
  id: string;
  brandId?: string;
  toneDimensions?: string;
  vocabularyPreferred?: string;
  vocabularyAvoided?: string;
  jargonStandards?: string;
  sentenceRhythm?: string;
  examplePairs?: string;
}): BrandVoice {
  return {
    id: v.id,
    brandId: v.brandId ?? "",
    toneDimensions: v.toneDimensions ?? "[]",
    vocabularyPreferred: v.vocabularyPreferred ?? "",
    vocabularyAvoided: v.vocabularyAvoided ?? "",
    jargonStandards: v.jargonStandards ?? "",
    sentenceRhythm: v.sentenceRhythm ?? "",
    examplePairs: v.examplePairs ?? "[]",
  };
}

function mapVisual(v: {
  id: string;
  brandId?: string;
  logoUsageNotes?: string;
  colorIntents?: string;
  typographyIntent?: string;
  layoutPersonality?: string;
}): BrandVisual {
  return {
    id: v.id,
    brandId: v.brandId ?? "",
    logoUsageNotes: v.logoUsageNotes ?? "",
    colorIntents: v.colorIntents ?? "[]",
    typographyIntent: v.typographyIntent ?? "",
    layoutPersonality: v.layoutPersonality ?? "",
  };
}

function mapScreenshot(s: {
  id: string;
  brandId?: string;
  url?: string;
  caption?: string;
  memoryType?: string;
  order?: number;
}): BrandScreenshot {
  return {
    id: s.id,
    brandId: s.brandId ?? "",
    url: s.url ?? "",
    caption: s.caption ?? "",
    memoryType: (s.memoryType ?? "visual") as BrandScreenshot["memoryType"],
    order: typeof s.order === "number" ? s.order : 0,
  };
}

function mapLogo(l: {
  id: string;
  brandId?: string;
  url?: string;
  context?: string;
  order?: number;
}): BrandLogo {
  return {
    id: l.id,
    brandId: l.brandId ?? "",
    url: l.url ?? "",
    context: (l.context === "dark" ? "dark" : "light") as BrandLogo["context"],
    order: typeof l.order === "number" ? l.order : 0,
  };
}

function mapPersona(p: {
  id: string;
  brandId?: string;
  name?: string;
  personaType?: string;
  priorities?: string;
  resonantLanguage?: string;
  avoidedLanguage?: string;
  dealContexts?: string;
  order?: number;
}): BrandPersona {
  return {
    id: p.id,
    brandId: p.brandId ?? "",
    name: p.name ?? "",
    personaType: p.personaType ?? "",
    priorities: p.priorities ?? "",
    resonantLanguage: p.resonantLanguage ?? "",
    avoidedLanguage: p.avoidedLanguage ?? "",
    dealContexts: p.dealContexts ?? "",
    order: typeof p.order === "number" ? p.order : 0,
  };
}

export interface UseBrandResult {
  brand: Brand | null;
  voice: BrandVoice | null;
  visual: BrandVisual | null;
  screenshots: BrandScreenshot[];
  logos: BrandLogo[];
  personas: BrandPersona[];
  isLoading: boolean;
}

export function useBrand(): UseBrandResult {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrandId = useBrandStore((s) => s.setActiveBrandId);

  const query = useMemo(() => {
    const where = activeBrandId != null ? { id: activeBrandId } : { isActive: true };
    return {
      brand: {
        $: { where },
        voice: {},
        visual: {},
        screenshots: {},
        logos: {},
        personas: {},
      },
    } as Parameters<typeof db.useQuery>[0];
  }, [activeBrandId]);

  const { isLoading, data } = db.useQuery(query);

  const result = useMemo(() => {
    const brandData = data?.brand;
    const row = (Array.isArray(brandData) ? brandData[0] : brandData) as {
      id: string;
      voice?: unknown;
      visual?: unknown;
      screenshots?: unknown[];
      logos?: unknown[];
      personas?: unknown[];
      [k: string]: unknown;
    } | undefined;
    if (!row) {
      return {
        brand: null,
        voice: null,
        visual: null,
        screenshots: [] as BrandScreenshot[],
        logos: [] as BrandLogo[],
        personas: [] as BrandPersona[],
        isLoading,
      };
    }
    const voiceRow = Array.isArray(row.voice) ? row.voice[0] : row.voice;
    const visualRow = Array.isArray(row.visual) ? row.visual[0] : row.visual;
    const screenshots = ((row.screenshots ?? []) as Parameters<typeof mapScreenshot>[0][]).map(mapScreenshot).sort((a, b) => a.order - b.order);
    const logos = ((row.logos ?? []) as Parameters<typeof mapLogo>[0][]).map(mapLogo).sort((a, b) => a.order - b.order);
    const personas = ((row.personas ?? []) as Parameters<typeof mapPersona>[0][]).map(mapPersona).sort((a, b) => a.order - b.order);
    return {
      brand: mapBrand(row),
      voice: voiceRow ? mapVoice(voiceRow) : null,
      visual: visualRow ? mapVisual(visualRow) : null,
      screenshots,
      logos,
      personas,
      isLoading,
    };
  }, [data, isLoading]);

  useEffect(() => {
    if (result.brand && activeBrandId !== result.brand.id) {
      setActiveBrandId(result.brand.id);
    }
  }, [result.brand, activeBrandId, setActiveBrandId]);

  return result;
}
