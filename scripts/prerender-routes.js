// Writes a static dist/<route>/index.html for each marketing route, with that
// route's own title, description, canonical, and og tags — plus a noscript
// summary of the page. The app itself stays a client-rendered SPA; these files
// exist because crawlers (and AI answer engines, which never run JS) otherwise
// receive the identical homepage shell for every route and cannot tell the
// manifesto from the papers page.
//
// vercel.json rewrites these three routes to their prerendered files
// explicitly (mirroring the existing /blog -> /blog/index.html entry), so
// serving does not depend on filesystem-over-rewrites precedence. Client-side
// nav is unaffected either way.
//
// Runs after `vite build` (see the build script in package.json). Add an entry
// here when you add a public route to src/App.jsx, alongside its sitemap.xml
// entry.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const ORIGIN = "https://moi.technology";

const ROUTES = [
  {
    path: "/why-moi",
    title: "The Shift — why AI agents need MOI",
    description:
      "Why AI agents need on-chain authority: how MOI shifts computation from accounts and sessions to persistent participants you can monitor, scope, and revoke.",
    noscript: `
      <h1>The Shift</h1>
      <p>Computers were built around accounts and sessions, not the people and
        agents behind them. MOI shifts computation to persistent participants —
        so every AI agent acts under authority you can monitor, scope, and
        revoke in real time.</p>`,
  },
  {
    path: "/manifesto",
    title: "The MOI Manifesto",
    description:
      "You are not a copy. You are the participant. The MOI manifesto on why people and agents deserve persistent, portable existence in computation.",
    noscript: `
      <h1>You are not a copy. You are the participant.</h1>
      <p>The MOI manifesto: computers have a problem with how they think about
        people. MOI gives every participant — human or agent — persistent,
        portable existence in computation.</p>`,
  },
  {
    path: "/papers",
    title: "MOI Papers — litepaper, whitepaper, and research",
    description:
      "Read the work behind MOI: the litepaper, whitepaper, and research on the participant layer — downloadable papers on agents, authority, and Contextual Compute.",
    noscript: `
      <h1>Read the work behind MOI</h1>
      <p>The MOI paper collection: "The Participant Layer of the Internet"
        litepaper, the whitepaper, and research on Contextual Compute and
        agent authority. Every paper is downloadable as a PDF.</p>`,
  },
];

const shell = readFileSync(join(DIST, "index.html"), "utf8");

// A regex that stops matching (e.g. Vite starts minifying/reformatting the
// head) must fail the build loudly — .replace() returning the input unchanged
// would otherwise ship route pages carrying the homepage's metadata.
function mustReplace(html, pattern, replacement, label, routePath) {
  const out = html.replace(pattern, replacement);
  if (out === html) {
    throw new Error(
      `prerender-routes: pattern for "${label}" did not match dist/index.html ` +
        `while prerendering ${routePath} — the built head markup has changed; ` +
        `update the pattern in scripts/prerender-routes.js`
    );
  }
  return out;
}

for (const route of ROUTES) {
  const url = ORIGIN + route.path;
  let html = shell;
  html = mustReplace(html, /<title>[^<]*<\/title>/, `<title>${route.title}</title>`, "title", route.path);
  html = mustReplace(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`,
    "meta description",
    route.path
  );
  html = mustReplace(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${url}" />`,
    "canonical",
    route.path
  );
  html = mustReplace(
    html,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${url}" />`,
    "og:url",
    route.path
  );
  html = mustReplace(
    html,
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${route.title}" />`,
    "og:title",
    route.path
  );
  html = mustReplace(
    html,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${route.description}" />`,
    "og:description",
    route.path
  );
  // Swap the homepage noscript headline/summary for this route's own, keeping
  // the shared noscript nav (matched by its closing </nav>) intact.
  html = mustReplace(
    html,
    /(<\/nav>)[\s\S]*?(<p><a href="\/blog")/,
    `$1${route.noscript}\n      $2`,
    "noscript summary",
    route.path
  );

  mkdirSync(join(DIST, route.path.slice(1)), { recursive: true });
  writeFileSync(join(DIST, route.path.slice(1), "index.html"), html);
  console.log(`prerendered ${route.path}`);
}
