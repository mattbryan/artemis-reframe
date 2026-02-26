"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BrandPersona } from "@/types/brand";
import { PersonaCard } from "./PersonaCard";
import {
  createBrandPersona,
  updateBrandPersona,
  deleteBrandPersona,
  reorderBrandPersonas,
} from "@/lib/mutations/brand";

interface PersonaListProps {
  brandId: string;
  personas: BrandPersona[];
  setSavingState: (state: "saving" | "saved" | "error") => void;
}

function SortablePersonaCard({
  persona,
  onBlurUpdate,
  onDelete,
}: {
  persona: BrandPersona;
  onBlurUpdate: (updates: Parameters<typeof updateBrandPersona>[1]) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: persona.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <PersonaCard
        persona={persona}
        onBlurUpdate={onBlurUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function PersonaList({
  brandId,
  personas,
  setSavingState,
}: PersonaListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleBlurUpdate = useCallback(
    async (personaId: string, updates: Parameters<typeof updateBrandPersona>[1]) => {
      setSavingState("saving");
      try {
        await updateBrandPersona(personaId, updates);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  const handleDelete = useCallback(
    async (personaId: string) => {
      setSavingState("saving");
      try {
        await deleteBrandPersona(personaId);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  const handleAdd = useCallback(async () => {
    setSavingState("saving");
    try {
      await createBrandPersona(brandId, personas.length);
      setSavingState("saved");
    } catch {
      setSavingState("error");
    }
  }, [brandId, personas.length, setSavingState]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = personas.map((p) => p.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(ids, oldIndex, newIndex);
      setSavingState("saving");
      reorderBrandPersonas(brandId, newOrder)
        .then(() => setSavingState("saved"))
        .catch(() => setSavingState("error"));
    },
    [brandId, personas, setSavingState]
  );

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={personas.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-4">
            {personas.map((persona) => (
              <li key={persona.id}>
                <SortablePersonaCard
                  persona={persona}
                  onBlurUpdate={(updates) =>
                    handleBlurUpdate(persona.id, updates)
                  }
                  onDelete={() => handleDelete(persona.id)}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Persona
      </Button>
    </div>
  );
}
