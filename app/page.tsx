import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-foreground">Artemis Reframe</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Brand governance platform for AI-generated content. Align and govern
        content created by generative AI to your specific brand.
      </p>
      <Button asChild>
        <Link href="/workbench">Open Workbench</Link>
      </Button>
    </div>
  );
}
