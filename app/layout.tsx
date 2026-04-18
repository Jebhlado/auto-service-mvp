import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "AutoCare Connect",
  description: "Lean automotive services marketplace MVP built with Next.js and Supabase."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="page-shell">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
