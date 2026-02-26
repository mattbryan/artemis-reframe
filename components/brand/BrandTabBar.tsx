"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "identity", label: "Identity", href: "/brand/identity" },
  { id: "voice", label: "Voice", href: "/brand/voice" },
  { id: "visual", label: "Visual", href: "/brand/visual" },
  { id: "audience", label: "Audience", href: "/brand/audience" },
] as const;

export function BrandTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 gap-0 border-b border-border bg-card px-6"
      role="tablist"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
