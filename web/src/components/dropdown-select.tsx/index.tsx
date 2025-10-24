"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
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
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="hover:data-[placeholder]:text-white text-subheader font-semibold py-5 rounded-xl bg-white hover:bg-primary hover:text-white border-2 border-primary w-[332px]">
        <SelectValue
          placeholder={
            options.length > 0 ? options[0].label : "Select an option"
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              className="text-subheader font-semibold text-primary py-3"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default DropdownSelect;
