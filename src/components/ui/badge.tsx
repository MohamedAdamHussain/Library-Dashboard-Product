import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary:
          "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
        secondary:
          "bg-secondary/15 text-secondary-700 border-secondary/25 hover:bg-secondary/20",
        success:
          "bg-success/10 text-success border-success/20 hover:bg-success/15",
        warning:
          "bg-warning/10 text-warning-foreground border-warning/25 hover:bg-warning/15",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
        outline: "border-border text-foreground bg-transparent",
        default: "bg-muted text-muted-foreground border-transparent",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
