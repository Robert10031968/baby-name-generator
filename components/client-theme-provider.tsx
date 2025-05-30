"use client";

import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";

export function ClientThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}