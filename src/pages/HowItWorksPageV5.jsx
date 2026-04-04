import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../components/Navbar.jsx";
import LandingFooter from "../components/LandingFooter.jsx";
import { WHITEPAPER_SITE_URL } from "../phases/constants.js";
import "../styles/how-it-works.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────
   Section sub-components (no special JS)
   ──────────────────────────────────────────────── */

function TrustChain() {
  return (
    <section className="s1" id="s1">
      <div className="sec-inner">
        <div className="pill gs">Act 1 — The Problem</div>
        <h2 className="headline gs">
          When agents delegate,
          <br />
          trust breaks down
        </h2>
        <p className="subline gs">
          Alice asks her agent to book a flight. It delegates to a flight agent,
          which delegates to payment, which delegates to the bank. Watch what
          happens to her identity at each hop.
        </p>

        <div className="chain-grid gs">
          {/* Your Agent */}
          <div className="agent-card">
            <div className="agent-header">
              <span className="agent-icon">👤</span>
              <span className="agent-name">Your Agent</span>
              <span className="trust-badge trust-green">100%</span>
            </div>
            <div className="signal-row">
              <span className="signal-label">Signal</span>
              <div className="signal-bars">
                <div className="signal-bar on-g" style={{ height: 8 }} />
                <div className="signal-bar on-g" style={{ height: 12 }} />
                <div className="signal-bar on-g" style={{ height: 16 }} />
                <div className="signal-bar on-g" style={{ height: 20 }} />
              </div>
            </div>
            <div className="field-row field-ok">
              <span className="field-label">Identity</span>
              <span className="field-val">alice.moi</span>
            </div>
            <div className="field-row field-ok">
              <span className="field-label">Scope</span>
              <span className="field-val">Book flight ≤ $500</span>
            </div>
            <div className="field-row field-ok">
              <span className="field-label">Prefs</span>
              <span className="field-val">Window · Vegetarian</span>
            </div>
            <div className="field-row field-ok">
              <span className="field-label">History</span>
              <span className="field-val">12 prior bookings</span>
            </div>
            <p className="agent-note">Full context. Full trust.</p>
            <div className="trust-bar">
              <div className="trust-bar-fill" style={{ width: "100%", background: "var(--bob)" }} />
            </div>
          </div>

          <div className="chain-conn">
            <div className="conn-line" />
            <span className="conn-chevron">›</span>
            <span className="conn-pill">⚠ data lost</span>
            <div className="conn-line" />
          </div>

          {/* Flight Agent */}
          <div className="agent-card">
            <div className="agent-header">
              <span className="agent-icon">✈️</span>
              <span className="agent-name">Flight Agent</span>
              <span className="trust-badge trust-green">65%</span>
            </div>
            <div className="signal-row">
              <span className="signal-label">Signal</span>
              <div className="signal-bars">
                <div className="signal-bar on-g" style={{ height: 8 }} />
                <div className="signal-bar on-g" style={{ height: 12 }} />
                <div className="signal-bar on-g" style={{ height: 16 }} />
                <div className="signal-bar off" style={{ height: 20 }} />
              </div>
            </div>
            <div className="field-row field-ok">
              <span className="field-label">Identity</span>
              <span className="field-val">alice.moi</span>
            </div>
            <div className="field-row field-ok">
              <span className="field-label">Scope</span>
              <span className="field-val">Book flight ≤ $500</span>
            </div>
            <div className="field-row field-redacted">
              <span className="field-label">Prefs</span>
              <span className="field-val">REDACTED</span>
            </div>
            <div className="field-row field-redacted">
              <span className="field-label">History</span>
              <span className="field-val">REDACTED</span>
            </div>
            <p className="agent-note">Preferences & history already gone.</p>
            <div className="trust-bar">
              <div className="trust-bar-fill" style={{ width: "65%", background: "var(--bob)" }} />
            </div>
          </div>

          <div className="chain-conn">
            <div className="conn-line" />
            <span className="conn-chevron">›</span>
            <span className="conn-pill">⚠ data lost</span>
            <div className="conn-line" />
          </div>

          {/* Payment Agent */}
          <div className="agent-card">
            <div className="agent-header">
              <span className="agent-icon">💳</span>
              <span className="agent-name">Payment Agent</span>
              <span className="trust-badge trust-amber">25%</span>
            </div>
            <div className="signal-row">
              <span className="signal-label">Signal</span>
              <div className="signal-bars">
                <div className="signal-bar on-a" style={{ height: 8 }} />
                <div className="signal-bar off" style={{ height: 12 }} />
                <div className="signal-bar off" style={{ height: 16 }} />
                <div className="signal-bar off" style={{ height: 20 }} />
              </div>
            </div>
            <div className="field-row field-deg">
              <span className="field-label">Identity</span>
              <span className="field-val">0xd41...f07</span>
            </div>
            <div className="field-row field-deg">
              <span className="field-label">Scope</span>
              <span className="field-val">charge some amount?</span>
            </div>
            <div className="field-row field-redacted">
              <span className="field-label">Prefs</span>
              <span className="field-val">REDACTED</span>
            </div>
            <div className="field-row field-redacted">
              <span className="field-label">History</span>
              <span className="field-val">REDACTED</span>
            </div>
            <p className="agent-note">Identity reduced to a raw address.</p>
            <div className="trust-bar">
              <div className="trust-bar-fill" style={{ width: "25%", background: "var(--charlie)" }} />
            </div>
          </div>

          <div className="chain-conn">
            <div className="conn-line" />
            <span className="conn-chevron">›</span>
            <span className="conn-pill">⚠ data lost</span>
            <div className="conn-line" />
          </div>

          {/* Bank Agent */}
          <div className="agent-card">
            <div className="agent-header">
              <span className="agent-icon">🏦</span>
              <span className="agent-name">Bank Agent</span>
              <span className="trust-badge trust-red">0%</span>
            </div>
            <div className="signal-row">
              <span className="signal-label">Signal</span>
              <div className="signal-bars">
                <div className="signal-bar off" style={{ height: 8 }} />
                <div className="signal-bar off" style={{ height: 12 }} />
                <div className="signal-bar off" style={{ height: 16 }} />
                <div className="signal-bar off" style={{ height: 20 }} />
              </div>
            </div>
            <div className="field-row field-lost">
              <span className="field-label">Identity</span>
              <span className="field-val blink">UNKNOWN</span>
            </div>
            <div className="field-row field-lost">
              <span className="field-label">Scope</span>
              <span className="field-val blink">UNKNOWN</span>
            </div>
            <div className="field-row field-redacted">
              <span className="field-label">Prefs</span>
              <span className="field-val">REDACTED</span>
            </div>
            <div className="field-row field-redacted">
              <span className="field-label">History</span>
              <span className="field-val">REDACTED</span>
            </div>
            <p className="agent-note">No idea who this is or what they want.</p>
            <div className="trust-bar">
              <div className="trust-bar-fill" style={{ width: "0%" }} />
            </div>
          </div>
        </div>

        <p className="caption gs">
          By the 4th agent, Alice's identity is gone. The bank has no idea who
          authorized this transaction.
        </p>

        <div className="stat-center gs">
          <div className="stat-center-num">73%</div>
          <p className="stat-center-desc">of autonomous agent deployments experienced unintended authority escalation in 2025</p>
          <p className="stat-center-source">— Agent of Chaos, 2025</p>
        </div>

        <p className="impact-line gs">By the 4th hop, you don&apos;t <em>exist</em>.</p>
      </div>
    </section>
  );
}

function ColdStart() {
  return (
    <section className="s2">
      <div className="sec-inner">
        <h2 className="headline gs">
          Every agent starts
          <br />
          from zero
        </h2>
        <p className="subline gs">
          No memory carries over. Every agent cold-starts, asking the same
          questions you've already answered. Context evaporates between agents.
        </p>

        <div className="chat-grid gs">
          <div className="chat-card">
            <div className="chat-chrome">
              <div className="chrome-dot" />
              <div className="chrome-dot" />
              <div className="chrome-dot" />
              <span className="chrome-name">Travel Agent</span>
              <div className="mem-badge"><div className="mem-dot" />0 KB</div>
            </div>
            <div className="chat-body">
              <div className="msg msg-agent">What is your name?</div>
              <div className="msg msg-user">Alice</div>
              <div className="msg msg-agent">Seat preference?</div>
              <div className="msg msg-user">Window seat</div>
            </div>
            <div className="frust-row">
              <span className="frust-label">Frustration</span>
              <div className="frust-track"><div className="frust-fill" style={{ width: "33%" }} /></div>
            </div>
          </div>

          <div className="chat-card">
            <div className="chat-chrome">
              <div className="chrome-dot" />
              <div className="chrome-dot" />
              <div className="chrome-dot" />
              <span className="chrome-name">Payment Agent</span>
              <div className="mem-badge"><div className="mem-dot" />0 KB</div>
            </div>
            <div className="chat-body">
              <div className="msg msg-agent">What is your name?</div>
              <div className="msg msg-user">I already told the last agent...</div>
              <div className="msg msg-agent">Seat preference?</div>
              <div className="msg msg-user">...window seat. Again.</div>
            </div>
            <div className="frust-row">
              <span className="frust-label">Frustration</span>
              <div className="frust-track"><div className="frust-fill" style={{ width: "66%" }} /></div>
            </div>
          </div>

          <div className="chat-card">
            <div className="chat-chrome">
              <div className="chrome-dot" />
              <div className="chrome-dot" />
              <div className="chrome-dot" />
              <span className="chrome-name">Insurance Agent</span>
              <div className="mem-badge"><div className="mem-dot" />0 KB</div>
            </div>
            <div className="chat-body">
              <div className="msg msg-agent">What is your name?</div>
              <div className="msg msg-user">I've answered this 3 times now.</div>
              <div className="msg msg-agent">Seat preference?</div>
              <div className="msg msg-user">I give up.</div>
            </div>
            <div className="frust-row">
              <span className="frust-label">Frustration</span>
              <div className="frust-track"><div className="frust-fill" style={{ width: "99%" }} /></div>
            </div>
          </div>
        </div>

        <p className="caption gs">The same questions. The same blank slate. Every single time.</p>

        <p className="impact-line gs">No memory. No continuity. No <em>you</em>.</p>
      </div>
    </section>
  );
}

function Custody() {
  return (
    <section className="s3">
      <div className="sec-inner">
        <h2 className="headline gs">
          Your tokens live in
          <br />
          someone else's contract
        </h2>
        <p className="subline gs">
          Your balance is just a number in someone else's ledger. The contract
          owns the tokens — you own a row in their mapping. If they pause,
          you're frozen.
        </p>

        <div className="custody-split gs">
          {/* Left — What you think */}
          <div className="custody-card custody-card--safe">
            <span className="custody-card-label">What you think</span>
            <div className="custody-mental-model">
              <div className="cm-node cm-node--you">You</div>
              <div className="cm-arrow">
                <svg width="2" height="40" viewBox="0 0 2 40"><line x1="1" y1="0" x2="1" y2="40" stroke="var(--bob)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                <span className="cm-arrow-label">own</span>
              </div>
              <div className="cm-node cm-node--token">80 MOI</div>
            </div>
            <p className="custody-card-caption">Direct ownership. You hold the tokens.</p>
          </div>

          {/* Divider */}
          <div className="custody-divider" />

          {/* Right — What actually happens */}
          <div className="custody-card custody-card--real">
            <span className="custody-card-label">What actually happens</span>
            <div className="custody-contract">
              <div className="custody-contract-header">
                <span className="custody-contract-dot" />
                <span className="custody-contract-name">SwapRouter.sol</span>
                <span className="custody-contract-owns">Owns all tokens</span>
              </div>
              <div className="custody-ledger">
                <div className="custody-ledger-row">
                  <span className="custody-addr">0xa3f...8c2</span>
                  <span className="custody-arrow">→</span>
                  <span className="custody-amt">240 MOI</span>
                </div>
                <div className="custody-ledger-row custody-ledger-row--you">
                  <span className="custody-addr">0xd41...f07</span>
                  <span className="custody-arrow">→</span>
                  <span className="custody-amt">80 MOI</span>
                  <span className="custody-you-tag">← you</span>
                </div>
                <div className="custody-ledger-row">
                  <span className="custody-addr">0x7b2...1d9</span>
                  <span className="custody-arrow">→</span>
                  <span className="custody-amt">512 MOI</span>
                </div>
                <div className="custody-ledger-row">
                  <span className="custody-addr">0xc19...3f6</span>
                  <span className="custody-arrow">→</span>
                  <span className="custody-amt">920 MOI</span>
                </div>
                <div className="custody-ledger-row">
                  <span className="custody-addr">0x5e4...b81</span>
                  <span className="custody-arrow">→</span>
                  <span className="custody-amt">1,800 MOI</span>
                </div>
              </div>
            </div>
            <p className="custody-card-caption custody-card-caption--red">
              You're row #2 in a mapping. The contract owner can pause, upgrade,
              or drain the pool — and you can't stop them.
            </p>
          </div>
        </div>

        <div className="custody-stats gs">
          <div className="custody-stat"><div className="val">3 contracts</div><div className="lbl">hold your assets</div></div>
          <div className="custody-stat"><div className="val">0 contracts</div><div className="lbl">you control</div></div>
        </div>

        <div className="stat-center gs">
          <div className="stat-center-num">$2.8B</div>
          <p className="stat-center-desc">lost in bridge exploits alone — Ronin ($625M), Wormhole ($320M), Nomad ($190M)</p>
          <p className="stat-center-source">— DeFi exploit data, 2022–2025</p>
        </div>

        <p className="impact-line gs">You own <em>nothing</em>. The contract owns everything.</p>
      </div>
    </section>
  );
}

/** Act 1 closer — dimensions, headline, bridge cards, thesis */
function RootCauseSection() {
  return (
    <section className="s-root-cause">
      <div className="sec-inner" style={{ textAlign: "center" }}>
        <div className="pill gs">The Root Cause</div>

        <div className="act2-dims gs">
          <span className="act2-dim">WHAT <span className="dim-check">✓</span></span>
          <span className="act2-dim">WHERE <span className="dim-check">✓</span></span>
          <span className="act2-dim">HOW <span className="dim-check">✓</span></span>
          <span className="act2-dim act2-dim-miss">
            WHO <span className="dim-miss-badge">MISSING</span>
          </span>
        </div>

        <h2 className="act2-hl gs">
          <span className="act2-hl-l1">Three problems.</span>
          <span className="act2-hl-l2">One missing dimension.</span>
        </h2>

        <div className="act2-cards gs">
          <div className="act2-card">
            <div className="act2-card-label">Trust</div>
            <div className="act2-card-text">
              By the 4th agent, Alice is unknown. No <em>who</em> persists across the chain.
            </div>
          </div>
          <div className="act2-card">
            <div className="act2-card-label">Context</div>
            <div className="act2-card-text">
              Every agent asks the same questions. No <em>who</em> carries memory between them.
            </div>
          </div>
          <div className="act2-card">
            <div className="act2-card-label">Assets</div>
            <div className="act2-card-text">
              Your tokens live in someone else&apos;s mapping. No <em>who</em> actually owns them.
            </div>
          </div>
        </div>

        <p className="impact-line gs s-root-cause-thesis">
          The <em>participant</em> does not exist in the machine.
        </p>
      </div>
    </section>
  );
}

/** Act 2 — MOI reveal only */
function Act2RevealSection() {
  const moiRef = useRef(null);

  useEffect(() => {
    const el = moiRef.current;
    if (!el) return;

    const reveal = () => {
      el.classList.add("vis");
    };

    const tryReveal = () => {
      if (el.classList.contains("vis")) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom > 0 && r.top < vh * 0.94) reveal();
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          obs.disconnect();
        }
      },
      { threshold: 0, rootMargin: "160px 0px" }
    );
    obs.observe(el);

    tryReveal();
    requestAnimationFrame(() => requestAnimationFrame(tryReveal));
    const t1 = window.setTimeout(tryReveal, 120);
    const t2 = window.setTimeout(tryReveal, 600);

    return () => {
      obs.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <section className="s-act2-reveal">
      <div className="sec-inner" style={{ textAlign: "center" }}>
        <div className="pill gs">Act 2 — The New Dimension</div>

        <p className="act2-moi-q gs">The missing dimension.</p>

        <div className="act2-moi-word-wrap gs">
          <div className="act2-moi-word" ref={moiRef} aria-label="MOI">
            MOI
          </div>
        </div>

        <p className="act2-moi-tag gs">The Participant Layer of the Internet.</p>

        <p className="impact-line gs">
          Not just identity. Not just memory. <em>Existence.</em>
        </p>

        <p className="act2-moi-sub gs">
          Providing existence to participants through the <em>Context Superstate</em>.
        </p>
      </div>
    </section>
  );
}

function ScopedDelegation() {
  return (
    <section className="s6" id="scopedSection">
      <div className="sec-inner">
        <div className="pill gs">Act 3 — The Solution</div>
        <h2 className="headline gs">
          Delegation is scoped
          <br />
          and signed
        </h2>
        <p className="subline gs">
          Every sub-agent checks back with Alice's context superstate. Trust
          doesn't degrade — it's verified at the source.
        </p>

        <div className="hub-wrap gs" id="hubWrap">
          <div className="hub-ring" />
          <div className="hub-center"><span className="hub-center-label">Alice's<br />Superstate</span></div>

          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }} viewBox="0 0 480 400">
            <line x1="240" y1="200" x2="100" y2="75" stroke="var(--purple)" strokeWidth="1.5" strokeDasharray="4 4" opacity=".45" />
            <line x1="240" y1="200" x2="380" y2="75" stroke="var(--purple)" strokeWidth="1.5" strokeDasharray="4 4" opacity=".45" />
            <line x1="240" y1="200" x2="240" y2="355" stroke="var(--purple)" strokeWidth="1.5" strokeDasharray="4 4" opacity=".45" />
            <circle className="pulse-dot" r="4"><animateMotion dur="1.5s" repeatCount="indefinite" path="M100,75 L240,200" /></circle>
            <circle className="pulse-dot" r="4"><animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s" path="M380,75 L240,200" /></circle>
            <circle className="pulse-dot" r="4"><animateMotion dur="1.5s" repeatCount="indefinite" begin="1s" path="M240,355 L240,200" /></circle>
          </svg>

          <div className="spoke-agent" style={{ top: 25, left: 30 }}>
            <div className="spoke-circle">✈️</div>
            <span className="spoke-name">Flight Agent</span>
            <span className="spoke-scope">book_flight: true</span>
            <span className="spoke-check" id="ck1">✓ Verified</span>
          </div>
          <div className="spoke-agent" style={{ top: 25, right: 30 }}>
            <div className="spoke-circle">💳</div>
            <span className="spoke-name">Payment Agent</span>
            <span className="spoke-scope">charge: $500 max</span>
            <span className="spoke-check" id="ck2">✓ Verified</span>
          </div>
          <div className="spoke-agent" style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}>
            <div className="spoke-circle">🏦</div>
            <span className="spoke-name">Bank Agent</span>
            <span className="spoke-scope">confirm_payment</span>
            <span className="spoke-check" id="ck3">✓ Verified</span>
          </div>
        </div>

        <p className="impact-line gs">Agents and apps log into <em>you</em>. Not the other way around.</p>
      </div>
    </section>
  );
}

function Preferences() {
  return (
    <section className="s7">
      <div className="sec-inner">
        <h2 className="headline gs">
          Your preferences
          <br />
          follow you across networks
        </h2>
        <p className="subline gs rv d1">
          Your context superstate travels with you. Every agent already knows you.
        </p>

        <div className="pref-layout gs">
          <div className="pref-avatar">
            <div className="pref-circle pref-superstate-circle">Your<br />Superstate</div>
            <div className="pref-tags">
              <span className="pref-tag">Window seat</span>
              <span className="pref-tag">Vegetarian</span>
              <span className="pref-tag">English</span>
              <span className="pref-tag">UTC+5:30</span>
            </div>
          </div>

          <div className="pref-agents pref-cards">
            <div className="pref-agent-card">
              <h4>✈️ Travel Agent</h4>
              <div className="pref-field"><span className="check">✓</span> Window seat preference</div>
              <div className="pref-field"><span className="check">✓</span> Vegetarian meal</div>
            </div>
            <div className="pref-agent-card">
              <h4>💳 Payment Agent</h4>
              <div className="pref-field"><span className="check">✓</span> Preferred payment method</div>
              <div className="pref-field"><span className="check">✓</span> Spending limits</div>
              <div className="pref-field"><span className="check">✓</span> Currency preference</div>
            </div>
            <div className="pref-agent-card">
              <h4>🛡️ Insurance Agent</h4>
              <div className="pref-field"><span className="check">✓</span> Travel history</div>
              <div className="pref-field"><span className="check">✓</span> Coverage preferences</div>
              <div className="pref-field"><span className="check">✓</span> Medical dietary needs</div>
              <div className="pref-field"><span className="check">✓</span> Emergency contacts</div>
            </div>
          </div>
        </div>

        <p className="impact-line gs">
          Your <em>context</em> follows you. Not the other way around.
        </p>
      </div>
    </section>
  );
}

function Assets() {
  return (
    <section className="s8">
      <div className="sec-inner">
        <h2 className="headline gs">
          Your assets live
          <br />
          with you
        </h2>
        <p className="subline gs">
          Tokens, credentials, and digital assets are owned by your MOI identity
          — not locked in someone else's contract.
        </p>

        <div className="assets-split gs">
          <div className="assets-side assets-today">
            <div className="assets-side-header">Today - communal vault</div>
            <div className="assets-scattered">
              <div className="assets-contract">
                <span className="assets-contract-name">SwapRouter.sol</span>
                <span className="assets-contract-val">3,200 MOI</span>
              </div>
              <div className="assets-contract">
                <span className="assets-contract-name">VaultV2.sol</span>
                <span className="assets-contract-val">0.5 ETH</span>
              </div>
              <div className="assets-contract">
                <span className="assets-contract-name">LendPool.sol</span>
                <span className="assets-contract-val">1,200 USDC</span>
              </div>
            </div>
            <p className="assets-side-caption">Scattered across 3 contracts you don't control.</p>
          </div>

          <div className="assets-divider" />

          <div className="assets-side assets-moi">
            <div className="assets-side-header">With MOI - personal safe</div>
            <div className="assets-unified">
              <div className="assets-context-label">Your context superstate</div>
              <div className="assets-grid">
                <div className="assets-item">3,200 MOI</div>
                <div className="assets-item">0.5 ETH</div>
                <div className="assets-item">1,200 USDC</div>
              </div>
            </div>
            <p className="assets-side-caption">All in one place. Apps never hold them.</p>
          </div>
        </div>

        <p className="impact-line gs">Your assets live with <em>you</em>. Not in someone else&apos;s contract.</p>
      </div>
    </section>
  );
}

function Permissions() {
  return (
    <section className="s9">
      <div className="sec-inner">
        <h2 className="headline gs">
          You control who
          <br />
          sees what
        </h2>
        <p className="subline gs">
          Your flight agent sees travel preferences — not health data. Your
          doctor sees health — not finances. Privacy by design.
        </p>

        <div className="perm-table-wrap gs">
          <table className="perm-table">
            <thead>
              <tr>
                <th />
                <th>✈️ Travel</th>
                <th>🏥 Doctor</th>
                <th>🏦 Finance</th>
                <th>🤖 AI Assist</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="perm-row-label">Passport</td>
                <td className="perm-yes">✓</td>
                <td className="perm-no">✗</td>
                <td className="perm-no">✗</td>
                <td className="perm-no">✗</td>
              </tr>
              <tr>
                <td className="perm-row-label">Payment</td>
                <td className="perm-yes">✓</td>
                <td className="perm-no">✗</td>
                <td className="perm-yes">✓</td>
                <td className="perm-no">✗</td>
              </tr>
              <tr>
                <td className="perm-row-label">Health records</td>
                <td className="perm-no">✗</td>
                <td className="perm-yes">✓</td>
                <td className="perm-no">✗</td>
                <td className="perm-no">✗</td>
              </tr>
              <tr>
                <td className="perm-row-label">Location</td>
                <td className="perm-yes">✓</td>
                <td className="perm-yes">✓</td>
                <td className="perm-no">✗</td>
                <td className="perm-yes">✓</td>
              </tr>
              <tr>
                <td className="perm-row-label">Preferences</td>
                <td className="perm-yes">✓</td>
                <td className="perm-yes">✓</td>
                <td className="perm-yes">✓</td>
                <td className="perm-yes">✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="impact-line gs">Your privacy policy applied to <em>them</em>. Not theirs applied to you.</p>
      </div>
    </section>
  );
}

function ContextSuperstate() {
  return (
    <section className="s-superstate">
      <div className="sec-inner" style={{ textAlign: "center" }}>
        <div className="pill gs">The Context Superstate</div>
        <h2 className="headline gs" style={{ textAlign: "center" }}>
          Seven sub-contexts.
          <br />
          One participant.
        </h2>
        <p className="subline gs" style={{ margin: "0 auto" }}>
          The cryptographic data structure that represents your entire
          existence in computation. Always current. Always available. Always
          sovereign.
        </p>

        <div className="superstate-card gs">
          <div className="ss-identity">
            <div className="ss-identity-icon">ψ</div>
            <div className="ss-identity-label">alice.moi</div>
          </div>
          <div className="ss-grid">
            <div className="ss-ctx">
              <div className="ss-ctx-name">Assets</div>
              <div className="ss-ctx-desc">Native tokens, balances, metadata</div>
            </div>
            <div className="ss-ctx">
              <div className="ss-ctx-name">Trust</div>
              <div className="ss-ctx-desc">Witness sets, delegation chains</div>
            </div>
            <div className="ss-ctx">
              <div className="ss-ctx-name">Storage</div>
              <div className="ss-ctx-desc">Participant-owned data, records</div>
            </div>
            <div className="ss-ctx">
              <div className="ss-ctx-name">Logic</div>
              <div className="ss-ctx-desc">Deployed code, interaction handlers</div>
            </div>
            <div className="ss-ctx">
              <div className="ss-ctx-name">Keys</div>
              <div className="ss-ctx-desc">Cryptographic keys, rotation</div>
            </div>
            <div className="ss-ctx">
              <div className="ss-ctx-name">Preferences</div>
              <div className="ss-ctx-desc">Privacy policies, constraints</div>
            </div>
            <div className="ss-ctx ss-ctx-wide">
              <div className="ss-ctx-name">Intelligence</div>
              <div className="ss-ctx-desc">
                Participant embeddings, interaction patterns
              </div>
            </div>
          </div>
          <div className="ss-footer">
            <span>Merkle-committed</span>
            <span>·</span>
            <span>One hash</span>
            <span>·</span>
            <span>One participant</span>
          </div>
        </div>

        <div className="formula-vs gs">
          <div className="formula-old">
            <div className="formula-old-label">Classical Compute (WHO = 0)</div>
            <div className="formula-old-eq">δ(S, I) → (S&apos;, O)</div>
            <div className="formula-old-note">Anonymous. Copyable. Context-free.</div>
          </div>
          <div className="formula-new">
            <div className="formula-new-label">Contextual Compute (WHO &gt; 0)</div>
            <div className="formula-pill">
              ψ(<span className="fp-highlight">P</span>, C, I) → (<span className="fp-highlight">P</span>, C&apos;, V)
            </div>
            <div className="formula-new-note">
              Participant-indexed. Linear. Participant-bound.
            </div>
          </div>
        </div>

        <p className="impact-line gs">
          The <em>participant</em> persists. The context transforms. Value is produced.
        </p>
      </div>
    </section>
  );
}

const ARCH_P = [
  { name: "Alice", color: "#7B5EA7", speed: 0.6 },
  { name: "Bob", color: "#3A8F6E", speed: 0.8 },
  { name: "Charlie", color: "#C47A2D", speed: 0.5 },
  { name: "Diana", color: "#2D7EC4", speed: 0.7 },
  { name: "Eve", color: "#C44D5A", speed: 0.55 },
];
const ARCH_BRIDGES = [
  { from: 0, to: 1, x: 0.35, label: "swap" },
  { from: 2, to: 3, x: 0.65, label: "lend" },
];

function ArchitectureSection() {
  const funnelRef = useRef(null);
  const lanesRef = useRef(null);

  useEffect(() => {
    const cleanups = [];

    function initCanvas(canvas, drawFn) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let animId = null;

      function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener("resize", resize);

      function loop(time) {
        drawFn(ctx, canvas.clientWidth, canvas.clientHeight, time);
        animId = requestAnimationFrame(loop);
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              if (!animId) animId = requestAnimationFrame(loop);
            } else {
              if (animId) { cancelAnimationFrame(animId); animId = null; }
            }
          });
        },
        { rootMargin: "100px" }
      );
      io.observe(canvas);

      cleanups.push(() => {
        window.removeEventListener("resize", resize);
        if (animId) cancelAnimationFrame(animId);
        io.disconnect();
      });
    }

    /* ── Funnel draw ── */
    const txs = [];
    let lastSpawn = 0;
    let blockNum = 1045;
    let blockTxCount = 0;

    function drawFunnel(ctx, W, H, time) {
      ctx.clearRect(0, 0, W, H);

      const pLeft = W * 0.05;
      const neckX = W * 0.6;
      const neckY = H * 0.5;
      const blockX = W * 0.72;
      const blockW = W * 0.12;
      const blockH = H * 0.4;
      const pSpacing = H * 0.15;
      const pTop = H * 0.5 - (4 * pSpacing) / 2;

      ARCH_P.forEach((p, i) => {
        const py = pTop + i * pSpacing;
        ctx.beginPath();
        ctx.arc(pLeft + 30, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = '300 9px "DM Mono", monospace';
        ctx.fillStyle = "rgba(26,26,26,0.45)";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(p.name, pLeft + 20, py);
        ctx.beginPath();
        ctx.moveTo(pLeft + 38, py);
        ctx.quadraticCurveTo(W * 0.35, py, neckX, neckY + (i - 2) * 3);
        ctx.strokeStyle = "rgba(26, 26, 26, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      if (time - lastSpawn > 100 + Math.random() * 80) {
        lastSpawn = time;
        txs.push({
          progress: 0,
          pIdx: Math.floor(Math.random() * 5),
          wobble: Math.random() * Math.PI * 2,
          lane: (Math.random() - 0.5) * 0.7,
        });
        if (txs.length > 50) txs.shift();
      }

      ctx.beginPath();
      ctx.roundRect(blockX, neckY - blockH / 2, blockW, blockH, 6);
      ctx.fillStyle = "rgba(26,26,26,0.02)";
      ctx.strokeStyle = "rgba(26,26,26,0.06)";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
      ctx.font = '400 8px "DM Mono", monospace';
      ctx.fillStyle = "rgba(26,26,26,0.4)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Block #" + blockNum, blockX + blockW / 2, neckY - blockH / 2 + 6);

      for (let g = 1; g <= 3; g++) {
        const gx = blockX + (blockW + 6) * g;
        ctx.beginPath();
        ctx.roundRect(gx, neckY - blockH / 2 + g * 4, blockW * 0.8, blockH - g * 8, 4);
        ctx.fillStyle = `rgba(26,26,26,${0.015 / g})`;
        ctx.strokeStyle = `rgba(26,26,26,${0.03 / g})`;
        ctx.lineWidth = 0.5;
        ctx.fill();
        ctx.stroke();
      }

      let bottleneckCount = 0;
      txs.forEach((tx) => {
        tx.progress += 0.003 + Math.random() * 0.001;
        const pr = Math.min(1, tx.progress);
        const srcY = pTop + tx.pIdx * pSpacing;
        let x, y, alpha = 1;
        if (pr < 0.4) {
          const t = pr / 0.4;
          x = (pLeft + 38) + (neckX - pLeft - 38) * t * t;
          y = srcY + (neckY - srcY) * t * t;
        } else if (pr < 0.7) {
          const t = (pr - 0.4) / 0.3;
          x = neckX + (blockX - neckX) * t;
          y = neckY + tx.lane * 18 + Math.sin(time * 0.004 + tx.wobble) * 3;
          bottleneckCount++;
        } else {
          const t = (pr - 0.7) / 0.3;
          const slotX = blockX + 8 + (tx.pIdx % 3) * 12;
          const slotY = neckY - blockH / 2 + 22 + Math.floor(tx.pIdx / 3) * 12;
          x = blockX + (slotX - blockX) * t;
          y = neckY + (slotY - neckY) * t;
          alpha = 1 - t * 0.3;
        }
        if (pr >= 1) return;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ARCH_P[tx.pIdx].color;
        ctx.globalAlpha = alpha * 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      for (let i = txs.length - 1; i >= 0; i--) {
        if (txs[i].progress >= 1) {
          txs.splice(i, 1);
          blockTxCount++;
          if (blockTxCount >= 8) { blockTxCount = 0; blockNum++; }
        }
      }

      if (bottleneckCount > 3) {
        ctx.font = '400 9px "DM Mono", monospace';
        ctx.fillStyle = "rgba(196, 77, 90, 0.45)";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(bottleneckCount + " txns waiting...", neckX, neckY + 36);
        ctx.font = '500 7px "DM Mono", monospace';
        ctx.fillStyle = "rgba(196, 77, 90, 0.3)";
        ctx.fillText("⚠ HIGH CONTENTION", neckX, neckY + 48);
      }

      ctx.font = '300 8px "DM Mono", monospace';
      ctx.fillStyle = "rgba(26, 26, 26, 0.3)";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("one block at a time →", blockX + blockW / 2, neckY + blockH / 2 + 16);
    }

    /* ── Lanes draw ── */
    function drawLanes(ctx, W, H, time) {
      ctx.clearRect(0, 0, W, H);
      const lL = W * 0.18;
      const lR = W * 0.82;
      const lW = lR - lL;
      const sp = H / (ARCH_P.length + 1);

      ARCH_P.forEach((p, i) => {
        const ly = sp * (i + 1);
        ctx.beginPath();
        ctx.moveTo(lL, ly);
        ctx.lineTo(lR, ly);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(lL - 8, ly, 8, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.font = '400 9px "DM Mono", monospace';
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.65;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(p.name, lL - 22, ly);
        ctx.globalAlpha = 1;

        for (let d = 0; d < 6; d++) {
          const phase = ((time * 0.0001 * p.speed + d * 0.17 + i * 0.23) % 1);
          const dx = lL + phase * lW;
          const dy = ly + Math.sin(phase * Math.PI * 3 + i + d) * 2;
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.15 + Math.sin(phase * Math.PI) * 0.25;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        const bn = Math.floor(time * (0.0004 + i * 0.00015)) % 9000 + 1000;
        const chipX = lR + 10;
        ctx.beginPath();
        ctx.roundRect(chipX, ly - 12, 44, 24, 4);
        ctx.fillStyle = "rgba(26,26,26,0.015)";
        ctx.strokeStyle = "rgba(26,26,26,0.05)";
        ctx.lineWidth = 0.5;
        ctx.fill();
        ctx.stroke();
        ctx.font = '400 8px "DM Mono", monospace';
        ctx.fillStyle = "rgba(26,26,26,0.4)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("#" + bn, chipX + 22, ly);
      });

      ARCH_BRIDGES.forEach((br) => {
        const y1 = sp * (br.from + 1);
        const y2 = sp * (br.to + 1);
        const bx = lL + br.x * lW;
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(bx, y1);
        ctx.lineTo(bx, y2);
        ctx.strokeStyle = "rgba(123,94,167,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        const tPhase = ((time * 0.0008 + br.x * 3) % 2) / 2;
        const ty = y1 + (y2 - y1) * tPhase;
        ctx.beginPath();
        ctx.arc(bx, ty, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(123,94,167,0.5)";
        ctx.fill();
        ctx.font = '300 7px "DM Mono", monospace';
        ctx.fillStyle = "rgba(123,94,167,0.3)";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(br.label, bx, Math.min(y1, y2) - 6);
      });
    }

    initCanvas(funnelRef.current, drawFunnel);
    initCanvas(lanesRef.current, drawLanes);

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section className="s10 s-arch" id="archSection">
      <div className="sec-inner">
        <div className="pill gs">Act 4 — The Architecture</div>
        <h2 className="headline gs">
          Independent. Parallel.
          <br />
          Participant-centric.
        </h2>
        <p className="subline gs">
          Instead of one shared blockchain where everyone queues for the same
          block, each participant has their own execution environment, running
          in parallel.
        </p>

        <div className="arch-split gs">
          <div className="arch-side arch-today">
            <div className="arch-side-header">Today — shared chain</div>
            <div className="arch-canvas-wrap">
              <canvas ref={funnelRef} />
            </div>
          </div>

          <div className="arch-divider" />

          <div className="arch-side arch-moi">
            <div className="arch-side-header">With MOI — MDAG architecture</div>
            <div className="arch-canvas-wrap">
              <canvas ref={lanesRef} />
            </div>
            <p className="arch-side-caption">
              Every participant runs independently.
            </p>
          </div>
        </div>

        <p className="impact-line gs">
          No global queue. No shared bottleneck. Truly <em>parallel</em>. Truly{" "}
          <em>contextual</em>.
        </p>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="s11">
      <div className="sec-inner">
        <div className="pill gs">Act 5</div>
        <blockquote className="closing-quote gs">
          <p>You are no longer a row in a database,<br />a wallet in a contract,<br />or a profile in an app.</p>
          <p className="closing-em">You have independent existence.</p>
          <p className="closing-tag">This is what the digitally interacting world requires.</p>
        </blockquote>
        <h2 className="cta-hl gs">
          The participant layer
          <br />
          is live.
        </h2>
        <p className="cta-sub gs">
          Read the full thesis. Or start building today.
        </p>
        <div className="cta-btns gs">
          <a
            href={WHITEPAPER_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Read the whitepaper →
          </a>
          <a
            href="https://docs.moi.technology"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Start Building →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────
   Main page — GSAP ScrollTrigger orchestration
   ──────────────────────────────────────────────── */

export default function HowItWorksPageV5() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const page = pageRef.current;
      if (!page) return;

      const allGs = page.querySelectorAll(".gs");
      gsap.set(allGs, { opacity: 0, y: 40, willChange: "opacity, transform" });

      const sections = page.querySelectorAll("section");

      sections.forEach((section, i) => {
        const gsEls = section.querySelectorAll(".gs");
        if (gsEls.length === 0) return;

        if (i === 0) {
          gsap.to(gsEls, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            delay: 0.3,
            ease: "power2.out",
            clearProps: "willChange",
          });
          return;
        }

        /* ── S6: Scoped Delegation — checkmark reveals ── */
        if (section.id === "scopedSection") {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              toggleActions: "play none none none",
            },
          });

          tl.to(gsEls, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power2.out",
            clearProps: "willChange",
          });

          tl.call(() => document.getElementById("ck1")?.classList.add("show"), null, "+=0.9");
          tl.call(() => document.getElementById("ck2")?.classList.add("show"), null, "+=0.45");
          tl.call(() => document.getElementById("ck3")?.classList.add("show"), null, "+=0.45");
          return;
        }

        /* ── All other sections — standard staggered entrance ── */
        gsap.to(gsEls, {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.15,
          ease: "power2.out",
          clearProps: "willChange",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      });

    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <Navbar activePage="how-it-works" />
      <div ref={pageRef} className="how-it-works-page">
        <TrustChain />
        <div className="section-divider" />
        <ColdStart />
        <div className="section-divider" />
        <Custody />
        <div className="section-divider" />
        <RootCauseSection />
        <div className="section-divider" />
        <Act2RevealSection />
        <div className="section-divider" />
        <ScopedDelegation />
        <div className="section-divider" />
        <Preferences />
        <div className="section-divider" />
        <Assets />
        <div className="section-divider" />
        <Permissions />
        <div className="section-divider" />
        <ContextSuperstate />
        <div className="section-divider" />
        <ArchitectureSection />
        <div className="section-divider" />
        <CallToAction />
      </div>
      <LandingFooter />
    </>
  );
}
