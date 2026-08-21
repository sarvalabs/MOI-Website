---
title: "go-moi v0.12.0: storage costing and access control on MOI"
summary: "MOI's August 2026 release: state is bought up front as a storage grant, foreign writes need a policy you publish, and the faucet funds only existing accounts."
date: 2026-08-19
cover: "/covers/moi-august-2026-release.svg"
author:
  name: "Sarva Labs"
  role: "Engineering"
  url: "https://sarvalabs.com"
tags: ["protocol", "agents", "native-assets", "release", "go-moi"]
takeaways:
  - "On MOI, state is bought up front as a storage grant, not billed per interaction. A write with no grant behind it is refused and the interaction reverts. Unused bytes convert back to KMOI, but only grant attributed to the sender is reclaimable — a deposit made on someone else's behalf cannot be withdrawn by the depositor."
  - "On MOI, a logic writing to an account that neither sent the interaction nor is the logic itself is a foreign access, denied unless that account published a policy allowing it."
  - "MOI access policies are defined over assets, logics, storage and keys, but go-moi v0.12.0 enforces only the storage dimension. The rest are reserved."
  - "go-moi v0.12.0 renumbered the interaction op-codes. Only 0, 1 and 4 kept their meaning, so any indexer or custom client that decodes by numeric op-code is wrong until updated."
  - "go-moi v0.12.0 is a coordinated upgrade. Nodes must stop together — mixed versions cannot decode each other's interactions and will diverge."
faq:
  - q: "What happens if a logic writes state and there is no storage grant?"
    a: "On MOI, the engine refuses the write and the interaction reverts. Nothing is billed afterwards; the grant has to exist before the write lands. moi.StorageMetric reports where a grant stands, and moi.StoragePricing gives the current rate."
  - q: "Do I get anything back if my logic frees state?"
    a: "Yes. StorageWithdraw releases unused bytes back into KMOI, returned to the sender, so a logic that cleans up after itself reclaims what it no longer uses. Only grant attributed to the sender is reclaimable; a deposit made on someone else's behalf cannot be withdrawn by the depositor."
  - q: "I have a dapp with existing users. What breaks when v0.12.0 lands?"
    a: "Writes to a user's actor state inside interactions someone else signed are foreign accesses, denied until that user publishes an access policy naming your logic. Writes inside interactions the user signed themselves are self-access and keep working with no policy. Nothing is grandfathered, and the policy interaction must be sent by the account it protects — you cannot publish it on a user's behalf. Each foreign write draws on a storage grant on the user's account, funded by the user's own StorageDeposit or by your deposit with .for(), which you cannot later withdraw. Per user, the order is: register as a participant (the devnet reset removed existing accounts, so devnet users register again), put a grant on their account, then publish the policy naming your logic."
  - q: "js-moi-agent-registry v0.3.0-rc1 is a release candidate. Why move to it?"
    a: "It is the client library for MOI's agent registry, and v0.3.0-rc1 carries the registry Logic ID for the reset devnet and pins js-moi-sdk 0.8.0 as an exact peer dependency. Keeping v0.2.0 next to the new SDK fails at install with an ERESOLVE conflict."
  - q: "Can I set access policies on my assets or keys yet?"
    a: "Not yet. The model defines resource types for assets, logics, storage and keys, but go-moi v0.12.0 enforces only storage. A policy naming any other class is rejected at validation."
  - q: "I run a node. Can I upgrade one node at a time?"
    a: "No. Access control, storage costing and the new validator system object all change state-transition semantics, and access control adds interaction types older nodes cannot decode. Stop every node inside the agreed window, deploy v0.12.0 everywhere, restart bootnodes then guardians, and confirm net.Version answers 0.12.0 and net.Peers returns peers before reopening client traffic."
  - q: "Why does the Voyage faucet say USER DOESNT EXIST?"
    a: "The faucet no longer creates an account and funds it in one step. `USER DOESNT EXIST` is what the raw API returns; the Voyage UI shows it as a message about not being registered in the protocol. It only sends tokens to accounts that already exist on the network, so register as a participant first — from Voyage or by following the wallet's instructions — then request funds."
draft: false
---

Two things became true on MOI in August 2026. State costs something, and it has an owner who decides who may write to it.

Both land in **go-moi v0.12.0**, the reference implementation of the MOI protocol, where every participant, human or agent, holds their own state. The changes run the full height of the stack: **PISA**, the runtime that executes a logic (MOI's term for a deployed program); **Coco**, the language you write logic in; and **js-moi-sdk**, the JavaScript SDK you call it from.

In the same window, **Voyage**, the network explorer and faucet, moved to wallet sign-in and changed how the faucet works, and the **MOI wallet extension** shipped twice — unrelated to the protocol changes, covered at the end.

## What changed in go-moi v0.12.0?

go-moi v0.12.0 makes storage a resource you buy and own, and puts writes to other accounts behind published policy.

Once a logic's state lives on *your* account rather than the logic's, which is what [the Participant Layer means in practice](https://blog.moi.technology/article/what-is-moi-network/), two questions other chains leave implicit need explicit answers: who pays for the space, and who may write into it. Storage costing answers the first, access control the second; both arrive as new interaction types (an interaction is MOI's transaction).

**Where each change lands, by layer and version**

| Layer | Storage costing | Access control |
|---|---|---|
| **go-moi** v0.12.0 | `StorageDeposit` / `StorageWithdraw` interactions, `moi.StorageMetric` and `moi.StoragePricing` RPCs | `AccessCreate` / `AccessUpdate` / `AccessDelete` interactions, `moi.AccessPolicy` and `moi.AccessPolicies` RPCs |
| **PISA** v0.8.0 | `VOLPAY` and `VOLRES` opcodes, metering per (account, payer) | `AccessControl` hook |
| **Coco** v0.9.0 | `payer` clause on `mutate` | `grant storage_mutate` in Cocolab, `Actor()` queries |
| **js-moi-sdk** v0.8.0 | Deposit and withdraw, automatic funding on creation | Policy create, update and delete |

## How does paying for storage work?

On MOI, you buy storage up front as a **storage grant**: a quota of bytes reserved on a target account, attributed to a specific participant, and paid in KMOI. A write with no grant behind it is not deferred or invoiced afterwards; the engine refuses it and the interaction reverts.

`StorageDeposit` converts KMOI into bytes of grant on a target account, and `StorageWithdraw` releases unused bytes back into KMOI, returned to the sender. In js-moi-sdk v0.8.0:

```js
import { StorageDeposit } from "js-moi-sdk";

await new StorageDeposit(signer).target(account).amount(5000).send();
```

`.amount(5000)` is KMOI, not bytes; the grant it buys follows `moi.StoragePricing`'s rate. `.for(participant)` credits someone other than the signer, and defaults to the signer.

`moi.StorageMetric` reports where a grant stands. Inside PISA, `VOLPAY` charges a write against a grant and `VOLRES`, a rename of `VOLAVL`, reports what is left. From Coco, `Environment.StorageResult(account, payer)` replaces the removed `VolumeCapacity()`. The grant is separate from fuel, the per-execution cost of an interaction.

A logic that frees state reclaims the bytes behind it.

Withdrawal is asymmetric: only grant attributed to the sender can be withdrawn, and the depositor cannot take back a `.for()` deposit.

### Who pays when my logic writes?

Whoever sent the interaction, unless the logic says otherwise. Coco v0.9.0 adds a `payer` clause on `mutate`:

```coco
mutate name -> MyModule.Logic.name payer Logic            // the logic absorbs its own setup cost
mutate cfg  -> MyModule.Logic.config payer Actor(sponsor) // sponsor: a participant who signed this interaction
```

`payer Sender` is the default, `payer Logic` makes the logic carry the cost, and `payer Actor(<id>)` bills a named participant, who must have signed the interaction. If not, execution raises `payer has to sign the transaction`, the interaction reverts, and fuel already spent stays spent. The clause applies to logic state only.

**js-moi-sdk v0.8.0 funds new asset and logic accounts automatically**, with the amount tunable through `RoutineOption.storageFund` and a fallback of 1,000,000 KMOI, a flat default rather than a computed cost. The MAS0 create signature (first of the native asset standards) shows it:

```js
// v0.7.x
MAS0AssetLogic.create(signer, symbol, supply, manager, enableEvents);
// v0.8.0: adds an optional RoutineOption and bundles a KMOI storage fund
MAS0AssetLogic.create(signer, symbol, supply, manager, enableEvents, option);
```

The bundled fund covers the new account's own creation cost and nothing more; a deploy routine that also writes logic state still needs `payer Logic`, or a `StorageDeposit` grant already in place.

## Why does a logic need permission to write my state?

Because on MOI it is writing to *your* account, not its own.

This is the part that differs most from what you may be used to. On Ethereum a contract owns its storage, so authorization to write it is implicit; finer control is hand-written with `require(msg.sender == owner)`. MOI moves that state to the participant: the data a logic keeps about you, its **actor state**, lives on your account. A logic routinely writes to storage it does not own, so the protocol needs an explicit answer: may this logic write to this account, in this situation?

MOI's developer docs put it as a scheduling logic. Bob books his own time all day; he signed those interactions, so writes to his own account need no permission. His assistant Alice arranges meetings for him too, putting a write on Bob's account inside an interaction Bob never signed: a **foreign access**, and without a rule anyone could fill Bob's calendar. Before the write lands, the engine checks whether Bob's published policies authorise this logic driven by Alice; they do, so her write goes through. The same write driven by anyone else is denied.

### What does a policy contain?

**Fields of a go-moi v0.12.0 access policy**

| Field | What it constrains |
|---|---|
| `Resource` | The class of object governed — `storage` today |
| `ResourceID` | The specific resource; for storage, the Logic ID doing the write |
| `Actions` | The operations permitted; at least one must be set |
| `Caller` | The immediate invoker — the sender, or the calling logic in a cross-logic call |
| `Origin` | The original sender of the interaction |
| `Scope` | Intended to narrow a policy to part of a resource — reserved, unenforced |

Caller and origin are each unrestricted or a fixed set of participants and logics; constraining both lets Bob say *this logic, driven by Alice* rather than *this logic*.

You publish a policy with `AccessCreate`, amend it with `AccessUpdate` and remove it with `AccessDelete`; `moi.AccessPolicy` reads one back and `moi.AccessPolicies` lists everything on an account. From js-moi-sdk v0.8.0:

```js
import { Access, access, AccessAction } from "js-moi-sdk";

// Bob signs this himself: only the account a policy protects may publish it
await new Access(bobSigner)
  .storage(logicId)                  // the writing logic
  .allow(AccessAction.STORAGE_MUTATE)
  .caller(access.callers(aliceId))
  .create()
  .send();
```

The model defines resource types for assets, logics, storage and keys, but **go-moi v0.12.0 enforces only `storage`** — a policy naming any other class is rejected at validation. `Scope` is reserved and unenforced too.

Cocolab, the local lab you run Coco logic in, now emulates the runtime's default-deny, so a logic that relied on writing other actors' state fails in the lab before failing on the network. You type the grant in Cocolab:

```
grant storage_mutate to callers(any) origins(Alice) through Token as Bob
```

`through Token` names the writing logic, `as Bob` the account written to; `callers` and `origins` mirror the policy's two constraints. The lab applies default-deny only to projects whose `coco.nut` targets `[target.pisa] version = "0.8.0"`; a project still pinned to 0.7.1 keeps the old runtime, passes in the lab, and fails on the network.

Neither change is free for existing code: writes that assumed storage was nobody's problem stop working, and so do writes into accounts that never published consent.

## What do developers need to change?

Most application code keeps working. Four changes in go-moi v0.12.0 touch the wire format:

- **go-moi v0.12.0 renumbered the interaction op-codes.** `IxOpType` is an integer on the wire and the values were reordered; only `0`, `1` and `4` kept their meaning. A client that decodes interactions by numeric op-code reads wrong values with no error to say so.
- **Five asset operations fold into one.** Transfer, approve, revoke, mint and burn now travel as a single `IxAssetAction` carrying a callsite string and calldata encoded in POLO, MOI's wire encoding. The callsite set is wider: `Lockup`, `Release` and `MintWithMetadata` ship too.
- **`TxFuelSupply` is dropped**, with no successor.
- **`moi.Registry` is renamed `moi.Deeds`.** Same `{asset_id, asset_info}` shape, still the assets an account has created: a rename in your client, not a removal.

**Interaction op-codes, go-moi v0.11.3 → v0.12.0**

| v0.11.3 | v0.12.0 |
|---|---|
| 0 `IxInvalid`, 1 `IxParticipantCreate`, 4 `IxAssetCreate` | unchanged |
| 2 `IxAssetTransfer`, 5 `IxAssetApprove`, 6 `IxAssetRevoke`, 7 `IxAssetMint`, 8 `IxAssetBurn` | folded into 5 `IxAssetAction` |
| 3 `TxFuelSupply` | removed |
| 9 `IxLogicDeploy`, 10 `IxLogicInvoke`, 11 `IxLogicEnlist` | 11, 12, 13 |
| 12 `TxLogicInteract`, 13 `TxLogicUpgrade` | 14 `IxLogicInteract`, 15 `IxLogicUpgrade` |
| (new) | 2–3 account ops, 6–10 guardian ops, 16–20 storage and access ops |

- **Coco v0.9.0 asset methods need exact state qualifiers.** Every asset write is `dynamic`, every asset read is `static`, and the compiler enforces it.
- **State naming caught up with the manifest in js-moi-sdk v0.8.0.** `PersistentState` is now `LogicState`; `EphemeralState` is now `ActorState`. Coco itself has used `state logic` and `state actor` since v0.6.0.
- **Native asset standards have their own flows.** Create MAS0, MAS1 and MAS2 through `MAS0AssetLogic.create()`, `MAS1AssetLogic.create()` and `MAS2AssetLogic.create()` — there is no bare `AssetLogic`. `AssetFactory` is now for custom MASX assets, and its `create()` requires a manifest, the logic's compiled interface description.
- **A logic can no longer load another logic's actor state.** The runtime raises an error.
- **Return types changed** on `moi.LogicIDs`, `debug.Accounts` and `net.Peers`. They now return a unified identifier type, so parsers need updating.

vscode-coco v0.4.0 reads `[target.pisa] version` from the `coco.nut` beside the file and gates every version-dependent check on it, reporting `VolumeCapacity()` as removed on a 0.8.0 target while accepting it on 0.7.1. The same checks cover state qualifiers: an omitted qualifier means `pure`, not `static`, and the extension infers what a callable's body needs, so a mismatch surfaces as a warning in the editor rather than at runtime.

`deriveAssetId(sender, standard)` and `deriveLogicId(sender)`, from js-moi-identifiers, give you an account ID before it exists, and Coco gained field shorthand in class literals (`Person{name, age}`).

Only the devnet was reset for go-moi v0.12.0: deployed logics and registered accounts there are gone, so redeploy and re-register.

## What else landed at the account level?

go-moi v0.12.0 also adds account-level features that are neither storage nor access control.

**Participant variants got first-class support.** `AccountInherit` lets a variant account (a sub-account under a participant) inherit context from its parent, and `AccountConfigure` is the separate interaction for adding and revoking keys. `moi.SubAccountCount` counts the variants under an account, and participant-create is now rejected when the target is itself a variant.

**Asset holdings and approvals became inspectable.** `moi.Lockups` returns an account's asset lockups, `moi.Mandates` returns asset approvals *and their expiry*, and `moi.Deeds` lists the assets an account has created.

**Keys are enumerable.** `moi.AccountKeys` lists the keys on an account.

## What do node operators need to do?

Upgrade every node together. This one does not roll.

Access control, storage costing and the new validator system object change state-transition semantics, and access control adds interaction types older nodes cannot decode; mixed versions will diverge.

The window is network-wide, and go-moi is not a public repository, so what you need arrives with your network's release announcement: the window time; the announcement channel, where bootnode health is also posted; the coordinator's contact; the image reference or source access; the `config.json` and `genesis.json` published for your network (the devnet's shipped with its reset); which of your nodes are guardians, meaning nodes the network records as validators; and the expected sync signal and duration. With the announcement in hand, the six steps run start to finish; without it, stop and get it first.

1. Close client traffic: RPC endpoints, load balancers, dapp writes. Then stop all nodes together, inside the agreed window.
2. Take a cold backup of each stopped node's database, `config.json` and `genesis.json`, and keep the pre-0.12.0 binary or image with it — a restore needs the old build, which step 3 replaces. Never copy files out of a running node.
3. Get the v0.12.0 build onto every node: pull the image named in the announcement (now multi-OS and multi-arch) or build from source with Go 1.24.6.
4. Replace `genesis.json` wholesale with the file from the announcement. For `config.json`, diff the published file against the node's current one, keep the keys that are node-local (vault, paths, ports), and ask the coordinator about any key you cannot classify. There is no `ProtocolVersion` key; the version is compiled into the binary, and the node reads the files through `--config-path` and the consensus config's `genesis_path`.
5. Restart bootnodes and wait until they report healthy: `net.Version` answers `0.12.0` and `Peer Connected` lines appear in the log. If the bootnodes are not yours, wait for the confirmation on the announcement channel. Then restart guardians, then any other nodes. Each node completes initial sync before joining consensus; watch for the sync signal from the announcement and budget its duration into the window.
6. Verify each node the same way: `net.Version` answers `0.12.0` and `net.Peers` returns a non-empty array. Once v0.12.0 is up, `moi.Validators` confirms which nodes the network records as validators.

```
curl -s -X POST http://localhost:1600/ -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"net.Peers","params":[]}'
```

Peer IDs are KramaID strings, a prefix and a libp2p peer ID joined by a dot. When both checks pass on every node, re-open the traffic you closed in step 1.

If the window blows out across the network, the coordinator calls a restore: every node returns to its step-2 cold backup together, all-or-nothing for the same reason the upgrade is. If one node fails to sync while the rest run v0.12.0, do not restore its pre-0.12.0 backup next to live nodes; wipe its database and start it fresh on v0.12.0 to rebuild from the new genesis (the shipped flow itself starts nodes with `--clean-db`). If it still refuses, keep it down and escalate to the coordinator.

Once it is running you will notice:

- Consensus and syncer traffic is now compressed, most visible on large ICS (Interaction Consensus Set) clusters.
- Read locks let accounts take part in a tesseract, a block on an account's own chain, with a latest-consistent-read guarantee instead of a full mutation, lightening the consensus hot path.
- Validator data lives in a dedicated system object, readable through `moi.Validators`. Nothing migrates old records into it; the upgrade flow rebuilds the validator set from the new genesis file.
- v0.12.0 randomises the liveness algorithm and fixes a slot-locking stall.

## What changed in Voyage and the wallet?

Voyage shipped twice in this window, v0.8.2 and v0.9.0, and v0.9.0 changes how you get in.

**Sign in with your wallet.** Voyage v0.9.0 replaces the old sign-in (generate a MOI ID, log in with IOME, or import an existing ID) with the MOI wallet Chrome extension. You sign a short message; no transaction is sent and no fuel is spent. You can connect several wallet accounts to one Voyage account.

**Register yourself as a participant.** Since v0.8.2, you can register on-chain from Voyage itself, with POLO-encoded or ordinary account details; the API rate-limits registrations and token transfers per day. The same release returns a participant's tesseracts with pagination, so Voyage pages through history instead of one unbounded response.

**The faucet changed in Voyage v0.9.0.** It used to create an account and fund it in one step; now it only sends tokens to accounts that already exist. If the account is not on-chain yet the API returns `USER DOESNT EXIST`, which the Voyage UI shows as a message about not being registered in the protocol. Register first, then use the faucet.

**Two wallet releases landed alongside.** v0.1.4 added the multi-account picker on Connect Wallet and a link to register your own wallet account. Addresses now truncate to `0x` plus the tag, then the first and last four characters of the fingerprint (`0x00…4cd9…da10`), with a suffix marking sub-accounts. The sign-interaction screen dropped sequence-number validation and stopped overriding a dapp-supplied `fuel_limit`; fuel is still estimated when the dapp omits one. v0.1.5 added error handling and validation in network configuration, and raised the participant registration amount in the encoded payload from 1k to 100k.

## Everything shipped

Everything here landed between 12 and 18 August 2026.

| Release | Released | What it brings |
|---|---|---|
| `go-moi:v0.12.0` | 14 Aug | Storage costing, access control, read locks, validator system object, native asset logics, message compression. Protocol version 0.12.0; Go 1.24.6 |
| `go-pisa:v0.8.0` | 13 Aug | `VOLPAY` and `VOLRES` opcodes, the `AccessControl` interface, metering per (account, payer), asset access levels |
| `cocolang:v0.9.0` | 14 Aug | `payer` on `mutate`, `Actor()` queries, field shorthand, `grant storage_mutate` in Cocolab, asset state qualifiers — [release notes](https://cocolang.dev/docs/releases/#v090) · [docs](https://cocolang.dev/docs/book) |
| `vscode-coco:v0.4.0` | 14 Aug | Coco 0.9.0 and PISA 0.8.0 support, the `payer` clause, actor validation — [changelog](https://github.com/sarvalabs/vscode-coco/blob/v0.4.0/CHANGELOG.md), and on the VS Code marketplace |
| `js-moi-sdk:v0.8.0` | 15 Aug | Storage and access-policy operations, automatic funding on creation, ID derivation, MAS0/1/2 flows, state renames — [release notes](https://github.com/sarvalabs/js-moi-sdk/releases/tag/v0.8.0) |
| `js-moi-agent-registry:v0.3.0-rc1` | 16 Aug | New registry Logic ID for the reset devnet, `SendOptions` for fuel overrides; pins `js-moi-sdk@0.8.0` as an exact peer dependency — [on npm](https://www.npmjs.com/package/js-moi-agent-registry) |
| `voyage:v0.9.0` · `voyage-api:v0.9.0` | 18 Aug | Wallet sign-in; faucet funds existing accounts only |
| `voyage:v0.8.2` · `voyage-api:v0.8.2` | 13 Aug | Participant registration with rate limits, tesseracts by participant with pagination, pending-interactions fix |
| `moi-wallet-extension:v0.1.5` | 14 Aug | Error handling and validation in network configuration; registration amount in the encoded payload raised from 1k to 100k |
| `moi-wallet-extension:v0.1.4` | 12 Aug | Multi-account picker on Connect Wallet, a self-registration link, and the new address-truncation format |

## What to do now

**If you build on MOI**, in this order:

1. Move to the new versions: `npm i js-moi-sdk@0.8.0`, and `npm i js-moi-agent-registry@0.3.0-rc1` if you use the registry. v0.3.0-rc1 is a release candidate; it pins `js-moi-sdk@0.8.0` as an exact peer dependency, so staying on v0.2.0 fails at install.
2. In js-moi-sdk v0.8.0, rename `PersistentState` and `EphemeralState`; in Coco v0.9.0, add `dynamic` and `static` qualifiers to custom asset logic. If anything you own decodes interaction op-codes, fix the mapping *before* it touches a v0.12.0 node.
3. Bump `[target.pisa]` version to `"0.8.0"` in `coco.nut`.
4. Run your logic in Cocolab under Coco v0.9.0; anything relying on a foreign actor-state write fails there first, where you want to find it.

If you already have users, go-moi v0.12.0 means planning for the policy step and the grant behind it. Nothing is grandfathered: writes to a user's actor state in interactions they did not sign are denied until that user publishes a policy naming your logic, from their own account; you cannot publish it for them. Each write draws on a storage grant on the user's account — their own deposit or yours with `.for()`. The FAQ carries the per-user order.

**If you run a node** — get the release announcement, schedule the stop, and follow the six steps above.

**If you use Voyage** — sign in with your wallet, and register as a participant before asking the faucet for anything.

When something breaks, the developer docs live at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) and [vscode-coco](https://github.com/sarvalabs/vscode-coco) take issues on their GitHub trackers. For the ideas underneath, start with [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/) and [how to give an agent authority without handing it your credentials](https://blog.moi.technology/article/how-to-give-an-ai-agent-authority-without-your-credentials/).
