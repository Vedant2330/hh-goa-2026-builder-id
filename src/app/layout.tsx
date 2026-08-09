import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BRAND_CONFIG } from "@/lib/brand";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HH Goa 2026 — Builder ID Generator",
  description:
    "Official Builder Pass & PFP Generator for Hacker House Goa 2026. Organized by 2:47 PM Studio. #FrameInGoa",
  openGraph: {
    title: "HH Goa 2026 — Builder ID Generator",
    description:
      "Generate your official Builder ID Pass for Hacker House Goa 2026. #FrameInGoa",
    siteName: "Hacker House Goa 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "HH Goa 2026 — Builder ID Generator",
    description: "Generate your official Builder ID Pass for Hacker House Goa 2026. #FrameInGoa",
    creator: "@247pmstudio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#070A0F] text-slate-100">
        {children}
      </body>
    </html>
  );
}
