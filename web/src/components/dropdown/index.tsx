"use client";
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
  onClick: () => void;
  separator?: boolean; // Add separator after this item
}

interface ReusableDropdownProps {
  items: DropdownMenuItemConfig[];
  triggerContent?: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end" | "center";
  sideOffset?: number;
}

export function DropdownButtons({
  items,
  triggerContent,
  triggerClassName,
  align = "end",
  sideOffset = 6,
}: ReusableDropdownProps) {
  const Ellipsis = icons.ellipsis;

  // Default trigger is ellipsis button if no custom content provided
  const defaultTrigger = (
    <Button
      variant="outline"
      className="h-9 w-9 p-0 rounded-full flex items-center justify-center"
    >
      <Ellipsis className="h-5 w-5" />
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
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={item.onClick}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span>{item.label}</span>
              </DropdownMenuItem>
              {item.separator && <DropdownMenuSeparator />}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
