---
title: "MOI August 2026 release: storage costing and access control"
summary: "go-moi v0.12.0: state is bought up front as a storage grant, and a logic writing to your account now needs a policy you published."
date: 2026-08-19
author:
  name: "Sarva Labs"
  role: "Engineering"
  url: "https://sarvalabs.com"
tags: ["protocol", "agents", "native-assets"]
takeaways:
  - "State is bought up front as a storage grant, not billed per interaction. A write with no grant behind it is refused and the interaction reverts. Unused bytes convert back to KMOI."
  - "A logic writing to an account that neither sent the interaction nor is the logic itself is a foreign access, and it is denied unless that account published a policy allowing it."
  - "Access policies are defined over assets, logics, storage and keys, but the protocol enforces the storage dimension only in this release. The rest are reserved."
  - "Interaction op-codes were renumbered. Only 0, 1 and 4 kept their meaning, so any indexer or custom client that decodes by numeric op-code is wrong until updated."
  - "This is a coordinated upgrade. Nodes must stop together — mixed versions cannot decode each other's interactions and will diverge."
faq:
  - q: "What happens if a logic writes state and there is no storage grant?"
    a: "The write is refused and the interaction reverts. Storage is not billed after the fact or invoiced — the grant has to exist before the write lands. StorageDeposit converts KMOI into bytes of grant on a target account, and moi.StorageMetric reports where that grant currently stands."
  - q: "Do I get anything back if my logic frees state?"
    a: "Yes. StorageWithdraw releases unused bytes back into KMOI, returned to the sender. Deposit and withdraw are exact inverses, so a logic that cleans up after itself reclaims what it is no longer using."
  - q: "Why can my logic no longer write to another participant's state?"
    a: "Because on MOI the actor state a logic keeps about you lives on your account, not the logic's. A write to an account that neither sent the interaction nor is the logic itself is a foreign access, and the execution engine denies it unless that account has published an access policy permitting it."
  - q: "What does an access policy actually contain?"
    a: "A resource and its ID — for storage, the Logic ID of the logic doing the writing — the set of actions permitted, and two constraints: caller, the immediate invoker, and origin, the original sender of the interaction. Both can be unrestricted or a fixed set of participants and logics."
  - q: "Can I set access policies on my assets or keys yet?"
    a: "Not yet. The model defines resource types for assets, logics, storage and keys, but only storage is enforced in this release. A policy naming any other class is rejected at validation."
  - q: "I run a node. Can I upgrade one node at a time?"
    a: "No. Access control, storage costing and the new validator system object all change state-transition semantics, and access control adds interaction types older nodes cannot decode. Stop every node, deploy v0.12.0 everywhere, restart bootnodes then guardians, and confirm peers connect on the 0.12.0 protocol IDs before resuming traffic."
  - q: "Why does the Voyage faucet say USER DOESNT EXIST?"
    a: "The faucet no longer creates an account and funds it in one step. It only sends tokens to accounts that already exist on the network, so register as a participant first — from Voyage or by following the wallet's instructions — then request funds."
draft: false
---

Two things are true on MOI that were not true a week ago. State costs something, and it has an owner who decides who may write to it.

Both land in **go-moi v0.12.0**, and both run the full height of the stack — through the PISA runtime that executes logic, the Coco language you write it in, the JavaScript SDK you call it from, and out into Voyage. This is one upgrade with a lot of moving parts, not a pile of separate ones.

## What changed in this release?

Storage costing and access control. Everything else in this post follows from those two.

The versions this covers, all released between 13 and 18 August 2026:

`go-moi:v0.12.0` · `go-pisa:v0.8.0` · `cocolang:v0.9.0` · `vscode-coco:v0.4.0` ·
`js-moi-sdk:v0.8.0` · `js-moi-agent-registry:v0.3.0-rc1` · `voyage:v0.9.0` ·
`voyage-api:v0.9.0` · `voyage:v0.8.2` · `voyage-api:v0.8.2`

They are related. Once a logic's state lives on *your* account rather than the logic's — which is what [the Participant Layer means in practice](https://blog.moi.technology/article/what-is-moi-network/) — two questions have to be answered explicitly that other chains answer implicitly. Who pays for the space that state occupies? And who is allowed to write into it?

| Layer | Storage costing | Access control |
|---|---|---|
| **go-moi** v0.12.0 | `StorageDeposit` / `StorageWithdraw` interactions, `moi.StorageMetric` and `moi.StoragePricing` RPCs | `AccessCreate` / `AccessUpdate` / `AccessDelete` interactions, `moi.AccessPolicy` and `moi.AccessPolicies` RPCs |
| **PISA** v0.8.0 | `VOLPAY` opcode, metering per (account, payer) | `AccessControl` interface, foreign actor-state writes denied |
| **Coco** v0.9.0 | `payer` clause on `mutate` | `grant storage_mutate` in Cocolab, `Actor()` queries |
| **js-moi-sdk** v0.8.0 | Deposit and withdraw, automatic funding on creation | Policy create, update and delete |
| **Voyage** v0.9.0 | Faucet funds existing accounts only | — |

## How does paying for storage work?

You buy it up front as a **storage grant** — a quota of bytes reserved on a target account and attributed to a specific participant. It is not billed per interaction and it is not invoiced afterwards.

That distinction matters more than it sounds. **A write with no grant behind it is not deferred or charged later. It is refused, and the interaction reverts.** Storage is a precondition, not a bill.

Two operations manage the grant, and they are exact inverses:

| Operation | Does |
|---|---|
| `StorageDeposit` | Converts KMOI into bytes of grant on a target account |
| `StorageWithdraw` | Releases unused bytes back into KMOI, returned to the sender |

A third piece, the `moi.StorageMetric` RPC, reports where a grant currently stands. Because withdraw is the inverse of deposit, a logic that frees state reclaims what it is no longer using — cleaning up has a return, rather than being pure altruism.

### Who pays when my logic writes?

By default, whoever sent the interaction. Coco v0.9.0 adds a `payer` clause on `mutate` that re-bills it:

```coco
mutate name -> MyModule.Logic.name payer Logic          // the logic absorbs its own setup cost
mutate cfg  -> MyModule.Logic.config payer Actor(sponsor)
```

`payer Sender` is the default; `payer Logic` makes the logic carry the cost; `payer Actor(<id>)` bills a named participant, who must have signed the interaction. It applies to logic state only.

For most application code, none of this is work you have to do. **js-moi-sdk v0.8.0 funds newly created asset and logic accounts automatically** so they can cover their initial storage, with the amount tunable through `RoutineOption`. You reach for `payer` when you want a different answer to who pays — a logic that sponsors its own users, say.

<!-- TODO: link the Manage Storage tutorial once moidocs#120 merges (docs/build/tutorials/storage-cost-tutorial) -->

## Why does a logic need permission to write my state?

Because on MOI it is writing to *your* account, not its own.

This is the part that differs most from what you may be used to. On Ethereum a contract owns its storage; changing your balance means changing the contract's own database, so authorization is implicit and any finer control is hand-written inside the contract with something like `require(msg.sender == owner)`.

MOI moves that state to the participant. The data a logic keeps about you — its **actor state** — lives on your account. So a logic routinely writes to storage it does not own, and implicit trust stops being a safe default. The protocol needs an explicit answer to: *may this logic write to this account, in this situation?*

The docs put it as a scheduling logic. Bob books his own time all day — he signs those interactions himself, and writing to his own account needs no extra permission. But Bob's assistant Alice also arranges meetings for him, and when she does, the logic must write to a calendar that lives on Bob's account, inside an interaction Bob never signed. That is a **foreign access**. Without a rule, anyone could fill Bob's calendar. So before the write lands, the engine checks the policies published on Bob's account: has Bob authorised this logic, driven by Alice, to modify his state? Alice's write goes through. The same write driven by anyone else is denied.

### What does a policy contain?

| Field | What it constrains |
|---|---|
| `Resource` | The class of object governed — `storage` today |
| `ResourceID` | The specific resource; for storage, the Logic ID doing the write |
| `Actions` | The operations permitted; at least one must be set |
| `Caller` | The immediate invoker — the sender, or the calling logic in a cross-logic call |
| `Origin` | The original sender of the interaction |

Caller and origin are each either unrestricted or a fixed set of participants and logics. Being able to constrain both is what lets Bob say *this logic, driven by Alice* rather than merely *this logic*.

**One scope limit worth knowing.** The model defines resource types for assets, logics, storage and keys, but **only `storage` is enforced in this release** — a policy naming any other class is rejected at validation. The `Scope` field, intended to narrow a policy to part of a resource, is reserved and unenforced. Write against what ships, not against the model.

In Coco, Cocolab now emulates the runtime's default-deny, so a logic that quietly relied on writing other actors' state fails in the lab before it fails on the network:

```
grant storage_mutate to callers(any) origins(Alice) through Token as Bob
```

<!-- TODO: link the Manage Access Policies tutorial once moidocs#120 merges (docs/build/tutorials/access-policy-tutorial) -->

## What else landed at the account level?

Three things worth knowing, none of which are storage or access control.

**Participant variants got first-class support.** Two new interactions,
`AccountConfigure` and `AccountInherit`, cover account configuration and
context inheritance — a variant account inheriting context from its parent.
`moi.SubAccountCount` reports how many variants sit under an account, and
participant-create is now correctly rejected when the target is itself a
variant. The syncer was optimised for inheritance too, so this is not a
surface-level addition.

**Asset approvals became inspectable.** Three read RPCs arrived for things
that previously had no direct query: `moi.Lockups` for asset lockups held by
an account, `moi.Deeds` for the lockup deeds behind them, and
`moi.Mandates` for asset approvals *and their expiry*. If you have been
tracking approvals by replaying interactions, you can now just ask.

**Keys are enumerable.** `moi.AccountKeys` lists the keys on an account,
which multi-key and recovery flows previously had to infer.

## What do developers need to change?

Most application code keeps working. These are the things that do not.

- **Interaction op-codes were renumbered.** `IxOpType` is an integer on the wire and the values were reordered — **only `0`, `1` and `4` kept their meaning**. If you run an indexer, an explorer, or any custom client that decodes interactions by numeric op-code, it is silently wrong until updated. Five asset operations — transfer, approve, revoke, mint, burn — are folded into a single `IxAssetAction` with an endpoint and POLO-encoded calldata. `TxFuelSupply` is dropped, and `moi.Registry` is removed with no replacement.
- **Asset methods need exact state qualifiers.** Every asset write is `dynamic`, every asset read is `static`, and the compiler enforces it.
- **State naming caught up with the manifest.** `PersistentState` is now `LogicState`; `EphemeralState` is now `ActorState`.
- **Native asset standards have their own flows.** Create MAS0, MAS1 and MAS2 through their respective `AssetLogic.create()`; `AssetFactory` is now for custom MASX assets and `AssetFactory.create()` requires a manifest.
- **A logic can no longer load another logic's actor state.** The runtime raises an error.
- **Return types changed** on `moi.LogicIDs`, `debug.Accounts` and `net.Peers` — they now return a unified identifier type, so parsers need updating.

Smaller things that are simply nice: `predictAssetId` and `predictLogicId` give you an account ID before creation; Coco gained field-name shorthand in class literals (`Person{name, age}`); and vscode-coco v0.4.0 understands the `payer` clause.

<!-- TODO(review): js-moi-agent-registry v0.3.0-rc1 is a release candidate whose peer dependency is js-moi-sdk 0.8.0 — mention it here, or wait for the final? -->

## What do node operators need to do?

Upgrade every node together. This one does not roll.

Access control, storage costing and the new validator system object all change state-transition semantics, and access control adds interaction types that older nodes cannot decode. Mixed versions will diverge.

1. Stop all nodes. Do not roll.
2. Pull the v0.12.0 image. <!-- TODO(review): public registry and tag for the image -->
3. Deploy it to every node. The build requirement is now Go 1.24.6.
4. Restart bootnodes, then guardian nodes.
5. Confirm peers connect on the `0.12.0` protocol IDs before resuming traffic.

Config and genesis files need updating for `ProtocolVersion 0.12.0`.

What you will notice once it is running: consensus and syncer traffic is now compressed, which shows up most on large ICS sets; a restarted node waits for initial sync to finish before joining consensus; read locks let accounts take part in a tesseract with a latest-consistent-read guarantee instead of a full mutation, lightening the consensus hot path; and validator data now lives in a dedicated system object, readable through `moi.Validators`, instead of being tracked ad hoc. Images are now published multi-OS and multi-arch, and the liveness algorithm is randomised, with a slot-locking stall fixed.

<!-- TODO(review): guardian staking interaction types appear in the go-moi op-code table with no release note — shipped or guarded? Anything operators must do? -->

## What changed in Voyage and the wallet?

Voyage shipped twice in this window, and the second release changes how you get in.

**Sign in with your wallet.** Voyage v0.9.0 replaces the old sign-in — generate a MOI ID, log in with IOME, or import an existing ID — with signing in through the MOI wallet Chrome extension. It works the way "Connect Wallet" does elsewhere: you sign a short message, **no transaction is sent and no fuel is spent**. You can connect more than one wallet account to a single Voyage account.

**Register yourself as a participant.** Since v0.8.2 you can complete on-chain registration from Voyage itself, by supplying either POLO-encoded account details or ordinary account details. The API side added rate limits on how many registrations and token transfers are allowed per day.

**Better history.** A new API returns a participant's tesseracts with pagination, so Voyage can page through an account's history rather than truncating it, and pending interactions appear on the home page again after a spell of going missing.

**The faucet changed, and this is the one that will catch people out.** It used to create an account and fund it in one step. Now it only sends tokens to accounts that already exist on the network — if the account is not on-chain yet, it returns `USER DOESNT EXIST`. Register first, then use the faucet.

<!-- TODO(review): MOI Wallet extension v0.1.4 shipped in this window and Voyage's new sign-in depends on it, but its release notes were not accessible — what changed in the extension? -->

## Everything shipped

| Release | What it brings |
|---|---|
| `go-moi:v0.12.0` | Storage costing, access control, read locks, validator system object, native asset logics, message compression. Protocol version 0.12.0; Go 1.24.6 |
| `go-pisa:v0.8.0` | `VOLPAY` and `VOLRES` opcodes, the `AccessControl` interface, metering per (account, payer), asset access levels |
| `cocolang:v0.9.0` | `payer` on `mutate`, `Actor()` queries, field shorthand, `grant storage_mutate` in Cocolab, asset state qualifiers — [release notes](https://cocolang.dev/docs/releases/#v090) · [docs](https://cocolang.dev/docs/book) |
| `vscode-coco:v0.4.0` | Coco 0.9.0 and PISA 0.8.0 support, the `payer` clause, actor validation — [release notes](https://github.com/sarvalabs/vscode-coco/releases/tag/v0.4.0), and on the VS Code marketplace |
| `js-moi-sdk:v0.8.0` | Storage and access-policy operations, automatic funding on creation, ID prediction, MAS0/1/2 flows, state renames — [release notes](https://github.com/sarvalabs/js-moi-sdk/releases/tag/v0.8.0) |
| `js-moi-agent-registry:v0.3.0-rc1` | Release candidate. Read methods surface failures instead of swallowing them; peers with SDK 0.8.0 |
| `voyage:v0.9.0` · `voyage-api:v0.9.0` | Wallet sign-in; faucet funds existing accounts only |
| `voyage:v0.8.2` · `voyage-api:v0.8.2` | Participant registration with rate limits, tesseracts by participant with pagination, pending-interactions fix |

<!-- TODO(review): go-moi's notes cite the embedded runtime as PISA v0.8.0 in Highlights and v0.5.0 in the Compute changelog, and Coco v0.7.0 where the language release is v0.9.0 — confirm before publishing -->
<!-- TODO(review): MOI Wallet extension v0.1.4 shipped in this window; release notes were not accessible to the author -->

## What to do now

**If you build on MOI** — move to js-moi-sdk v0.8.0 and Coco v0.9.0. Rename `PersistentState` and `EphemeralState`. Add `dynamic` and `static` qualifiers to custom asset logic. If anything you own decodes interaction op-codes, fix the mapping *before* it touches a v0.12.0 node. Then run your logic in Cocolab under v0.9.0 — anything relying on a foreign actor-state write will fail there first, which is where you want to find it.

**If you run a node** — schedule a coordinated stop, update config and genesis for `ProtocolVersion 0.12.0`, and follow the five steps above.

**If you use Voyage** — sign in with your wallet, and register as a participant before asking the faucet for anything.

For the ideas underneath all of this, the two places to start are [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/) and [how to give an agent authority without handing it your credentials](https://blog.moi.technology/article/how-to-give-an-ai-agent-authority-without-your-credentials/).
