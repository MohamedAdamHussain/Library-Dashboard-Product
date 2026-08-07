/**
 * QueryBoundary
 * ─────────────────────────────────────
 * روتين عرض بيانات موحّد لكل المسارات:
 *   تحميل (skeleton مطابق للشكل) → خطأ (مع إعادة محاولة) → فراغ → المحتوى
 * كما يعرض مؤشراً خفيفاً عند التحديث في الخلفية (refetch) دون إخفاء المحتوى.
 */

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { getErrorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";

export interface QueryLike {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching?: boolean;
  refetch: () => unknown;
}

interface QueryBoundaryProps {
  query: QueryLike;
  isEmpty?: boolean;
  skeleton: ReactNode;
  empty?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  wrap?: boolean;
  className?: string;
  children: ReactNode;
}

function Framed({
  wrap,
  children,
}: {
  wrap: boolean;
  children: ReactNode;
}) {
  if (!wrap) return <>{children}</>;
  return (
    <Card>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function QueryBoundary({
  query,
  isEmpty = false,
  skeleton,
  empty,
  errorTitle,
  errorMessage,
  wrap = true,
  className,
  children,
}: QueryBoundaryProps) {
  if (query.isPending) {
    return (
      <div
        className={cn("animate-fade-in", className)}
        aria-busy="true"
        aria-live="polite"
      >
        {skeleton}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className={className}>
        <Framed wrap={wrap}>
          <ErrorState
            {...(errorTitle ? { title: errorTitle } : {})}
            message={errorMessage ?? getErrorMessage(query.error)}
            onRetry={() => query.refetch()}
          />
        </Framed>
      </div>
    );
  }

  if (isEmpty && empty) {
    return (
      <div className={cn("animate-fade-in", className)}>
        <Framed wrap={wrap}>{empty}</Framed>
      </div>
    );
  }

  return (
    <div className={cn("relative animate-fade-in", className)}>
      {query.isFetching ? <RefreshingBadge /> : null}
      {children}
    </div>
  );
}

/** مؤشر تحديث خفيف يظهر أثناء إعادة الجلب في الخلفية. */
export function RefreshingBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -top-9 left-0 z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur",
        className
      )}
      role="status"
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      جارٍ التحديث…
    </div>
  );
}
