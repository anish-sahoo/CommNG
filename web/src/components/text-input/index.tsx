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
  disabled?: boolean;
} & (
  | {
      multiline: true;
      rows?: number;
    }
  | { multiline?: false; type?: React.HTMLInputTypeAttribute }
);

export const TextInput = (props: TextInputProps) => {
  const {
    className,
    maxLength,
    showCharCount,
    onChange,
    value,
    placeholder,
    counterColor,
    disabled,
    ...rest
  } = props;
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (disabled) {
      return;
    }

    const newValue = e.target.value;

    // Respect maxLength if provided
    if (maxLength !== undefined && newValue.length > maxLength) {
      return;
    }

    onChange?.(newValue);
  };

  const charCount = value?.length ?? 0;
  const showCount = showCharCount ?? maxLength !== undefined;

  const counterStyles: React.CSSProperties = {
    color: counterColor,
  };

  if ("multiline" in rest && rest.multiline) {
    const {
      rows,
      multiline: _multiline,
      ...textareaProps
    } = rest as {
      multiline: true;
      rows?: number;
    } & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

    return (
      <div className="relative w-full">
        <Textarea
          {...textareaProps}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows ?? 3}
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

  const {
    multiline: _multiline,
    type,
    ...inputProps
  } = rest as {
    multiline?: false;
    type?: React.HTMLInputTypeAttribute;
  } & React.InputHTMLAttributes<HTMLInputElement>;

  return (
    <div className="relative w-full">
      <Input
        {...inputProps}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        type={type}
        className={cn(showCount && "pr-20", className)}
      />

      {showCount && (
        <div
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs"
          style={counterStyles}
        >
          {charCount}
          {maxLength ? `/${maxLength}` : ""}
        </div>
      )}
    </div>
  );
};

export default TextInput;
