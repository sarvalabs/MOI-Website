import { useEffect } from "react";
import Navbar from "../components/Navbar";
import LandingFooter from "../components/LandingFooter";
import "../styles/papers.css";

const PAPERS = [
  {
    key: "lite",
    eyebrow: "01 / Litepaper",
    title: "The Participant Layer of the Internet",
    blurb:
      "The short introduction to the MOI Protocol — a base protocol where participants exist natively in computation. Argues that three domain problems (agents, business, tokens) collapse to a single absence: the participant has no computational existence inside the machine, and shows what changes when WHO becomes a network primitive.",
    file: "/papers/moi-lite-paper.pdf",
    downloadName: "MOI-Lite-Paper.pdf",
  },
  {
    key: "white",
    eyebrow: "02 / White Paper",
    title: "The Linear Substrate and the Authority Layer",
    blurb:
      "MOI Foundations v2.1. Information is Cartesian; value is linear — double-spend is the copy map applied to value, and global consensus is the patch a Cartesian substrate needs to forbid it. Orders value into four classes by writer structure, shows the Participant Layer is the substrate all four require, and develops the MOI Authority Layer (MAL): a stateful, revocable, auditable authority architecture for agentic systems in which tokens are witnesses of valid state rather than bearers of permission.",
    file: "/papers/moi-white-paper.pdf",
    downloadName: "MOI-White-Paper.pdf",
  },
  {
    key: "tech",
    eyebrow: "03 / Tech Paper",
    title: "Contextual Compute: The General Theory of Computation",
    blurb:
      "Introduces the K-Machine — a Turing Machine extended with one primitive dimension, WHO, alongside WHAT, WHERE, and HOW. Classical computation is recovered when the participant dimension collapses to the trivial unit, and is strictly subsumed by participant-indexed computation.",
    file: "https://zenodo.org/records/19500491",
    external: true,
  },
  {
    key: "math",
    eyebrow: "04 / Math Paper",
    title: "Value, Information, and the Cartesian Degeneracy",
    blurb:
      "Establishes the categorical distinction between value and information, proves no structure-preserving embedding can map value into information, and identifies the Cartesian Degeneracy: the parametric collapse of value into information when the participant dimension reduces to the trivial unit.",
    file: "https://zenodo.org/records/19194877",
    external: true,
  },
  {
    key: "pic",
    eyebrow: "05 / Semantics Paper",
    title: "PIC: Operational Semantics of Participant-Indexed Computation",
    blurb:
      "Derives the operational semantics of Contextual Compute from the K-Machine. Formalises the Participant–Interaction–Context (PIC) model and shows that six axioms — Conservation, Consent, Linearity, Witness Sufficiency, Composability, Commutativity — follow necessarily from its structure, defining the PIC value category and introducing Network Objects as a network-level linear-type primitive.",
    file: "https://doi.org/10.5281/zenodo.19189687",
    external: true,
  },
];

export default function PapersPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <>
      <Navbar activePage="papers" />
      <main className="papers-page">
        <section className="papers-hero">
          <span className="papers-eyebrow">Papers</span>
          <h1 className="papers-hl">
            Read the work behind <em>MOI</em>.
          </h1>
          <p className="papers-sub">
            Five documents. The litepaper, the thesis, the theory, the math, the semantics —
            everything that grounds the Participant Layer of the internet.
          </p>
        </section>

        <section className="papers-grid">
          {PAPERS.map((p) => (
            <article key={p.key} className="paper-card">
              <span className="paper-eyebrow">{p.eyebrow}</span>
              <h2 className="paper-title">{p.title}</h2>
              <p className="paper-blurb">{p.blurb}</p>
              <a
                href={p.file}
                className="paper-btn"
                {...(p.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : { download: p.downloadName })}
              >
                {p.external ? (
                  <>
                    Read on Zenodo <span aria-hidden="true">↗</span>
                  </>
                ) : (
                  <>
                    Download PDF <span aria-hidden="true">↓</span>
                  </>
                )}
              </a>
            </article>
          ))}
        </section>

        <LandingFooter />
      </main>
    </>
  );
}
