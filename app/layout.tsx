import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RouteGuard } from "@/components/layout/RouteGuard";

export const metadata: Metadata = {
  title: "Artemis Reframe",
  description: "Brand governance platform for AI-generated content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          <RouteGuard>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </RouteGuard>
        </QueryProvider>
      </body>
    </html>
  );
}
