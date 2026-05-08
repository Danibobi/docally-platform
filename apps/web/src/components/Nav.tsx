import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav" aria-label="Main navigation">
      <div className="container nav-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">DA</span>
          DocAlly
        </Link>
        <div className="nav-links">
          <a href="/#product">Product</a>
          <a href="/#compliance">Compliance</a>
          <a href="/#security">Security</a>
          <Link href="/dashboard">Dashboard</Link>
          <Link className="button primary" href="/onboarding">
            Pilot intake
          </Link>
        </div>
      </div>
    </nav>
  );
}
