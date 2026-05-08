import Link from "next/link";
import {ArrowRight, Check, Code2, KeyRound, ScanLine, Wrench} from "lucide-react";

export default function HomePage() {
  return (
    <main className="marketing-page">
      <header className="marketing-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">DA</span>
          <span>DocAlly</span>
        </Link>
        <nav>
          <Link href="/signup">Get API key</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div>
          <p className="eyebrow">Accessibility API for developers</p>
          <h1>Scan your site. Fix the code. Ship accessible pages.</h1>
          <p className="hero-copy">
            DocAlly finds accessibility issues across your website and returns code-level fixes developers can copy, review,
            and apply.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/signup">
              Get API key <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="button" href="/dashboard">
              Start scanning
            </Link>
          </div>
        </div>

        <div className="funnel-panel" aria-label="DocAlly product funnel">
          <FunnelStep icon={<ScanLine size={16} />} title="1. Scan" text="POST /v1/scan with a URL and profile." />
          <FunnelStep icon={<Wrench size={16} />} title="2. Fix" text="Choose issue IDs and request code diffs." />
          <FunnelStep icon={<Code2 size={16} />} title="3. Ship" text="Copy HTML/CSS changes into your project." />
        </div>
      </section>

      <section className="marketing-strip">
        <div>
          <span className="mono-number">02</span>
          <p>API endpoints</p>
        </div>
        <div>
          <span className="mono-number">50</span>
          <p>pages per full crawl</p>
        </div>
        <div>
          <span className="mono-number">14</span>
          <p>issue categories</p>
        </div>
      </section>

      <section className="marketing-grid">
        <ProductCard icon={<KeyRound />} title="API key in one step" text="Email signup issues a demo key and drops you directly into the dashboard." />
        <ProductCard icon={<ScanLine />} title="Scanner included" text="Enter a URL, choose crawl depth, and review page-by-page accessibility results without writing code." />
        <ProductCard icon={<Check />} title="Developer-ready fixes" text="Every fix includes before, after, and explanation so teams can review changes quickly." />
      </section>
    </main>
  );
}

function FunnelStep({icon, title, text}: {icon: React.ReactNode; title: string; text: string}) {
  return (
    <div className="funnel-step">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function ProductCard({icon, title, text}: {icon: React.ReactNode; title: string; text: string}) {
  return (
    <article className="marketing-card">
      <span aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}
