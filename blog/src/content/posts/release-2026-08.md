---
title: "MOI August release: state has a price, and a permission"
summary: "go-moi v0.12.0 charges for state growth and puts every write to someone else's state behind an explicit, revocable permission — what it means for you."
date: 2026-08-18
author:
  name: "Sarva Labs"
  role: "Engineering"
  url: "https://sarvalabs.com"
tags: ["releases", "protocol", "developers"]
takeaways:
  - "State growth on MOI is now metered and paid for. Every write has a payer, and the SDK funds new asset and logic accounts automatically, so most code carries on unchanged."
  - "Writing to another participant's state is denied by default. The owner grants a scoped access policy, and can narrow or revoke it at any time."
  - "This is one protocol upgrade with matching releases in the PISA runtime, the Coco language, the JS SDK and Voyage. Node operators must stop all nodes and upgrade together; developers must re-check anything that decodes interaction op-codes."
  - "For users: sign in to Voyage with your wallet, register yourself as a participant, and use the faucet only after registering."
faq:
  - q: "Do I have to change my code to keep deploying logics after this release?"
    a: "Mostly no. The SDK funds newly created asset and logic accounts for their initial storage automatically. You will need to update anything that decodes interaction op-codes (they were renumbered), rename PersistentState to LogicState and EphemeralState to ActorState, and add state qualifiers to any custom asset logic."
  - q: "Who pays for storage when my logic writes state?"
    a: "For logic state, the interaction sender by default; for actor state, the participant whose state it is. Coco's new payer clause on mutate (logic state only) lets the logic absorb the cost itself, or bill a named actor who signed the interaction."
  - q: "Can my logic still write to another participant's state?"
    a: "Only if that participant has granted it. Writes to another actor's state are now denied by default; the owner grants a scoped access policy through the new IxAccessCreate interaction, and can update or revoke it at any time."
  - q: "I run a node. Can I roll the upgrade one node at a time?"
    a: "No. v0.12.0 changes state-transition semantics and adds interaction types older nodes cannot decode, so mixed versions will diverge. Stop every node, deploy v0.12.0 everywhere, restart bootnodes then guardians, and confirm peers connect on the 0.12.0 protocol IDs before resuming traffic."
  - q: "Why does the Voyage faucet say USER DOESNT EXIST?"
    a: "The faucet no longer creates accounts. Register yourself as a participant first — from Voyage or by following the wallet's instructions — then request funds."
draft: false
---

On MOI, state growth is now metered and paid for, and every write to someone else's state needs the owner's explicit, revocable permission. Both are new in this release.

Those two changes are the whole story of the August release. They start in the protocol, in go-moi v0.12.0, and they run all the way up: into the PISA runtime that executes logic, into the Coco language you write it in, into the JavaScript SDK you call it from, and out to Voyage, whose faucet behaviour has changed in the same window. Read this as one upgrade with a lot of moving parts, not as a pile of separate ones.

If you only take one thing away: **state now has a price, and a permission.** The rest of this post is what that means for you, depending on how you use MOI.

## Storage costing

**What changed.** State growth is now charged for. Every byte a write adds to the network is metered against a payer, and bytes a write releases are metered too. Storage has a price, queryable at any time, and accounts can deposit into and withdraw from storage through two new interaction types.

**Why.** Unbounded free state is a subsidy paid by every node operator forever. Charging for growth makes state size economically bounded rather than a slow externality.

**What it means for you.**

*Developers* — for most code the change is small. When you create an asset or deploy a logic through js-moi-sdk v0.8.0, the SDK now funds the new account with KMOI from the sender to cover its initial storage; the amount is a `RoutineOption` if you want to tune it. Where it does change is when you want control over who pays. In Coco v0.9.0, a logic-state write bills the interaction sender by default, and the new `payer` clause on `mutate` re-bills it:

```coco
mutate name -> MyModule.Logic.name payer Logic          // the logic absorbs its own setup cost
mutate cfg  -> MyModule.Logic.config payer Actor(sponsor)
```

`payer Sender` is the default; `payer Logic` and `payer Actor(<id>)` are the alternatives, and the named actor must have signed the interaction. It applies to logic state only. `Environment.StorageResult(account, payer)` replaces the old global `VolumeCapacity()` / `VolumeAvailable()` metering and returns the bytes added and removed in the current interaction for that account and payer.

<!-- TODO: link the tutorial on payer / storage costing when it lands -->

*Node operators* — the state on your disk is now paid for by whoever grows it, so state size is economically bounded rather than growing for free. You can watch it: pricing via `moi.StoragePricing`, per-account usage via `moi.StorageMetric`.

*Token holders* — KMOI now pays for state as well as fuel. New asset and logic accounts are funded with KMOI to cover their initial storage.

*Users* — the Voyage faucet changed in the same window. It no longer creates an account and funds it in one step; it only sends tokens to accounts that already exist on the network. Register yourself as a participant first, then use the faucet. If you see `USER DOESNT EXIST`, that is the reason.

**What breaks.** Anything that reads the old volume-metering values: metering is now per (account, payer) and reports bytes added and released, and the old global capacity and availability queries are gone.

## Access control

**What changed.** MOI now has a first-class permission system. An access policy names a resource (storage, an asset, a logic, or a key), an action on it (`StorageMutate`, `AssetAccess`, `LogicAccess`), and who may perform it — as caller and origin constraints, each either unrestricted or a fixed set of participants and logics. Policies can be scoped to part of a resource rather than granting it whole. They live as state like anything else, and are created, updated and deleted through three new interaction types.

**Why.** Authority on MOI has always been the participant's. This release makes that enforceable at the write: a logic can no longer reach into another actor's state just because it can address it. Permission is granted by the owner, in a form the owner can narrow or revoke at any moment.

**What it means for you.**

*Developers* — the runtime rule is simple: a logic may always write the state of the actor who sent the interaction, and may write anyone else's only if that actor has granted it. In Cocolab that grant is a command — Bob authorises Alice to write into his context through the Token logic:

```
grant storage_mutate to callers(any) origins(Alice) through Token as Bob
```

Cocolab now emulates the runtime's default-deny, so a logic that silently relied on writing to other actors will fail in the lab before it fails on the network. New Actor methods — `Actor(id).Exists()`, `Actor(id).HasSigned()` and `Actor(id).Param("key")` — query the participant rather than state, so an endpoint that only calls them stays `pure`. Guard caller-supplied identifiers with `Exists()` first; the other two raise on a non-participant. Over the SDK, policies are `create` / `update` / `delete` operations, and `moi.AccessPolicy` / `moi.AccessPolicies` read them back.

<!-- TODO: link the tutorial on access policies when it lands -->

*Node operators* — policies are validated when submitted and persisted as state like anything else. Nothing access-control-specific to configure; everything to upgrade for, since older nodes cannot decode the new interaction types.

*Users* — nothing writes to your state unless you granted it, the grant is scoped to what you chose, and you can narrow or revoke it at any time. Today that grant is made through the SDK or Cocolab. <!-- TODO(review): is there a Voyage or wallet UI for viewing or revoking a policy? -->

**What breaks.** Any logic that writes to another actor's state without a grant. And a logic can no longer load another logic's actor state at all — the runtime raises an error.

## For developers

Beyond the two highlights, the developer surface moved in a few places worth knowing about.

- **Interaction op-codes were renumbered.** `IxOpType` is an integer on the wire and the values were reordered — only `0`, `1` and `4` kept their meaning. If you have an indexer, a custom client, or anything that decodes interactions by numeric op-code, it is wrong until updated. Five asset ops (`Transfer`, `Approve`, `Revoke`, `Mint`, `Burn`) are gone, folded into a single `IxAssetAction` with an endpoint and POLO-encoded calldata; `TxFuelSupply` is dropped outright.
- **Native asset standards.** Existing MAS0, MAS1 and MAS2 assets keep working. To create new ones, use their own `AssetLogic.create()` flows; `AssetFactory` is now for custom MASX assets and `AssetFactory.create()` requires a manifest.
- **Asset methods need exact state qualifiers.** Every asset write is `dynamic`, every asset read is `static`, and the compiler enforces it. Asset logic written for the previous target needs the qualifiers added.
- **Predictable IDs.** `predictAssetId` and `predictLogicId` give you an account ID before creation, so you can reference it ahead of time.
- **Naming caught up with the manifest.** `PersistentState` is `LogicState`; `EphemeralState` is `ActorState`.
- **Coco got less repetitive.** Field-name shorthand in class and event literals: `Person{name, age}` instead of `Person{name: name, age: age}`.
- **Tooling.** vscode-coco v0.4.0 supports Coco 0.9.0 and PISA 0.8.0, including the new `payer` clause, and is available from the VS Code marketplace.
- **RPC changes to act on.** If you read `moi.LogicIDs`, `debug.Accounts` or `net.Peers`, their return shape changed — they now return the unified identifier type, so update your parsers. `moi.Registry` is gone with no drop-in replacement; anything calling it will fail. New read RPCs cover account keys and sub-account counts, the validator set, and asset lockups, deeds and mandates.

## For validators and node operators

This is a **coordinated upgrade**, and it does not roll. Access control, storage costing and the new validator system object all change state-transition semantics, and access control adds interaction types that older nodes cannot decode. Mixed versions will diverge.

1. Stop all nodes. Do not roll.
2. Pull the v0.12.0 image. <!-- TODO(review): public image registry and tag -->
3. Deploy it to every node.
4. Restart bootnodes, then guardian nodes.
5. Verify peers connect on the `0.12.0` protocol IDs before resuming traffic.

Config and genesis files must be updated for `ProtocolVersion 0.12.0`. <!-- TODO(review): the go-moi notes cite the embedded runtime as PISA v0.8.0 in one place and v0.5.0 in another, and Coco v0.7.0 where the language release is v0.9.0 — confirm the versions before publish -->

What you will notice on the node:

- **Less bandwidth between nodes** — consensus and syncer traffic is compressed, most noticeable on large ICS sets.
- **A restarted node waits** — consensus no longer starts until initial sync has finished.
- **Read locks** — accounts can participate in a tesseract with a latest-consistent-read guarantee instead of a full mutation, which lightens the consensus hot path.
- **Validator data has a home** — a dedicated system object replaces ad-hoc tracking, readable via `moi.Validators`.
- **Liveness** — a randomised liveness algorithm, and a slot-locking stall fix.

<!-- TODO(review): guardian staking interaction types are in the go-moi op-code table with no release note — shipped or guarded? anything operators must do? -->

## For the community

Voyage 0.9.0 lets you **sign in with your MOI wallet**. You sign a short message; no transaction is sent and no fuel is spent. You can connect more than one wallet account to a Voyage account. <!-- TODO(review): if you previously signed in with IOME or an imported ID, does the account and its history carry over, and how do you get back in? -->

Voyage shipped twice this month. Since 0.8.2 you can also **register yourself as a participant** from Voyage, and see a participant's tesseracts with pagination. Pending interactions show on the home page again.

And the faucet change from above bears repeating because it will be the first thing people hit: **register first, then use the faucet.** It no longer creates accounts.

## Everything shipped

| Component | Version | What | |
|---|---|---|---|
| go-moi | v0.12.0 | Storage costing, access control, read locks, validator system object, native asset logics, message compression, PISA v0.8.0 | |
| go-pisa | v0.8.0 | Storage payer opcodes, access-control interface, per-(account, payer) storage metering, asset access levels | |
| cocolang | v0.9.0 | `payer` on `mutate`, `Actor()` queries, field shorthand, `grant storage_mutate` in Cocolab, asset qualifiers | [docs](https://cocolang.dev/docs/releases/#v090) |
| vscode-coco | v0.4.0 | Coco 0.9.0 / PISA 0.8.0 support, `payer` | [notes](https://github.com/sarvalabs/vscode-coco/releases/tag/v0.4.0) |
| js-moi-sdk | v0.8.0 | Storage and access-policy interactions and RPCs, automatic funding, ID prediction, MAS0/1/2 flows, state renames | [notes](https://github.com/sarvalabs/js-moi-sdk/releases/tag/v0.8.0) |
| voyage | v0.9.0 | Wallet sign-in | |
| voyage | v0.8.2 | Participant registration, tesseracts by participant, pending-interactions fix | |
| voyage-api | v0.9.0 | Wallet auth, faucet only funds existing accounts | |
| voyage-api | v0.8.2 | Registration APIs with rate limits, tesseract pagination | |
<!-- TODO(review): the go-moi, go-pisa, cocolang, voyage and voyage-api release pages are private — link public notes if they exist elsewhere, otherwise leave the cells empty -->
<!-- TODO(review): js-moi-agent-registry v0.3.0-rc1 — include a release candidate here? Its peer dependency is js-moi-sdk 0.8.0, which developers using it need to know -->
<!-- TODO(review): MOI Wallet extension v0.1.4 — release notes not available to the author -->

## What to do now

**If you build on MOI**
- Update to js-moi-sdk v0.8.0 and Coco v0.9.0 (set `version = "0.8.0"` under `[target.pisa]`).
- Search your code for `PersistentState` and `EphemeralState`; rename.
- If you decode interaction op-codes anywhere — indexer, explorer, custom client — update the mapping before touching a v0.12.0 node.
- Add `dynamic` / `static` qualifiers to any custom asset logic.
- Run your logic in Cocolab under v0.9.0: anything that wrote another actor's state without a grant will now fail there first.

**If you run a node**
- Schedule a coordinated stop. Update config and genesis for `ProtocolVersion 0.12.0`. Follow the five steps above.

**If you use Voyage**
- Sign in with your wallet. Register as a participant before requesting from the faucet.
