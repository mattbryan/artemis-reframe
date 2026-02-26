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
import {
  createCollateralGlobalField,
  updateCollateralGlobalField,
  deleteCollateralGlobalField,
  reorderCollateralGlobalFields,
} from "@/lib/mutations/collateralTypes";
import { GlobalFieldRow } from "./GlobalFieldRow";
import { InlineFieldForm } from "./InlineFieldForm";
import type {
  CollateralType,
  CollateralFieldType,
  CollateralGlobalField,
} from "@/types/collateralType";

type GlobalFieldWithOptions = CollateralGlobalField & { optionsParsed: string[] };

interface TypeFieldsTabProps {
  type: CollateralType & {
    globalFields: GlobalFieldWithOptions[];
    sections: Array<{ id: string; name: string; fieldsParsed: unknown[] }>;
  };
}

function SortableGlobalFieldRow({
  field,
  typeId,
  isEditMode,
  onEdit,
  onDelete,
}: {
  field: GlobalFieldWithOptions;
  typeId: string;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: field.id });

  return (
    <div ref={setNodeRef}>
      <GlobalFieldRow
        field={field}
        isEditMode={isEditMode}
        dragHandleProps={isEditMode ? { ...attributes, ...listeners } : null}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

export function TypeFieldsTab({ type }: TypeFieldsTabProps) {
  const isEditMode = useCollateralTypeStore((s) => s.isEditMode);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const globalFields = type.globalFields ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = globalFields.map((f) => f.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorderCollateralGlobalFields(type.id, newOrder);
  };

  const handleAddField = async (
    field: Omit<import("@/types/collateralType").FieldDef, "id" | "order">
  ) => {
    await createCollateralGlobalField(type.id, {
      label: field.label,
      fieldType: field.fieldType as CollateralFieldType,
      helperText: field.helperText,
      placeholder: field.placeholder,
      options: field.options ?? [],
      required: field.required,
      order: globalFields.length,
    });
    setShowAddForm(false);
  };

  const handleUpdateField = (
    fieldId: string,
    updates: Partial<{
      label: string;
      fieldType: CollateralFieldType;
      helperText: string;
      placeholder: string;
      options: string[];
      required: boolean;
    }>
  ) => {
    const opts = updates.options;
    updateCollateralGlobalField(fieldId, {
      ...updates,
      options: opts !== undefined ? JSON.stringify(opts) : undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Global Fields</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Information that applies to the collateral as a whole — property
          details, deal metadata, agent information. These appear before
          section-specific fields in the input wizard.
        </p>
        {isEditMode && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={globalFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="mt-3 space-y-2">
                {globalFields.map((field) => (
                  <li key={field.id}>
                    {editingId === field.id ? (
                      <InlineFieldForm
                        initial={{
                          label: field.label,
                          fieldType: field.fieldType as CollateralFieldType,
                          placeholder: field.placeholder,
                          helperText: field.helperText,
                          options: field.optionsParsed ?? [],
                          required: field.required,
                        }}
                        onSubmit={(updates) =>
                          handleUpdateField(field.id, {
                            ...updates,
                            options: updates.options,
                          })
                        }
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <SortableGlobalFieldRow
                        field={field}
                        typeId={type.id}
                        isEditMode={isEditMode}
                        onEdit={() => setEditingId(field.id)}
                        onDelete={() => deleteCollateralGlobalField(field.id)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {!isEditMode && globalFields.length > 0 && (
          <ul className="mt-3 space-y-2">
            {globalFields.map((field) => (
              <li key={field.id}>
                <GlobalFieldRow
                  field={field}
                  isEditMode={false}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </li>
            ))}
          </ul>
        )}
        {isEditMode && !showAddForm && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Global Field
          </Button>
        )}
        {isEditMode && showAddForm && (
          <div className="mt-3">
            <InlineFieldForm
              onSubmit={(f) =>
                handleAddField({
                  ...f,
                  options: f.options ?? [],
                })
              }
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
      </div>
      {type.sections?.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="text-sm font-medium text-foreground">
            Section Fields Summary
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Section-specific fields are configured in the Sections tab. This is
            for reference when designing the full input flow.
          </p>
          <ul className="mt-2 space-y-1">
            {type.sections.map((sec) => (
              <li key={sec.id} className="text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() =>
                    useCollateralTypeStore.getState().setActiveTab("sections")
                  }
                  className="text-primary hover:underline"
                >
                  {sec.name}
                </button>
                {" — "}
                {(sec.fieldsParsed ?? []).length} field(s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
