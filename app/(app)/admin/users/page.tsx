"use client";

import { useMemo } from "react";
import { db } from "@/lib/db";
import type { UserProfile, UserRole } from "@/types/user";
import { updateUserRole } from "@/lib/mutations/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "just now";
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return days === 1 ? "1 day ago" : `${days} days ago`;
  if (hours > 0) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  if (minutes > 0) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  return "just now";
}

export default function AdminUsersPage() {
  const { user } = db.useAuth();
  const { data: queryResult } = db.useQuery({ userProfile: {} });

  const profiles = useMemo<UserProfile[]>(() => {
    const raw = queryResult?.userProfile ?? [];
    const arr = Array.isArray(raw)
      ? raw
      : (Object.values(raw) as any[]);
    return arr
      .map((item: any) => ({
        id: item.id as string,
        email: item.email as string,
        name: (item.name as string | undefined) ?? undefined,
        role: item.role as UserRole,
        createdAt: item.createdAt as number,
        lastSeenAt: item.lastSeenAt as number,
      }))
      .sort((a, b) => {
        const nameA = (a.name || a.email).toLowerCase();
        const nameB = (b.name || b.email).toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
      });
  }, [queryResult]);

  const isLoading = !queryResult;

  const currentUserEmail = user?.email ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage team members and their roles.
        </p>
      </header>

      <div className="flex-1 rounded-lg border border-border bg-card p-4">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-52 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : profiles.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
            No users yet. Users appear here once they sign in for the first time.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const isCurrentUser = currentUserEmail === profile.email;
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.name || profile.email}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {profile.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {profile.role === "admin" ? "Admin" : "Editor"}{" "}
                          <span className="text-[11px] uppercase tracking-wide">
                            (you)
                          </span>
                        </span>
                      ) : (
                        <select
                          className="h-8 rounded border border-input bg-background px-2 text-sm"
                          value={profile.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as UserRole;
                            if (newRole !== profile.role) {
                              await updateUserRole(profile.id, newRole);
                            }
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(profile.lastSeenAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

