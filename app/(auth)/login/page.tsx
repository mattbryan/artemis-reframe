"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { ReframeLogo } from "@/components/layout/ReframeLogo";
import { Button } from "@/components/ui/button";

/** Google client name as configured in the InstantDB dashboard Auth tab. */
const GOOGLE_CLIENT_NAME = "google";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectToRaw = searchParams.get("redirect") ?? "/workbench";
  const redirectTo =
    typeof redirectToRaw === "string" && redirectToRaw.startsWith("/")
      ? redirectToRaw
      : "/workbench";
  const errorParam = searchParams.get("error");

  const { user, isLoading, error } = db.useAuth();
  const [isPending, setIsPending] = useState(false);
  const [originHint, setOriginHint] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin.startsWith("http://localhost")) {
      setOriginHint(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  const handleSignIn = () => {
    setIsPending(true);
    const redirectURL = typeof window !== "undefined" ? window.location.href : "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = db.auth.createAuthorizationURL({
      clientName: GOOGLE_CLIENT_NAME,
      redirectURL,
    });
    if (url && typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  if (isLoading) {
    return null;
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">
          <ReframeLogo className="mb-6 h-10 text-foreground" />
        </div>
        <h1 className="text-center text-lg font-semibold text-foreground">
          Artemis Reframe
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Sign in to continue
        </p>
        <Button
          type="button"
          onClick={handleSignIn}
          className="mt-6 w-full"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Sign in with Google"}
        </Button>
        {error && (
          <p className="mt-3 text-center text-sm text-destructive">
            {error?.message ?? "Sign-in failed. Please try again."}
          </p>
        )}
        {errorParam === "domain" && (
          <p className="mt-3 text-center text-sm text-destructive">
            This app is restricted to matthews.com accounts. Please sign in with your matthews.com Google account.
          </p>
        )}
        {originHint && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            If you get a 400 error, add{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              {originHint}
            </code>{" "}
            to InstantDB Dashboard → Auth → Redirect Origins.
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
