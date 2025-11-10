"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

type NavigationShellContextValue = {
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  registerTrigger: () => () => void;
};

const NavigationShellContext =
  createContext<NavigationShellContextValue | null>(null);

export const useNavigationShellControls = () =>
  useContext(NavigationShellContext);

type MobileNavTriggerProps = {
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
};

const MenuIcon = icons.menu;

export function MobileNavTrigger({
  className,
  iconClassName,
  ariaLabel = "Open navigation",
}: MobileNavTriggerProps) {
  const controls = useNavigationShellControls();

  useEffect(() => {
    if (!controls) {
      return;
    }
    const unregister = controls.registerTrigger();
    return unregister;
  }, [controls]);

  if (!controls) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={controls.openMobileNav}
      className={cn(
        "inline-flex items-center justify-center text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden",
        className,
      )}
      aria-label={ariaLabel}
    >
      <MenuIcon className={cn("h-8 w-8", iconClassName)} aria-hidden="true" />
    </button>
  );
}

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

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(
    () => setMobileNavOpen((previous) => !previous),
    [],
  );

  const [customTriggerCount, setCustomTriggerCount] = useState(0);
  const registerTrigger = useCallback(() => {
    setCustomTriggerCount((count) => count + 1);
    return () => setCustomTriggerCount((count) => Math.max(0, count - 1));
  }, []);
  const hasCustomTrigger = customTriggerCount > 0;

  const navigationContextValue = useMemo(
    () => ({
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
      registerTrigger,
    }),
    [openMobileNav, closeMobileNav, toggleMobileNav, registerTrigger],
  );

  return (
    <NavigationShellContext.Provider value={navigationContextValue}>
      <div className="min-h-screen bg-background">
        <Navigation
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          showCommsNav={showCommsNav}
        />
        {!hasCustomTrigger ? (
          <button
            type="button"
            onClick={openMobileNav}
            className="fixed left-4 top-5 z-40 inline-flex items-center justify-center text-primary lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-8 w-8" aria-hidden="true" />
          </button>
        ) : null}
        <div
          className={cn(
            "flex flex-1 flex-col px-4 py-10 sm:px-5 md:px-6 lg:pr-10 lg:pt-16",
            desktopOffsetClass,
            desktopPaddingClass,
          )}
        >
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
    </NavigationShellContext.Provider>
  );
};

export default NavigationShell;
