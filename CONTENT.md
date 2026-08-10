# MOI Blog — How to Add Content

## Quick Start

1. Create a new Markdown file in `blog/src/content/posts/your-slug.md`
2. Add frontmatter at the top with required fields (see schema below)
3. Write your article in Markdown
4. Merge to `main` → CI builds the blog and ships it to the VM

The frontmatter contract below is enforced at build time by
`blog/src/content.config.ts`; a post that violates it fails the build rather
than shipping broken.

## Frontmatter Schema

Every post **must** include these required fields:

```yaml
---
title: "Your Post Title"
summary: "One-sentence summary. Doubles as the meta description for SEO."
date: 2026-06-15
author:
  name: "Author Name"
  role: "Their role"
  url: "https://example.com"
tags: ["tag1", "tag2"]
takeaways:
  - "First key takeaway"
  - "Second key takeaway"
faq:
  - q: "Question one?"
    a: "Answer one."
  - q: "Question two?"
    a: "Answer two."
draft: false
---
```

### Field Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✓ | Post headline; rendered as `<h1>` |
| `summary` | string | ✓ | One sentence; used as meta description and preview text |
| `date` | ISO date | ✓ | Publication date; format `2026-06-15` |
| `updated` | ISO date | optional | Last update date; if omitted, defaults to `date` |
| `author` | object | optional | `{name, role, url}`; displayed under title |
| `tags` | array | optional | String tags; rendered as pills at article bottom |
| `takeaways` | array | optional | 2-3 bullet points; rendered in a highlighted box near top |
| `faq` | array | optional | `[{q, a}, ...]`; rendered as collapsible FAQ section at bottom |
| `cover` | string | optional | URL to cover image for OG tags |
| `draft` | boolean | optional | If `true`, post is excluded from builds; defaults to `false` |

## Markdown Syntax

The blog supports full **GitHub-flavored Markdown** (GFM):

```markdown
# This becomes h2 (h1 is reserved for title)

## Section heading

### Sub-section

**Bold text** and *italic text*

- Unordered list
- Another item

1. Numbered list
2. Second item

[Link text](https://example.com)

> Blockquote text

`inline code`

\`\`\`javascript
// Code block with syntax highlighting
function example() {
  return true;
}
\`\`\`

| Header | Column |
|--------|--------|
| Cell   | Cell   |
```

## SEO & Crawler Guidelines

The blog is **statically generated** so AI crawlers (GPTBot, ClaudeBot, PerplexityBot) can read the full article text. Follow these rules to maximize discoverability:

### Structure

- **One `<h1>` per page** — set automatically from `title`
- **Meaningful h2/h3 hierarchy** — crawlers lift structure from headings
- **Question-shaped h2s** — where feasible, phrase headings as questions ("Why is X important?" vs "The Importance of X")
  - LLMs parse q→a patterns readily; pose h2s as genuine questions, then answer in the section
- **One declarative sentence early** — in the first paragraph, state the main claim of the article
  - E.g.: "On-chain authority is a model where your agents act under scoped, revocable permission anchored to you."

### Voice

Follow the MOI brand voice — it is not optional styling, it is how the site reads:

- **Second person.** "You scope what each agent can touch." Almost never "we".
- **Declarative, short, hard line breaks.** State the fact, then the consequence.
- **Sentence case** headlines. UPPERCASE only for small section labels.
- **No emoji.**
- **Vocabulary**: say `participant`, `authority`, `scope`, `revoke`, `on chain`,
  `agent`. Avoid `user`, `permissions`, `blockchain`, `AI assistant`.

### Content Patterns Crawlers Favor

- **Takeaways** — LLMs pull bullet-point summaries far more reliably than prose
  - Fill in `takeaways` even if it feels redundant; the box is not decoration
- **FAQ** — q→a pairs are parsed as first-class entities; use `faq` liberally
  - 2-4 questions per post is typical; think "What would a reader want to know?"
- **Lists** — scannable lists outrank dense paragraphs in LLM recall
  - Use `- ` for regular bullets, `1. ` for numbered steps

### Metadata

- `date` → `datePublished` in JSON-LD BlogPosting
- `updated` (if present) → `dateModified` in JSON-LD
- `summary` → `description` in schema + meta tags
- `author.name` + `author.role` → `Person` in JSON-LD with role context
- `tags` → rendered as visible tags at article bottom

## JSON-LD & Schema

Every post automatically generates:

1. **BlogPosting** schema with title, summary, datePublished, author, wordCount
2. **FAQPage** schema (if `faq` present) with questions and answers
3. **BreadcrumbList** (Home → Blog → Post)
4. **Organization** schema (MOI)

Open Graph and Twitter Card tags are also generated from title, summary, and cover image.

## Example Post

See `content/posts/why-agents-need-onchain-authority.md` for a complete example exercising every frontmatter field plus code blocks, tables, blockquotes, and lists.

## Frontmatter Validation

Build-time validation catches missing required fields and malformed dates:

```bash
npm run build
# If frontmatter is invalid:
# Error: Post "my-slug" missing required fields: title, date
```

Fix the frontmatter and rebuild.

## Routing & URLs

The blog is its own host, `blog.moi.technology` — the same split Logos uses.
Posts are routed automatically:

- **Listing on the main site**: `https://moi.technology/blog` — generated from
  your frontmatter at build time, so the apex domain carries every post's
  metadata. You do not edit this by hand.
- **Index**: `https://blog.moi.technology/` (lists all posts)
- **Article**: `https://blog.moi.technology/article/[slug]`
- **Tag page**: `https://blog.moi.technology/tags/[tag]/`

The slug comes from the filename: `blog/src/content/posts/my-article.md` →
`/article/my-article/`.

## Images

**Inside a post** — put the file in `blog/src/assets/` and reference it
relative to the post. Astro hashes it and rewrites the URL at build time:

```markdown
![Alt text describing the image](../../assets/agent-flow.svg)
```

**Listing thumbnail** — put the file in `blog/public/covers/` and set `cover`
in frontmatter, root-relative, around 1200×780 or wider:

```yaml
cover: "/covers/my-post.png"
```

Skip `cover` and the listing generates a branded gradient tile from the slug.

## Metadata Files

The build generates, all at the blog's own root:

- `/sitemap-index.xml` — every post and tag page, for search engines
- `/rss.xml` — RSS feed
- `/llms.txt` — llmstxt.org format listing all posts (for LLM indexing)
- `/robots.txt` — allows GPTBot, ClaudeBot, PerplexityBot, etc.

The marketing site's own `public/robots.txt` cross-submits the blog sitemap so
crawlers arriving at moi.technology can discover it.

## Testing Locally

```bash
npm run dev --prefix blog
```

Then open `http://localhost:4321` for the index, or
`http://localhost:4321/article/your-slug/` for a post.

To check the real static output rather than the dev server:

```bash
npm run build --prefix blog && npm run preview --prefix blog
```

Verify a post is genuinely static HTML (not a JS shell):

```bash
curl -s http://localhost:4321/article/why-agents-need-onchain-authority/ | grep "on-chain authority"
```

## Word Count & Reading Time

Automatically calculated per post; displayed under the title. Reading time is in minutes (rounded up).

Example: "3,247 words · 12 min read"

## Styling

Styles live in `blog/src/styles/global.css` and follow the MOI brand book,
matching the manifesto page rather than inventing a separate look:

- **Poppins only** — weights 400/500/600/700. The brand has one typeface; there is
  no serif and no italic. The only exception is code, where a system monospace
  stack is used because code needs character alignment.
- **Palette**: Almost Lavender paper (`#FCFBFF`), text `#15102B`, muted `#5B5570`,
  MOI Main (`#4B17E5`) as the single accent, MOI Black (`#0A0026`) for code
  surfaces. Do not introduce new hues.
- **Layout**: single column, 40rem measure, hairline rules instead of cards.
- **Headings**: h2/h3 wrapped in self-anchors for click-to-permalink.
- **Reduced motion**: respects `prefers-reduced-motion`.

Light theme only. No dark mode, no gradients, no glassmorphism, no cards.

**Root font size:** the site root is 10px (Tailwind reset), so blog routes add a
`blog-root` class to `<html>` that restores a 16px root — the same trick
`/manifesto` uses. Without it, every rem value in the blog renders at 62.5% size.
Both blog components add and remove this class on mount/unmount.

## Deployment

The blog builds independently of the marketing site:

```bash
npm run build --prefix blog   # → blog/dist/
```

Astro validates every post's frontmatter against `content.config.ts`, renders
static HTML, and emits the sitemap, RSS, and llms.txt. CI then rsyncs
`blog/dist/` to the VM, where nginx serves it as `blog.moi.technology`. See
[DEPLOYMENT.md](DEPLOYMENT.md) for the DNS, TLS, and vhost setup.

Posts with `draft: true` are excluded from the build, the index, RSS, the
sitemap, and llms.txt — so an unfinished post can sit on `main` safely.

Posts go live on merge to `main`.
