"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingEmail = searchParams?.get("email") ?? undefined;

  const { data: sessionData, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sessionData) {
      router.replace("/communications");
    }
  }, [isPending, router, sessionData]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
        Create Your Account
      </h1>
      <div className="rounded-2xl border border-primary bg-white px-8 py-12 shadow-xl sm:px-12">
        <p className="text-lg text-secondary pb-6 sm:text-xl">
          Account creation is coming soon.
        </p>

        {pendingEmail ? (
          <p className="mb-6 text-base font-semibold text-secondary">
            We noticed you supplied{" "}
            <span className="text-primary">{pendingEmail}</span>. We&apos;ll
            pre-fill this when sign up is ready.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/login">
            <Button type="button" variant="outline" size="lg" className="px-10">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
