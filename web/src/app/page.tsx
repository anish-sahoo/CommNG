"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sessionData) {
      router.replace("/communications");
    } else {
      router.replace("/login");
    }
  }, [isPending, router, sessionData]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}
