"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

function SignUpContent() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const trpcClient = useTRPCClient();

  const { data: sessionData, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sessionData) {
      router.replace("/communications");
    }
  }, [isPending, router, sessionData]);

  const normalizedInviteCode = useMemo(
    () => inviteCode.trim().toUpperCase(),
    [inviteCode],
  );

  const handleContinue = async () => {
    if (!normalizedInviteCode) {
      return;
    }

    try {
      setIsValidating(true);

      await trpcClient.inviteCodes.validateInviteCode.query({
        code: normalizedInviteCode,
      });

      const params = new URLSearchParams();
      params.set("inviteCode", normalizedInviteCode);

      router.push(`/login/create-account?${params.toString()}`);
    } catch (error) {
      console.error("Failed to validate invite code", error);
      toast.error(
        "We couldn't validate that invite code. Please double-check and try again.",
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
        Create Your Account
      </h1>
      <div className="rounded-2xl border border-primary bg-white px-8 py-12 shadow-xl sm:px-12">
        <p className="text-lg text-secondary pb-6 sm:text-xl">
          To create your account, enter your invite code below.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 text-left">
              <label
                htmlFor="invite-code"
                className="block text-sm font-medium text-secondary"
              >
                Invite Code
              </label>
              <TextInput
                id="invite-code"
                name="inviteCode"
                placeholder="Enter your invite code"
                value={inviteCode}
                onChange={setInviteCode}
                className="mt-2 w-full"
              />
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto px-8"
              disabled={!normalizedInviteCode || isValidating}
              onClick={() => {
                void handleContinue();
              }}
            >
              {isValidating && <Spinner />}
              Continue
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
