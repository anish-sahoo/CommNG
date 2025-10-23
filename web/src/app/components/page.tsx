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
      <Navigation />
      <main className="min-h-screen bg-background px-4 pb-16 pt-20 sm:px-6 lg:pl-[21rem] lg:pr-12 lg:pt-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Components Gallery
            </p>
            <h1 className="text-header font-semibold text-secondary">
              Communication UI Patterns
            </h1>
            <p className="text-body text-secondary/70">
              Explore in-progress layouts and navigation elements. Each module
              reflects the CommNG design system tokens so updates remain
              consistent as the product evolves.
            </p>
          </header>

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
