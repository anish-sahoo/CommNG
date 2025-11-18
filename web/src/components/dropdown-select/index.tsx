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
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger
        ref={triggerRef}
        className="hover:data-[placeholder]:text-white data-[state=open]:rounded-b-none data-[state=open]:border-b-0 text-subheader font-semibold py-5 rounded-xl bg-white hover:bg-primary hover:text-white border-1 border-primary w-full max-w-[332px]"
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
            className="z-[9999] rounded-b-xl rounded-t-none w-[var(--radix-select-trigger-width)] max-w-[332px] border-1 border-primary bg-white"
          >
            <SelectGroup>
              {options.map((option, idx) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={`text-subheader font-semibold text-primary py-2 px-3 ${idx > 0 ? "border-t border-neutral" : ""}`}
                >
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
