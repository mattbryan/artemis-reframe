"use client";

import { isAuthenticated } from "@/lib/auth-stub";

/**
 * Route guard stub. Checks isAuthenticated and redirects if needed.
 * No real auth UI yet — placeholder for future implementation.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    // Future: redirect to /login
    return null;
  }
  return <>{children}</>;
}
