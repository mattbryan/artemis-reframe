"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/db";

/**
 * Route guard for authenticated routes. Uses InstantDB auth.
 * If loading: render nothing. If no user: redirect to /login with current path as redirect param. Otherwise render children.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user == null) {
      const loginUrl =
        pathname && pathname !== "/login"
          ? `/login?redirect=${encodeURIComponent(pathname)}`
          : "/login";
      router.replace(loginUrl);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return null;
  }

  if (user == null) {
    return null;
  }

  return <>{children}</>;
}
