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

// #region agent log
if (typeof window !== "undefined") {
  fetch("http://127.0.0.1:7351/ingest/15b2fcf1-ad78-4521-8bd0-ab3a09601be4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "db999b",
    },
    body: JSON.stringify({
      sessionId: "db999b",
      runId: "initial",
      hypothesisId: "H1",
      location: "lib/db.ts:24",
      message: "InstantDB client initialized",
      data: {
        hasRealAppId: appId !== "placeholder-app-id",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion
