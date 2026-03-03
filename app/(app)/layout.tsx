import { Sidebar } from "@/components/layout/Sidebar";
import { RouteGuard } from "@/components/layout/RouteGuard";

/**
 * Authenticated app shell. All routes under (app) require auth;
 * RouteGuard redirects to /login when user is null.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </RouteGuard>
  );
}
