//app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hemingway potovalna agencija",
  description: "Počitnice z letalom, namestitve in potovanja",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>
        <div className="toolbar">
          <div className="container toolbar-inner">
            <span>
              <a href="tel:059337444">☎ 059 337 444</a>
              &nbsp;&nbsp;
              <a href="mailto:info@hemingway.si">✉ info@hemingway.si</a>
            </span>
            <span className="socials">
              <a href="https://www.facebook.com/hemingway.si" target="_blank" rel="noopener">Facebook</a>
              <a href="https://www.instagram.com/hemingwaypotovanja/" target="_blank" rel="noopener">Instagram</a>
            </span>
          </div>
        </div>

        <nav className="navbar">
          <div className="container navbar-inner">
            <Link href="/" className="brand">HEMINGWAY</Link>
            <div className="nav">
              <Link href="/?type=pauschal">✈ Počitnice z letalom</Link>
              <Link href="/?type=hotel">🏠 Samo namestitve</Link>
              <Link href="/?type=trips">🚌 Potovanja</Link>
            </div>
          </div>
        </nav>

        {children}

        <footer className="toolbar footerbar">
          <div className="container footer-inner">
            <span>Vse pravice pridržane. © Hemingway d.o.o.</span>
            <a href="https://mtravel.si" target="_blank" rel="noopener">
              mtravel.si
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
