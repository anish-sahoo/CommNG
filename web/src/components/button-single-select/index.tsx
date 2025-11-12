"use client";

import { useState } from "react";
import DropdownSelect from "@/components/dropdown-select";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropdownOption = { label: string; value: string };

type Option = {
  label: string;
  value: string;
  dropdownOptions?: DropdownOption[];
};

interface SingleSelectButtonGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onDropdownChange?: (parentValue: string, dropdownValue: string) => void;
  className?: string;
  legend?: string;
}

export function SingleSelectButtonGroup({
  options,
  value,
  onChange,
  onDropdownChange,
  className,
  legend = "Select an option",
}: SingleSelectButtonGroupProps) {
  const [dropdownValues, setDropdownValues] = useState<Record<string, string>>(
    {}
  );
  const [otherTextValues, setOtherTextValues] = useState<
    Record<string, string>
  >({});

  return (
    <fieldset className={cn("flex flex-col items-start gap-2", className)}>
      <legend className="sr-only">{legend}</legend>

      {options.map((option) => {
        const isActive = option.value === value;
        const hasDropdown =
          option.dropdownOptions && option.dropdownOptions.length > 0;
        const dropdownValue = dropdownValues[option.value] || "";

        return (
          <div key={option.value} className="w-full">
            {/* Parent option button */}
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "w-full max-w-xs justify-start rounded-md px-3 py-2 transition-all",
                isActive
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
              onClick={() => {
                onChange(option.value);
                // Clear dropdowns and "other" fields when switching options
                setDropdownValues({});
                setOtherTextValues({});
              }}
              title={option.label}
            >
              <span
                className={cn(
                  "mr-2 h-3.5 w-3.5 rounded-full border-2 transition-all",
                  isActive
                    ? "border-primary/10 bg-primary"
                    : "border-muted-foreground"
                )}
              />
              <span className="truncate whitespace-nowrap overflow-hidden">
                {option.label}
              </span>
            </Button>

            {/* Dropdown appears ONLY after this option is selected */}
            {isActive && hasDropdown && option.dropdownOptions && (
              <div className="mt-2 ml-6 flex-col gap-2">
                <DropdownSelect
                  options={option.dropdownOptions}
                  value={dropdownValue}
                  onChange={(dropdownValue) => {
                    setDropdownValues((prev) => ({
                      ...prev,
                      [option.value]: dropdownValue,
                    }));
                    onDropdownChange?.(option.value, dropdownValue);
                  }}
                />

                {/* Show TextInput if "Other" is selected */}
                {dropdownValue === "other" && (
                  <TextInput
                    className="background-neutral-100 mt-2 w-full w-[332px]"
                    placeholder="Please specify your position"
                    value={otherTextValues[option.value] || ""}
                    onChange={(text) =>
                      setOtherTextValues((prev) => ({
                        ...prev,
                        [option.value]: text,
                      }))
                    }
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
