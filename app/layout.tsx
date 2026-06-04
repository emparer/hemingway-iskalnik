import "./globals.css";
import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Hemingway potovalna agencija",
  description: "Počitnice z letalom, namestitve in potovanja",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
