"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";
import MA_NG_Logo from "../../../public/MA_NG_Logo.png";

const emailSchema = z.string().email();

export default function Page() {
  const router = useRouter();
  const trpcClient = useTRPCClient();

  const { data: sessionData, isPending } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"email" | "password">("email");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sessionData) {
      router.replace("/communications");
    }
  }, [isPending, router, sessionData]);

  const trimmedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleEmailSubmit = async () => {
    const parsed = emailSchema.safeParse(trimmedEmail);
    if (!parsed.success) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    try {
      setErrorMessage(null);
      setIsCheckingEmail(true);
      const exists = await trpcClient.user.checkEmailExists.query({
        email: parsed.data,
      });

      if (exists) {
        setPassword("");
        setStage("password");
      } else {
        router.replace(`/sign-up?email=${encodeURIComponent(parsed.data)}`);
      }
    } catch (error) {
      console.error("Failed to check email", error);
      toast.error("We couldn't verify that email. Please try again.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setErrorMessage(null);
      setIsSigningIn(true);
      const res = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      if (res.error) {
        toast.error(res.error.message);
        setIsSigningIn(false);
        return;
      }

      router.replace("/communications");
    } catch (error) {
      console.error("Failed to sign in", error);
      toast.error("We couldn't sign you in. Please try again.");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="pointer-events-none absolute -left-40 top-24 h-[420px] w-[420px] rounded-full bg-yellow-200 opacity-70 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[520px] w-[520px] rounded-full bg-blue-200 opacity-70 blur-[160px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 sm:gap-16 sm:px-10 lg:px-16">
        <div className="flex w-full flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-center sm:gap-8 sm:text-left">
          <Image
            src={MA_NG_Logo}
            width={140}
            height={140}
            alt="Massachusetts National Guard Logo"
            priority
            className="h-24 w-24 sm:h-28 sm:w-28"
          />
          <h1 className="text-3xl font-semibold text-secondary sm:text-4xl lg:text-5xl">
            MA National Guard Mentorship & Communications Hub
          </h1>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (stage === "email") {
              void handleEmailSubmit();
            } else {
              void handlePasswordSubmit();
            }
          }}
          className="w-full max-w-md"
        >
          <div className="border border-primary rounded-xl bg-white px-7 py-9 shadow-xl sm:px-10 sm:py-12">
            <div className="mb-6 text-left">
              <h2 className="text-xl font-semibold text-secondary">
                {stage === "email" ? "Sign In or Create Account" : "Sign In"}
              </h2>
            </div>

            <div className="flex flex-col gap-5">
              <TextInput
                id="email"
                name="email"
                placeholder="Email address"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  if (stage === "email") {
                    setErrorMessage(null);
                  }
                }}
                disabled={stage === "password"}
                className="w-full"
              />

              {stage === "password" ? (
                <div>
                  <TextInput
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(value) => {
                      setPassword(value);
                      setErrorMessage(null);
                    }}
                    className="w-full"
                  />
                  <Link href="/forgot-password">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="text-xs text-primary underline-offset-4 p-0"
                      >
                        Forgot password?
                      </Button>
                    </div>
                  </Link>
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm font-semibold text-error">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-4">
              <Button
                variant="outline"
                className="px-10"
                disabled={
                  (stage === "email" &&
                    (isCheckingEmail || trimmedEmail === "")) ||
                  (stage === "password" &&
                    (isSigningIn || password.trim() === ""))
                }
              >
                {(isCheckingEmail || isSigningIn) && <Spinner />}
                {stage === "email" ? "Continue" : "Sign in"}
              </Button>

              {stage === "password" ? (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm font-semibold text-primary underline-offset-4"
                    onClick={() => {
                      setStage("email");
                      setPassword("");
                      setIsSigningIn(false);
                    }}
                  >
                    Use a different email
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
