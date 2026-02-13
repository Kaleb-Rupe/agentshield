import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border border-primary/20",
        secondary:
          "bg-white/[0.06] text-muted-foreground border border-white/[0.08]",
        destructive:
          "bg-red-500/15 text-red-400 border border-red-500/20",
        outline:
          "text-foreground border border-white/10",
        success:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
        warning:
          "bg-amber-500/15 text-amber-400 border border-amber-500/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
