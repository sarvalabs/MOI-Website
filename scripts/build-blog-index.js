// Generates moi.technology/blog — a static listing of every published post.
//
// The posts themselves live on blog.moi.technology (see blog/). This page is
// the metadata counterpart on the apex domain, the same split Logos uses
// between logos.co/media and blog.logos.co/article/…: a crawler reaching
// moi.technology finds every post's heading, summary, date, and tags here and
// follows through to the article.
//
// It has to be real static HTML rather than a React route — the SPA renders
// client-side, so a route would be an empty div to any crawler that does not
// execute JavaScript, which is most of the AI ones.
//
// Output goes to public/blog/index.html; Vite copies public/ into dist/ (and
// serves it in dev), so this runs before `vite build`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(root, 'blog/src/content/posts');
const OUT_DIR = path.join(root, 'public/blog');
const BLOG_ORIGIN = 'https://blog.moi.technology';
const SITE_ORIGIN = 'https://moi.technology';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');


// 200 wpm is the usual reading-speed convention; round up so a short post
// reads "1 min" rather than "0 min".
const readMinutes = (body) =>
  Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200));

// A missing directory means the same as an empty one: nothing published. Git
// does not track empty directories, so a clone with no posts lands here.
const posts = (fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR) : [])
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const { data, content } = matter(
      fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
    );
    const slug = file.replace(/\.md$/, '');
    return { slug, minutes: readMinutes(content), ...data };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Nothing published is a legitimate state, not a failure. This script runs
// inside `npm run build`, so exiting non-zero here would fail the entire
// production deploy — the marketing site included — over an empty blog.
if (posts.length === 0) {
  console.warn('build-blog-index: no published posts — emitting an empty listing');
}

// UTC, because a date-only frontmatter value parses as UTC midnight and would
// otherwise render a day early for anyone west of Greenwich — including the
// build machine.
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

const articleUrl = (slug) => `${BLOG_ORIGIN}/article/${slug}/`;

// Covers live in blog/public/ and are therefore served from the blog host, but
// this listing is served from the apex — so a root-relative `cover` has to be
// resolved against the blog origin or it 404s here. Absolute URLs pass through.
const coverUrl = (cover) =>
  cover.startsWith('/') ? `${BLOG_ORIGIN}${cover}` : cover;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'MOI Blog',
  description:
    'Writing from Sarva Labs on MOI: Contextual Compute, agent authority, protocol research, and product updates.',
  url: `${SITE_ORIGIN}/blog`,
  publisher: { '@type': 'Organization', name: 'Sarva Labs', url: SITE_ORIGIN },
  // omitted when nothing is published — an empty array is valid but tells
  // crawlers nothing
  ...(posts.length === 0 ? {} : { blogPost: posts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.summary,
    datePublished: new Date(p.date).toISOString(),
    ...(p.updated ? { dateModified: new Date(p.updated).toISOString() } : {}),
    ...(p.author?.name ? { author: { '@type': 'Organization', name: p.author.name } } : {}),
    keywords: (p.tags || []).join(', '),
    url: articleUrl(p.slug),
  })) }),
};

// Thumbnail only when the post set `cover`. No cover means no tile — the
// card is the title, summary, date, and tags, and the whole card is the link.
const cards = posts
  .map((p) => {
    const thumb = p.cover
      ? `          <span class="thumb"><img src="${esc(coverUrl(p.cover))}" alt="" loading="lazy" /></span>
`
      : '';
    const tags = (p.tags || [])
      .map((t) => `<span class="tag">${esc(t)}</span>`)
      .join('');
    return `        <article>
        <a class="card" href="${articleUrl(p.slug)}">
${thumb}          <div class="card-body">
            <p class="meta">
              <time datetime="${new Date(p.date).toISOString()}">${esc(fmtDate(p.date))}</time>
              <span aria-hidden="true">·</span>
              <span>${p.minutes} min read</span>
            </p>
            <h2>${esc(p.title)}</h2>
            <p class="summary">${esc(p.summary)}</p>
            ${tags ? `<p class="tags">${tags}</p>` : ''}
            <span class="go">Read <span aria-hidden="true">→</span></span>
          </div>
        </a>
        </article>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Blog — MOI</title>
    <meta
      name="description"
      content="Writing from Sarva Labs on MOI: Contextual Compute, agent authority, protocol research, and product updates."
    />
    <link rel="canonical" href="${SITE_ORIGIN}/blog" />
    <meta property="og:title" content="Blog — MOI" />
    <meta
      property="og:description"
      content="Writing from Sarva Labs on MOI: Contextual Compute, agent authority, protocol research, and product updates."
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_ORIGIN}/blog" />
    <link rel="alternate" type="application/rss+xml" title="MOI Blog" href="${BLOG_ORIGIN}/rss.xml" />
    <link rel="icon" type="image/svg+xml" href="/brand/logos/SVG/default-light.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <style>
      :root {
        --moi-main: #4b17e5;
        --moi-black: #0a0026;
        --moi-lavender: #d9ccff;
        --font: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        /* top padding clears the fixed navbar (top: 16px + 50px tall) */
        padding: 96px 24px 96px;
        background:
          radial-gradient(60% 40% at 80% 8%, rgba(75, 23, 229, 0.32), transparent 60%),
          radial-gradient(50% 35% at 8% 40%, rgba(111, 69, 234, 0.22), transparent 60%),
          radial-gradient(50% 40% at 92% 60%, rgba(75, 23, 229, 0.22), transparent 60%),
          linear-gradient(180deg, #0A0526 0%, #1B1148 50%, var(--moi-black) 100%);
        background-attachment: fixed;
        color: #fff;
        font-family: var(--font);
        font-weight: 500;
        -webkit-font-smoothing: antialiased;
        min-height: 100vh;
      }
      .wrap { max-width: 760px; margin: 0 auto; }

      /* Navbar — hand-mirrored from src/components/Navbar.jsx and kept in step
         with .moi-nav-pill in src/styles/moi-tokens.css. This page is static
         HTML generated outside the React app, so the component cannot be
         reused; both have to be changed together. */
      .site-nav {
        position: fixed;
        top: 16px;
        left: 0;
        right: 0;
        z-index: 50;
        padding: 0 16px;
      }
      .nav-pill {
        position: relative;
        overflow: hidden;
        height: 50px;
        width: min(100%, 1200px);
        margin-inline: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(60, 44, 130, 0.55) 0%, rgba(34, 22, 88, 0.55) 100%);
        backdrop-filter: blur(28px) saturate(150%);
        -webkit-backdrop-filter: blur(28px) saturate(150%);
        border: 1px solid rgba(200, 191, 239, 0.28);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.18),
          0 14px 36px rgba(10, 5, 38, 0.32);
        transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
      }
      .site-nav a { text-decoration: none; }
      .nav-logo { display: flex; align-items: center; flex-shrink: 0; }
      .nav-logo img { height: 36px; width: auto; display: block; }
      .nav-center { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
      .nav-center a {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.72);
        padding: 6px 14px;
        border-radius: 999px;
        white-space: nowrap;
        transition: color 0.3s ease, background 0.3s ease;
      }
      .nav-center a:hover { color: #fff; }
      .nav-center a.active { color: #fff; background: rgba(255, 255, 255, 0.1); }
      .nav-cta {
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: -0.005em;
        color: #fff;
        background: var(--moi-main);
        border-radius: 999px;
        padding: 9px 20px;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(75, 23, 229, 0.28);
        transition: background 0.2s ease;
      }
      .nav-cta:hover { background: #320f99; }

      @media (min-width: 768px) {
        .nav-pill { transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease; }
        /* Collapsed is the bare mark: no plate, no border, no shadow, and the
           padding goes so it sits centred rather than pinned left. */
        .nav-pill.collapsed {
          width: 48px;
          padding: 0;
          justify-content: center;
          cursor: pointer;
          background: none;
          border-color: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        /* Absolute, not merely faded: opacity alone still occupies layout, and
           in a 48px pill that pushes the mark outside the box, where
           overflow: hidden clips it. */
        .nav-center, .nav-cta { transition: opacity 0.18s ease 0.3s; }
        .nav-pill.collapsed .nav-center,
        .nav-pill.collapsed .nav-cta {
          position: absolute;
          left: 50%;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.14s ease;
        }
      }
      @media (max-width: 767px) {
        .nav-center { display: none; }
      }
      h1 {
        font-size: clamp(38px, 7vw, 62px);
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
        margin: 72px 0 16px;
        text-wrap: balance;
        color: rgba(255, 255, 255, 0.85);
      }
      .lede { color: rgba(255, 255, 255, 0.69); font-size: 17px; line-height: 1.6; max-width: 60ch; margin: 0 0 8px; }
      .note { color: rgba(255, 255, 255, 0.55); font-size: 13px; margin: 0 0 48px; }
      .note a { color: #BCA6FF; }
      main { display: flex; flex-direction: column; gap: 16px; }
      .card {
        display: block;
        text-decoration: none;
        color: inherit;
        padding: 32px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(200, 191, 239, 0.20);
        border-radius: 20px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
      }
      .card:hover {
        transform: translateY(-3px);
        border-color: rgba(200, 191, 239, 0.45);
        box-shadow: 0 14px 36px rgba(75, 23, 229, 0.28);
      }
      .card:hover .go { color: #fff; }
      .thumb {
        display: block;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 40 / 26;
        margin: -32px -32px 24px;
        background: rgba(217, 204, 255, 0.08);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: baseline;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.55);
        margin: 0 0 12px;
      }
      h2 {
        font-size: clamp(22px, 3.4vw, 28px);
        font-weight: 700;
        line-height: 1.25;
        letter-spacing: -0.01em;
        margin: 0 0 10px;
        text-wrap: balance;
        color: rgba(255, 255, 255, 0.85);
      }
      .summary { color: rgba(255, 255, 255, 0.69); font-size: 15px; line-height: 1.65; margin: 0; }
      .tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; }
      .tag {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #BCA6FF;
        border: 1px solid rgba(217, 204, 255, 0.28);
        border-radius: 999px;
        padding: 4px 10px;
      }
      .go {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 20px;
        font-size: 13px;
        font-weight: 600;
        color: #BCA6FF;
        transition: color 160ms ease;
      }
      @media (max-width: 640px) {
        .card { padding: 24px; }
        .thumb { margin: -24px -24px 20px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .card, .card:hover { transform: none; transition: border-color 200ms ease, box-shadow 200ms ease; }
      }
      .empty {
        margin: 0;
        padding: 40px 32px;
        color: rgba(255, 255, 255, 0.55);
        font-size: 15px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(200, 191, 239, 0.20);
        border-radius: 20px;
      }
      footer { border-top: 1px solid rgba(217, 204, 255, 0.16); margin-top: 56px; padding-top: 24px; color: rgba(255, 255, 255, 0.55); font-size: 13px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
      footer a { color: #BCA6FF; }
    </style>
  </head>
  <body>
    <nav class="site-nav">
        <div class="nav-pill" id="nav-pill">
          <a class="nav-logo" href="/" aria-label="MOI — home">
            <img src="/brand/logos/SVG/default-light.svg" alt="MOI" />
          </a>
          <div class="nav-center">
            <a href="/why-moi">The Shift</a>
            <a href="https://docs.moi.technology" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="/manifesto">Manifesto</a>
            <a href="/papers">Papers</a>
            <a class="active" href="/blog">Blog</a>
          </div>
          <a class="nav-cta" href="https://voyage.moi.technology" target="_blank" rel="noopener noreferrer">Explore the network</a>
        </div>
    </nav>

    <div class="wrap">
      <h1>Writing on the personal internet</h1>
      <p class="lede">
        Contextual Compute, agent authority, protocol research, and product
        updates — from the team building MOI.
      </p>
      <p class="note">
        Full articles are published on <a href="${BLOG_ORIGIN}">blog.moi.technology</a>.
      </p>

      <main>
${posts.length === 0 ? '        <p class="empty">No posts published yet — the first one is on its way.</p>' : cards}
      </main>

      <footer>
        <span>© ${new Date().getFullYear()} Sarva Labs — MOI</span>
      </footer>
    </div>

    <script>
      // Same behaviour as src/components/Navbar.jsx: past 360px the pill
      // collapses to the bare mark, clicking it re-expands, scrolling again
      // re-collapses. Thresholds are deliberately identical so the two pages
      // collapse at the same point.
      (function () {
        var pill = document.getElementById('nav-pill');
        var COLLAPSE_AT = 360, EXPAND_AT = 280;
        var collapsed = false, pinnedOpen = false;
        var lastY = window.scrollY;

        function apply(next) {
          if (collapsed === next) return;
          collapsed = next;
          pill.classList.toggle('collapsed', next);
        }

        function onScroll() {
          var y = window.scrollY;
          var dy = Math.abs(y - lastY);
          lastY = y;
          if (pinnedOpen) {
            if (y < EXPAND_AT) pinnedOpen = false;
            else if (dy > 8) { pinnedOpen = false; apply(true); }
            return;
          }
          if (y > COLLAPSE_AT) apply(true);
          else if (y < EXPAND_AT) apply(false);
        }

        // Match the current scroll position on load, so a reload partway down
        // the page starts collapsed.
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        pill.addEventListener(
          'click',
          function (ev) {
            if (!collapsed) return;
            ev.preventDefault();
            ev.stopPropagation();
            pinnedOpen = true;
            apply(false);
          },
          true
        );
      })();
    </script>
  </body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
console.log(
  `build-blog-index: wrote public/blog/index.html — ${posts.length} post${posts.length === 1 ? '' : 's'}`
);
