/**
 * useSchemaDefinitions — returns schema definitions for asset types.
 * Stub: uses fixtures. Swap for db.useQuery() when InstantDB is wired.
 */

import { useMemo } from "react";
import { schemaDefinitionsFixture } from "@/lib/fixtures";
import type { SchemaDefinition } from "@/types/schema-definition";

export function useSchemaDefinitions(): {
  data: SchemaDefinition[];
  isLoading: boolean;
  error: Error | null;
} {
  return useMemo(
    () => ({
      data: schemaDefinitionsFixture,
      isLoading: false,
      error: null,
    }),
    []
  );
}
