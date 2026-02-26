"use client";

import { create } from "zustand";
import type { CollateralTabId } from "@/types/collateralType";

export interface IdentityDraft {
  name: string;
  category: string;
  description: string;
  aiIntent: string;
}

export interface CollateralTypeStore {
  activeTypeId: string | null;
  activeTab: CollateralTabId;
  searchQuery: string;
  isEditMode: boolean;
  showArchived: boolean;
  identityDraft: IdentityDraft | null;
  setActiveTypeId: (id: string | null) => void;
  setActiveTab: (tab: CollateralTabId) => void;
  setSearchQuery: (q: string) => void;
  setIsEditMode: (v: boolean) => void;
  setShowArchived: (v: boolean) => void;
  setIdentityDraft: (draft: IdentityDraft | null) => void;
}

export const useCollateralTypeStore = create<CollateralTypeStore>((set) => ({
  activeTypeId: null,
  activeTab: "identity",
  searchQuery: "",
  isEditMode: false,
  showArchived: false,
  identityDraft: null,
  setActiveTypeId: (id) => set({ activeTypeId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setIsEditMode: (v) => set({ isEditMode: v }),
  setShowArchived: (v) => set({ showArchived: v }),
  setIdentityDraft: (draft) => set({ identityDraft: draft }),
}));
