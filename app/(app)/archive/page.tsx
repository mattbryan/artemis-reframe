"use client";

/**
 * BUILD: Historical content store with search and filtering.
 *
 * Purpose: Browse, search, and filter previously generated content.
 * Changelog entries link to assets (exemplary, elemental, proprietary).
 * Supports version history and re-use of past deliverables.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { formatTargetType, OUTPUT_TARGET_BADGE_CLASS } from "@/lib/collateralTypeUtils";
import { Input } from "@/components/ui/input";
import type { ProjectOutputApprovalStatus } from "@/types/project";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

type SortKey = "name" | "targetType" | "approvalStatus" | "createdAt";

const APPROVAL_BADGE_CLASS: Record<string, string> = {
  approved: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  not_approved: "bg-muted text-muted-foreground",
};

interface NormalizedRow {
  id: string;
  projectId: string;
  projectName: string;
  targetType: string;
  approvalStatus: ProjectOutputApprovalStatus | undefined;
  createdAt: number;
  createdByName?: string;
  createdByEmail?: string;
}

function normalizeProjectName(project: unknown): string {
  if (project === undefined || project === null) return "";
  const list = Array.isArray(project)
    ? (project as Record<string, unknown>[])
    : [project as Record<string, unknown>];
  const row = list[0];
  if (!row || typeof row !== "object") return "";
  const name = (row as Record<string, unknown>).name;
  return typeof name === "string" ? name : "";
}

function normalizeArchiveRows(data: unknown): NormalizedRow[] {
  const raw = (data as { projectOutput?: unknown })?.projectOutput;
  if (raw === undefined || raw === null) return [];
  const list = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : Object.entries(raw as Record<string, unknown>).map(([id, v]) => ({
        ...(typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}),
        id,
      }));
  const result: NormalizedRow[] = [];
  for (const r of list) {
    const rec = r as Record<string, unknown>;
    const id = (rec.id as string) ?? String(rec.id);
    if (!id) continue;
    const status = rec.status as string | undefined;
    if (status === "failed") continue;
    const project = rec.project as Record<string, unknown> | undefined;
    const projectName = normalizeProjectName(project);
    const projectId = (rec.projectId as string) ?? "";
    const targetType = (rec.targetType as string) ?? "";
    const rawApproval = rec.approvalStatus;
    const approvalStatus =
      rawApproval === "approved" || rawApproval === "not_approved"
        ? (rawApproval as ProjectOutputApprovalStatus)
        : undefined;
    const createdAt = typeof rec.createdAt === "number" ? rec.createdAt : 0;
    const createdByName =
      project && typeof project.createdByName === "string"
        ? project.createdByName
        : undefined;
    const createdByEmail =
      project && typeof project.createdByEmail === "string"
        ? project.createdByEmail
        : undefined;
    result.push({
      id,
      projectId,
      projectName,
      targetType,
      approvalStatus,
      createdAt,
      createdByName,
      createdByEmail,
    });
  }
  return result;
}

export default function ArchivePage() {
  const { data } = db.useQuery({
    projectOutput: {
      project: {},
    },
  });

  const [search, setSearch] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allRows = useMemo(() => normalizeArchiveRows(data), [data]);
  const distinctTargetTypes = useMemo(() => {
    const set = new Set(allRows.map((r) => r.targetType).filter(Boolean));
    return Array.from(set).sort();
  }, [allRows]);

  const filteredRows = useMemo(() => {
    let list = allRows;
    const searchLower = search.trim().toLowerCase();
    if (searchLower) {
      list = list.filter((r) => r.projectName.toLowerCase().includes(searchLower));
    }
    if (targetTypeFilter) {
      list = list.filter((r) => r.targetType === targetTypeFilter);
    }
    if (approvalFilter === "approved") {
      list = list.filter((r) => r.approvalStatus === "approved");
    } else if (approvalFilter === "not_approved") {
      list = list.filter((r) => r.approvalStatus === "not_approved");
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      const effectiveApproval = (row: NormalizedRow) =>
        row.approvalStatus === "approved" ? "approved" : "not_approved";
      switch (sortKey) {
        case "name":
          cmp = a.projectName.localeCompare(b.projectName);
          break;
        case "targetType": {
          cmp = formatTargetType(a.targetType).localeCompare(formatTargetType(b.targetType));
          break;
        }
        case "approvalStatus":
          cmp = effectiveApproval(a).localeCompare(effectiveApproval(b));
          break;
        case "createdAt":
        default:
          cmp = a.createdAt - b.createdAt;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allRows, search, targetTypeFilter, approvalFilter, sortKey, sortDir]);

  const hasActiveFilters =
    search.trim() !== "" || targetTypeFilter !== "" || approvalFilter !== "";
  const clearFilters = () => {
    setSearch("");
    setTargetTypeFilter("");
    setApprovalFilter("");
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const isLoading = data === undefined;
  const totalCount = allRows.length;
  const visibleCount = filteredRows.length;
  const showEmptyNoData = !isLoading && totalCount === 0;
  const showEmptyNoResults = !isLoading && totalCount > 0 && visibleCount === 0;

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Archive</h1>
        <p className="text-muted-foreground">
          Historical content store. Search and filter past deliverables and
          version history.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by project name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64"
        />
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <option value="">All output targets</option>
          {distinctTargetTypes.map((tt) => (
            <option key={tt} value={tt}>
              {formatTargetType(tt)}
            </option>
          ))}
        </select>
        <select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="not_approved">Not approved</option>
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Name
                  {sortKey === "name" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Creator
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                <button
                  type="button"
                  onClick={() => handleSort("targetType")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Output Target
                  {sortKey === "targetType" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                <button
                  type="button"
                  onClick={() => handleSort("approvalStatus")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Approval Status
                  {sortKey === "approvalStatus" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Generated
                  {sortKey === "createdAt" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-b border-border last:border-0">
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            )}
            {showEmptyNoData && (
              <tr className="border-b border-border last:border-0">
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No generated outputs yet. Run the Workbench to generate content.
                </td>
              </tr>
            )}
            {showEmptyNoResults && (
              <tr className="border-b border-border last:border-0">
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No results match your filters.
                </td>
              </tr>
            )}
            {!isLoading && visibleCount > 0 &&
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/workbench/${row.projectId}/${encodeURIComponent(row.targetType)}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {row.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {row.createdByName ?? row.createdByEmail ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                        OUTPUT_TARGET_BADGE_CLASS[row.targetType] ??
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {formatTargetType(row.targetType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                        row.approvalStatus === "approved"
                          ? APPROVAL_BADGE_CLASS.approved
                          : APPROVAL_BADGE_CLASS.not_approved
                      )}
                    >
                      {row.approvalStatus === "approved"
                        ? "Approved"
                        : "Not approved"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && visibleCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {visibleCount} of {totalCount} outputs
        </p>
      )}
    </div>
  );
}
