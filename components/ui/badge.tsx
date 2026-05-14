import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("badge", {
  variants: {
    variant: {
      success: "badge-success",
      warning: "badge-warning",
      danger: "badge-danger",
      muted: "badge-muted",
      info: "badge-info",
    },
  },
  defaultVariants: {
    variant: "muted",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-green-500",
            variant === "warning" && "bg-yellow-500",
            variant === "danger" && "bg-red-500",
            variant === "muted" && "bg-slate-400",
            variant === "info" && "bg-blue-500"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
