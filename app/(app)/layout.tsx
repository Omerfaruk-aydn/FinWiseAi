import * as React from "react";
import { AppLayoutClient } from "./app-layout-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
