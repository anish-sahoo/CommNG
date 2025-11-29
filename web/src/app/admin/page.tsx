"use client";

import type { RoleKey } from "@server/data/roles";
import { ShieldCheck, UserPlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import NavigationShell from "@/components/layouts/navigation-shell";
import { TitleShell } from "@/components/layouts/title-shell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserRoles } from "@/hooks/useUserRoles";
import { hasAnyRole, hasRole } from "@/lib/rbac";

type AdminFeature = {
  id: string;
  title: string;
  description: string;
  href: Route;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole: RoleKey;
};

const adminFeatures: AdminFeature[] = [
  {
    id: "invites",
    title: "Invite Codes",
    description:
      "Create and manage invite codes to grant permissions to new users. Configure role presets and customize access levels.",
    href: "/admin/invites",
    icon: UserPlus,
    requiredRole: "global:create-invite",
  },
];

export default function AdminPage() {
  const { roles } = useUserRoles();

  if (!roles) {
    return <AuthGuard></AuthGuard>;
  }

  const hasAdminAccess = hasAnyRole(roles, [
    "global:admin",
    "global:create-invite",
  ]);

  if (!hasAdminAccess) {
    return (
      <AuthGuard>
        <NavigationShell showCommsNav={false}>
          <TitleShell
            title="Access Denied"
            backHref="/communications"
            backAriaLabel="Back to communications"
          >
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-800">
                You do not have permission to access admin features. Admin
                access requires special permissions.
              </p>
            </div>
          </TitleShell>
        </NavigationShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <NavigationShell showCommsNav={false}>
        <TitleShell
          title="Admin Dashboard"
          backHref="/communications"
          backAriaLabel="Back to communications"
        >
          <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <ShieldCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-blue-900">
                  Administration Tools
                </h2>
                <p className="mt-1 text-sm text-blue-800">
                  Manage system configuration, user access, and administrative
                  functions. These tools require elevated permissions.
                </p>
              </div>
            </div>

            {/* Admin Features Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {adminFeatures.map((feature) => {
                const Icon = feature.icon;
                const hasPermission = hasRole(roles, feature.requiredRole);

                if (!hasPermission) {
                  return null;
                }

                return (
                  <Link key={feature.id} href={feature.href}>
                    <Card className="transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">
                            {feature.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="mt-2">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Empty State */}
            {adminFeatures.filter((f) => hasRole(roles, f.requiredRole))
              .length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-600">
                  No admin features available for your permission level.
                </p>
              </div>
            )}
          </div>
        </TitleShell>
      </NavigationShell>
    </AuthGuard>
  );
}
