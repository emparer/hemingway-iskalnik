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
        <div className="site-shell">
          <div className="toolbar">
            <div className="container toolbar-inner">
              <div className="toolbar-links">
                <a href="tel:059337444">059 337 444</a>
                <a href="mailto:info@hemingway.si">info@hemingway.si</a>
              </div>
              <div className="socials">
                <a href="https://www.facebook.com/hemingway.si" target="_blank" rel="noopener">
                  <img src="/facebook.png" alt="Facebook" width="20" height="20" />
                </a>
                <a href="https://www.instagram.com/hemingwaypotovanja/" target="_blank" rel="noopener">
                  <img src="/instagram.png" alt="Instagram" width="20" height="20" />
                </a>
              </div>
            </div>
          </div>

          <nav className="navbar">
            <div className="container navbar-inner">
              <Link href="/" className="brand-lockup">
                <img src="/hemingway.png" alt="Hemingway Travel Selection" className="brand-logo" />
              </Link>
            </div>
          </nav>

          {children}

          <footer className="toolbar footerbar">
            <div className="container footer-inner">
              <span>Vse pravice pridržane. © Hemingway d.o.o.</span>
              <a href="https://pangersic.com" target="_blank" rel="noopener">
                pangersic.com
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
