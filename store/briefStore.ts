"use client";

import { create } from "zustand";
import type { BriefTabId } from "@/types/brief";

export interface BriefStore {
  activeBriefId: string | null;
  activeTab: BriefTabId;
  searchQuery: string;
  isAddingSectionInline: boolean;
  setActiveBriefId: (id: string | null) => void;
  setActiveTab: (tab: BriefTabId) => void;
  setSearchQuery: (q: string) => void;
  setIsAddingSectionInline: (v: boolean) => void;
}

export const useBriefStore = create<BriefStore>((set) => ({
  activeBriefId: null,
  activeTab: "overview",
  searchQuery: "",
  isAddingSectionInline: false,
  setActiveBriefId: (id) => set({ activeBriefId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setIsAddingSectionInline: (v) => set({ isAddingSectionInline: v }),
}));

/** Hook for collateral generator and other consumers to read the active brief id and full brief data. */
export function useActiveBriefId(): string | null {
  return useBriefStore((s) => s.activeBriefId);
}
