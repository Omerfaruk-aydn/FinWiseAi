"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronDown } from "lucide-react";
import { CalendarDate, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import DateViewer from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  ariaLabel: string;
}

function formatDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Tarih seçin",
  disabled,
  className,
  triggerClassName,
  contentClassName,
  ariaLabel,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseDate(value) : undefined;
  const defaultMonth = selected ?? today(getLocalTimeZone());

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none transition hover:bg-slate-50 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            triggerClassName,
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-slate-400")}>
            {value ? formatDate(value) : placeholder}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <CalendarDays className="h-4 w-4" />
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className={cn(
            "z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl",
            contentClassName,
          )}
        >
          <DateViewer
            aria-label={ariaLabel}
            value={selected as CalendarDate | undefined}
            defaultValue={defaultMonth as CalendarDate}
            onChange={(next) => {
              onChange(next.toString());
              setOpen(false);
            }}
            className="rounded-xl border-0 shadow-none"
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
