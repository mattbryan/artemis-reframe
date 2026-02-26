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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { removeFieldFromType, reorderPolicyTypeFields } from "@/lib/mutations/policy";
import { usePolicyStore } from "@/store/policyStore";
import { AddFieldForm } from "./AddFieldForm";
import type { PolicyTypeSchema, FieldDef } from "@/types/policy";

interface EditFieldsPanelProps {
  typeSchema: PolicyTypeSchema;
  fields: FieldDef[];
  onFieldsChange: () => void;
}

function SortableFieldRow({
  field,
  typeLabel,
  onRemove,
}: {
  field: FieldDef;
  typeLabel: string;
  onRemove: () => void;
}) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded border border-border bg-card px-3 py-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M8 6h2V4H8v2zm0 4h2V8H8v2zm0 4h2v-2H8v2zm4-8h2V4h-2v2zm0 4h2V8h-2v2zm0 4h2v-2h-2v2z" />
        </svg>
      </button>
      <span className="flex-1 text-sm font-medium">{field.label}</span>
      <span className="text-xs text-muted-foreground">{field.fieldType}</span>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setRemoveDialogOpen(true)}
      >
        Remove
      </Button>
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this field?</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{field.label}&rdquo; from all {typeLabel} rules? Existing data in this
              field will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRemoveDialogOpen(false);
                onRemove();
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EditFieldsPanel({ typeSchema, fields, onFieldsChange }: EditFieldsPanelProps) {
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const [showAddForm, setShowAddForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = fields.map((f) => f.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    setSavingState("saving");
    try {
      await reorderPolicyTypeFields(typeSchema.id, newOrder);
      setSavingState("saved");
      onFieldsChange();
    } catch {
      setSavingState("error");
    }
  };

  const handleRemoveField = async (fieldDefId: string) => {
    setSavingState("saving");
    try {
      await removeFieldFromType(typeSchema.id, fieldDefId);
      setSavingState("saved");
      onFieldsChange();
    } catch {
      setSavingState("error");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag to reorder. Removing a field removes it from all rules of this type.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fields.map((field) => (
              <SortableFieldRow
                key={field.id}
                field={field}
                typeLabel={typeSchema.label}
                onRemove={() => handleRemoveField(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {showAddForm ? (
        <AddFieldForm
          schemaId={typeSchema.id}
          onAdded={() => {
            setShowAddForm(false);
            onFieldsChange();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
          + Add Field
        </Button>
      )}
    </div>
  );
}
