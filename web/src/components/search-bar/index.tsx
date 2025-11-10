"use client";

import { icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = React.InputHTMLAttributes<HTMLInputElement> & {
  placeholder?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search",
  icon,
  containerClassName,
  ...props
}) => {
  const Search = icons.search;
  const { className: inputClassName, style, ...restProps } = props;
  const { "aria-label": ariaLabelFromProps, ...inputProps } =
    restProps as typeof restProps & { "aria-label"?: string };
  const ariaLabel = ariaLabelFromProps ?? placeholder;

  return (
    <div className={cn("relative", containerClassName)}>
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
        {...inputProps}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn("h-[41px] w-[233px]", inputClassName)}
        style={{ paddingLeft: "35px", ...style }}
      />
    </div>
  );
};

export default SearchBar;
