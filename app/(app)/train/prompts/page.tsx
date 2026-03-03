/**
 * TRAIN: Prompts → Design Briefs.
 * Redirects to the Design Briefs feature.
 */

import { redirect } from "next/navigation";

export default function PromptsPage() {
  redirect("/design-briefs");
}
