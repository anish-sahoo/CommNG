"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TitleShell } from "@/components/layouts/title-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

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
  return (
    <TitleShell
      title="Profile Settings"
      backHref="/profile"
      backAriaLabel="Back to profile"
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
    </TitleShell>
  );
}
