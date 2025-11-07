"use client";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

type DraggableCard<T = unknown> = {
  id: string;
  data: T;
};

type DragDropCardsProps<T = unknown> = {
  cards: DraggableCard<T>[];
  onReorder: (cards: DraggableCard<T>[]) => void;
  renderCard: (data: T, index: number) => React.ReactNode;
};

export const DragDropCards = <T,>({
  cards: initialCards,
  onReorder,
  renderCard,
}: DragDropCardsProps<T>) => {
  const [cards, setCards] = useState<DraggableCard<T>[]>(initialCards);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newCards = [...cards];
    const [draggedCard] = newCards.splice(draggedIndex, 1);
    newCards.splice(dropIndex, 0, draggedCard);

    setCards(newCards);
    setDraggedIndex(null);
    setDragOverIndex(null);

    onReorder(newCards);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="w-full space-y-3">
      {cards.map((card, index) => (
        <Card
          key={card.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnd={handleDragEnd}
          className={`
            w-full p-4 transition-all duration-200 cursor-grab active:cursor-grabbing
            ${draggedIndex === index ? "opacity-50 scale-95" : "opacity-100"}
            ${dragOverIndex === index ? "border-primary border-2" : ""}
          `}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center gap-4">
            <div className="text-accent hover:text-accent/70 transition-colors">
              <GripVertical className="h-6 w-6" />
            </div>
            <div className="flex-1 text-sm">{renderCard(card.data, index)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DragDropCards;
