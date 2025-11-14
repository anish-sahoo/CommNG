import type { ReactNode } from "react";
import NavigationShell from "@/components/layouts/navigation-shell";

// Wraps every Communications route with the shared navigation chrome so the mobile drawer + broadcasts modal behave consistently.

export default function CommunicationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <NavigationShell>{children}</NavigationShell>;
}
