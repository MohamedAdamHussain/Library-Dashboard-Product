import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  lastPage: number;
  total?: number;
  perPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** مكون Pagination يتعامل مع ترقيم Laravel (1-based) */
export function Pagination({
  page,
  lastPage,
  total,
  perPage,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = Math.max(page - delta, 1);
    const right = Math.min(page + delta, lastPage);

    if (left > 1) {
      range.push(1);
      if (left > 2) range.push("...");
    }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < lastPage) {
      if (right < lastPage - 1) range.push("...");
      range.push(lastPage);
    }
    return range;
  }, [page, lastPage]);

  const from = total && perPage ? (page - 1) * perPage + 1 : 0;
  const to = total && perPage ? Math.min(page * perPage, total) : 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className
      )}
    >
      {total !== undefined && perPage !== undefined ? (
        <p className="text-sm text-muted-foreground">
          عرض{" "}
          <span className="font-semibold text-foreground">{from}</span> –{" "}
          <span className="font-semibold text-foreground">{to}</span> من{" "}
          <span className="font-semibold text-foreground">{total}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          صفحة{" "}
          <span className="font-semibold text-foreground">{page}</span> من{" "}
          <span className="font-semibold text-foreground">{lastPage}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          aria-label="السابق"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "h-9 w-9 rounded-lg text-sm font-semibold transition-colors",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(page + 1, lastPage))}
          disabled={page === lastPage}
          aria-label="التالي"
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
