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

// Posts without a cover get a branded gradient tile rather than a broken or
// borrowed image — hue is derived from the slug so each post is visually
// distinct and stable across builds. Replace by setting `cover:` in the
// post's frontmatter.
const placeholderCover = (slug) => {
  let n = 0;
  for (const ch of slug) n = (n * 31 + ch.charCodeAt(0)) % 1000;
  // Constrained to indigo→violet around MOI Main (#4B17E5, hue ~258) so tiles
  // vary between posts without drifting off-brand.
  const h = 240 + (n % 42);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${h} 78% 52%)"/>` +
    `<stop offset="1" stop-color="hsl(${h + 14} 72% 22%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="260" fill="url(#g)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

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

const cards = posts
  .map(
    (p) => `        <article class="card">
          <a class="thumb" href="${articleUrl(p.slug)}" tabindex="-1" aria-hidden="true">
            <img src="${esc(p.cover ? coverUrl(p.cover) : placeholderCover(p.slug))}" alt="" loading="lazy" />
          </a>
          <div class="card-body">
            <p class="meta">
              <time datetime="${new Date(p.date).toISOString()}">${esc(fmtDate(p.date))}</time>
              ${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('\n              ')}
              <span class="read">${p.minutes} min read</span>
            </p>
            <h2><a href="${articleUrl(p.slug)}">${esc(p.title)}</a></h2>
            <p class="summary">${esc(p.summary)}</p>
            ${p.author?.name ? `<p class="byline">${esc(p.author.name)}</p>` : ''}
          </div>
        </article>`
  )
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
        padding: 0 24px 96px;
        background: linear-gradient(180deg, #1a0b4d 0%, var(--moi-black) 60%);
        color: #fff;
        font-family: var(--font);
        -webkit-font-smoothing: antialiased;
        min-height: 100vh;
      }
      .wrap { max-width: 860px; margin: 0 auto; }
      header.top { display: flex; align-items: center; justify-content: space-between; padding: 28px 0 0; }
      header.top img { height: 34px; width: auto; display: block; }
      nav a {
        color: rgba(255, 255, 255, 0.72);
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
        margin-left: 20px;
      }
      nav a:hover { color: #fff; }
      h1 {
        font-size: clamp(38px, 7vw, 62px);
        line-height: 1.05;
        letter-spacing: -0.02em;
        margin: 72px 0 16px;
        text-wrap: balance;
      }
      .lede { color: rgba(255, 255, 255, 0.7); font-size: 17px; line-height: 1.6; max-width: 60ch; margin: 0 0 8px; }
      .note { color: rgba(255, 255, 255, 0.45); font-size: 13px; margin: 0 0 48px; }
      .note a { color: var(--moi-lavender); }
      .card {
        border-top: 1px solid rgba(217, 204, 255, 0.16);
        padding: 32px 0;
        display: grid;
        grid-template-columns: 210px 1fr;
        gap: 28px;
        align-items: start;
      }
      .thumb {
        display: block;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 40 / 26;
        background: rgba(217, 204, 255, 0.08);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .read { color: rgba(255, 255, 255, 0.5); }
      @media (max-width: 640px) {
        .card { grid-template-columns: 1fr; gap: 16px; }
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: baseline;
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 10px;
      }
      .tag { color: var(--moi-lavender); }
      h2 { font-size: clamp(22px, 3.4vw, 31px); line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 10px; text-wrap: balance; }
      h2 a { color: #fff; text-decoration: none; }
      h2 a:hover { color: var(--moi-lavender); }
      .summary { color: rgba(255, 255, 255, 0.68); font-size: 15px; line-height: 1.65; margin: 0; max-width: 62ch; }
      .byline { color: var(--moi-lavender); font-size: 12px; font-weight: 600; margin: 14px 0 0; }
      .empty {
        border-top: 1px solid rgba(217, 204, 255, 0.16);
        padding: 40px 0;
        margin: 0;
        color: rgba(255, 255, 255, 0.5);
        font-size: 15px;
      }
      footer { border-top: 1px solid rgba(217, 204, 255, 0.16); margin-top: 56px; padding-top: 24px; color: rgba(255, 255, 255, 0.45); font-size: 13px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
      footer a { color: var(--moi-lavender); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header class="top">
        <a href="/" aria-label="MOI — home"><img src="/brand/logos/SVG/default-light.svg" alt="MOI" /></a>
        <nav>
          <a href="/why-moi">The Shift</a>
          <a href="/manifesto">Manifesto</a>
          <a href="/papers">Papers</a>
          <a href="${BLOG_ORIGIN}">All posts</a>
        </nav>
      </header>

      <h1>Writing on the personal internet</h1>
      <p class="lede">
        Contextual Compute, agent authority, protocol research, and product
        updates — from the team building MOI.
      </p>
      <p class="note">
        Full articles are published on <a href="${BLOG_ORIGIN}">blog.moi.technology</a>.
        <a href="${BLOG_ORIGIN}/rss.xml">RSS</a>
      </p>

      <main>
${posts.length === 0 ? '        <p class="empty">No posts published yet — the first one is on its way.</p>' : cards}
      </main>

      <footer>
        <span>© ${new Date().getFullYear()} Sarva Labs — MOI</span>
        <span>Not your Context, Not your Agent.</span>
      </footer>
    </div>
  </body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
console.log(
  `build-blog-index: wrote public/blog/index.html — ${posts.length} post${posts.length === 1 ? '' : 's'}`
);
