---
title: "Why your agents need on-chain authority"
summary: "On-chain authority is a model where your agents act under scoped, revocable permission anchored to you, instead of holding copies of your credentials."
date: 2026-06-15
updated: 2026-06-20
author:
  name: "Sarva Labs"
  role: "Protocol Research"
  url: "https://sarvalabs.com"
tags: ["authority", "agents", "protocol"]
takeaways:
  - "An API key handed to an agent is not information. It is value, and anyone holding the copy can spend it."
  - "On-chain authority anchors permission to you, not to the copy. You scope what each agent can touch and revoke it at machine speed."
  - "Agents cannot negotiate with each other until they share one reference for what is true right now."
faq:
  - q: "Is this the same as an API key with narrow scopes?"
    a: "No. A scoped key is still a copy. Once it leaves your machine you cannot see how it is used and you cannot pull it back without rotating the secret everywhere. On-chain authority stays anchored to you, so scope changes and revocation take effect immediately."
  - q: "Does every action have to go on chain?"
    a: "No. Actions execute wherever they already execute. What goes on chain is the authority itself, plus a tamper-evident record of what was done under it, so any party can verify the action was permitted when it happened."
  - q: "Does MOI replace my agent framework?"
    a: "No. MOI sits underneath the stack you already run. It does not replace your model provider or your orchestration layer. It makes what they do accountable."
cover: "https://moi.technology/brand/og/blog-default.png"
draft: false
---

Your agent needs to move money, read mail, or touch production. So you hand it a credential. That credential is not information. It is value, and anyone holding the copy can use it.

This post is about the alternative: **on-chain authority**, where permission is anchored to you rather than to the copy your agent carries.

## What breaks when you hand over a key

A copied credential has three properties you did not ask for.

It is **opaque**. Once the key leaves your machine, you see the consequences of its use, not the use itself. The first signal that something went wrong is usually the damage.

It is **unbounded in time**. A key is valid until you rotate it. Rotation means finding every service holding a copy, which in practice means you do not rotate it.

It is **transferable**. Nothing about the credential binds it to the agent you gave it to. A leaked key works exactly as well for whoever picks it up.

> Used it and deleted a production database in 9 seconds. Wrote an apology after.

None of this is fixed by a smarter model. It is a property of the credential, not the caller.

## What on-chain authority means

On-chain authority is a model where three things are true at once:

1. **You exist once, as a participant.** Your authority is anchored to that participant, not scattered across copies.
2. **Each agent acts under scope you set.** Scope names what the agent may touch, and nothing else is reachable.
3. **Revocation is immediate.** You cut access at machine speed, without rotating a secret in twelve places.

The agent still acts. What changes is that its permission to act is checkable by anyone, including you, while it is acting.

### Permission-first versus trust-first

Most systems today are permission-first. Every action is a round trip to an access-control service that answers yes or no. The service becomes a bottleneck, and it can only answer questions someone anticipated when the rules were written.

On-chain authority is trust-first. The agent acts under scope, the action is recorded, and any observer can verify that the scope covered it.

| | Permission-first | Trust-first |
|---|---|---|
| Check happens | Before every action | Against the record, by anyone |
| New agent types | Need new rules | Work under existing scope |
| Revocation | Rotate the secret everywhere | Immediate, at the anchor |
| Two agents negotiating | No shared basis | Both verify the same reference |

The last row is the one that matters as agent count grows. Two agents cannot strike a deal until they share one reference for what is true right now.

## Scoping an agent

Scope is the unit you actually work with. It names the participant, the agent, and the surface the agent may reach.

```js
// Grant a research agent read-only reach, expiring in an hour.
const grant = await moi.scope({
  agent: "agent:research-01",
  can: ["mail.read", "docs.read"],
  expires: "1h",
});

// Revoke takes effect at the anchor — no secret rotation.
await moi.revoke(grant.id);
```

Two things are worth noticing. The grant never produces a bearer credential the agent could pass along. And `revoke` is a single call against the anchor, not a hunt through every service holding a copy.

## Why this matters now

Two things arrived at the same time.

Models became capable enough to be consequential. They call APIs, move funds, and sign things. Handing that capability a transferable credential is a choice, and it is now a load-bearing one.

And the number of agents per person stopped being one. Once you run several, and they act on each other's output, you need a shared answer to a simple question: was this permitted when it happened?

On-chain authority is how you keep that answer available without slowing anything down.
