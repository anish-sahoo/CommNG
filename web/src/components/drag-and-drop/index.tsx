"use client";

import * as React from "react";
import { icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DragSelectOption {
  label: string;
  value: string;
}

interface DragReorderFrameProps {
  options: DragSelectOption[];
  onChange: (values: string[]) => void;
  className?: string;
}

/**
 * A simple reorderable list with native drag-and-drop.
 * No external libraries needed.
 */
export function DragReorderFrame({
  options,
  onChange,
  className,
}: DragReorderFrameProps) {
  const [items, setItems] = React.useState(options.map((o) => o.value));
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const handleDragStart = (value: string) => setDragging(value);
  const handleDragEnter = (value: string) => setDragOver(value);
  const handleDragEnd = () => {
    if (dragging && dragOver && dragging !== dragOver) {
      const newItems = [...items];
      const fromIndex = newItems.indexOf(dragging);
      const toIndex = newItems.indexOf(dragOver);
      newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, dragging);
      setItems(newItems);
      onChange(newItems);
    }
    setDragging(null);
    setDragOver(null);
  };

  const DragIcon = icons.drag;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((value) => {
        const option = options.find((o) => o.value === value);
        if (!option) return null;

        const isDragging = dragging === value;
        const isDragOver = dragOver === value && dragging !== value;

        return (
          <Card
            key={value}
            draggable
            onDragStart={() => handleDragStart(value)}
            onDragEnter={() => handleDragEnter(value)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex flex-row items-center gap-3 cursor-grab active:cursor-grabbing px-4 py-3 text-sm font-medium min-w-0",
              isDragging && "opacity-50",
              isDragOver && "border-primary",
            )}
          >
            <span className="flex items-center">
              <DragIcon className="h-5 w-5 text-accent cursor-move" />
            </span>
            <span className="flex-1 min-w-0 break-words whitespace-normal">
              {option.label}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
