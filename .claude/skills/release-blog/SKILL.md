---
name: release-blog
description: Draft the biweekly MOI engineering release blog from a list of GitHub release URLs. Fetches the notes with gh, finds the thread, writes the post in the agreed per-actor structure, builds to verify, and opens a draft PR. Use when the user says "release blog", "release notes post", or pastes release URLs.
---

# MOI release blog

You are drafting the biweekly engineering release blog for blog.moi.technology.
The goal is **not a changelog**. It is what the release *means* for the people
who use MOI — "we built the tools, but this opens up these capabilities."

## Inputs

The user gives you some or all of:

- Release URLs (`https://github.com/sarvalabs/<repo>/releases/tag/<tag>`), one per component
- Optional: tutorial / docs links to tag
- Optional: a highlight hint (which one or two features lead)

If a URL is missing for a component that plausibly shipped (SDK, wallet,
Voyage), ask once; do not invent it.

## Step 1 — fetch, do not paraphrase from memory

For each URL:

```bash
gh release view <tag> -R sarvalabs/<repo> --json name,publishedAt,body \
  --jq '"# \(.name)\npublished: \(.publishedAt)\n\n\(.body)"'
```

If a repo is not visible to the current `gh` account, say so and continue —
never guess its contents. If a release body is empty, look at
`gh api repos/sarvalabs/<repo>/compare/<prev>...<tag> --jq '.commits[].commit.message'`
and say that is where the summary came from. Fetch cocolang.dev release
pages with curl when a Coco release is in the set.

Read everything before writing anything.

## Step 2 — find the thread

Classify each release by layer: protocol (go-moi) · runtime (go-pisa) ·
language (cocolang, vscode-coco) · SDK (js-moi-sdk, js-moi-agent-registry)
· apps (voyage, voyage-api, wallet). Then answer, in one sentence, what
this fortnight *is*. Usually one or two features run through several layers
— that is the thread and the highlights. The user picks the highlights and
takes them to Rahul; Rahul approves. Propose, do not decide.

Map every notable item to an actor:

- **Developers** — SDK, language, tooling; anything breaking for clients
- **Validators / node operators** — upgrade steps, consensus, RPC, ops
- **Token holders** — staking, supply, economics (say "nothing this release" when true)
- **Community** — Voyage, wallet, faucet, registration; anything a non-developer touches

## Step 3 — write it

File: `blog/src/content/posts/release-<YYYY>-<MM>.md`. Frontmatter contract
is `blog/src/content.config.ts`. Fill:

- `title` — under ~60 chars, leads with the meaning not the version
- `summary` — under 155 chars (Google truncates)
- `date`, `author: { name: "Sarva Labs", role: "Engineering", url: "https://sarvalabs.com" }`
- `tags: ["releases", "protocol", "developers"]` (adjust to what shipped)
- `takeaways` — 3–5, one per idea, no version numbers
- `faq` — 4–5, phrased as a developer or operator would actually search
- `draft: false` — the PR is the gate, not the flag; a draft:true post is
  invisible on the preview and cannot be reviewed

Body, in this order, every time:

1. **Opening** — 2–3 paragraphs on what this release means, as one thread. No list.
2. **Highlight 1** — what changed → why → what it means for you (per-actor
   callouts in italics) → how to use it (link the tutorial) → what breaks
3. **Highlight 2** — same shape
4. **For developers** / **For validators and node operators** / **For the
   community** — short; things beyond the highlights. Token holders: one line
   or omit.
5. **Everything shipped** — one compact table: component · version · one
   line · links to the notes. This is the only place changelog detail lives.
6. **What to do now** — an action checklist per actor.

Rules:

- **Current release only.** No delta against last time, no recap of prior
  releases. Readers have that context.
- Every section must answer "what does this mean for *me*". If a paragraph
  is just a list of things that changed, move it to the table.
- Breaking changes are called out where the affected reader will see them,
  not buried in the table.
- Where a tutorial link should go and none exists yet:
  `<!-- TODO: link <name>'s tutorial on <topic> -->`
- **Never resolve an open question by guessing.** Release candidates,
  features that appear in code but not in notes, inaccessible repos,
  contradictory version numbers — leave a `<!-- TODO(Rahul): … -->` in the
  file and list every one of them in your reply.
- Source repos are mostly private and this repo is public. Put in the post
  only what belongs in a public article.

## Step 4 — build to prove it

```bash
rm -rf blog/node_modules/.astro blog/dist dist public/blog
npm run build --prefix blog && npm run build
```

Then check the article page exists in `blog/dist/article/<slug>/`, and that
it has the takeaways box, the FAQ `<details>`, both `Article` and `FAQPage`
JSON-LD, and no broken images. Check the listing card in
`dist/blog/index.html`. Report title and summary lengths.

## Step 5 — open a draft PR, do not merge

Branch `content/release-<YYYY>-<MM>`. Push, then
`gh pr create --draft`. The preview workflow comments two URLs —
`pr-N.preview.moi.technology` (site, with the listing at `/blog`) and
`pr-N-blog.preview.moi.technology` (the article). Put both in your reply.

Reply with, in this order: the one-sentence thread; the two highlights as
you framed them, for approval; the questions for Rahul; the preview URLs.
Then stop. Merging is the user's call after Rahul signs off.
