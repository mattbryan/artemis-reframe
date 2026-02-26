/**
 * Workbench Zustand store — multi-step wizard and proofing workflow.
 * State machine: idle → configuring → generating → proofing → complete.
 */

import { create } from "zustand";
import type { DeliverableConfig } from "@/types/deliverable";
import type { GeneratedContent } from "@/types/ai";
import type { ChangelogEntry } from "@/types/changelog";

export type WorkbenchStatus =
  | "idle"
  | "configuring"
  | "generating"
  | "proofing"
  | "complete";

interface WorkbenchState {
  status: WorkbenchStatus;
  activeDeliverable: DeliverableConfig | null;
  generatedContent: GeneratedContent | null;
  changelog: ChangelogEntry[];

  startNew: () => void;
  updateConfig: (config: Partial<DeliverableConfig>) => void;
  submitForGeneration: () => void;
  submitEdit: (contentId: string, prompt: string) => void;
  finalize: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  status: "idle",
  activeDeliverable: null,
  generatedContent: null,
  changelog: [],

  startNew: () =>
    set({
      status: "configuring",
      activeDeliverable: {
        id: crypto.randomUUID(),
        name: "New deliverable",
        deliverableType: "default",
        createdAt: new Date().toISOString(),
      },
      generatedContent: null,
    }),

  updateConfig: (config) =>
    set((state) => ({
      activeDeliverable: state.activeDeliverable
        ? { ...state.activeDeliverable, ...config }
        : null,
    })),

  submitForGeneration: () =>
    set({
      status: "generating",
      // In real impl, would call generateContent() and transition to proofing
    }),

  submitEdit: (_contentId, _prompt) =>
    set({
      status: "generating",
      // In real impl, would call refineWithPrompt()
    }),

  finalize: () =>
    set({
      status: "complete",
      // In real impl, would persist and add to changelog
    }),
}));
