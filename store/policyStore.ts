"use client";

import { create } from "zustand";
import type { PolicySavingState } from "@/types/policy";

export interface PolicyStore {
  editingFieldsTypeKey: string | null;
  expandedRuleIds: Set<string>;
  savingState: PolicySavingState;
  setEditingFieldsTypeKey: (key: string | null) => void;
  toggleRuleExpanded: (id: string) => void;
  collapseAllRules: () => void;
  setSavingState: (state: PolicySavingState) => void;
}

export const usePolicyStore = create<PolicyStore>((set) => ({
  editingFieldsTypeKey: null,
  expandedRuleIds: new Set<string>(),
  savingState: "idle",
  setEditingFieldsTypeKey: (key) => set({ editingFieldsTypeKey: key }),
  toggleRuleExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedRuleIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedRuleIds: next };
    }),
  collapseAllRules: () => set({ expandedRuleIds: new Set() }),
  setSavingState: (state) => set({ savingState: state }),
}));
