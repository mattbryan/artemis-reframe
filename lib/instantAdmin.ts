// SERVER ONLY — do not import in client components or pages

import { init } from "@instantdb/admin";
import schema from "@/instant.schema";

export const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: schema as any,
});
