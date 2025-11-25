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
  | ({
      multiline: true;
      rows?: number;
    } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange">)
  | ({
      multiline?: false;
      type?: React.HTMLInputTypeAttribute;
    } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">)
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
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (disabled) return;

    const newValue = e.target.value;

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

  // Multiline (textarea)
  if (rest.multiline) {
    const { rows = 3, multiline: _multiline, ...textareaProps } = rest;

    return (
      <div className="relative w-full max-w-full">
        <Textarea
          {...textareaProps}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
          className={cn(
            "w-full max-w-full resize-none pb-7",
            showCount && "pb-7 pr-16",
            className,
          )}
        />

        {showCount && (
          <div
            className="pointer-events-none absolute bottom-2 right-3 bg-background px-1 text-xs"
            style={counterStyles}
          >
            {charCount}
            {maxLength ? `/${maxLength}` : ""}
          </div>
        )}
      </div>
    );
  }

  const { type, multiline: _multiline, ...inputProps } = rest;

  return (
    <div className="relative w-full max-w-full">
      <Input
        {...inputProps}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        type={type}
        className={cn(
          "w-full max-w-full truncate",
          showCount && "pr-20",
          className,
        )}
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
