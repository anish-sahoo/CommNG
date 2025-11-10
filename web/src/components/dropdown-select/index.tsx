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

export const DropdownSelect = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Scroll the trigger into view when dropdown opens
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
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger
        ref={triggerRef}
        className="hover:data-[placeholder]:text-white data-[state=open]:rounded-b-none data-[state=open]:border-b-0 text-subheader font-semibold py-5 rounded-xl bg-white hover:bg-primary hover:text-white border-1 border-primary w-[332px]"
      >
        <SelectValue
          placeholder={
            options.length > 0 ? options[0].label : "Select an option"
          }
        />
      </SelectTrigger>

      {/* Use a portal to always render on top of everything */}
      <SelectPortal container={document.body}>
        <SelectContent
          position="popper"
          side="bottom"
          align="start"
          avoidCollisions={false}
          className="z-[9999] rounded-b-xl rounded-t-none w-[var(--radix-select-trigger-width)] border-1 border-primary bg-white"
        >
          <SelectGroup>
            {options.map((option, index) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={`text-subheader font-semibold text-primary py-3 rounded-none ${
                  index > 0 ? "border-t-1 border-neutral" : ""
                }`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

export default DropdownSelect;
