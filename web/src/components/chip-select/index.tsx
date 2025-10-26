"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";

interface ChipSelectProps {
  options: string[] | { id: string; label: string }[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const ChipSelect: React.FC<ChipSelectProps> = ({
  options,
  selectedOptions = [],
  onChange,
}) => {
  const handleToggle = (optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      onChange(selectedOptions.filter((item) => item !== optionId));
    } else {
      selectedOptions = [...selectedOptions, optionId];
      onChange(selectedOptions);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const optionId = typeof option === "string" ? option : option.id;
        const optionLabel = typeof option === "string" ? option : option.label;
        const isSelected = selectedOptions.includes(optionId);

        return (
          <Badge
            key={optionId}
            variant={isSelected ? "default" : "outline"}
            className={`font-subheader font-semibold text-sm h-6 cursor-pointer transition-colors ${
              isSelected
                ? "hover:bg-primary hover:text-white"
                : "text-primary hover:bg-primary hover:text-white"
            }`}
            onClick={() => handleToggle(optionId)}
          >
            {optionLabel}
          </Badge>
        );
      })}
    </div>
  );
};

export default ChipSelect;
