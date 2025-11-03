import type { ReactNode } from "react";
import NavigationShell from "@/components/layouts/navigation-shell";

export default function MentorshipLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <NavigationShell showCommsNav={false}>{children}</NavigationShell>;
}
