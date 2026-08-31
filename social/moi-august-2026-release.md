---
slug: moi-august-2026-release
title: "MOI August 2026 Release: storage costing and access control"
published: 2026-08-21

# X allows 280 characters. The link counts as 23 whatever its length.
x: |
  State on MOI now costs something and has an owner.

  go-moi v0.12.0: storage is prepaid (no grant, no write). Foreign writes are denied until the account publishes a policy naming your logic. Nothing is grandfathered.

  {{link}}

linkedin: |
  MOI's August release makes two things true on the network: state costs something, and it has an owner who decides who may write to it.

  The design behind that is unusual. On MOI, every participant, human or agent, holds their own state. A deployed program (a logic, in MOI terms) keeps its data about you on your account, not its own. That forces two questions other networks settle implicitly: who pays for the space, and who may write into it.

  go-moi v0.12.0 answers both. Storage is now prepaid, a grant of bytes bought up front, and a write with no grant behind it is refused before it lands. Writes to an account inside an interaction that account did not sign are denied until the owner publishes an access policy naming the logic. Nothing is grandfathered, and nobody can publish the policy on the owner's behalf.

  The post covers what to change if you build on MOI (js-moi-sdk v0.8.0, Coco v0.9.0, renumbered interaction op-codes), the coordinated node upgrade for operators, and what changed in Voyage and the MOI wallet.

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
