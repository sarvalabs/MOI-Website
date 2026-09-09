#!/usr/bin/env node
// GEO lint for MOI docs pages — enforces the checkable half of
// DOCS-GEO-STANDARD.md on .md/.mdx sources. Zero dependencies.
//
// Usage:  node lint-docs-geo.mjs <dir-or-file> [...more]
// Env:    GEO_LINT_STRICT=1   description-length warnings become errors
//
// Output: one "::error file=..."/"::warning file=..." annotation per finding
// (GitHub Actions renders these inline on the PR). Exit 1 on any error.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const STRICT = process.env.GEO_LINT_STRICT === "1";
const WARN_ONLY = process.env.GEO_LINT_WARN_ONLY === "1"; // rollout mode: nothing fails
let errors = 0;
let warnings = 0;

function report(kind, file, line, msg) {
  if (WARN_ONLY) kind = "warning";
  if (kind === "error") errors++;
  else warnings++;
  console.log(`::${kind} file=${file},line=${line}::${msg}`);
}

function* walk(p) {
  const st = statSync(p);
  if (st.isFile()) {
    // README files are repo documentation, not content pages — they carry no
    // frontmatter and aren't served as site pages, so the GEO rules don't apply.
    if (basename(p).toLowerCase() === "readme.md") return;
    if ([".md", ".mdx"].includes(extname(p))) yield p;
    return;
  }
  for (const name of readdirSync(p)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    yield* walk(join(p, name));
  }
}

// Minimal frontmatter reader: returns {fields: {key: {value, line, quoted}}, end}
function parseFrontmatter(src) {
  if (!src.startsWith("---\n")) return null;
  const end = src.indexOf("\n---", 4);
  if (end < 0) return null;
  const fields = {};
  const lines = src.slice(4, end).split("\n");
  lines.forEach((ln, i) => {
    const m = ln.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) return;
    const raw = m[2].trim();
    const quoted = /^(["']).*\1$/.test(raw);
    fields[m[1]] = {
      value: quoted ? raw.slice(1, -1) : raw,
      line: i + 2, // 1-based, after the opening ---
      quoted,
    };
  });
  return { fields, bodyStart: src.slice(0, end).split("\n").length + 2 };
}

const SCAFFOLDING = [
  "facebook/docusaurus",
  "Description will go into a meta tag",
  "Lorem ipsum",
  "My site description",
];

for (const root of process.argv.slice(2)) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    const fm = parseFrontmatter(src);
    const body = fm ? src.split("\n").slice(fm.bodyStart - 1).join("\n") : src;

    // Rule 8: no template scaffolding anywhere in the file
    for (const s of SCAFFOLDING) {
      const idx = src.indexOf(s);
      if (idx >= 0) {
        const line = src.slice(0, idx).split("\n").length;
        report("error", file, line, `Template scaffolding shipped: "${s}" (GEO standard rule 8)`);
      }
    }

    // Frontmatter rules
    // Astro blog posts drive their meta description from `summary`
    // (blog/src/content.config.ts) - accept either field name.
    const desc = fm?.fields.description ?? fm?.fields.summary;
    const title = fm?.fields.title;
    if (!desc || !desc.value) {
      report("error", file, 1, "Missing frontmatter description (GEO standard rule 4: hand-written, 140-160 chars)");
    } else {
      const len = desc.value.length;
      if (len < 80 || len > 200) {
        report("error", file, desc.line, `Description is ${len} chars — outside the acceptable 80-200 band; target 140-160 (rule 4)`);
      } else if (len < 140 || len > 160) {
        report(STRICT ? "error" : "warning", file, desc.line, `Description is ${len} chars — target 140-160 (rule 4)`);
      }
      if (!desc.quoted && /:\s/.test(desc.value)) {
        report("error", file, desc.line, 'Unquoted colon in YAML description — wrap it in quotes: description: "..." (breaks the frontmatter parser)');
      }
    }
    // Leading section numbers ("2.3 Variables & Types") are book numbering,
    // not versions — only flag v-prefixed or mid-title x.y[.z] patterns.
    if (title?.value && /(?!^)\bv?\d+\.\d+(\.\d+)?(-[\w.]+)?\b/.test(title.value.replace(/^[\d.]+\s+/, ""))) {
      report("error", file, title.line, `Version number in title "${title.value}" — titles must be version-free (rule 2)`);
    }

    // Rule 1: exactly one H1 in the body (markdown # headings; skip code fences)
    let h1s = [];
    let inFence = false;
    body.split("\n").forEach((ln, i) => {
      if (/^\s*(```|~~~)/.test(ln)) inFence = !inFence;
      else if (!inFence && /^# /.test(ln)) h1s.push(i + (fm ? fm.bodyStart : 1));
    });
    if (h1s.length > 1) {
      report("error", file, h1s[1], `${h1s.length} H1 headings — a page has exactly one H1; demote the rest to ## (rule 1)`);
    }

    // Rule 9: stubs must be noindex
    if (/coming soon|under development|\bTBD\b/i.test(body) && !/noindex/.test(src)) {
      const idx = body.search(/coming soon|under development|\bTBD\b/i);
      const line = (fm ? fm.bodyStart : 1) + body.slice(0, idx).split("\n").length - 1;
      report("warning", file, line, 'Looks like a stub ("Coming Soon"/"TBD") without noindex — add <head><meta name="robots" content="noindex" /></head> until it has real content (rule 9)');
    }
  }
}

console.log(`\ngeo-lint: ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 ? 1 : 0);
