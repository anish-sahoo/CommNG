"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TextInputProps = {
  className?: string;
  value?: Exclude<
    (
      | React.TextareaHTMLAttributes<HTMLTextAreaElement>
      | React.InputHTMLAttributes<HTMLInputElement>
    )["value"],
    number
  >;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  counterColor?: string;
  id?: string;
  name?: string;
} & (
  | {
      multiline: true;
      rows?: number;
    }
  | { multiline?: false; type?: React.HTMLInputTypeAttribute }
);

export const TextInput = ({
  className,
  maxLength,
  showCharCount,
  onChange,
  value,
  placeholder,
  counterColor,
  ...rest
}: TextInputProps) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value;

    // Respect maxLength if provided
    if (maxLength !== undefined && newValue.length > maxLength) {
      return;
    }

    onChange?.(newValue);
  };

  const charCount = value?.length ?? 0;
  const showCount = showCharCount || maxLength;

  const counterStyles = {
    color: counterColor,
  };

  if (rest.multiline) {
    return (
      <div className="relative w-full">
        <Textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rest.rows ?? 3}
          className={cn(
            "resize-none pb-7",
            showCount && "pb-7 pr-16",
            className,
          )}
        />

        {showCount && (
          <div
            className="absolute bottom-2 right-3 text-xs pointer-events-none bg-background px-1"
            style={counterStyles}
          >
            {charCount}
            {maxLength ? `/${maxLength}` : ""}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        type={rest.type}
        className={cn(showCount && "pr-20", className)}
      />

      {showCount && (
        <div
          className="absolute top-1/2 -translate-y-1/2 right-3 text-xs pointer-events-none"
          style={counterStyles}
        >
          {charCount}
          {maxLength ? `/${maxLength}` : ""}
        </div>
      )}
    </>
  );
};

export default TextInput;
