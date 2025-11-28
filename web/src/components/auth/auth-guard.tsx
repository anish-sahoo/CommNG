"use client";

import { usePathname, useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

const PUBLIC_ROUTES = ["/login", "/sign-up", "/forgot-password"];

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: sessionData, isPending } = authClient.useSession();
  const lastToastPath = useRef<string | null>(null);

  const isPublicRoute = useMemo(
    () =>
      PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ),
    [pathname],
  );

  const shouldRedirectToLogin = !isPublicRoute && !isPending && !sessionData;
  const shouldRedirectToApp = isPublicRoute && !isPending && !!sessionData;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      if (lastToastPath.current !== pathname) {
        toast.error("Please sign in");
        lastToastPath.current = pathname;
      }
      router.replace("/login");
    }
    if (shouldRedirectToApp) {
      router.replace("/communications");
    }
  }, [pathname, router, shouldRedirectToApp, shouldRedirectToLogin]);

  if (isPending || shouldRedirectToLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
