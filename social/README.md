# social/

One file per post, holding the copy that goes out on each channel.

These exist so the words are written before anything is sent. Text generated
from a `summary` field reads generated, and the audience this blog is written
for notices — so the pipeline automates the bookkeeping (which channels, which
tagged links, what went where) and leaves the writing to a person.

## The loop

**1. A post merges to `main`.** The *Prepare social copy* workflow opens a pull
request adding `social/<slug>.md`, seeded from the post's own title and summary.
Nothing is sent.

**2. You rewrite the copy** in that PR and merge it. One block per channel.
Empty a channel to skip it.

**3. You run *Distribute a post*** — Actions → Distribute a post → Run workflow.
It defaults to a dry run. Turn that off when the output looks right.

Steps 1 and 3 are deliberately separate. A post can ship, get corrected, and
ship again without anything reaching an audience in between.

## The file

```yaml
---
slug: some-post
title: "Some Post"
published: 2026-08-21

discord: |
  **Some Post**

  One line on why it matters.

  {{link}}

x: |
  A hook worth reading.

  {{link}}
---
```

`{{link}}` becomes that channel's tagged URL — `utm_source`, `utm_medium` and
`utm_campaign=<slug>` — which is what lets GA4 attribute a reader to a channel
and a post at once. Put it anywhere in the copy. Delete it and the link is
appended to the end rather than lost.

## Channels

| Channel | On send | Limit |
| --- | --- | --- |
| `discord` | Posts immediately | 2000 |
| `telegram` | Posts immediately | 4096 |
| `x` | Queued in Buffer as a draft | 280 |
| `linkedin` | Queued in Buffer as a draft | 3000 |

Discord and Telegram are announcement channels, where a bot posting is expected.
X and LinkedIn are not, so those arrive as Buffer drafts for a person to approve.

The draft state is set on the API call itself (`saveToDraft: true`), not left to
Buffer's per-channel approval toggle — so a setting changed in Buffer's UI
cannot turn queued posts into scheduled ones behind your back.

Publishing is not reachable from this code at all. Buffer's API offers
`shareNow` and `shareNext`, and neither is wired up — enabling one should cost a
code change and a pull request, not a flag someone could set by accident.

X's limit is measured the way X measures it: every URL counts as 23 characters
however long it is. Over-length copy is refused rather than truncated.

## Locally

```bash
npm run social:init  <slug>            # create or recreate a copy file
npm run distribute   <slug> -- --dry-run
npm run distribute   <slug> -- --only=discord,telegram
npm run social:links <slug> -- --md    # just the tagged links
```

## Secrets

Set in the repository, not here. A channel whose secrets are absent is skipped
and reported, so you can switch this on one channel at a time.

| Secret | For |
| --- | --- |
| `DISCORD_WEBHOOK_URL` | Discord |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram |
| `BUFFER_ACCESS_TOKEN` | Buffer (org owner creates it) |
| `BUFFER_CHANNEL_X`, `BUFFER_CHANNEL_LINKEDIN` | Which Buffer channel is which |

The newsletter is not here. Mailchimp polls `/rss-email.xml` weekly on its own,
so it needs no code and no secrets.
