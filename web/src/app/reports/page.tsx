import Link from "next/link";
import { Button } from "@/components/ui/button";

// ReportsPage placeholder marks the future analytics hub while the backend reporting endpoints are under development.
export default function ReportsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
        Reports Dashboard
      </h1>
      <div className="rounded-3xl border-3 border-dashed border-primary bg-card px-8 py-12 shadow-sm sm:px-12">
        <p className="text-lg text-secondary pb-4 sm:text-xl">
          This page will be implemented soon.
        </p>
        <Link href="/communications">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="inline-flex items-center gap-1"
          >
            Back to Landing Page
          </Button>
        </Link>
      </div>
    </div>
  );
}
