import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth/auth-guard";
import NotificationSubscriber from "@/components/providers/notification-subscriber";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "GuardConnect",
  description:
    "A Communications and Mentorship Platform for the Massachusetts National Guard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(openSans.variable, "antialiased h-full")}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body className="min-h-screen w-full max-w-full overflow-x-hidden">
        <QueryProvider>
          <NotificationSubscriber />
          <AuthGuard>{children}</AuthGuard>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
