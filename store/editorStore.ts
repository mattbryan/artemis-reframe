/**
 * In-memory editor state — not persisted to localStorage.
 * Page refresh loses unsaved changes (acceptable for MVP).
 */

import { create } from "zustand";
import type { GeneratedOutputContent } from "@/types/generation";

export interface EditorState {
  liveContent: Record<string, GeneratedOutputContent>;
  savedContent: Record<string, GeneratedOutputContent>;

  initOutput: (outputId: string, content: GeneratedOutputContent) => void;
  updateField: (
    outputId: string,
    sectionId: string,
    fieldKey: string,
    value: string
  ) => void;
  updateNarrative: (
    outputId: string,
    sectionId: string,
    value: string
  ) => void;
  updateSection: (
    outputId: string,
    sectionId: string,
    sectionData: { fields: Record<string, string>; narrative: string }
  ) => void;
  markSaved: (outputId: string) => void;
  hasUnsavedChanges: (outputId: string) => boolean;
  resetOutput: (outputId: string, content: GeneratedOutputContent) => void;
}

function deepCopy(content: GeneratedOutputContent): GeneratedOutputContent {
  return JSON.parse(JSON.stringify(content));
}

export const useEditorStore = create<EditorState>((set, get) => ({
  liveContent: {},
  savedContent: {},

  initOutput(outputId, content) {
    const copy = deepCopy(content);
    set((state) => ({
      liveContent: { ...state.liveContent, [outputId]: copy },
      savedContent: { ...state.savedContent, [outputId]: copy },
    }));
  },

  updateField(outputId, sectionId, fieldKey, value) {
    set((state) => {
      const live = state.liveContent[outputId];
      if (!live || !Array.isArray(live.sections)) return state;
      const sections = live.sections.map((s) =>
        s.sectionId === sectionId
          ? { ...s, fields: { ...s.fields, [fieldKey]: value } }
          : s
      );
      return {
        liveContent: {
          ...state.liveContent,
          [outputId]: { ...live, sections },
        },
      };
    });
  },

  updateNarrative(outputId, sectionId, value) {
    set((state) => {
      const live = state.liveContent[outputId];
      if (!live || !Array.isArray(live.sections)) return state;
      const sections = live.sections.map((s) =>
        s.sectionId === sectionId ? { ...s, narrative: value } : s
      );
      return {
        liveContent: {
          ...state.liveContent,
          [outputId]: { ...live, sections },
        },
      };
    });
  },

  updateSection(outputId, sectionId, sectionData) {
    set((state) => {
      const live = state.liveContent[outputId];
      if (!live || !Array.isArray(live.sections)) return state;
      const sections = live.sections.map((s) =>
        s.sectionId === sectionId
          ? {
              ...s,
              fields: { ...sectionData.fields },
              narrative: sectionData.narrative,
            }
          : s
      );
      return {
        liveContent: {
          ...state.liveContent,
          [outputId]: { ...live, sections },
        },
      };
    });
  },

  markSaved(outputId) {
    const live = get().liveContent[outputId];
    if (!live) return;
    set((state) => ({
      savedContent: { ...state.savedContent, [outputId]: deepCopy(live) },
    }));
  },

  hasUnsavedChanges(outputId) {
    const live = get().liveContent[outputId];
    const saved = get().savedContent[outputId];
    if (!live || !saved) return false;
    return JSON.stringify(live) !== JSON.stringify(saved);
  },

  resetOutput(outputId, content) {
    const copy = deepCopy(content);
    set((state) => ({
      liveContent: { ...state.liveContent, [outputId]: copy },
      savedContent: { ...state.savedContent, [outputId]: copy },
    }));
  },
}));
