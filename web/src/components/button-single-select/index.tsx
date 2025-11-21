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
    {},
  );

  const [otherTextValues, setOtherTextValues] = useState<
    Record<string, string>
  >({});

  return (
    <fieldset
      className={cn("flex w-full flex-col items-start gap-2", className)}
    >
      <legend className="sr-only">{legend}</legend>

      {options.map((option) => {
        const isActive = option.value === value;
        const hasDropdown = option.dropdownOptions?.length;
        const dropdownValue = dropdownValues[option.value] || "";

        return (
          <div key={option.value} className="flex flex-col w-full">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-md px-3 py-2 transition-all",
                isActive
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
              )}
              onClick={() => {
                onChange(option.value);
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
                    : "border-muted-foreground",
                )}
              />
              <span className="break-words">{option.label}</span>
            </Button>

            {/* Child dropdown & optional "Other" text input */}
            {isActive && hasDropdown && option.dropdownOptions && (
              <div className="mt-2 -mb-2 flex w-full flex-col pl-6">
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

                {dropdownValue === "other" && (
                  <TextInput
                    className="mt-2"
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
