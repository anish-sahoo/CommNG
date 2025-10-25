"use client"

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react"
import { useState } from "react";

type TextInputProps = {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  multiline?: boolean;
  rows?: number;
  borderColor?: string;
  textColor?: string;
  counterColor?: string;
};

export const TextInput = ({ 
  value, 
  onChange,
  placeholder,
  maxLength,
  showCharCount = false,
  multiline = false,
  rows = 3,
  borderColor,
  textColor,
  counterColor
}: TextInputProps) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Respect maxLength if provided
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange?.(newValue);
  };

  const charCount = value.length;
  const showCount = showCharCount || maxLength;

  const inputStyles = {
    borderColor: borderColor,
    color: textColor
  };

  const counterStyles = {
    color: counterColor
  };

  if (multiline) {
    return (
      <div className="relative w-full">
        <Textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className="resize-none pb-7"
          style={{
            paddingBottom: showCount ? '1.75rem' : undefined,
            ...inputStyles
          }}
        />
        
        {showCount && (
          <div 
            className="absolute bottom-2 right-3 text-xs pointer-events-none bg-background px-1"
            style={counterStyles}
          >
            {charCount}{maxLength ? `/${maxLength}` : ''}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        type="text"
        className="pr-20"
        style={inputStyles}
      />
      
      {showCount && (
        <div 
          className="absolute top-1/2 -translate-y-1/2 right-3 text-xs pointer-events-none"
          style={counterStyles}
        >
          {charCount}{maxLength ? `/${maxLength}` : ''}
        </div>
      )}
    </div>
  );
};

export default TextInput;