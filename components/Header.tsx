import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <>
      <div className="site-toolbar">
        <div className="container site-toolbar-inner">
          <div className="toolbar-left">
            <a href="tel:059337444" className="toolbar-link">
              <span className="toolbar-icon">☎</span>
              059 337 444
            </a>

            <a href="mailto:info@hemingway.si" className="toolbar-link toolbar-email">
              <span className="toolbar-icon">✉</span>
              info@hemingway.si
            </a>
          </div>

          <div className="toolbar-socials">
            <a
              href="https://www.facebook.com/hemingway.si"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="social-link"
            >
              <Image
                src="/images/facebook.png"
                alt=""
                width={18}
                height={18}
              />
            </a>

            <a
              href="https://www.instagram.com/hemingwaypotovanja/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="social-link"
            >
              <Image
                src="/images/instagram.png"
                alt=""
                width={18}
                height={18}
              />
            </a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="site-logo">
            <Image
              src="/images/hemingway.png"
              alt="Hemingway"
              width={260}
              height={90}
              priority
            />
          </Link>

          <nav className="site-nav">
            <Link href="/?type=pauschal">
              <span>✈</span>
              Počitnice z letalom
            </Link>

            <Link href="/?type=hotel">
              <span>⌂</span>
              Samo namestitve
            </Link>

            <Link href="/?type=trips">
              <span>▣</span>
              Potovanja
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}