"use client";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "@/components/icons";
import { Protected } from "@/components/rbac/Protected";
import { cn } from "@/lib/utils";

type NavItem = {
  id: number;
  label: string;
  href: Route;
  icon: keyof typeof icons;
};

const navItems: NavItem[] = [
  {
    id: 1,
    label: "Communications",
    href: "/communications",
    icon: "communications",
  },
  { id: 2, label: "Mentorship", href: "/mentorship", icon: "mentorship" },
  { id: 3, label: "Reports", href: "/reports", icon: "reports" },
];

const AppNavBarItem = ({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) => {
  const Icon = icons[item.icon];

  return (
    <li>
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
        className={`group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl transition-all duration-300
          ${
            isActive
              ? "bg-accent ring-3 ring-background scale-105"
              : "bg-primary-dark hover:bg-accent"
          } group-hover:-translate-y-2`}
      >
        <Icon className="h-7 w-7 text-background" />
        <span
          className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary opacity-0 shadow-lg shadow-black/20 ring-1 ring-border transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-1 z-50"
          role="presentation"
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
};

type AppNavBarProps = {
  className?: string;
  onNavigate?: () => void;
};

export const AppNavBar = ({ className, onNavigate }: AppNavBarProps = {}) => {
  const pathname = usePathname();
  const ProfileIcon = icons.user;
  const HelpIcon = icons.help;
  const BellIcon = icons.bell;
  const MegaphoneIcon = icons.announce;
  const AdminIcon = icons.admin;
  const isProfileActive = pathname.startsWith("/profile");
  const isHelpActive = pathname.startsWith("/help-page");
  const isAdminActive = pathname.startsWith("/admin");
  const isBroadcastsActive = pathname.startsWith("/broadcasts");
  const isCreateBroadcastActive = pathname.startsWith("/broadcasts/new");

  const circleButtonClasses =
    "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 overflow-visible";

  return (
    <nav
      className={cn(
        // Dynamic viewport height; only the action buttons scroll so top icons stay fixed.
        "fixed inset-y-0 left-0 z-40 flex w-24 max-h-[100dvh] flex-col items-center overflow-visible bg-primary px-3 py-6 shadow-lg shadow-black/20",
        className,
      )}
    >
      <div className="flex w-full flex-col items-center">
        <Link
          href="/communications"
          aria-label="Go to My Channels"
          onClick={onNavigate}
          className="flex h-16 w-16 items-center justify-center rounded-3xl transition-transform hover:scale-110"
        >
          <Image
            src="/icons/favicon_yellow.svg"
            alt="CommNG app switcher logo"
            width={52}
            height={52}
            className="h-12 w-12"
            priority
          />
        </Link>

        <ul className="mt-10 flex flex-col items-center gap-6">
          {navItems.map((item) => (
            <AppNavBarItem
              key={item.id}
              item={item}
              isActive={pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>

      <div className="mt-8 flex w-full flex-1 min-h-0 flex-col items-center overflow-visible">
        <div className="mt-auto flex w-full flex-col items-center gap-3 overflow-visible pb-6 md:pb-10">
          <Protected requiredRole="broadcast:create">
            <Link
              href="/broadcasts/new"
              aria-label="Create broadcast"
              aria-current={isCreateBroadcastActive ? "page" : undefined}
              className={cn(
                circleButtonClasses,
                isCreateBroadcastActive
                  ? "border-accent bg-accent text-primary"
                  : "border-primary bg-accent text-primary hover:bg-primary-dark hover:text-background",
              )}
              onClick={onNavigate}
            >
              <MegaphoneIcon className="h-6 w-6" aria-hidden="true" />
              <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary opacity-0 shadow-lg shadow-black/20 ring-1 ring-border transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-1 z-50">
                Broadcast
              </span>
            </Link>
          </Protected>

          <Link
            href="/broadcasts"
            aria-label="Active broadcasts"
            aria-current={isBroadcastsActive ? "page" : undefined}
            className={cn(
              circleButtonClasses,
              isBroadcastsActive
                ? "border-accent bg-accent text-primary"
                : "border-primary bg-accent text-primary hover:bg-primary-dark hover:text-background",
            )}
            onClick={onNavigate}
          >
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary opacity-0 shadow-lg shadow-black/20 ring-1 ring-border transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-1 z-50">
              Active Broadcasts
            </span>
          </Link>

          <Link
            href="/help-page"
            aria-label="Help"
            className={cn(
              circleButtonClasses,
              isHelpActive
                ? "border-accent bg-accent text-primary"
                : "border-primary bg-accent text-primary hover:bg-primary-dark hover:text-background",
            )}
            onClick={onNavigate}
          >
            <HelpIcon className="h-6 w-6" />
            <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary opacity-0 shadow-lg shadow-black/20 ring-1 ring-border transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-1 z-50">
              Help
            </span>
          </Link>

          <Protected requiredRole="global:create-invite">
            <Link
              href="/admin"
              aria-label="Admin"
              aria-current={isAdminActive ? "page" : undefined}
              className={cn(
                circleButtonClasses,
                isAdminActive
                  ? "border-accent bg-accent text-primary"
                  : "border-primary bg-accent text-primary hover:bg-primary-dark hover:text-background",
              )}
              onClick={onNavigate}
            >
              <AdminIcon className="h-6 w-6" />
              <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary opacity-0 shadow-lg shadow-black/20 ring-1 ring-border transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-1 z-50">
                Admin
              </span>
            </Link>
          </Protected>

          <Link
            href="/profile"
            aria-label="Profile"
            aria-current={isProfileActive ? "page" : undefined}
            className={cn(
              circleButtonClasses,
              isProfileActive
                ? "border-accent bg-accent text-primary"
                : "border-primary bg-accent text-primary hover:bg-primary-dark hover:text-background",
            )}
            onClick={onNavigate}
          >
            <ProfileIcon className="h-6 w-6" strokeWidth={2} />
            <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary opacity-0 shadow-lg shadow-black/20 ring-1 ring-border transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-1 z-50">
              Profile
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AppNavBar;
