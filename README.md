# Artemis Reframe

**Deploying this app?** → Read **[HANDOFF.md](./HANDOFF.md)** first. It documents environment, uploads, InstantDB, auth, and design intent you must respect.

Brand governance platform for AI-generated content. Align and govern content created by generative AI to a specific brand. First vertical: Commercial Real Estate (CRE).

## Three-Section Mental Model

The app is organized into three conceptual sections:

- **BUILD** — Where content is created and stored. References FEED assets, guided by TRAIN context.
  - Workbench: AI content creation workspace (multi-step wizard, proofing workflow)
  - Archive: Historical content store with search and filtering

- **TRAIN** — Where the AI is calibrated. Brand identity, rules, exemplary references, prompts.
  - Exemplary Work: Best-in-class tagged asset library
  - Brand Philosophy: Colors, logos, mission, aesthetic guidelines
  - Prompts: Prompt library and sandbox editor
  - Policies & Rules: Hard rules governing AI output
  - Tag Manager: Taxonomy and metadata management

- **FEED** — Where raw inputs live. Assets, research, schemas, and integrations.
  - Elemental Assets: Photography, illustration, design elements
  - Proprietary Intel: Research docs, perspectives, operational philosophy
  - Asset Schemas: Attribute schema definitions for elemental assets
  - API Integrations: CRM and pipeline integrations, ingestion configuration

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict, no implicit any)
- Tailwind CSS
- Shadcn/ui (base component layer — unstyled, meant to be overridden)
- Zustand (client state)
- TanStack Query (async/server state)
- InstantDB (real-time graph database)

## InstantDB Schema Design

The schema lives in `instant.schema.ts` at the project root.

### Entities (each asset type is its own object type)

| Entity            | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| exemplaryAssets   | Best-in-class tagged assets (TRAIN)               |
| elementalAssets   | Photography, illustration, design elements (FEED) |
| proprietaryDocs   | Research docs, perspectives (FEED)                |
| tags              | Taxonomy labels for Exemplary Work                |
| prompts           | Prompt library entries                            |
| policies          | Hard rules governing AI output                    |
| schemaDefinitions | Attribute schema definitions for elemental assets |
| changelogEntries  | Version history for content                       |

### Links

- `exemplaryAssetsTags`: ExemplaryAsset ↔ Tag (many-to-many)
- `elementalAssetSchema`: ElementalAsset → SchemaDefinition (many-to-one)
- `changelogExemplaryAsset`, `changelogElementalAsset`, `changelogProprietaryDoc`: ChangelogEntry → each asset type (many-to-one; exactly one link set per entry)
- `promptPolicy`: Prompt → Policy (many-to-one, optional)

### ChangelogEntry Pattern

ChangelogEntry has three optional links (exemplaryAsset, elementalAsset, proprietaryDoc). Exactly one is set per entry — the application enforces this invariant.

## Service Abstractions

### AI Service (`/lib/ai.ts`)

Stubbed for scaffold phase. Intended functions:

- `generateContent(config)` — Generate content from config, referencing FEED assets and TRAIN context
- `refineWithPrompt(contentId, prompt)` — Refine existing content with a prompt
- `applyPolicies(content)` — Apply policies to content; returns pass/fail and violations
- `suggestTags(content)` — Suggest tags for generated content

### Auth Stub (`/lib/auth-stub.ts`)

`isAuthenticated()` always returns `true` during scaffold. Replace with real auth provider when ready.

### Route Guard (`/components/layout/RouteGuard.tsx`)

Placeholder that checks `isAuthenticated`. No redirect yet — add `/login` redirect when auth is implemented.

## Conventions

- **Design philosophy**: Use CSS variables and Tailwind placeholders for visual properties. Every component accepts `className` and is composition-friendly. Figma designs will override these values later.
- **Fixtures**: All pages that display data use typed mock fixtures in `/lib/fixtures/`. Hooks in `/lib/hooks/` return fixture data. Swapping to InstantDB is a one-line change inside each hook (replace fixture import with `db.useQuery()` or `useQuery`).
- **Base Asset interface**: `BaseAsset` in `/types/asset.ts` is extended by `ExemplaryAsset`, `ElementalAsset`, `ProprietaryDoc`. Maps to InstantDB entities via the `type` field — each concrete type is its own entity in the schema.

## Getting Started

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_INSTANT_APP_ID in .env.local (optional for scaffold)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's Not Built Yet

- Authentication UI (stub only)
- Real AI calls
- Real InstantDB queries (fixtures only)
- File upload handling
- Real CRM integrations
