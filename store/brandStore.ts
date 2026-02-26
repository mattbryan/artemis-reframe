"use client";

import { create } from "zustand";
import type { BrandTabId, SavingState } from "@/types/brand";

export interface BrandStore {
  activeBrandId: string | null;
  activeTab: BrandTabId;
  savingState: SavingState;
  setActiveBrandId: (id: string | null) => void;
  setActiveTab: (tab: BrandTabId) => void;
  setSavingState: (state: SavingState) => void;
}

export const useBrandStore = create<BrandStore>((set) => ({
  activeBrandId: null,
  activeTab: "identity",
  savingState: "idle",
  setActiveBrandId: (id) => set({ activeBrandId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSavingState: (state) => set({ savingState: state }),
}));
