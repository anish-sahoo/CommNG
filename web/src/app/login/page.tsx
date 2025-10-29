"use client";

import { useForm } from "@tanstack/react-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import minuteMan from "../../../public/minute_man.png";

const schema = z.object({
  email: z.email(),
  password: z.string(),
});

export default function Page() {
  const router = useRouter();

  const session = authClient.useSession();

  useEffect(() => {
    if (session.data) {
      router.replace("/");
    }
  }, [session, router]);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value: { email, password } }) => {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      router.replace("/");
    },
  });

  return (
    <div>
      {/* Yellow circle */}
      <div className="pointer-events-none absolute -left-40 h-[500px] w-[500px] rounded-full bg-yellow-300 blur-[120px] opacity-60"></div>
      {/* Blue circle */}
      <div className="pointer-events-none absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full bg-blue-400 blur-[140px] opacity-60"></div>

      <div className="relative">
        <div className="grid grid-cols-[3fr_2fr] items-center px-24 min-h-lvh max-w-[1600px] mx-auto">
          <div className="flex items-center">
            <h1 className="text-5xl font-semibold w-[450px] flex-1">
              MA National Guard Mentorship & Communications
            </h1>
            <Image src={minuteMan} width={360} alt="Minute man logo" priority />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col items-center w-full gap-14">
              <div className="flex gap-5 flex-col w-full">
                <form.Field
                  name="email"
                  children={(field) => {
                    return (
                      <TextInput
                        id={field.name}
                        name={field.name}
                        placeholder="Email address"
                        value={field.state.value}
                        onChange={field.handleChange}
                        className="border-primary border-2 text-xl font-semibold font-sans placeholder:text-neutral px-7 py-5 bg-white"
                      />
                    );
                  }}
                />

                <form.Field
                  name="password"
                  children={(field) => {
                    return (
                      <TextInput
                        id={field.name}
                        name={field.name}
                        placeholder="Password"
                        type="password"
                        value={field.state.value}
                        onChange={field.handleChange}
                        className="border-primary border-2 text-xl font-semibold font-sans placeholder:text-neutral px-7 py-5 bg-white"
                      />
                    );
                  }}
                />
              </div>
              <Button
                type="submit"
                className="w-[270px] h-[60px] font-semibold text-xl"
                disabled={!form.state.canSubmit}
              >
                {form.state.isSubmitting && <Spinner />}
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
