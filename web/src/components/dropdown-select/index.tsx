"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const DropdownSelect = ({
  options,
  value,
  onChange,
  className,
  disabled = false,
  id,
  ariaLabel,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const handleOpenChange = (open: boolean) => {
    if (open && triggerRef.current) {
      triggerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger
        ref={triggerRef}
        disabled={disabled}
        id={id}
        className={cn("w-full sm:w-auto sm:min-w-64", className)}
        aria-label={ariaLabel}
      >
        <SelectValue
          placeholder={
            options.length > 0 ? options[0].label : "Select an option"
          }
        />
      </SelectTrigger>

      {mounted && (
        <SelectPortal container={document.body}>
          <SelectContent
            position="popper"
            side="bottom"
            align="start"
            avoidCollisions={false}
          >
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </SelectPortal>
      )}
    </Select>
  );
};
export default DropdownSelect;
