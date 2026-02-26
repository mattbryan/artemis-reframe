"use client";

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
import { useState } from "react";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import {
  createCollateralMediaField,
  reorderCollateralMediaFields,
} from "@/lib/mutations/collateralTypes";
import { MediaFieldCard } from "./MediaFieldCard";
import type {
  CollateralType,
  CollateralMediaType,
  CollateralMediaField,
} from "@/types/collateralType";

interface TypeMediaTabProps {
  type: CollateralType & { mediaFields: CollateralMediaField[] };
}

function SortableMediaCard({
  field,
  isEditMode,
  onDelete,
}: {
  field: CollateralMediaField;
  isEditMode: boolean;
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
      <MediaFieldCard
        field={field}
        isEditMode={isEditMode}
        dragHandleProps={isEditMode ? { ...attributes, ...listeners } : null}
        isDragging={isDragging}
        onDelete={onDelete}
      />
    </div>
  );
}

export function TypeMediaTab({ type }: TypeMediaTabProps) {
  const isEditMode = useCollateralTypeStore((s) => s.isEditMode);
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<CollateralMediaType>("image");
  const [required, setRequired] = useState(true);
  const [maxCount, setMaxCount] = useState(1);
  const mediaFields = type.mediaFields ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = mediaFields.map((m) => m.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorderCollateralMediaFields(type.id, newOrder);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await createCollateralMediaField(type.id, {
      label: label.trim(),
      description: description.trim(),
      mediaType,
      required,
      maxCount: Math.max(1, maxCount),
      order: mediaFields.length,
    });
    setLabel("");
    setDescription("");
    setMediaType("image");
    setRequired(true);
    setMaxCount(1);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Media Requirements
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the images, videos, or documents this collateral type requires.
          These appear together in Step 2 of the input wizard. Be specific about
          how each asset will be used — this context is passed to the AI at
          generation time.
        </p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={mediaFields.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {mediaFields.map((field) => (
              <li key={field.id}>
                <SortableMediaCard
                  field={field}
                  isEditMode={isEditMode}
                  onDelete={() => {}}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {isEditMode && !showAdd && (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Media Field
        </Button>
      )}
      {isEditMode && showAdd && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4"
        >
          <div>
            <label className="text-sm font-medium">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Hero Property Photo"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Media Type</label>
            <select
              value={mediaType}
              onChange={(e) =>
                setMediaType(e.target.value as CollateralMediaType)
              }
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How is this asset used?"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={10000}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={required}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                required ? "bg-primary" : "bg-input"
              }`}
              onClick={() => setRequired((r) => !r)}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition ${
                  required ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium">Required</span>
          </div>
          <div>
            <label className="text-sm font-medium">Max Count</label>
            <input
              type="number"
              min={1}
              value={maxCount}
              onChange={(e) =>
                setMaxCount(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="mt-1 h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!label.trim()}>
              Add Media Field
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
