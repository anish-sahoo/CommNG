"use client";

import { icons } from "@/components/icons";
import { Input } from "@/components/ui/input";

type SearchBarProps = React.InputHTMLAttributes<HTMLInputElement> & {
  placeholder?: string;
  icon?: React.ReactNode;
};

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search",
  icon,
  ...props
}) => {
  const Search = icons.search;

  return (
    <div className="relative">
      <span
        className="absolute top-1/2 transform -translate-y-1/2"
        style={{ left: "10px" }}
      >
        {icon ?? (
          <Search
            className="h-[18px] w-[18px]"
            style={{ stroke: "#DDA139", strokeWidth: 3 }}
          />
        )}
      </span>
      <Input
        {...props}
        placeholder={placeholder}
        className={props.className || "" || "w-[233px] h-[41px]"}
        style={{ paddingLeft: "35px" }}
      />
    </div>
  );
};

export default SearchBar;
