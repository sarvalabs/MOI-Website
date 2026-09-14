// Static-site generation for the marketing routes. Runs after `vite build`
// and `vite build --ssr` (see package.json): renders each route's real React
// output to HTML and writes dist/<route>/index.html with that content inside
// #root, plus per-route head metadata.
//
// This supersedes the old metadata-only prerender (scripts/prerender-routes.js):
// crawlers and AI engines now receive the actual page content — the manifesto
// text, the why-moi narrative, the papers list — not just tags and a noscript
// summary. The app still hydrates on load (src/main.jsx), so animations, the
// chatbot, and analytics behave exactly as before.
//
// The blog is a separate app (blog/ → blog.moi.technology) and is untouched.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = "dist";
const ORIGIN = "https://moi.technology";

const ROUTES = [
  {
    path: "/",
    title: "MOI — The participant layer for AI agents",
    description:
      "You exist once, on chain. Monitor, scope, and revoke your AI agents in real time.",
  },
  {
    path: "/why-moi",
    title: "The Shift — why AI agents need MOI",
    description:
      "Why AI agents need on-chain authority: how MOI shifts computation from accounts and sessions to persistent participants you can monitor, scope, and revoke.",
  },
  {
    path: "/manifesto",
    title: "The MOI Manifesto",
    description:
      "You are not a copy. You are the participant. The MOI manifesto on why people and agents deserve persistent, portable existence in computation.",
  },
  {
    path: "/papers",
    title: "MOI Papers — litepaper, whitepaper, and research",
    description:
      "Read the work behind MOI: the litepaper, whitepaper, and research on the participant layer — downloadable papers on agents, authority, and Contextual Compute.",
  },
];

// A pattern that stops matching (e.g. Vite starts minifying the template
// head) must fail the build loudly rather than ship wrong metadata.
function mustReplace(html, pattern, replacement, label, routePath) {
  // Test for the pattern's presence rather than comparing before/after —
  // on the homepage the replacement can equal the existing value, which is
  // fine; only an absent pattern means the template drifted.
  const present =
    typeof pattern === "string" ? html.includes(pattern) : pattern.test(html);
  if (!present) {
    throw new Error(
      `ssg: pattern for "${label}" did not match while rendering ${routePath} — ` +
        `the built template has changed; update scripts/ssg.mjs`
    );
  }
  return html.replace(pattern, replacement);
}

const { render } = await import(
  pathToFileURL(join(process.cwd(), "dist-ssr", "entry-server.js")).href
);

const shell = readFileSync(join(DIST, "index.html"), "utf8");

for (const route of ROUTES) {
  const url = ORIGIN + route.path;
  const appHtml = render(route.path);
  if (!appHtml || appHtml.length < 500) {
    throw new Error(`ssg: suspiciously small render for ${route.path} (${appHtml?.length ?? 0}B)`);
  }

  let html = shell;
  html = mustReplace(html, /<title>[^<]*<\/title>/, `<title>${route.title}</title>`, "title", route.path);
  html = mustReplace(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`,
    "meta description",
    route.path
  );
  html = mustReplace(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, "canonical", route.path);
  html = mustReplace(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, "og:url", route.path);
  html = mustReplace(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${route.title}" />`, "og:title", route.path);
  html = mustReplace(
    html,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${route.description}" />`,
    "og:description",
    route.path
  );
  // The real content now lives in the document, so the old noscript summary
  // (nav + headline + paragraph) is redundant on prerendered routes — remove
  // it, keeping the GTM noscript iframe (which contains no nav).
  html = mustReplace(
    html,
    /<noscript>\s*<nav>[\s\S]*?<\/noscript>/,
    "",
    "noscript summary removal",
    route.path
  );
  // Inject the rendered app into the mount point.
  html = mustReplace(html, '<div id="root"></div>', `<div id="root">${appHtml}</div>`, "root injection", route.path);

  const outDir = route.path === "/" ? DIST : join(DIST, route.path.slice(1));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`ssg: ${route.path} rendered (${(appHtml.length / 1024).toFixed(1)}KB of content)`);
}

rmSync("dist-ssr", { recursive: true, force: true });
console.log("ssg: done — dist-ssr cleaned up");
