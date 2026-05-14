import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("empty-state", className)}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted">
          {icon}
        </div>
      )}
      <p className="text-h4 font-medium text-primary">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
