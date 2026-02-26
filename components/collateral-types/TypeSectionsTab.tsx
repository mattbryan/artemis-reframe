"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import { createCollateralSection, reorderCollateralSections } from "@/lib/mutations/collateralTypes";
import { SectionCard } from "./SectionCard";
import type {
  CollateralType,
  CollateralSection,
  FieldDef,
} from "@/types/collateralType";

type SectionWithParsed = CollateralSection & { fieldsParsed: FieldDef[] };

interface TypeSectionsTabProps {
  type: CollateralType & { sections: SectionWithParsed[] };
}

function SortableSectionItem({
  section,
  typeId,
  isEditMode,
  onDelete,
}: {
  section: SectionWithParsed;
  typeId: string;
  isEditMode: boolean;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: section.id });

  return (
    <div ref={setNodeRef}>
      <SectionCard
        section={section}
        isEditMode={isEditMode}
        dragHandleProps={isEditMode ? { ...attributes, ...listeners } : null}
        isDragging={isDragging}
        onDelete={onDelete}
      />
    </div>
  );
}

export function TypeSectionsTab({ type }: TypeSectionsTabProps) {
  const isEditMode = useCollateralTypeStore((s) => s.isEditMode);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newGuidelines, setNewGuidelines] = useState("");
  const sections = type.sections ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorderCollateralSections(type.id, newOrder);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCollateralSection(type.id, {
      name: newName.trim(),
      description: newDescription.trim(),
      contentGuidelines: newGuidelines.trim(),
      order: sections.length,
    });
    setNewName("");
    setNewDescription("");
    setNewGuidelines("");
    setShowAddSection(false);
  };

  return (
    <div className="space-y-4">
      {isEditMode && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Sections</h3>
          {!showAddSection && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddSection(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          )}
        </div>
      )}
      {showAddSection && (
        <form
          onSubmit={handleAddSection}
          className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4"
        >
          <div>
            <label className="text-sm font-medium">Section Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Executive Summary"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What is this section for?"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={10000}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Content Guidelines</label>
            <textarea
              rows={4}
              value={newGuidelines}
              onChange={(e) => setNewGuidelines(e.target.value)}
              placeholder="Instructions to the AI..."
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={10000}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!newName.trim()}>
              Add Section
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddSection(false);
                setNewName("");
                setNewDescription("");
                setNewGuidelines("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {sections.map((section) => (
              <li key={section.id}>
                <SortableSectionItem
                  section={section}
                  typeId={type.id}
                  isEditMode={isEditMode}
                  onDelete={() => {}}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
