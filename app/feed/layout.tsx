import { SectionLayout } from "@/components/layout/SectionLayout";

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SectionLayout activeSection="feed" sectionLabel="FEED">
      {children}
    </SectionLayout>
  );
}
