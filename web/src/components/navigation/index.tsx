"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import AppNavBar from "./app-navbar";
import CommsNavBar from "./comms-navbar";

type NavigationProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  showCommsNav?: boolean;
};

const Navigation = ({
  mobileOpen = false,
  onMobileClose,
  showCommsNav = true,
}: NavigationProps) => {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!mobileOpen) {
      previousPathnameRef.current = pathname;
      return;
    }

    if (pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname;
      onMobileClose?.();
    }
  }, [mobileOpen, onMobileClose, pathname]);

  return (
    <>
      <div className="hidden lg:block">
        <AppNavBar />
        {showCommsNav ? <CommsNavBar /> : null}
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 flex lg:hidden transition-opacity duration-300",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-secondary/70 backdrop-blur-sm transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={onMobileClose}
          aria-label="Close navigation"
        />

        <AppNavBar
          className={cn(
            "transform -translate-x-full transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        />

        {showCommsNav ? (
          <CommsNavBar
            className={cn(
              "transform -translate-x-full transition-transform duration-300 ease-out delay-75",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          />
        ) : null}
      </div>
    </>
  );
};

export default Navigation;
