---
slug: how-ai-agents-pay-each-other-moi
title: "How AI Agents Pay Each Other \u2014 MOI Webinars VII"
published: 2026-08-21

# X allows 280 characters. The link counts as 23 whatever its length.
x: |
  Two AI agents paid each other on MOI. No accounts, no payment processor, no human. Before spending, the buyer checked the seller's registered wallet on chain.

  The whole payment layer: 713 lines of TypeScript, open source.

  {{link}}

linkedin: |
  Two AI agents did business with each other at MOI Builders Session 7. No human approved anything. The buyer had a question it couldn't answer and a wallet of its own. The seller priced its answers itself and got paid.

  The buyer found the seller through MOI's on-chain agent registry, got billed over HTTP 402, a status code reserved since 1997 that almost nothing has ever used, and paid from its own wallet in a native asset. The seller verified the payment by reading the chain. No accounts, no payment processor.

  The step that matters is one comparison. A payment address tells you where to send money, not whose address it is. So before spending anything, the buyer asks the registry which wallet that seller registered, and refuses to pay if the invoice doesn't match. Identity the agent can read on chain is what lets it pay a stranger.

  The whole payment layer is 713 lines of TypeScript, open source, runnable with one funded devnet wallet. The write-up also covers what we left open on purpose: the buyer's spending limit lives in its own code, so it is a preference, not authority. Moving that limit onto the chain is the next session.

  Full write-up:
  {{link}}
---

<!-- {{link}} becomes that channel's tagged URL. Move it anywhere in the copy;
     delete it and the link is appended to the end instead.

     Discord and Telegram are intentionally absent: emptied channels skip.
     To send: Actions -> Distribute a post -> slug, channels x,linkedin.
-->

Notes: X and LinkedIn only, per the 31 Aug decision. Drafted from the post
content with the house voice rules, stop-slop and humanizer applied.
