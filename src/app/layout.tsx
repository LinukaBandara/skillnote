import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "Skill Note — Smart learning for Sri Lankan A/L students",
  description: "Learn. Practice. Improve. Syllabus tracking, past papers, and performance insights for G.C.E. Advanced Level students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <NextTopLoader color="#2C4BE0" height={2.5} showSpinner={false} shadow="0 0 8px #2C4BE0" />
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
