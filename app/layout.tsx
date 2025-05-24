import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientThemeProvider } from "@/components/client-theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Baby Name Generator",
  description: "Discover the perfect baby name with beautiful meaning and poetry.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientThemeProvider>
          {children}
          <Toaster />
        </ClientThemeProvider>
      </body>
    </html>
  );
}