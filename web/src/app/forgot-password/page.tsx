"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="pointer-events-none absolute -left-32 top-24 h-[360px] w-[360px] rounded-full bg-yellow-200 opacity-70 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[520px] w-[520px] rounded-full bg-blue-200 opacity-70 blur-[160px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center sm:px-10">
        <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
          Reset Your Password
        </h1>

        <div className="w-full max-w-lg rounded-2xl border border-primary bg-white px-8 py-10 text-left shadow-xl sm:px-12 sm:py-12">
          <p className="text-secondary mb-6 text-base sm:text-lg">
            Password resets are coming soon.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
            className="flex flex-col gap-6"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-secondary"
              >
                Email address
              </label>
              <TextInput
                id="email"
                name="email"
                placeholder="you@example.com"
                className="w-full"
              />
            </div>
            <div className="mt-4 flex flex-col items-center gap-4">
              <Button type="submit" variant="outline" className="px-8">
                Send Reset Link
              </Button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-end gap-4">
            <Link href="/login">
              <Button type="button" variant="link" className="px-0">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
