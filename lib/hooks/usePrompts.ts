/**
 * usePrompts — returns prompts.
 * Stub: uses fixtures. Swap for db.useQuery() when InstantDB is wired.
 */

import { useMemo } from "react";
import { promptsFixture } from "@/lib/fixtures";
import type { PromptFixture } from "@/lib/fixtures/prompts";

export function usePrompts(): {
  data: PromptFixture[];
  isLoading: boolean;
  error: Error | null;
} {
  return useMemo(
    () => ({
      data: promptsFixture,
      isLoading: false,
      error: null,
    }),
    []
  );
}
