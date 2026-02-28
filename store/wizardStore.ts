import { create } from "zustand";
import type { CollateralType } from "@/types/collateralType";
import type { ProjectImage } from "@/types/project";
import type { OutputTargetType } from "@/types/collateralType";
import type { Project } from "@/types/project";

interface WizardState {
  currentStep: number;
  projectName: string;
  selectedCollateralType: CollateralType | null;
  formData: Record<string, string | boolean | number>;
  sectionData: Record<string, Record<string, string | boolean | number>>;
  images: ProjectImage[];
  outputTargetAssignments: Partial<Record<OutputTargetType, string>>;
  draftProjectId: string | null;

  setStep: (step: number) => void;
  setProjectName: (name: string) => void;
  setCollateralType: (ct: CollateralType) => void;
  setFormField: (fieldId: string, value: string | boolean | number) => void;
  setSectionField: (
    sectionId: string,
    fieldId: string,
    value: string | boolean | number
  ) => void;
  addImage: (image: ProjectImage) => void;
  removeImage: (imageId: string) => void;
  setHeroImage: (imageId: string) => void;
  setOutputTargetBrief: (targetType: OutputTargetType, briefId: string) => void;
  setDraftProjectId: (id: string) => void;
  /** Rehydrate store from a saved draft project and collateral type; sets step. */
  hydrateFromDraft: (
    project: Project,
    collateralType: CollateralType,
    step: number
  ) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  projectName: "",
  selectedCollateralType: null,
  formData: {},
  sectionData: {},
  images: [],
  outputTargetAssignments: {},
  draftProjectId: null,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setProjectName: (name) => set({ projectName: name }),
  setCollateralType: (ct) => set({ selectedCollateralType: ct }),
  setFormField: (fieldId, value) =>
    set((s) => ({ formData: { ...s.formData, [fieldId]: value } })),
  setSectionField: (sectionId, fieldId, value) =>
    set((s) => ({
      sectionData: {
        ...s.sectionData,
        [sectionId]: { ...(s.sectionData[sectionId] ?? {}), [fieldId]: value },
      },
    })),
  addImage: (image) => set((s) => ({ images: [...s.images, image] })),
  removeImage: (imageId) =>
    set((s) => {
      const filtered = s.images.filter((i) => i.id !== imageId);
      const wasHero = s.images.find((i) => i.id === imageId)?.isHero;
      if (wasHero && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isHero: true };
      }
      return { images: filtered };
    }),
  setHeroImage: (imageId) =>
    set((s) => ({
      images: s.images.map((i) => ({ ...i, isHero: i.id === imageId })),
    })),
  setOutputTargetBrief: (targetType, briefId) =>
    set((s) => ({
      outputTargetAssignments: {
        ...s.outputTargetAssignments,
        [targetType]: briefId,
      },
    })),
  setDraftProjectId: (id) => set({ draftProjectId: id }),
  hydrateFromDraft: (project, collateralType, step) =>
    set({
      draftProjectId: project.id,
      projectName: project.name,
      formData: project.formData ?? {},
      sectionData: project.sectionData ?? {},
      images: Array.isArray(project.images) ? project.images : [],
      outputTargetAssignments: project.outputTargetAssignments ?? {},
      selectedCollateralType: collateralType,
      currentStep: step,
    }),
  reset: () => set(initialState),
}));
