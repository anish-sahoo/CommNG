"use client";

import { useEffect, useState } from "react";

type ReactionProps = {
  emoji: string;
  count: number;
  onClick?: () => void;
  onToggle?: (active: boolean) => void;
  initiallyActive?: boolean;
};

//Reaction logic
export const Reaction = ({
  emoji,
  count,
  onClick,
  onToggle,
  initiallyActive = false,
}: ReactionProps) => {
  const [active, setActive] = useState(initiallyActive);

  useEffect(() => {
    setActive(initiallyActive);
  }, [initiallyActive]);

  const handleClick = () => {
    const next = !active;
    setActive(next);
    onClick?.();
    onToggle?.(next);
  };

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
      aria-label={`React with ${emoji}`}
      aria-pressed={active}
    >
      <span aria-hidden="true" className="emoji">
        {emoji}
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
};

export default Reaction;
