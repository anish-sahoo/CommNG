"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { icons } from "@/components/icons";
import { BroadcastModal } from "@/components/modal";
import Navigation from "@/components/navigation";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type NavigationShellProps = {
  children: ReactNode;
  showCommsNav?: boolean;
};

const MenuIcon = icons.menu;

const NavigationShell = ({
  children,
  showCommsNav = true,
}: NavigationShellProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [acknowledgedBlastIds, setAcknowledgedBlastIds] = useState<number[]>(
    [],
  );
  const [acksHydrated, setAcksHydrated] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const { data: sessionData } = authClient.useSession();

  const trpc = useTRPC();
  const { data: activeBroadcasts } = useQuery(
    trpc.messageBlasts.getActiveMessageBlastsForUser.queryOptions(),
  );

  const userId = sessionData?.user?.id;
  const storageKey = userId ? `commng:broadcast-acks:${userId}` : null;
  const displayableBroadcasts = useMemo(() => {
    if (!activeBroadcasts || activeBroadcasts.length === 0) {
      return [];
    }
    if (!userId) {
      return activeBroadcasts;
    }
    return activeBroadcasts.filter((blast) => blast.senderId !== userId);
  }, [activeBroadcasts, userId]);

  const nextBroadcast = useMemo(() => {
    if (!displayableBroadcasts.length) {
      return null;
    }
    return (
      displayableBroadcasts.find(
        (blast) => !acknowledgedBlastIds.includes(blast.blastId),
      ) ?? null
    );
  }, [displayableBroadcasts, acknowledgedBlastIds]);

  useEffect(() => {
    if (!storageKey) {
      setAcknowledgedBlastIds([]);
      setAcksHydrated(true);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0);
          setAcknowledgedBlastIds(normalized);
        } else {
          setAcknowledgedBlastIds([]);
        }
      } else {
        setAcknowledgedBlastIds([]);
      }
    } catch (error) {
      console.error(
        "Failed to read acknowledged broadcasts from storage",
        error,
      );
      setAcknowledgedBlastIds([]);
    } finally {
      setAcksHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !acksHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(acknowledgedBlastIds),
      );
    } catch (error) {
      console.error("Failed to persist acknowledged broadcasts", error);
    }
  }, [acknowledgedBlastIds, acksHydrated, storageKey]);

  useEffect(() => {
    if (nextBroadcast) {
      setBroadcastModalOpen(true);
    } else {
      setBroadcastModalOpen(false);
    }
  }, [nextBroadcast]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const desktopOffsetClass = showCommsNav ? "lg:ml-[21rem]" : "lg:ml-24";
  const desktopPaddingClass = showCommsNav ? "lg:pl-10" : "lg:pl-8";

  const handleAcknowledge = () => {
    if (!nextBroadcast) {
      return;
    }

    setAcknowledgedBlastIds((previous) =>
      previous.includes(nextBroadcast.blastId)
        ? previous
        : [...previous, nextBroadcast.blastId],
    );
    setBroadcastModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        showCommsNav={showCommsNav}
      />
      <div
        className={cn(
          "flex flex-1 flex-col px-4 py-10 sm:px-5 md:px-6 lg:pr-10 lg:pt-16",
          desktopOffsetClass,
          desktopPaddingClass,
        )}
      >
        <div className="mb-4 flex items-center justify-start lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-transparent px-3 py-2 text-primary transition hover:text-primary"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </div>
      {nextBroadcast ? (
        <BroadcastModal
          open={broadcastModalOpen}
          onOpenChange={setBroadcastModalOpen}
          title={nextBroadcast.title}
          message={nextBroadcast.content}
          onAcknowledge={handleAcknowledge}
        />
      ) : null}
    </div>
  );
};

export default NavigationShell;
