"use client";

import { forwardRef, useState } from "react";
import { type IconName, icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SelectableButtonProps = {
  text?: string;
  icon?: IconName;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  selectable?: boolean;
  defaultSelected?: boolean;
  disabled?: boolean;
};

export const SelectableButton = forwardRef<
  HTMLButtonElement,
  SelectableButtonProps
>(
  (
    {
      text,
      icon,
      className,
      onClick,
      selectable = true,
      defaultSelected = false,
      disabled = false,
    },
    ref,
  ) => {
    const [selected, setSelected] = useState(defaultSelected);
    const Icon = icon ? icons[icon] : null;

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (selectable) setSelected((s) => !s);
      onClick?.(e);
    }

    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={selected}
        data-selected={selected}
        className={cn(
          "gap-2",
          "data-[selected=true]:border-primary data-[selected=true]:ring-1 data-[selected=true]:ring-primary",
          className,
        )}
      >
        {Icon && <Icon className="h-5 w-5" />}
        {text}
      </Button>
    );
  },
);
SelectableButton.displayName = "SelectableButton";
