"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<FilterSelectOption<T>>;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
  triggerClassName,
  disabled,
}: FilterSelectProps<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select.Root value={value} onValueChange={(next) => onChange(next as T)} disabled={disabled}>
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-9 min-w-32 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          triggerClassName,
          className,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl"
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex h-8 cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-3 font-semibold text-slate-700 outline-none data-[highlighted]:bg-emerald-50 data-[highlighted]:text-emerald-700"
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
