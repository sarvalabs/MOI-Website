---
slug: how-to-give-an-ai-agent-authority-without-your-credentials
title: "How to give an AI agent authority without handing it your credentials"
published: 2026-08-19

# X allows 280 characters. The link counts as 23 whatever its length.
x: |
  An API key handed to an agent is not authority. Whoever reads it holds what the agent holds, and it says 800 long after you cut the budget to 500.

  The fix: a scoped mandate, enforced outside the agent, revocable in one state change.

  {{link}}

linkedin: |
  Most agent stacks copy a credential into the agent and hope it behaves. An API key or OAuth token is a bearer credential: whoever reads it holds what the agent holds, and it records what you wanted at issuance, not what you want now.

  At machine speed that gap is priced in actions, not seconds. Exposure inside a revocation window is actions per second times window length, and agents manufacture actions faster than humans manufacture decisions. GitGuardian counted 28.65 million new hardcoded secrets in public GitHub commits in 2025, over 1.2 million of them for AI services.

  The alternative keeps authority with you. The agent gets a scoped mandate that names it, sets a ceiling, binds a specific card or account, expires, and stays revocable in one state change. Enforcement runs outside the agent, so a prompt-injected agent can attempt anything and still finalize nothing outside its mandate. That is the layer MOI provides: authority held by the participant, on chain, checked before an action commits.

  One test worth keeping: at 9:14 on a Tuesday you cut an agent's budget from 800 to 500 dollars. Ask your stack when every check sees 500.

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
