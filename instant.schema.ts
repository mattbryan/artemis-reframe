/**
 * Artemis Reframe — InstantDB Schema
 *
 * Defines all entity types and their relationships for the brand governance
 * knowledge graph. Each asset type (ExemplaryAsset, ElementalAsset, ProprietaryDoc)
 * is its own entity — there is no base "Asset" entity in InstantDB.
 *
 * @see https://www.instantdb.com/docs/modeling-data
 */

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    /** Storage files — required for db.storage.upload; elementalAssets reference URLs from here */
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),

    /** Best-in-class tagged assets used to calibrate AI (TRAIN section) */
    exemplaryAssets: i.entity({
      title: i.string(),
      description: i.string().optional(),
      url: i.string().optional(),
      schemaVersion: i.string(),
      createdAt: i.date(),
      metadata: i.json().optional(),
    }),

    /** Photography, illustration, and design elements (FEED section) */
    elementalAssets: i.entity({
      title: i.string(),
      type: i.string(), // 'photo' | 'illustration' | 'design-element'
      url: i.string().optional(),
      storagePath: i.string().optional(),
      schemaVersion: i.string(),
      createdAt: i.date(),
      metadata: i.json().optional(),
    }),

    /** Research docs, perspectives, operational philosophy (FEED section) */
    proprietaryDocs: i.entity({
      title: i.string(),
      content: i.string().optional(),
      schemaVersion: i.string(),
      createdAt: i.date(),
      metadata: i.json().optional(),
    }),

    /** Taxonomy labels for Exemplary Work (TRAIN section).
     *  Structure: Category: Value or Parent/Category: Value.
     *  key is unique when set; name/slug and optional category/value for migration. */
    tags: i.entity({
      parent: i.string().optional(),
      category: i.string().optional(),
      value: i.string().optional(),
      key: i.string().optional().unique().indexed(),
      name: i.string().optional(),
      slug: i.string().optional(),
    }),

    /** Prompt library entries (TRAIN section) */
    prompts: i.entity({
      name: i.string(),
      body: i.string(),
      createdAt: i.date(),
      metadata: i.json().optional(),
    }),

    /** Hard rules governing AI output (TRAIN section) */
    policies: i.entity({
      name: i.string(),
      rule: i.string(),
      priority: i.number().optional(),
      createdAt: i.date(),
    }),

    /** Version history for content — links to exactly one asset type per entry */
    changelogEntries: i.entity({
      message: i.string(),
      createdAt: i.date(),
      metadata: i.json().optional(),
    }),

    /** Attribute schema definitions for elemental assets (name, fields, license/usage). */
    schemaDefinitions: i.entity({
      name: i.string(),
      fields: i.json(),
      licenseInfo: i.string().optional(),
      usageGuidelines: i.string().optional(),
      createdAt: i.date(),
    }),

    /** Design briefs — structured documents for collateral generation (design source of truth). */
    brief: i.entity({
      name: i.string(),
      slug: i.string().unique().indexed(),
      description: i.string(),
      usageGuidelines: i.string(),
      collateralType: i.string(), // legacy display; prefer collateralTypeIds
      /** IDs of collateral types this brief applies to (multi-select). */
      collateralTypeIds: i.json().optional(), // string[]
      status: i.string(), // "draft" | "active" | "archived"
      createdAt: i.number(),
      updatedAt: i.number(),
      isDefault: i.boolean(),
    }),

    /** Sections within a brief (tokens, component-spec, layout-ref, principles, prompt, custom). */
    briefSection: i.entity({
      briefId: i.string(),
      type: i.string(),
      body: i.string(),
      order: i.number(),
    }),

    /** Screenshots attached to a brief, optionally linked to one or more sections. */
    briefScreenshot: i.entity({
      briefId: i.string(),
      sectionId: i.string().optional(),
      sectionIds: i.json().optional(),
      url: i.string(),
      storagePath: i.string().optional(),
      caption: i.string(),
      order: i.number(),
    }),

    /** One-to-one metadata for a brief (audience, examples, Figma URL, tags). */
    briefMeta: i.entity({
      briefId: i.string().optional(), // optional to allow existing orphan rows; app always sets when creating
      targetAudience: i.string(),
      collateralExamples: i.string(),
      figmaFileUrl: i.string(),
      tags: i.string(),
    }),

    /** Brand & Philosophy — single active brand (MVP). Foundation for AI collateral generation. */
    brand: i.entity({
      name: i.string(),
      legalName: i.string(),
      tagline: i.string(),
      marketPositionStatement: i.string(),
      geographicMarkets: i.string(),
      assetClassFocus: i.string(),
      essenceStatement: i.string(),
      isActive: i.boolean(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    /** Voice & tone profile — one per brand. */
    brandVoice: i.entity({
      brandId: i.string(),
      toneDimensions: i.string(),
      vocabularyPreferred: i.string(),
      vocabularyAvoided: i.string(),
      jargonStandards: i.string(),
      sentenceRhythm: i.string(),
      examplePairs: i.string(),
    }),

    /** Visual identity memory — one per brand. */
    brandVisual: i.entity({
      brandId: i.string(),
      logoUsageNotes: i.string(),
      colorIntents: i.string(),
      typographyIntent: i.string(),
      layoutPersonality: i.string(),
    }),

    /** Reference screenshots with AI-directed captions. */
    brandScreenshot: i.entity({
      brandId: i.string(),
      url: i.string(),
      caption: i.string(),
      memoryType: i.string(),
      order: i.number(),
    }),

    /** Logo assets (SVG/PNG) for use in generated collateral; each has light/dark context. */
    brandLogo: i.entity({
      brandId: i.string(),
      url: i.string(),
      context: i.string(), // "light" | "dark"
      order: i.number(),
    }),

    /** Client/buyer personas — many per brand. */
    brandPersona: i.entity({
      brandId: i.string(),
      name: i.string(),
      personaType: i.string(),
      priorities: i.string(),
      resonantLanguage: i.string(),
      avoidedLanguage: i.string(),
      dealContexts: i.string(),
      order: i.number(),
    }),

    /** Collateral type definitions — structure, guidelines, and output targets for generated collateral. */
    collateralType: i.entity({
      name: i.string(),
      slug: i.string().unique().indexed(),
      description: i.string(),
      category: i.string(),
      aiIntent: i.string(),
      outputTargets: i.string(), // JSON array of OutputTargetDef
      isDefault: i.boolean(),
      isArchived: i.boolean(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    /** Sections within a collateral type (ordered content blocks with guidelines and fields). */
    collateralSection: i.entity({
      collateralTypeId: i.string(),
      name: i.string(),
      description: i.string(),
      contentGuidelines: i.string(),
      fields: i.string(), // JSON array of FieldDef
      order: i.number(),
    }),

    /** Global input fields for a collateral type (apply to whole type). */
    collateralGlobalField: i.entity({
      collateralTypeId: i.string(),
      label: i.string(),
      fieldType: i.string(), // text | textarea | number | date | select | toggle
      helperText: i.string(),
      placeholder: i.string(),
      options: i.string(), // JSON array of strings for select
      required: i.boolean(),
      order: i.number(),
    }),

    /** Media asset requirements for a collateral type. */
    collateralMediaField: i.entity({
      collateralTypeId: i.string(),
      label: i.string(),
      description: i.string(),
      mediaType: i.string(), // image | video | document
      required: i.boolean(),
      maxCount: i.number(),
      order: i.number(),
    }),

    /** Policy & Rules — type schema (fields, label, description). Global, no brandId. */
    policyTypeSchema: i.entity({
      typeKey: i.string(),
      label: i.string(),
      description: i.string(),
      fields: i.string(), // JSON array of FieldDef
      isDefault: i.boolean(),
      order: i.number(),
      isActive: i.boolean(),
    }),

    /** Policy & Rules — individual rule. Global, no brandId. */
    policyRule: i.entity({
      typeKey: i.string(),
      name: i.string(),
      fieldValues: i.string(), // JSON object { [fieldDefId]: string | boolean }
      isActive: i.boolean(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    /** Workbench project — one per wizard run; status draft | generating | complete | failed.
     *  createdByEmail/createdByName are denormalized for single-tenant use; will be replaced with user links when multi-tenancy is introduced. */
    project: i.entity({
      name: i.string(),
      status: i.string(), // "draft" | "generating" | "complete" | "failed"
      collateralTypeId: i.string(),
      collateralTypeSlug: i.string(),
      formData: i.json(), // { [globalFieldId]: string | boolean | number }
      sectionData: i.json(), // { [sectionId]: { [fieldDefId]: string | boolean | number } }
      images: i.json(), // ProjectImage[] (each may have storagePath for fresh URL resolution)
      storagePath: i.string().optional(),
      outputTargetAssignments: i.json(), // { [targetType]: briefId }
      generationLog: i.json(), // string[]
      errorMessage: i.string().optional(),
      createdAt: i.number(),
      updatedAt: i.number(),
      createdByEmail: i.string().optional(), // email of the user who created the project
      createdByName: i.string().optional(), // display name if available, falls back to email
    }),

    /** Generated output for one output target — written by the generation API. */
    projectOutput: i.entity({
      projectId: i.string(),
      targetType: i.string(), // OutputTargetType
      briefId: i.string(),
      status: i.string(), // build state: "pending" | "generating" | "complete" | "failed"
      approvalStatus: i.string().optional(), // "approved" | "not_approved"
      contentJson: i.json(), // GeneratedOutputContent — immutable AI output
      editedContentJson: i.json().optional(), // user-edited version for Editor
      rawPrompt: i.string().optional(),
      errorMessage: i.string().optional(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
  },
  links: {
    /** ExemplaryAsset ↔ Tag: many-to-many */
    exemplaryAssetsTags: {
      forward: { on: "exemplaryAssets", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "exemplaryAssets" },
    },

    /** ChangelogEntry → ExemplaryAsset: many-to-one (optional link) */
    changelogExemplaryAsset: {
      forward: { on: "changelogEntries", has: "one", label: "exemplaryAsset" },
      reverse: { on: "exemplaryAssets", has: "many", label: "changelogEntries" },
    },

    /** ChangelogEntry → ElementalAsset: many-to-one (optional link) */
    changelogElementalAsset: {
      forward: { on: "changelogEntries", has: "one", label: "elementalAsset" },
      reverse: { on: "elementalAssets", has: "many", label: "changelogEntries" },
    },

    /** ChangelogEntry → ProprietaryDoc: many-to-one (optional link) */
    changelogProprietaryDoc: {
      forward: { on: "changelogEntries", has: "one", label: "proprietaryDoc" },
      reverse: { on: "proprietaryDocs", has: "many", label: "changelogEntries" },
    },

    /** Prompt → Policy: many-to-one, optional reference */
    promptPolicy: {
      forward: { on: "prompts", has: "one", label: "policy" },
      reverse: { on: "policies", has: "many", label: "prompts" },
    },

    /** Brief → BriefSection: one-to-many */
    briefSections: {
      forward: { on: "brief", has: "many", label: "sections" },
      reverse: { on: "briefSection", has: "one", label: "brief" },
    },

    /** Brief → BriefScreenshot: one-to-many */
    briefScreenshots: {
      forward: { on: "brief", has: "many", label: "screenshots" },
      reverse: { on: "briefScreenshot", has: "one", label: "brief" },
    },

    /** Brief → BriefMeta: one-to-one */
    briefMetaLink: {
      forward: { on: "brief", has: "one", label: "meta" },
      reverse: { on: "briefMeta", has: "one", label: "brief" },
    },

    /** Brand → BrandVoice: one-to-one */
    brandVoiceLink: {
      forward: { on: "brand", has: "one", label: "voice" },
      reverse: { on: "brandVoice", has: "one", label: "brand" },
    },

    /** Brand → BrandVisual: one-to-one */
    brandVisualLink: {
      forward: { on: "brand", has: "one", label: "visual" },
      reverse: { on: "brandVisual", has: "one", label: "brand" },
    },

    /** Brand → BrandScreenshot: one-to-many */
    brandScreenshots: {
      forward: { on: "brand", has: "many", label: "screenshots" },
      reverse: { on: "brandScreenshot", has: "one", label: "brand" },
    },

    /** Brand → BrandLogo: one-to-many */
    brandLogos: {
      forward: { on: "brand", has: "many", label: "logos" },
      reverse: { on: "brandLogo", has: "one", label: "brand" },
    },

    /** Brand → BrandPersona: one-to-many */
    brandPersonas: {
      forward: { on: "brand", has: "many", label: "personas" },
      reverse: { on: "brandPersona", has: "one", label: "brand" },
    },

    /** CollateralType → CollateralSection: one-to-many */
    collateralTypeSections: {
      forward: { on: "collateralType", has: "many", label: "sections" },
      reverse: { on: "collateralSection", has: "one", label: "collateralType" },
    },

    /** CollateralType → CollateralGlobalField: one-to-many */
    collateralTypeGlobalFields: {
      forward: { on: "collateralType", has: "many", label: "globalFields" },
      reverse: { on: "collateralGlobalField", has: "one", label: "collateralType" },
    },

    /** CollateralType → CollateralMediaField: one-to-many */
    collateralTypeMediaFields: {
      forward: { on: "collateralType", has: "many", label: "mediaFields" },
      reverse: { on: "collateralMediaField", has: "one", label: "collateralType" },
    },

    /** Project → ProjectOutput: one-to-many */
    projectOutputs: {
      forward: { on: "project", has: "many", label: "outputs" },
      reverse: { on: "projectOutput", has: "one", label: "project" },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
