"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Merge } from "lucide-react";
import { useTags } from "@/lib/hooks/useTags";
import { useTagsWithExemplaryAssets } from "@/lib/hooks/useTagsWithExemplaryAssets";
import {
  createTagsFromMultipleStrings,
  updateTag,
  deleteTag,
  mergeTags,
  migrateTag,
} from "@/lib/mutations/tags";
import { formatTagDisplay } from "@/types/tag";
import {
  getTagInputState,
  getSuggestions,
  parseTagInput,
} from "@/lib/tag-utils";
import type { Tag } from "@/types/tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function isLegacyTag(tag: Tag): boolean {
  return Boolean(tag.name && !tag.key);
}

export function TagManagerContent() {
  const { data: tags, isLoading, error } = useTags();
  const { data: tagsWithAssets } = useTagsWithExemplaryAssets();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);

  const [addInput, setAddInput] = useState("");
  const [addCursorPos, setAddCursorPos] = useState(0);
  const [editInput, setEditInput] = useState("");
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const existingKeys = new Set((tags ?? []).map((t) => t.key).filter(Boolean) as string[]);
  const lines = addInput.split(/\r?\n/);
  let cursorLine = "";
  let cursorOffset = 0;
  let pos = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length + (i < lines.length - 1 ? 1 : 0);
    if (pos + lineLen >= addCursorPos) {
      cursorLine = lines[i] ?? "";
      cursorOffset = Math.min(addCursorPos - pos, cursorLine.length);
      break;
    }
    pos += lineLen;
  }
  if (lines.length > 0 && cursorLine === "" && cursorOffset === 0) {
    cursorLine = lines[lines.length - 1] ?? "";
    cursorOffset = cursorLine.length;
  }
  const addState = getTagInputState(cursorLine, cursorOffset);
  const addSuggestions = getSuggestions(tags ?? [], addState);

  useEffect(() => {
    if (!suggestionOpen || addSuggestions.length === 0) {
      setHighlightedIndex(0);
      return;
    }
    setHighlightedIndex((i) =>
      Math.min(Math.max(0, i), addSuggestions.length - 1)
    );
  }, [suggestionOpen, addSuggestions.length]);

  const hasValidLine = addInput
    .split(/\r?\n/)
    .some((line) => parseTagInput(line.trim()));

  const handleAdd = async () => {
    const trimmed = addInput.trim();
    if (!trimmed) return;
    const created = await createTagsFromMultipleStrings(trimmed, existingKeys);
    setAddInput("");
    setAddOpen(false);
    if (created === 0) {
      alert("No new tags created. Use format Category: Value or Parent/Category: Value. Invalid lines or duplicates were skipped.");
    }
  };

  const handleEdit = async () => {
    if (!editingTag) return;
    const parsed = parseTagInput(editInput.trim());
    if (!parsed || parsed.values.length !== 1) {
      alert('Use format "Category: Value" or "Parent/Category: Value" (single value for edit).');
      return;
    }
    await updateTag(editingTag.id, {
      parent: parsed.parent,
      category: parsed.category,
      value: parsed.values[0],
    });
    setEditingTag(null);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingTag) return;
    await deleteTag(deletingTag.id);
    setDeletingTag(null);
    setDeleteOpen(false);
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    const sourceTag = tagsWithAssets?.find((t) => t.id === mergeSource);
    const exemplaryAssetIds = (sourceTag?.exemplaryAssets ?? []).map(
      (a: { id: string }) => a.id
    );
    await mergeTags(mergeSource, mergeTarget, exemplaryAssetIds);
    setMergeSource(null);
    setMergeTarget(null);
    setMergeOpen(false);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setEditInput(formatTagDisplay(tag));
    setEditOpen(true);
  };

  const openDelete = (tag: Tag) => {
    setDeletingTag(tag);
    setDeleteOpen(true);
  };

  const openMerge = (tagId: string) => {
    setMergeSource(tagId);
    setMergeTarget(null);
    setMergeOpen(true);
  };

  const migrateLegacy = async () => {
    const legacy = (tags ?? []).filter(isLegacyTag);
    for (const tag of legacy) {
      await migrateTag(tag);
    }
  };

  const legacyCount = (tags ?? []).filter(isLegacyTag).length;

  const applySuggestion = (suggestion: string) => {
    const state = addState;
    const line = cursorLine;
    let newLine: string;
    if (state.segment === "parent") {
      const rest = state.prefix ? line.slice(0, line.length - state.prefix.length) : "";
      newLine = rest + suggestion;
    } else if (state.segment === "category") {
      const slashIdx = line.indexOf("/");
      const beforeSlash = slashIdx !== -1 ? line.slice(0, slashIdx + 1) : "";
      const afterSlash = slashIdx !== -1 ? line.slice(slashIdx + 1) : line;
      const rest = state.prefix ? afterSlash.slice(0, -state.prefix.length) : "";
      newLine = beforeSlash + rest + suggestion;
    } else {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) {
        newLine = line + ": " + suggestion;
      } else {
        const afterColon = line.slice(colonIdx + 1);
        const parts = afterColon.split(",");
        const lastPart = parts[parts.length - 1] ?? "";
        const start = colonIdx + 1 + afterColon.length - lastPart.length;
        newLine = line.slice(0, start) + suggestion;
      }
    }
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + (i < lines.length - 1 ? 1 : 0);
      if (idx + lineLen >= addCursorPos) {
        const newLines = [...lines];
        newLines[i] = newLine;
        setAddInput(newLines.join("\n"));
        setAddCursorPos(idx + newLine.length);
        break;
      }
      idx += lineLen;
    }
    setSuggestionOpen(false);
    inputRef.current?.focus();
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {legacyCount > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
              <span>
                {legacyCount} legacy tag{legacyCount !== 1 ? "s" : ""} (name only). Migrate to &quot;Uncategorized: value&quot;.
              </span>
              <Button variant="outline" size="sm" onClick={migrateLegacy}>
                Migrate all
              </Button>
            </div>
          )}
          <div className="mb-4 flex justify-end">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add tags</DialogTitle>
                  <DialogDescription>
                    One tag per line. Use Category: Value or Parent/Category: Value. Comma-separate values per line: Color: Red,Blue
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Tags (one per line)</label>
                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        value={addInput}
                        onChange={(e) => {
                          setAddInput(e.target.value);
                          setAddCursorPos(e.target.selectionStart ?? 0);
                          setSuggestionOpen(true);
                        }}
                        onSelect={(e) => {
                          const t = e.target as HTMLTextAreaElement;
                          setAddCursorPos(t.selectionStart ?? 0);
                        }}
                        onClick={(e) => {
                          const t = e.target as HTMLTextAreaElement;
                          setAddCursorPos(t.selectionStart ?? 0);
                        }}
                        onFocus={() => addSuggestions.length > 0 && setSuggestionOpen(true)}
                        onBlur={() => setTimeout(() => setSuggestionOpen(false), 150)}
                        onKeyDown={(e) => {
                          if (!suggestionOpen || addSuggestions.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlightedIndex((i) => Math.min(i + 1, addSuggestions.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlightedIndex((i) => Math.max(i - 1, 0));
                          } else if (e.key === "Tab" && addSuggestions[highlightedIndex]) {
                            e.preventDefault();
                            applySuggestion(addSuggestions[highlightedIndex]);
                          }
                        }}
                        placeholder={"Color: Blue\nSize: Large\nApparel/Color: Red,Green"}
                        rows={6}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      {suggestionOpen && addSuggestions.length > 0 && (
                        <ul
                          ref={listRef}
                          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
                        >
                          {addSuggestions.map((s, i) => (
                            <li
                              key={s}
                              className={`cursor-pointer px-3 py-1.5 ${i === highlightedIndex ? "bg-accent" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applySuggestion(s);
                              }}
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={!addInput.trim() || !hasValidLine}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tags ?? []).map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">
                    {formatTagDisplay(tag)}
                    {isLegacyTag(tag) && (
                      <span className="ml-2 text-xs text-muted-foreground">(legacy)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tag.parent ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tag.category ?? (tag.name ? "Uncategorized" : "—")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tag.value ?? tag.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(tag)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMerge(tag.id)}>
                          <Merge className="mr-2 h-4 w-4" />
                          Merge into...
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDelete(tag)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(tags ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tags yet. Add one using Category: Value or Parent/Category: Value.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit tag</DialogTitle>
            <DialogDescription>
              Use Category: Value or Parent/Category: Value.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tag (full string)</label>
              <Input
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                placeholder="e.g. Color: Blue"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !editingTag ||
                !editInput.trim() ||
                !parseTagInput(editInput.trim()) ||
                (parseTagInput(editInput.trim())?.values.length ?? 0) !== 1
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingTag && formatTagDisplay(deletingTag)}&quot;?
              Links to exemplary assets will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge tags</DialogTitle>
            <DialogDescription>
              Merge the source tag into the target tag. All exemplary assets
              will be retagged; the source tag will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Source (to merge)</label>
              <p className="text-sm text-muted-foreground">
                {mergeSource && tags
                  ? formatTagDisplay(tags.find((t) => t.id === mergeSource)!)
                  : "—"}
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Target (merge into)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={mergeTarget ?? ""}
                onChange={(e) => setMergeTarget(e.target.value || null)}
              >
                <option value="">Select target tag</option>
                {(tags ?? [])
                  .filter((t) => t.id !== mergeSource)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatTagDisplay(t)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeSource || !mergeTarget || mergeSource === mergeTarget}
            >
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
