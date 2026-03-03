// SERVER ONLY — do not import in client components or pages

import { init } from "@instantdb/admin";
import schema from "@/instant.schema";

export const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  // eslint-disable-next-line -- schema type from instant.schema not fully compatible with init() typing
  schema: schema as any,
});
