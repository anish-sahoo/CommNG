"use client";
import type { Route } from "next";
import Link from "next/link";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DropdownMenuItemConfig {
  id: string;
  icon?: keyof typeof icons;
  label: string;
  href?: Route | string;
  onClick?: () => void;
  separator?: boolean; // Add separator after this item
}

interface ReusableDropdownProps {
  items: DropdownMenuItemConfig[];
  triggerContent?: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end" | "center";
  sideOffset?: number;
  triggerAriaLabel?: string;
}

export function DropdownButtons({
  items,
  triggerContent,
  triggerClassName,
  align = "end",
  sideOffset = 6,
  triggerAriaLabel = "Open options menu",
}: ReusableDropdownProps) {
  const Ellipsis = icons.ellipsis;

  // Default trigger is ellipsis button if no custom content provided
  const defaultTrigger = (
    <Button
      variant="outline"
      className="h-9 w-9 p-0 rounded-full flex items-center justify-center"
      aria-label={triggerAriaLabel}
    >
      <Ellipsis className="h-5 w-5 text-accent" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={triggerClassName}>
        {triggerContent || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={sideOffset}>
        {items.map((item) => {
          const IconComponent = item.icon ? icons[item.icon] : null;
          return (
            <div key={item.id}>
              <DropdownMenuItem asChild className="cursor-pointer">
                {item.href ? (
                  <Link
                    href={item.href as Route}
                    className="flex w-full items-center gap-2 text-secondary hover:text-primary"
                  >
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 text-accent" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center gap-2 text-secondary hover:text-primary focus:outline-none"
                  >
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 text-accent" />
                    )}
                    {item.label}
                  </button>
                )}
              </DropdownMenuItem>

              {item.separator && <DropdownMenuSeparator />}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
