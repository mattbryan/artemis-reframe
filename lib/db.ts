/**
 * InstantDB client initialization.
 * Uses schema from instant.schema.ts for type-safe queries and transactions.
 *
 * Set NEXT_PUBLIC_INSTANT_APP_ID in .env.local for real InstantDB connectivity.
 *
 * Auth (Google OAuth) — prerequisite setup (no new env vars; NEXT_PUBLIC_INSTANT_APP_ID covers auth):
 * 1. In the InstantDB dashboard, add Google as an OAuth provider under Auth settings (client ID and secret from Google Cloud Console).
 * 2. Set the authorized redirect URI in Google Cloud Console to https://api.instantdb.com/runtime/oauth/callback and add your site to Redirect Origins in the Instant dashboard.
 * 3. The login page uses db.auth.createAuthorizationURL({ clientName: "google", redirectURL }) and redirects; the clientName must match the name you gave the Google client in the InstantDB dashboard (e.g. "google").
 */

import { init_experimental } from "@instantdb/react";
import schema from "../instant.schema";

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "placeholder-app-id";

export const db = init_experimental({
  appId,
  schema,
});
