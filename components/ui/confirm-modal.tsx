"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  variant?: "danger" | "warning";
  children?: React.ReactNode;
}

function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Sil",
  cancelLabel = "İptal",
  onConfirm,
  loading = false,
  variant = "danger",
  children,
}: ConfirmModalProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
    }
  };

  const isLoading = loading || isPending;

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>}

      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </AlertDialog.Overlay>
            <AlertDialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
                  "card p-6 shadow-dropdown"
                )}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      variant === "danger" ? "bg-red-100 text-danger" : "bg-yellow-100 text-warning"
                    )}
                    aria-hidden="true"
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <AlertDialog.Title className="text-h4 font-semibold text-primary">
                      {title}
                    </AlertDialog.Title>
                    {description && (
                      <AlertDialog.Description className="mt-1.5 text-sm text-muted">
                        {description}
                      </AlertDialog.Description>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <AlertDialog.Cancel asChild>
                    <Button variant="ghost" size="md" disabled={isLoading}>
                      {cancelLabel}
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <Button
                      variant={variant === "danger" ? "danger" : "primary"}
                      size="md"
                      loading={isLoading}
                      onClick={handleConfirm}
                    >
                      {confirmLabel}
                    </Button>
                  </AlertDialog.Action>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
}

export { ConfirmModal };
export type { ConfirmModalProps };
