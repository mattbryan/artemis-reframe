import { SectionLayout } from "@/components/layout/SectionLayout";

export default function TrainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SectionLayout activeSection="train" sectionLabel="TRAIN">
      {children}
    </SectionLayout>
  );
}
