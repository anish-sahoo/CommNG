"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <Navigation />
      <div className="flex flex-col items-center gap-16 mt-6">
        <h1 className="font-bold text-2xl">Home page</h1>

        <h2 className="font-semibold text-xl">User info</h2>

        <AuthData />

        <Button
          onClick={async () => {
            const res = await authClient.signOut();

            if (res.error) {
              toast.error(res.error.message ?? "An error occurred");
              return;
            }

            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}

function AuthData() {
  const session = authClient.useSession();

  if (!session.data) {
    return <div>No user data</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <span>Email: {session.data.user.email}</span>
      <span>Name: {session.data.user.name}</span>
      <span>
        First logged in: {session.data.session.createdAt.toLocaleString()}
      </span>
    </div>
  );
}
