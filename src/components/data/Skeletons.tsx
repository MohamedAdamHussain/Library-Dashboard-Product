/**
 * Skeletons — هياكل تحميل مطابقة لشكل المحتوى الفعلي
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonListProps {
  rows?: number;
  className?: string;
}

export function StatsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

export function ChartSkeleton({
  height = "h-72",
  className,
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-2", height, className)}>
      {[40, 60, 35, 80, 50, 70, 45].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="border-b border-border p-4 last:border-0"
        >
          <div
            className="grid items-center gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4" style={{ width: `${60 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookGridSkeleton({
  count = 8,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 8,
  height = "h-32",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("rounded-xl", height)} />
      ))}
    </div>
  );
}
