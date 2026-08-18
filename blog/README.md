# MOI Blog

A standalone [Astro 5](https://astro.build) static site that serves
`blog.moi.technology`. It lives in this repo for convenience but shares no code
with the marketing site at the root — separate dependencies, separate build,
separate host. This mirrors how Logos splits `logos.co` from
`blog.logos.co/article/…`.

Styled with the MOI design system (cream `#F5F3EE`, ink `#1A1A1A`, purple
`#7B5EA7`, Poppins self-hosted via `@fontsource`).

What it gives us out of the box:

- **Content collections** — posts are markdown files in `src/content/posts/` with a
  zod-validated frontmatter schema (`src/content.config.ts`). `draft: true` posts are
  excluded from the build, the index, RSS, the sitemap, and `llms.txt`.
- **Pages** — index with tag chips (`/`), per-tag pages (`/tags/<tag>/`), and
  articles at `/article/<slug>/` with a key-takeaways box, FAQ (`<details>`),
  and Article + FAQPage JSON-LD.
- **Feeds / GEO** — `rss.xml`, `llms.txt` (plain-text index for AI crawlers),
  `sitemap-index.xml` via `@astrojs/sitemap`, and a `robots.txt` that allows
  the major LLM crawlers.
- **Assets** — images referenced from markdown (e.g. `../../assets/agent-flow.svg`)
  are hashed and emitted to `_astro/` automatically.

## Run it

```bash
npm install --prefix blog
npm run dev --prefix blog        # → http://localhost:4321
```

`npm run build --prefix blog` writes the static site to `blog/dist/`;
`npm run preview --prefix blog` serves that build locally.

Because the blog is a separate host, there is no dev proxy from the marketing
site — its Blog link points at production even when you run it locally. Open
`localhost:4321` directly to work on the blog.

## Deploying

The blog is plain static output. CI builds `blog/dist` and rsyncs it to the VM:

```bash
npm ci --prefix blog
npm run build --prefix blog
rsync -az --delete blog/dist/ deploy@vm:/var/www/moi-blog/
```

Nginx serves it as its own vhost:

```nginx
server {
    server_name blog.moi.technology;
    root /var/www/moi-blog;
    try_files $uri $uri/index.html =404;
}
```

This needs a `blog.moi.technology` DNS record and a TLS certificate before it
will resolve. Full setup — DNS, certbot, vhost, Search Console — is in
[DEPLOYMENT.md](../DEPLOYMENT.md).

## Publishing a post

Add a markdown file to `src/content/posts/` and open a PR. The frontmatter
contract is documented in [CONTENT.md](../CONTENT.md) and enforced by
`src/content.config.ts`; merging to main triggers the CI build + rsync above.
