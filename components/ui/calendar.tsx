"use client";

import * as React from "react";
import { Calendar, type CalendarProps } from "@/components/ui/calendar-rac";

export interface DateViewerProps extends CalendarProps {}

const DateViewer = React.forwardRef<HTMLDivElement, DateViewerProps>(
  ({ className, ...props }, ref) => {
    return <Calendar ref={ref} className={`rounded-lg border shadow-sm ${className ?? ""}`} {...props} />;
  }
);

DateViewer.displayName = "DateViewer";

export default DateViewer;
