"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function ProfilePage() {
  const router = useRouter();
  const { data: sessionData } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const placeholderName = sessionData?.user.name ?? "Staff Sgt. Placeholder";
  const placeholderEmail =
    sessionData?.user.email ?? "placeholder@manationalguard.mil";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
        My Profile
      </h1>
      <div className="rounded-3xl border-3 border-dashed border-primary bg-card px-8 py-12 shadow-sm sm:px-12">
        <p className="text-lg text-secondary pb-4 sm:text-xl">
          Profile management content will appear here soon.
        </p>

        <div className="space-y-2 pb-8 text-base sm:text-lg">
          <p className="font-semibold text-secondary text-left">
            Name: <span className="font-normal">{placeholderName}</span>
          </p>
          <p className="font-semibold text-secondary text-left">
            Email: <span className="font-normal">{placeholderEmail}</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="inline-flex items-center gap-2"
            disabled={isSigningOut}
            onClick={async () => {
              setIsSigningOut(true);
              const res = await authClient.signOut();

              if (res.error) {
                toast.error(
                  res.error.message ?? "Unable to sign out right now.",
                );
                setIsSigningOut(false);
                return;
              }

              router.replace("/login");
            }}
          >
            {isSigningOut && <Spinner />}
            Log out
          </Button>

          <Link href="/communications">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="inline-flex items-center gap-1"
            >
              Back to Communications
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
