import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import NextTopLoader from "nextjs-toploader";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://skillnote.lk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Skill Note — Smart learning for Sri Lankan A/L students",
    template: "%s | Skill Note",
  },
  description: "Learn, practice and improve with syllabus tracking, assessments, revision and performance insights for G.C.E. Advanced Level students in Sri Lanka.",
  applicationName: "Skill Note",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Skill Note",
    title: "Skill Note — Smart learning for Sri Lankan A/L students",
    description: "Learn, practice and improve with structured A/L learning tools.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Note — Smart learning for Sri Lankan A/L students",
    description: "Learn, practice and improve with structured A/L learning tools.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <NextTopLoader color="#2C4BE0" height={2.5} showSpinner={false} shadow="0 0 8px #2C4BE0" />
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
