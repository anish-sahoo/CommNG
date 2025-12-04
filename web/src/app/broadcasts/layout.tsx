import type { ReactNode } from "react";
import NavigationShell from "@/components/layouts/navigation-shell";

// Broadcasts live outside the communications section; only the app nav shows.
export default function BroadcastsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <NavigationShell showCommsNav={false}>{children}</NavigationShell>;
}
