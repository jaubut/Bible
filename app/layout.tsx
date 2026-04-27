import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeScript from "@/components/ThemeScript";
import { PodcastProvider } from "@/components/PodcastContext";

export const metadata: Metadata = {
  title: "Bible Companion",
  description: "Read Scripture with a knowledgeable companion at your side.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <PodcastProvider>{children}</PodcastProvider>
      </body>
    </html>
  );
}
