"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowRight, Check, Mail} from "lucide-react";

const demoKey = process.env.NEXT_PUBLIC_DOCALLY_DEMO_API_KEY || "dk_test_docally_demo_key";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [issued, setIssued] = useState(false);

  function issueKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    window.localStorage.setItem("docally_email", email);
    window.localStorage.setItem("docally_api_key", demoKey);
    setIssued(true);
  }

  return (
    <main className="signup-page">
      <Link className="brand signup-brand" href="/">
        <span className="brand-mark">DA</span>
        <span>DocAlly</span>
      </Link>
      <section className="signup-card">
        <p className="eyebrow">Get API key</p>
        <h1>Start scanning in the next screen.</h1>
        <p className="hero-copy">Enter your email. DocAlly issues a local demo API key and opens the developer dashboard.</p>
        <form onSubmit={issueKey}>
          <label htmlFor="email">Work email</label>
          <div className="signup-row">
            <input
              id="email"
              className="input"
              type="email"
              required
              value={email}
              placeholder="you@company.com"
              onChange={(event) => setEmail(event.target.value)}
            />
            <button className="button primary" type="submit">
              <Mail size={16} /> Issue key
            </button>
          </div>
        </form>

        {issued ? (
          <div className="issued-key">
            <Check size={16} />
            <div>
              <strong>API key issued</strong>
              <code>{demoKey}</code>
            </div>
            <Link className="button primary" href="/dashboard">
              Dev dashboard <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
