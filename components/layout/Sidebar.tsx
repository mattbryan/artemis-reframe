"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layout,
  Archive,
  Palette,
  Scale,
  Tags,
  Image,
  FileText,
  Plug,
  User,
  Bug,
  Bell,
  LogOut,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReframeLogo } from "./ReframeLogo";
import { db } from "@/lib/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_GROUPS = [
  {
    label: "BUILD",
    items: [
      { href: "/workbench", label: "Workbench", icon: LayoutDashboard },
      { href: "/archive", label: "Archive", icon: Archive },
    ],
  },
  {
    label: "TRAIN",
    items: [
      { href: "/collateral-types", label: "Collateral Types", icon: Layout },
      { href: "/design-briefs", label: "Design Briefs", icon: FileText },
      { href: "/brand", label: "Brand & Philosophy", icon: Palette },
      { href: "/policy", label: "Policy & Rules", icon: Scale },
    ],
  },
  {
    label: "FEED",
    items: [
      { href: "/feed/elemental-assets", label: "Elemental Assets", icon: Image },
      { href: "/train/tag-manager", label: "Tag Manager", icon: Tags },
      { href: "/feed/proprietary-intel", label: "Proprietary Intel", icon: FileText },
      { href: "/feed/api-integrations", label: "API & Integrations", icon: Plug },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
] as const;

export const Sidebar = React.memo(function Sidebar({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = db.useAuth();

  const displayName =
    (user as { name?: string } | null)?.name ?? user?.email ?? "Account";

  const handleSignOut = () => {
    db.auth.signOut();
    router.replace("/login");
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-[width]",
        "w-[var(--sidebar-width-collapsed)] lg:w-[var(--sidebar-width)]",
        "pt-6 pb-2 px-6 gap-6",
        className
      )}
    >
      {/* Logo area - 48px height */}
      <div className="flex h-12 shrink-0 items-center">
        <ReframeLogo className="text-foreground" />
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22px] text-muted-foreground">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-8 min-w-[176px] items-center gap-6 rounded-md px-2 py-1.5 text-sm transition-colors",
                        "hover:bg-accent/50",
                        isActive
                          ? "bg-secondary text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6 shrink-0",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      />
                      <span className="truncate opacity-0 w-0 overflow-hidden lg:opacity-100 lg:w-auto">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: Profile, Bug, Notifications */}
      <div className="mt-auto flex items-end gap-0 py-2">
        <div className="flex flex-1 items-center justify-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                aria-label="Account"
              >
                <User className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="min-w-[12rem]">
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                {displayName}
              </div>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            aria-label="Bug reports"
          >
            <Bug className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive"
              aria-hidden
            />
          </button>
        </div>
      </div>
    </aside>
  );
});
