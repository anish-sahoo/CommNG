import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  hasMore: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  hasMore,
  hasPrevious,
  onPageChange,
}: PaginationProps) {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
      <div className="text-sm text-muted-foreground text-center sm:text-left">
        {totalItems === 0 ? (
          "No results"
        ) : (
          <>
            Showing {startItem}-{endItem} of {totalItems}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          className="flex-1 sm:flex-initial"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore}
          className="flex-1 sm:flex-initial"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
