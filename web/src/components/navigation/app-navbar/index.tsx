"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "@/components/icons";
import { cn } from "@/lib/utils";

type NavItem = {
  id: number;
  label: string;
  href: string;
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
}: {
  item: NavItem;
  isActive: boolean;
}) => {
  const Icon = icons[item.icon];

  return (
    <li>
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex h-16 w-16 items-center justify-center rounded-3xl transition-all duration-300
          ${
            isActive
              ? "bg-accent ring-3 ring-background scale-105"
              : "bg-primary-dark hover:bg-accent"
          }`}
      >
        <Icon className="h-7 w-7 text-background" />
      </Link>
    </li>
  );
};

type AppNavBarProps = {
  className?: string;
};

export const AppNavBar = ({ className }: AppNavBarProps = {}) => {
  const pathname = usePathname();
  const ProfileIcon = icons.user;

  return (
    <nav
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-24 flex-col items-center bg-primary px-3 py-6 shadow-lg shadow-black/20",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center">
        <Image
          src="/favicon_yellow.svg"
          alt="CommNG app switcher logo"
          width={52}
          height={52}
          className="h-12 w-12"
          priority
        />
      </div>

      <ul className="mt-10 flex flex-col items-center gap-6">
        {navItems.map((item) => (
          <AppNavBarItem
            key={item.id}
            item={item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </ul>

      <div className="mt-auto flex h-16 w-full items-end justify-center pb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-accent text-primary">
          <ProfileIcon className="h-6 w-6" strokeWidth={2} />
        </div>
      </div>
    </nav>
  );
};

export default AppNavBar;
