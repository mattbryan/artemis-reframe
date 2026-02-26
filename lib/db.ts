/**
 * InstantDB client initialization.
 * Uses schema from instant.schema.ts for type-safe queries and transactions.
 *
 * Set NEXT_PUBLIC_INSTANT_APP_ID in .env.local for real InstantDB connectivity.
 * During scaffold phase, no real DB calls are made — fixtures are used instead.
 */

import { init_experimental } from "@instantdb/react";
import schema from "../instant.schema";

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "placeholder-app-id";

export const db = init_experimental({
  appId,
  schema,
});
