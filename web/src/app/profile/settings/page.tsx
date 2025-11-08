"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { ChannelShell } from "../../communications/components";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const res = await authClient.signOut();

    if (res.error) {
      toast.error(res.error.message ?? "Unable to sign out right now.");
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
  };
  const ArrowLeftIcon = icons.arrowLeft;

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/profile"
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to Profile"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Profile Settings
          </span>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary">
          This page is under construction
        </h2>
        <p className="mt-2 text-secondary/80">
          We&apos;re adding more ways for you to manage your profile soon. In
          the meantime, you can still sign out below if you need to switch
          accounts.
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          className="inline-flex items-center gap-2 px-6"
          disabled={isSigningOut}
          onClick={handleSignOut}
          aria-label="Log out of your account"
        >
          {isSigningOut && <Spinner />}
          Log out
        </Button>
      </div>
    </ChannelShell>
  );
}
