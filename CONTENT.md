# MOI Blog — How to Add Content

## Quick Start

1. Create a new Markdown file in `content/posts/your-slug.md`
2. Add frontmatter at the top with required fields (see schema below)
3. Write your article in Markdown
4. Push to `main` → GitHub Actions builds and deploys automatically

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

Posts are automatically routed:

- **Blog index**: `/blog` (lists all posts)
- **Individual post**: `/blog/[slug]` (e.g., `/blog/why-agents-need-onchain-authority`)

The slug is derived from the filename: `content/posts/my-article.md` → `/blog/my-article`

## Metadata Files

The build automatically generates:

- `/blog/sitemap.xml` — links all posts for search engines
- `/blog/feed.xml` — RSS feed with all posts
- `/blog/llms.txt` — llmstxt.org format listing all posts (for LLM indexing)
- `/robots.txt` (root) — Allow GPTBot, ClaudeBot, PerplexityBot, etc., and references the sitemap

## Testing Locally

```bash
npm run build
npm run preview
# Visit http://localhost:5173/blog to see the index
# Visit http://localhost:5173/blog/your-slug to see a post
```

Use `curl` to verify static HTML:

```bash
curl -s http://localhost:5173/blog | grep "Essays on context"
# Should return HTML with that text (not empty, not "<!DOCTYPE html><script>")

curl -s http://localhost:5173/blog/why-agents-need-onchain-authority | grep "on-chain authority"
# Should return the article HTML
```

## Word Count & Reading Time

Automatically calculated per post; displayed under the title. Reading time is in minutes (rounded up).

Example: "3,247 words · 12 min read"

## Styling

Styles live in `src/styles/blog.css` and follow the MOI brand book, matching the
manifesto page rather than inventing a separate look:

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

The blog is built as part of the standard deploy pipeline:

```bash
npm run build  # Runs Vite + build-blog.js
```

The build script:
1. Processes all Markdown posts in `content/posts/*.md`
2. Validates frontmatter
3. Generates static HTML + metadata (sitemap, RSS, llms.txt)
4. Writes JSON data + metadata into `public/`, which Vite copies to `dist/`
   (generating into `public/` is what lets `npm run dev` serve the blog too —
   these paths are gitignored)
5. The deploy job ships `dist/` to the server

Posts go live immediately after merge to `main`.
