"use client";

import { useState } from "react";
import { icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type CollapsibleCardProps = {
  name: string;
  rank: string;
  job: string;
  location: string;
  information: string;
  contact: string;
};

const UserIcon = icons.user;
const ArrowRight = icons.arrowRight;

const Avatar = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary">
    <UserIcon className="h-7 w-7" />
  </div>
);

export default function CollapsibleCard({
  name,
  rank,
  job,
  location,
  information,
  contact,
}: CollapsibleCardProps) {
  const [Expandable, setExpandable] = useState(false);

  return (
    <Card className="w-full p-0">
      <Collapsible open={Expandable} onOpenChange={setExpandable}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-between cursor-pointer rounded transition-colors ${
              Expandable
                ? "bg-primary-dark text-white p-4 rounded-xl"
                : "p-4 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <Avatar />
              <div>
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
                  {rank}, {job}
                </div>
              </div>
            </div>
            <ArrowRight
              className={`h-5 w-5 transform transition-transform duration-200 ease-in-out ${
                Expandable ? "rotate-90" : "rotate-0"
              }`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-2 text-sm text-muted-foreground ">
            <div>
              <span className="font-semibold">Location: </span> {location}
            </div>
            <div>
              <span className="font-semibold">Information: </span> {information}
            </div>
            <div>
              <span className="font-semibold">Contact: </span> {contact}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
