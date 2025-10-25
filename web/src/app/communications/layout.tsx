"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { icons } from "@/components/icons";
import Navigation from "@/components/navigation";

export default function CommunicationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const MenuIcon = icons.menu;

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col px-4 pb-10 pt-16 sm:px-5 md:px-6 lg:ml-[21rem] lg:pl-0 lg:pr-10 lg:pt-16">
        <div className="mb-4 flex justify-start lg:hidden">
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
    </div>
  );
}
