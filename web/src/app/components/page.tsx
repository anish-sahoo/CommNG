"use client";
import { useEffect, useState } from "react";
import { SelectableButton } from "@/components/buttons";
import { icons } from "@/components/icons";
import ListView from "@/components/list-view";
import Navigation from "@/components/navigation";

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
      <main className="min-h-screen bg-background px-4 pb-16 pt-20 sm:px-6 lg:pl-[21rem] lg:pr-12 lg:pt-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
          <div className="flex justify-start lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-transparent px-3 py-2 text-primary transition hover:text-primary focus-visible:outline-none"
              aria-label="Open navigation"
            >
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Components Gallery
            </p>
            <h1 className="text-header font-semibold text-secondary">
              Communication UI Patterns
            </h1>
          </header>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Button Component
              </h2>
            </div>
            <SelectableButton text="Button" />
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-subheader font-semibold text-secondary">
                Member List View
              </h2>
            </div>
            <ListView />
          </section>
        </div>
      </main>
    </>
  );
};

export default Components;
