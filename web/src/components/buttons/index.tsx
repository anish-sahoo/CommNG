"use client";

import { useState } from "react";
import { icons } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SelectableButton({
  text,
  icon,
  className,
  onClick,
}: {
  text?: string;
  icon?: keyof typeof icons;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [selected, setSelected] = useState(false);
  const Icon = icon ? icons[icon] : null;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    setSelected(!selected);
    onClick?.(e);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2 text-subheader font-semibold transition-all duration-200",
        "border",
        "bg-white text-primary border-neutral hover:bg-primary hover:text-background",
        selected && "border-primary text-primary",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        className,
      )}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0 text-inherit" />}
      {text}
    </button>
  );
}
