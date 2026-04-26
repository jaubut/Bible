import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bible Companion",
  description: "Read Scripture with a knowledgeable companion at your side.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
