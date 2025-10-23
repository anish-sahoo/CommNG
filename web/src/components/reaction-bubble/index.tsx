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

  // compute classes based on displayCount
  const baseClasses = [
    "rounded-full",
    "px-2",
    "py-2",
    "text-xs",
    "font-semibold",
    "reaction",
  ];

  if (displayCount === 0) {
    baseClasses.push("border-2", "border-primary-dark", "bg-white", "text-primary-dark");
  } 
  else if (displayCount === 1) {
    baseClasses.push("bg-primary-dark", "text-white");
  };

  //Reaction button UI
  return (
    <button
      type="button"
      className={baseClasses.join(" ")}
      onClick={handleClick}
      aria-pressed={active}
    >
      <span className="emoji">{emoji}</span>
      {displayCount > 0 && (
        <span className="px-1 text-white">{displayCount}</span>
      )}
    </button>
  );
};

export default Reaction;
