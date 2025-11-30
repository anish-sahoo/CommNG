"use client";
import Image from "next/image";
import { useState } from "react";
import { icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type CollapsibleCardProps = {
  name: string;
  rank: string;
  location: string;
  personalInterests?: string;
  information: string;
  email: string;
  phone: string;
  avatarSrc?: string;
};

const UserIcon = icons.user;
const ArrowRight = icons.arrowRight;

export default function CollapsibleCard({
  name,
  rank,
  location,
  personalInterests,
  information,
  email,
  phone,
  avatarSrc,
}: CollapsibleCardProps) {
  const [Expandable, setExpandable] = useState(false);

  return (
    <Card className="w-full p-0 overflow-hidden">
      <Collapsible open={Expandable} onOpenChange={setExpandable}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={`w-full flex items-center justify-between cursor-pointer transition-all duration-300 p-4 ${
              Expandable
                ? "bg-primary-dark text-white rounded-t-xl"
                : "rounded-xl hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-center gap-4">
              <div className="relative z-10 h-16 w-16 shrink-0 overflow-hidden rounded-full border-3 border-card bg-neutral text-secondary sm:h-16 sm:w-16">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={`${name} profile photo`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 96px, 80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral/10 text-secondary">
                    <UserIcon className="h-8 w-8" aria-hidden="true" />
                    <span className="sr-only">{name} avatar</span>
                  </div>
                )}
              </div>
              <div className="text-left">
                <div
                  className={`font-semibold ${Expandable ? "text-white" : ""}`}
                >
                  {name}
                </div>
                <div
                  className={`text-sm ${
                    Expandable ? "text-white/90" : "text-muted-foreground"
                  }`}
                >
                  {rank}
                </div>
              </div>
            </div>
            <ArrowRight
              className={`h-5 w-5 transform transition-transform duration-300 ease-in-out ${
                Expandable ? "rotate-90" : "rotate-0"
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="px-4 pb-4 text-sm text-muted-foreground space-y-4">
            <div className="pt-4 border-t">
              <span className="font-semibold">Location: </span> {location}
            </div>
            <div className="pt-4 border-t">
              <span className="font-semibold">Information: </span> {information}
            </div>
            {personalInterests && (
              <div className="pt-4 border-t">
                <span className="font-semibold">Personal Interests: </span>{" "}
                {personalInterests}
              </div>
            )}
            <div className="pt-4 border-t">
              <span className="font-semibold">Email: </span> {email}
            </div>
            <div className="pt-4 border-t">
              <span className="font-semibold">Phone: </span> {phone}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
