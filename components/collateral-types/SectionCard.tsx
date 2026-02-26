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
import { ChevronDown, ChevronRight, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateCollateralSection,
  deleteCollateralSection,
  updateSectionFields,
  addFieldToSection,
  reorderSectionFields,
} from "@/lib/mutations/collateralTypes";
import { InlineFieldForm } from "./InlineFieldForm";
import type { CollateralSection } from "@/types/collateralType";
import type { FieldDef } from "@/types/collateralType";
import { parseSectionFields } from "@/lib/collateralTypeUtils";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  section: CollateralSection & { fieldsParsed?: FieldDef[] };
  isEditMode: boolean;
  dragHandleProps?: Record<string, unknown> | null;
  isDragging?: boolean;
  onDelete: () => void;
}

function SortableFieldRow({
  field,
  onEdit,
  onRemove,
}: {
  field: FieldDef;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded border border-border bg-card px-3 py-2",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm font-medium">{field.label}</span>
      <span className="text-xs text-muted-foreground">{field.fieldType}</span>
      {field.required && (
        <span className="text-xs text-muted-foreground">Required</span>
      )}
      <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit field">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
        aria-label="Remove field"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function SectionCard({
  section,
  isEditMode,
  dragHandleProps,
  isDragging,
  onDelete,
}: SectionCardProps) {
  const [open, setOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description);
  const [contentGuidelines, setContentGuidelines] = useState(
    section.contentGuidelines
  );
  const fields = section.fieldsParsed ?? parseSectionFields(section.fields);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSaveSection = () => {
    updateCollateralSection(section.id, {
      name,
      description,
      contentGuidelines,
    });
    setEditingSection(false);
  };

  const handleDragEndFields = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = fields.map((f) => f.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorderSectionFields(section.id, section.fields, newOrder);
  };

  const handleAddField = (field: Omit<FieldDef, "id" | "order">) => {
    addFieldToSection(section.id, section.fields, field);
    setShowAddField(false);
  };

  const handleRemoveField = (fieldId: string) => {
    const next = fields.filter((f) => f.id !== fieldId);
    const withOrder = next.map((f, i) => ({ ...f, order: i }));
    updateSectionFields(section.id, withOrder);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FieldDef>) => {
    const next = fields.map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    updateSectionFields(section.id, next);
    setEditingFieldId(null);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-1 rounded-t-lg border-b border-border bg-muted/30 px-3 py-2">
        {dragHandleProps && (
          <button
            type="button"
            className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Drag to reorder"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          className="flex flex-1 items-center gap-2 py-1 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">{section.name}</span>
          <span className="text-xs text-muted-foreground">#{section.order + 1}</span>
        </button>
        {isEditMode && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Edit section"
              onClick={() => setEditingSection(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              aria-label="Delete section"
              onClick={() => {
                if (confirm("Delete this section?")) {
                  deleteCollateralSection(section.id);
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      {open && (
        <div className="space-y-4 p-4">
          {editingSection ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Section Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-xs text-muted-foreground">
                  What is this section for?
                </p>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={10000}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content Guidelines</label>
                <p className="text-xs text-muted-foreground">
                  Instructions to the AI. What should this section contain? How
                  long? What tone? What data should it reference or calculate?
                </p>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={contentGuidelines}
                  onChange={(e) => setContentGuidelines(e.target.value)}
                  maxLength={10000}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSection}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setName(section.name);
                    setDescription(section.description);
                    setContentGuidelines(section.contentGuidelines);
                    setEditingSection(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {section.description && (
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              )}
              {section.contentGuidelines && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Content Guidelines
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {section.contentGuidelines}
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <p className="text-sm font-medium">Section-Specific Fields</p>
            <p className="text-xs text-muted-foreground">
              Fields the broker fills out that are specific to this section.
              These appear in the input wizard alongside the section guidelines.
            </p>
            {isEditMode && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndFields}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="mt-2 space-y-2">
                    {fields.map((field) => (
                      <li key={field.id}>
                        {editingFieldId === field.id ? (
                          <InlineFieldForm
                            initial={field}
                            onSubmit={(updates) =>
                              handleUpdateField(field.id, updates)
                            }
                            onCancel={() => setEditingFieldId(null)}
                          />
                        ) : (
                          <SortableFieldRow
                            field={field}
                            onEdit={() => setEditingFieldId(field.id)}
                            onRemove={() => handleRemoveField(field.id)}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
            {!isEditMode && fields.length > 0 && (
              <ul className="mt-2 space-y-1">
                {fields.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <span className="font-medium">{f.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {f.fieldType}
                      {f.required ? " · Required" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {isEditMode && !showAddField && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowAddField(true)}
              >
                Add Field
              </Button>
            )}
            {isEditMode && showAddField && (
              <div className="mt-2">
                <InlineFieldForm
                  onSubmit={handleAddField}
                  onCancel={() => setShowAddField(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
