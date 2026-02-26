# 🚀 Deployment Handoff — Read This First

**For the engineer deploying Artemis Reframe to Vercel (or similar).** This file calls out every implication of the codebase that must be considered before and after deployment. Do not treat this as optional reading.

---

## Table of Contents

1. [Environment & Hosting](#1-environment--hosting)
2. [Brand & Philosophy — Design Intent](#2-brand--philosophy--design-intent)
3. [Generation Integration Point](#3-generation-integration-point)
4. [File Upload — Two Different Paths](#4-file-upload--two-different-paths)
5. [InstantDB & JSON Fields](#5-instantdb--json-fields)
6. [AI Generation — Intent Only](#6-ai-generation--intent-only)
7. [Authentication](#7-authentication)
8. [Quick Checklist](#8-quick-checklist)

---

## 1. Environment & Hosting

- **Required env:** `NEXT_PUBLIC_INSTANT_APP_ID` must be set in the hosting platform (e.g. Vercel → Project → Settings → Environment Variables). Copy from `.env.local` or from the InstantDB dashboard. Without it, the app uses a placeholder and real-time data will not work.
- **No backend server:** The app is Next.js frontend + InstantDB. There is no custom Node/Express server to run. Standard `next build` / `next start` (or Vercel’s default) is sufficient.
- **InstantDB schema & permissions:** After cloning, the deployer must run `npx instant-cli@latest login`, then `push schema` and `push perms` so the remote app matches `instant.schema.ts`. See `LAUNCH.md` for exact commands.

---

## 2. Brand & Philosophy — Design Intent

These choices are intentional and should be preserved unless the product direction changes.

- **Essence Statement field**  
  The “Brand Essence Statement” textarea gets **visual elevation** — blue tint (`border-primary/50`, `bg-muted/30`) and accent border — because it is the **single most important field** in the entire feature. The UX is meant to signal that without a tooltip. Do not flatten it to look like the other fields.

- **Helper text**  
  The Essence field’s helper text (“Write this as a direct instruction. Start with: ‘When generating content for this brand, always…’ — this field is the most important in the system.”) is part of the product intent. Keep it unless copy is explicitly updated.

- **One file for generation wiring**  
  The **`useBrand()` hook** (`lib/hooks/useBrand.ts`) is built clean and commented as the **future generation integration point**. When you wire the generation layer, that is the one file you touch — the rest of the app (forms, mutations, UI) stays stable. Brand Context Block assembly will consume `{ brand, voice, visual, screenshots, personas }` from this hook.

---

## 3. Generation Integration Point

- **Single touchpoint:** All brand/voice/visual/persona/screenshot data is exposed via `useBrand()`. No AI generation, prompt assembly, or Brand Context Block compilation lives in this data layer; that is future work. Implement generation by consuming `useBrand()` (and related types in `types/brand.ts`), not by scattering logic across forms or pages.

---

## 4. File Upload — Two Different Paths

There are **two** upload flows. Do not assume one implementation fits both.

| Use case | File | Current behavior | What you need to do |
|----------|------|------------------|----------------------|
| **Brand screenshots** (Brand & Philosophy → Visual) | `lib/uploadScreenshot.ts` | **Stub.** Returns `URL.createObjectURL(file)` (client-only blob URL). Not persisted to any storage. | Replace the body with real storage (e.g. Vercel Blob). The function is fully typed and wired everywhere; only the actual storage call is missing. Drop in `put()` (or equivalent) and return `{ url: blob.url }` — the rest of the UI works immediately. |
| **Design brief screenshots** | `lib/uploadImage.ts` | Uses **InstantDB storage** (`db.storage.upload` / `getDownloadUrl`). Works today with InstantDB. | Optional: swap to Vercel Blob (or your chosen storage) for consistency and durability; the comment in the file describes the replacement. |

So: **Brand screenshots** = stub, must be implemented for production. **Brief screenshots** = already using InstantDB storage; can be left as-is or migrated to Blob.

---

## 5. InstantDB & JSON Fields

- **No native array type:** InstantDB does not have a native array type for these fields. The following are stored as **JSON strings** in the schema:
  - `brandVoice.toneDimensions`
  - `brandVoice.examplePairs`
  - `brandVisual.colorIntents`

- **Safe parsing:** All read paths use the helpers in **`lib/brandJson.ts`** (`parseToneDimensions`, `parseColorIntents`, `parseExamplePairs`). Each does `JSON.parse` inside try/catch and validates shape; invalid or malformed data returns `[]` (or a safe default). **A bad value in the DB will not break the UI.** When you add new JSON fields or new consumers, keep using this pattern (parse once, validate, fallback).

- **Writing:** The UI always writes back with `JSON.stringify(...)` of the typed structures. Do not write raw or unvalidated JSON from new code.

---

## 6. AI Generation — Intent Only

- **No generation logic:** The codebase includes **comments and helper text** that describe how brand/voice/visual data will eventually drive AI generation. There is **no** implementation of that generation. Cursor (or any tool) should not scaffold generation logic from this repo’s prompts alone.

- **Stubbed AI surface:** `lib/ai.ts` defines the intended API (`generateContent`, `refineWithPrompt`, `applyPolicies`, `suggestTags`) and throws “Not implemented” for each. Types live in `types/ai.ts`. When you add a real LLM/API, implement behind these functions so the rest of the app can stay unchanged.

---

## 7. Authentication

- **Auth is stubbed:** `lib/auth-stub.ts` exports `isAuthenticated()` which always returns `true`. `RouteGuard` uses it and currently does not redirect (it only returns `null` when “unauthorized”). For a real deployment you must:
  - Replace the stub with your auth provider (e.g. NextAuth, Clerk, custom).
  - Implement a `/login` (or equivalent) and have `RouteGuard` redirect unauthenticated users there.

---

## 8. Quick Checklist

Before going live:

- [ ] Set `NEXT_PUBLIC_INSTANT_APP_ID` in the hosting environment.
- [ ] Run `npx instant-cli push schema` and `push perms` for the InstantDB app.
- [ ] Implement real storage in `lib/uploadScreenshot.ts` (e.g. Vercel Blob) for brand screenshots.
- [ ] Decide: keep brief screenshots on InstantDB storage or migrate to the same blob storage.
- [ ] Replace `lib/auth-stub.ts` with real auth and add redirect in `RouteGuard`.

When adding generation:

- [ ] Consume brand/voice/visual/screenshots/personas from `useBrand()` only; do not duplicate or re-fetch from elsewhere.
- [ ] Implement `lib/ai.ts` (and use `types/ai.ts`); do not scatter LLM calls across components.

---

*This handoff doc is the single source of truth for these implications. Update it when you change any of the above behaviors.*
