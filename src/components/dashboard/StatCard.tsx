import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  format?: "currency" | "number" | "percent" | "raw";
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  format = "number",
  icon: Icon,
  trend,
  trendLabel,
  iconBg = "bg-primary-50 text-primary",
}: StatCardProps) {
  const formatted = (() => {
    if (format === "raw") return value;
    if (typeof value === "number") {
      if (format === "currency") return `$${formatNumber(value)}`;
      if (format === "percent") return `${value}%`;
      return formatNumber(value);
    }
    return value;
  })();

  const isPositive = (trend ?? 0) >= 0;

  return (
    <Card className="overflow-hidden transition-all hover:border-primary-100 hover:shadow-card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 truncate text-sm text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatted}
            </p>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold",
                    isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(trend)}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              iconBg
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
