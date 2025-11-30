"use client";
import type { ReactNode } from "react";
import { icons } from "@/components/icons";
import { Card } from "@/components/ui/card";

type LinkedCardProps = {
  children: ReactNode;
  href: string;
};

export const LinkedCard = ({ children, href }: LinkedCardProps) => {
  const Icon = icons.externalLink;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="linked-card"
    >
      <Card className="w-full p-4 hover:bg-primary group">
        <div className="flex items-center justify-between gap-4 px-4 py-0 w-full">
          <div className="text-secondary text-subheader font-semibold group-hover:text-white flex-1">
            {children}
          </div>
          <Icon className="text-accent w-6 h-6 shrink-0" />
        </div>
      </Card>
    </a>
  );
};

export default LinkedCard;
