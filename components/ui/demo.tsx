"use client";

import * as React from "react";
import { useState } from "react";
import DateViewer from "@/components/ui/calendar";

const DateViewerDemo = () => {
  const [date, setDate] = useState<any>(new Date(2025, 5, 12));

  return (
    <div className="flex min-h-[450px] w-full items-center justify-center bg-background p-10">
      <DateViewer
        value={date}
        onChange={setDate}
      />
    </div>
  );
};

export { DateViewerDemo as DemoOne };
