"use client";
import { icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { useCollapse } from "react-collapsed";

type CollapsibleCardProps = {
  name: string;
  rank: string;
  job: string;
  location: string;
  information: string;
  contact: string;
};

const UserIcon = icons.user;

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
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();
  const ArrowRight = icons.arrowRight;

  const collapseProps = getCollapseProps();

  return (
    <Card className="w-full p-0">
      <div
        {...getToggleProps()}
        className={`flex items-center justify-between cursor-pointer rounded ${
          isExpanded ? "bg-primary-dark text-white p-4 rounded-xl" : "p-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <Avatar />
          <div className={`font-semibold ${isExpanded ? "text-white" : ""}`}>
            {name}
          </div>
          <div
            className={`text-sm ${
              isExpanded ? "text-white/90" : "text-muted-foreground"
            }`}
          >
            {rank}, {job}
          </div>
        </div>

        <div className="p-2">
          <ArrowRight
            className={`h-5 w-5 transform transition-transform duration-200 ease-in-out ${
              isExpanded ? "rotate-90" : "rotate-0"
            }`}
          />
        </div>
      </div>

      <div
        {...collapseProps}
        // ensure smooth height animation and hide overflow while collapsing
        style={{ ...(collapseProps as any).style, transition: "height 250ms ease" }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0 text-sm text-muted-foreground">
          <span className="font-semibold">Location: </span> {location}
          <br />
          <span className="font-semibold">Information: </span> {information}
          <br />
          <span className="font-semibold">Contact: </span> {contact}
          <br />
        </div>
      </div>
    </Card>
  );
}
