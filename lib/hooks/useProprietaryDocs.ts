/**
 * useProprietaryDocs — returns proprietary docs.
 * Stub: uses fixtures. Swap for db.useQuery() when InstantDB is wired.
 */

import { useMemo } from "react";
import { proprietaryDocsFixture } from "@/lib/fixtures";
import type { ProprietaryDoc } from "@/types/asset";

export function useProprietaryDocs(): {
  data: ProprietaryDoc[];
  isLoading: boolean;
  error: Error | null;
} {
  return useMemo(
    () => ({
      data: proprietaryDocsFixture,
      isLoading: false,
      error: null,
    }),
    []
  );
}
