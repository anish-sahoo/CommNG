"use client";

import { useCallback, useId } from "react";
import { icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const CheckIcon = icons.done;

type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type MultiSelectProps = {
  id?: string;
  name?: string;
  label?: string;
  helperText?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  error?: string;
};

export function MultiSelect({
  id: idProp,
  name,
  label,
  helperText,
  options,
  value,
  onChange,
  maxSelections,
  disabled,
  error,
}: MultiSelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hasHelperText = Boolean(helperText) || Boolean(maxSelections);
  const descriptionId = hasHelperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const toggleValue = useCallback(
    (nextValue: string) => {
      const isSelected = value.includes(nextValue);
      if (isSelected) {
        onChange(value.filter((current) => current !== nextValue));
        return;
      }

      if (maxSelections && value.length >= maxSelections) {
        return;
      }

      onChange([...value, nextValue]);
    },
    [onChange, value, maxSelections],
  );

  const renderHelperText = () => {
    if (helperText) {
      return helperText;
    }
    if (maxSelections) {
      return `Select up to ${maxSelections}`;
    }
    return undefined;
  };

  const helperMessage = renderHelperText();

  return (
    <fieldset
      className="w-full space-y-3 border-0 p-0"
      aria-describedby={
        [descriptionId, errorId].filter(Boolean).join(" ") || undefined
      }
    >
      {label && (
        <legend className="text-sm font-semibold text-secondary">
          {label}
        </legend>
      )}
      {helperMessage && (
        <p
          id={descriptionId}
          className="text-sm font-normal text-primary italic"
        >
          {helperMessage}
        </p>
      )}

      <div className="space-y-3">
        {options.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No options available
          </p>
        ) : (
          options.map((option) => {
            const selected = value.includes(option.value);
            const selectionLimitReached =
              maxSelections !== undefined &&
              maxSelections > 0 &&
              value.length >= maxSelections &&
              !selected;
            const isDisabled =
              disabled || option.disabled || selectionLimitReached;
            const optionId = `${id}-${option.value}`;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-0 text-left transition",
                  "hover:bg-primary/5",
                  isDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer",
                )}
              >
                <input
                  id={optionId}
                  type="checkbox"
                  className="peer sr-only"
                  name={name}
                  value={option.value}
                  checked={selected}
                  disabled={isDisabled}
                  onChange={() => toggleValue(option.value)}
                />
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-transparent transition",
                    selected
                      ? "border-primary text-primary"
                      : "border-secondary/40 bg-background",
                    !selected &&
                      !isDisabled &&
                      "group-hover:border-primary group-hover:bg-primary/10",
                  )}
                  aria-hidden="true"
                >
                  {selected && <CheckIcon className="text-accent size-5" />}
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-sm font-medium text-secondary">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export type { MultiSelectOption, MultiSelectProps };
