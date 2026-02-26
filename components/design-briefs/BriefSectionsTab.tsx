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
import { useActiveBrief } from "@/lib/hooks/useActiveBrief";
import { useBriefStore } from "@/store/briefStore";
import { reorderBriefSections } from "@/lib/mutations/briefSections";
import { SectionCard } from "./SectionCard";
import { InlineSectionForm } from "./InlineSectionForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function SortableSectionItem({
  section,
  onDelete,
}: {
  section: { id: string; briefId: string; type: string; body: string; order: number };
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
        section={section as import("@/types/brief").BriefSection}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

export function BriefSectionsTab() {
  const { brief, sections } = useActiveBrief();
  const isAddingSectionInline = useBriefStore((s) => s.isAddingSectionInline);
  const setIsAddingSectionInline = useBriefStore((s) => s.setIsAddingSectionInline);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !brief) return;
    const ids = sections.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorderBriefSections(brief.id, newOrder);
  };

  if (!brief) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Sections</h3>
        {!isAddingSectionInline && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingSectionInline(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        )}
      </div>
      {isAddingSectionInline && (
        <InlineSectionForm
          briefId={brief.id}
          nextOrder={sections.length}
          onSaved={() => setIsAddingSectionInline(false)}
          onCancel={() => setIsAddingSectionInline(false)}
        />
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
