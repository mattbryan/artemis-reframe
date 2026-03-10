 "use client";

import { useEffect, useMemo, useRef } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { UserProfile } from "@/types/user";

export function useEnsureUserProfile(): {
  profile: UserProfile | null;
  isLoading: boolean;
} {
  const { user, isLoading: authLoading } = db.useAuth();

  const userEmail = user?.email ?? null;

  const { data: profileQueryResult } = db.useQuery(
    userEmail
      ? {
          userProfile: {
            $: {
              where: {
                email: userEmail,
              },
            },
          },
        }
      : null
  );

  const isQueryLoading = !profileQueryResult && !!userEmail;

  const profile = useMemo<UserProfile | null>(() => {
    if (!profileQueryResult || !profileQueryResult.userProfile) return null;
    const arr = profileQueryResult.userProfile;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const raw = arr[0] as any;
    return {
      id: raw.id,
      email: raw.email,
      name: raw.name ?? undefined,
      role: raw.role,
      createdAt: raw.createdAt,
      lastSeenAt: raw.lastSeenAt,
    };
  }, [profileQueryResult]);

  useEffect(() => {
    if (!userEmail || !profileQueryResult) return;

    const now = Date.now();

    if (!profile) {
      db.transact(
        db.tx.userProfile[id()].update({
          email: userEmail,
          name: (user as { name?: string }).name ?? userEmail,
          role: "admin",
          createdAt: now,
          lastSeenAt: now,
        })
      );
      return;
    }

    db.transact(
      db.tx.userProfile[profile.id].update({
        lastSeenAt: now,
      })
    );
  }, [userEmail, profileQueryResult, profile]);

  return {
    profile,
    isLoading: authLoading || isQueryLoading,
  };
}

