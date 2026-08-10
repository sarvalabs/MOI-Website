# MOI Blog — Astro demo (Option A)

This directory is the working demo for **Option A** of the blog platform decision: a
standalone [Astro 5](https://astro.build) static site living at `blog/` inside the
MOI-Website repo, styled with the MOI design system (cream `#F5F3EE`, ink `#1A1A1A`,
purple `#7B5EA7`, Instrument Serif + DM Mono self-hosted via `@fontsource`).

What it gives us out of the box:

- **Content collections** — posts are markdown files in `src/content/posts/` with a
  zod-validated frontmatter schema (`src/content.config.ts`). `draft: true` posts are
  excluded from the build, the index, RSS, the sitemap, and `llms.txt`.
- **Pages** — index with tag chips (`/blog/`), per-tag pages (`/blog/tags/<tag>/`),
  post pages with key-takeaways box, FAQ (`<details>`), and Article + FAQPage JSON-LD.
- **Feeds / GEO** — `rss.xml`, `llms.txt` (plain-text index for AI crawlers), and
  `sitemap-index.xml` via `@astrojs/sitemap`.
- **Assets** — images referenced from markdown (e.g. `../../assets/agent-flow.svg`)
  are hashed and emitted to `_astro/` with the correct `/blog` base automatically.

## Run it

```bash
cd blog
npm install
npm run dev        # → http://localhost:4321/blog
```

`npm run build` writes the static site to `blog/dist/` (base path `/blog` is set in
`astro.config.mjs`); `npm run preview` serves that build locally.

## Deploying — no Vercel

The blog is plain static output; it deploys the same way as the rest of the site:
**CI builds `blog/dist` and rsyncs it to the VM**, e.g.

```bash
npm ci --prefix blog
npm run build --prefix blog
rsync -az --delete blog/dist/ deploy@vm:/var/www/moi-website/blog/
```

Nginx serves it under `moi.technology/blog` alongside the existing site:

```nginx
location /blog/ {
    alias /var/www/moi-website/blog/;
    try_files $uri $uri/index.html =404;
}
```

## Publishing a post

Add a markdown file to `src/content/posts/` and open a PR — same frontmatter
contract as `CONTENT.md` on `feature/blog`; merging to main triggers the CI
build + rsync above.
