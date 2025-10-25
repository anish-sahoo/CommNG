"use client"

import { Input } from "@/components/ui/input";

type SearchBarProps = React.InputHTMLAttributes<HTMLInputElement> & {
    placeholder?: string;
    icon?: React.ReactNode;
};

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = "Search", icon, ...props }) => {
    const defaultIcon = (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#DDA139" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-muted-foreground"
        >
            <path d="m21 21-4.34-4.34"/>
            <circle cx="11" cy="11" r="8"/>
        </svg>
    );

    return (
        <div className="relative">
            <span 
                className="absolute top-1/2 transform -translate-y-1/2"
                style={{ left: '10px' }}
            >
                {icon ?? defaultIcon}
            </span>
            <Input
                {...props}
                placeholder={placeholder}
                className={props.className || '' || "w-[233px] h-[41px]"}
                style={{ paddingLeft: '35px' }}
            />
        </div>
    );
};

export default SearchBar;