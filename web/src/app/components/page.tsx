"use client";
import { useEffect, useState } from "react";
import ListView from "@/components/list-view";
import Navigation from "@/components/navigation";
import { icons } from "@/components/icons";

const Components = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const MenuIcon = icons.menu;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileNavOpen(false);
      }
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
    <>
      <Navigation
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <main className="relative min-h-screen bg-background px-4 pb-16 pt-16 sm:px-6 lg:pl-[30rem] lg:pr-10 lg:py-12">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="absolute left-4 top-4 inline-flex items-center justify-center text-primary transition-colors hover:text-primary-dark lg:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon className="h-8 w-8" />
        </button>

        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-header font-semibold text-secondary">
                Component Library
              </h1>
              <p className="text-sm text-secondary/70">
                Responsive shells and interaction samples
              </p>
            </div>
          </div>
        </header>
      </main>
    </>
  );
};

export default Components;
