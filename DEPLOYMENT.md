# Deployment

What this repo builds, how to run it, and how a post gets published.

## The stack

The blog is [Astro 5](https://astro.build), a static site generator. Posts are
markdown files in `blog/src/content/posts/`; the build validates their
frontmatter against a schema and renders plain HTML, and also emits the
sitemap, `rss.xml`, `llms.txt`, and `robots.txt`. Posts marked `draft: true`
are skipped.

It lives in `blog/` with its own `package.json` and `node_modules`, entirely
separate from the React app at the repo root — no shared code or dependencies.

Both builds output **static files only**. Nothing needs a Node runtime, process
manager, or database in production. Node is needed at build time only.

## The split

Two hosts, the same split Logos uses between `logos.co/media` and
`blog.logos.co/article/…`:

- **`moi.technology`** — the React marketing site, plus `/blog`: a listing of
  every post with its title, summary, date, and tags. That listing is a real
  static file (`dist/blog/index.html`) generated at build time from the post
  frontmatter, **not** a React route — the app renders client-side, so a route
  would be an empty div to any crawler that doesn't run JavaScript.
- **`blog.moi.technology`** — the Astro blog: the articles themselves at
  `/article/<slug>`, plus the sitemap, `rss.xml`, and `llms.txt`.

So the metadata lives on the apex domain and the article bodies live on the
subdomain. A crawler reaching `moi.technology` sees every post's heading and
summary, and follows through to the subdomain to read it.

Both builds read the same `blog/src/content/posts/` directory, which is why one
markdown file updates both hosts — and why both builds have to run on every
deploy. Ship only one and a post ends up live but unlisted, or listed but
404ing.

## What needs to be served

| Build | Output | Host |
|---|---|---|
| `npm ci && npm run build` | `dist/` | `moi.technology` |
| `npm ci --prefix blog && npm run build --prefix blog` | `blog/dist/` | `blog.moi.technology` |

`blog.moi.technology` is a new host and does not exist yet — it needs DNS and a
certificate.

## Running it locally

```bash
# the blog on its own
npm install --prefix blog
npm run dev --prefix blog     # http://localhost:4321

# the marketing site — also generates the /blog listing
npm install
npm run dev                   # http://localhost:5173, listing at /blog
```

To check the real static output instead of the dev server:

```bash
npm run build --prefix blog && npm run preview --prefix blog
```

The two run as separate servers and do not cross-link locally: the listing's
post links point at production `blog.moi.technology`, and the blog's navbar
points back at production `moi.technology`. That is expected — they are
separate hosts, so there is no local proxy between them.

## Publishing flow

Writing a post is adding one markdown file. Everything downstream should be
automatic:

```
 blog/src/content/posts/my-post.md          ← author adds this, opens a PR
            │
            ▼
     merge to main
            │
            ▼
        deploy
            │
            ├──▶ root build   ──▶ moi.technology/blog
            │                     listing, regenerated with the new post
            │
            └──▶ blog build   ──▶ blog.moi.technology/article/my-post/
                                  the post, plus sitemap / rss / llms.txt
```

A post goes live only on merge to `main`.

### Images

**Inside a post** — drop the file in `blog/src/assets/` and reference it
relative to the post:

```markdown
![Alt text describing the image](../../assets/agent-flow.svg)
```

Astro hashes it, emits it to `_astro/`, and rewrites the URL at build time. Do
not link to images on other sites; they break and leak referrers.

**Thumbnail on the listing** — set `cover` in the post's frontmatter:

```yaml
cover: "/covers/my-post.png"      # file goes in blog/public/covers/
```

Roughly 1200×780 (3:2) or wider. The path is root-relative to the blog host;
the generator rewrites it to an absolute URL so it also resolves on the apex
listing. Absolute URLs are passed through untouched.

Without a `cover`, the listing generates a branded gradient tile from the
post's slug — stable across builds, distinct per post. No post sets one today,
so every card is currently a gradient.

