"use client";

import { redirect } from "next/navigation";

/**
 * Legacy route: Policy & Rules now lives at /policy.
 * Redirect so bookmarks and sidebar (if ever pointing here) work.
 */
export default function PoliciesRulesPage() {
  redirect("/policy");
}
