"use client";

import { useState } from "react";

type ReactionProps = {
  emoji: string;
  count: number;
  onClick?: () => void;
  onToggle?: (active: boolean) => void;
};

//Reaction logic
export const Reaction = ({
  emoji,
  count,
  onClick,
  onToggle,
}: ReactionProps) => {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    const next = !active;
    setActive(next);
    onClick?.();
    onToggle?.(next);
  };

  const displayCount = count + (active ? 1 : 0);

  const baseClasses = [
    "inline-flex",
    "items-center",
    "gap-1",
    "rounded-full",
    "px-3",
    "py-1.5",
    "text-xs",
    "font-semibold",
    "border",
    "transition",
    "duration-200",
    "ring-offset-background",
  ];

  if (active) {
    baseClasses.push(
      "border-transparent",
      "bg-primary",
      "text-primary-foreground",
      "hover:bg-primary-dark",
    );
  } else {
    baseClasses.push(
      "border-primary",
      "bg-white",
      "text-primary",
      "hover:bg-primary",
      "hover:text-primary-foreground",
    );
  }

  //Reaction button UI
  return (
    <button
      type="button"
      className={baseClasses.join(" ")}
      onClick={handleClick}
      aria-pressed={active}
    >
      <span className="emoji">{emoji}</span>
      {displayCount > 0 && <span>{displayCount}</span>}
    </button>
  );
};

export default Reaction;
