import type { ReactNode } from "react";
import NavigationShell from "@/components/layouts/navigation-shell";

export default function CommunicationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <NavigationShell>{children}</NavigationShell>;
}
