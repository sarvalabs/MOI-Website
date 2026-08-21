---
title: "MOI August 2026 Release: storage costing and access control"
summary: "MOI's August 2026 release: state is bought up front as a storage grant, foreign writes need a policy you publish, and the faucet funds only existing accounts."
date: 2026-08-21
updated: 2026-08-21
author:
  name: "Sarva Labs"
  role: "Engineering"
  url: "https://sarvalabs.com"
tags: ["protocol", "agents", "native-assets", "release", "go-moi", "storage-costing", "access-control"]
takeaways:
  - "go-moi v0.12.0: storage costing (StorageDeposit/StorageWithdraw), access control (AccessCreate/Update/Delete), renumbered op-codes. Coordinated upgrade to protocol version 0.12.0."
  - "go-pisa v0.8.0: VOLPAY and VOLRES opcodes, the AccessControl interface, storage metering per (account, payer)."
  - "cocolang v0.9.0: `payer` clause on `mutate`, `Actor()` queries, `grant storage_mutate` in Cocolab, exact state qualifiers on asset methods."
  - "vscode-coco v0.4.0: Coco 0.9.0 and PISA 0.8.0 support, with checks gated on the `[target.pisa]` version in `coco.nut`."
  - "js-moi-sdk v0.8.0: storage and access-policy builders, automatic funding on account creation, `LogicState`/`ActorState` renames, MAS0/1/2 create flows."
  - "js-moi-agent-registry v0.3.0-rc1: a new registry Logic ID; pins js-moi-sdk 0.8.0 as an exact peer dependency."
  - "voyage v0.8.2 and v0.9.0: participant registration and paginated history, then wallet sign-in and a faucet that funds only existing accounts."
  - "moi-wallet-extension v0.1.4 and v0.1.5: multi-account picker and a new address format, then network-config validation and a 100k registration amount."
faq:
  - q: "What happens if a logic writes state and there is no storage grant?"
    a: "On MOI, the engine refuses the write and the interaction reverts. Nothing is billed afterwards; the grant has to exist before the write lands. moi.StorageMetric reports where a grant stands, and moi.StoragePricing gives the current rate."
  - q: "Do I get anything back if my logic frees state?"
    a: "Yes. StorageWithdraw releases unused bytes back into KMOI, returned to the sender, so a logic that cleans up after itself reclaims what it no longer uses. Only grant attributed to the sender is reclaimable; a deposit made on someone else's behalf cannot be withdrawn by the depositor."
  - q: "I have a dapp with existing users. What breaks when v0.12.0 lands?"
    a: "Writes to a user's actor state inside interactions someone else signed are foreign accesses, denied until that user publishes an access policy naming your logic. Writes inside interactions the user signed themselves are self-access and keep working with no policy. Nothing is grandfathered, and the policy interaction must be sent by the account it protects — you cannot publish it on a user's behalf. Each foreign write draws on a storage grant on the user's account, funded by the user's own StorageDeposit or by a deposit you make on their behalf, which you cannot later withdraw. Per user, the order is: register as a participant (the devnet reset removed existing accounts, so devnet users register again), put a grant on their account, then publish the policy naming your logic."
  - q: "Why move to js-moi-agent-registry v0.3.0-rc1?"
    a: "It is the client library for the MOI agent registry, and v0.3.0-rc1 carries a new registry Logic ID and pins js-moi-sdk 0.8.0 as an exact peer dependency. Keeping v0.2.0 next to the new SDK fails at install with an ERESOLVE conflict."
  - q: "Can I set access policies on my assets or keys yet?"
    a: "Not yet. The model defines resource types for assets, logics, storage and keys, but go-moi v0.12.0 enforces only storage. A policy naming any other class is rejected at validation."
  - q: "I run a node. Can I upgrade one node at a time?"
    a: "No. Access control, storage costing and the new validator system object all change state-transition semantics, and access control adds interaction types older nodes cannot decode. Stop every node inside the agreed window, deploy v0.12.0 everywhere, restart bootnodes then guardians, and confirm net.Version answers 0.12.0 and net.Peers returns peers before reopening client traffic."
  - q: "Why does the Voyage faucet say USER DOESNT EXIST?"
    a: "The faucet no longer creates an account and funds it in one step. `USER DOESNT EXIST` is what the raw API returns; the Voyage UI shows it as a message about not being registered in the protocol. It only sends tokens to accounts that already exist on the network, so register as a participant first — from Voyage or by following the wallet's instructions — then request funds."
draft: false
---

Two things became true on MOI in August 2026. State costs something, and it has an owner who decides who may write to it.

Both land in **go-moi v0.12.0**, the reference implementation of the MOI protocol, where every participant, human or agent, holds their own state. The changes run the full height of the stack: **PISA**, the runtime that executes a logic (a deployed program); **Coco**, the language you write logic in; and **js-moi-sdk**, the JavaScript SDK you deploy your logics with.

In the same window, [**Voyage**](https://voyage.moi.technology), the network explorer and faucet, moved to wallet sign-in and changed how the faucet works, and the **MOI wallet extension** shipped twice — unrelated to the protocol changes, covered at the end.

## What changed in go-moi v0.12.0?

go-moi v0.12.0 makes storage a resource you buy and own, and puts writes to other accounts behind published policy.

Start with what storage is. When a logic runs, it leaves state behind: a balance, a calendar entry, a setting, a record of what happened. That state has to survive after the interaction finishes, and the network has to keep it for as long as it exists. On MOI it sits on an account: the logic's own account for state that belongs to the logic, your account for state that is about you. Those persisted bytes are storage. Executing code is a one-off cost; keeping bytes around is an ongoing one, which is why MOI prices it separately.

Both changes exist because of the thing that separates MOI from Ethereum. On Ethereum, a contract owns every byte of state about its users. That settles two questions without anyone asking them: storage is paid for through gas by whoever sends the transaction, and who may write is whatever the contract's own code checks. You do not own your state there. You occupy a row in someone else's table, and your only protection is the code they wrote.

On MOI, a logic's state about you lives on *your* account, which is what [the Participant Layer means in practice](https://blog.moi.technology/article/what-is-moi-network/). That puts your state in one place you control, and it lets you withdraw a logic's access to it with a single interaction instead of trusting each contract's hand-written checks. It also means the two questions Ethereum answers implicitly have to be answered explicitly, per participant: who pays for the space, and who may write into it. Storage costing answers the first, access control the second, and both arrive as new interaction types (interactions are the network's transactions).

**Where each change lands, by layer and version**

| Layer | Storage costing | Access control |
|---|---|---|
| **go-moi** v0.12.0 | `StorageDeposit` / `StorageWithdraw` interactions, `moi.StorageMetric` and `moi.StoragePricing` RPCs | `AccessCreate` / `AccessUpdate` / `AccessDelete` interactions, `moi.AccessPolicy` and `moi.AccessPolicies` RPCs |
| **PISA** v0.8.0 | `VOLPAY` and `VOLRES` opcodes, metering per (account, payer) | `AccessControl` interface |
| **Coco** v0.9.0 | `payer` clause on `mutate` | `grant storage_mutate` in Cocolab, `Actor()` queries |
| **js-moi-sdk** v0.8.0 | Deposit and withdraw, automatic funding on creation | Policy create, update and delete |

## How does paying for storage work?

A **storage grant** is how you pay for storage. Think of it as prepaid space: a number of bytes reserved on an account, bought with KMOI before anything is written. Writes consume the grant byte by byte, and whatever you do not use you can release and get back. The grant belongs to an account, where the bytes live, and is attributed to a participant, who paid for it.

So before a logic can write state onto an account, there has to be enough unused grant there to hold the write. If there is not, the write is refused and the whole interaction reverts. Nothing is metered and billed afterwards. The grant is a precondition, not an invoice.

Two interactions manage a grant. `StorageDeposit` turns KMOI into bytes of grant on a target account; how many bytes it buys depends on the network's current rate, which `moi.StoragePricing` reports. `StorageWithdraw` runs the other way, releasing bytes that are no longer in use and returning the KMOI to the sender. `moi.StorageMetric` shows where a grant stands: how much was granted and how much has been consumed. js-moi-sdk v0.8.0 has a builder for each; its [release notes](https://github.com/sarvalabs/js-moi-sdk/releases/tag/v0.8.0) list them, and the [developer docs](https://docs.moi.technology) are where the walkthroughs will live.

Two things trip people up.

**Fuel and storage are separate dimensions.** Fuel is what an interaction pays to execute. The grant is what pays for the bytes that persist afterwards. A write needs both.

**Withdrawal is asymmetric.** A grant is attributed to a participant. Normally that is whoever deposited it, but you can deposit on someone else's behalf, and then the grant is theirs: only grant attributed to the sender can be withdrawn, so sponsoring a user is a gift you cannot take back.

Under the hood, PISA v0.8.0 meters storage per (account, payer). Two opcodes sit on top: `VOLPAY` sets the payer for a logic-state write, and `VOLRES` reports the volume added and released for an (account, payer) pair (`VOLRES` is a rename of `VOLAVL`, not a new opcode). From Coco, `Environment.StorageResult(account, payer)` replaces the removed `VolumeCapacity()`.

### Who pays when my logic writes?

By default, the participant who sent the interaction, out of their grant. Coco v0.9.0 lets a logic redirect that with a `payer` clause on `mutate`, in one of three forms. `payer Sender` is the default and bills whoever sent the interaction. `payer Logic` makes the logic pay from its own grant, which is how a logic absorbs its own setup cost. `payer Actor(<id>)` bills a named participant instead.

That named participant has to have signed the interaction. If they have not, execution raises `payer has to sign the transaction`, the interaction reverts, and fuel already spent stays spent. The clause applies to logic state only. The syntax is in the [Coco book](https://cocolang.dev/docs/book).

Creating an account is the one case the SDK handles for you. **js-moi-sdk v0.8.0 funds new asset and logic accounts automatically**, with the amount tunable through `RoutineOption.storageFund` and a fallback of 1,000,000 KMOI, a flat default rather than a computed cost. Read that fund narrowly: it covers the new account's own creation cost and nothing more. A deploy routine that also writes logic state still needs `payer Logic`, or a `StorageDeposit` grant already in place.

## Why does a logic need permission to write my state?

Because on MOI it is writing to *your* account, not its own.

A logic holds state in two places. Its own account holds its **logic state**, the data that belongs to the logic as a whole. Your account holds its **actor state**, the data it keeps about you. The second is what access control is about.

This is the part that differs most from what you may be used to. On Ethereum a contract owns its storage, so authorization to write it is implicit; finer control is hand-written with `require(msg.sender == owner)`. On MOI a logic routinely writes to storage it does not own, so implicit trust stops being a safe default and the protocol needs an explicit answer: may this logic write to this account, in this situation?

The answer splits into two cases. A **self-access** is a write to the account that signed the interaction: you initiated it, so no permission is needed. A **foreign access** is a write to an account that neither signed the interaction nor is the logic itself, and go-moi v0.12.0 denies it by default.

The MOI developer docs put it as a scheduling logic. Bob books his own time all day; he signed those interactions, so writes to his own calendar are self-access. His assistant Alice arranges meetings for him too, which puts a write on Bob's account inside an interaction Alice signed. That is foreign, and without a rule anyone could fill Bob's calendar. Before the write lands, the engine checks whether Bob has published a policy authorising this logic, driven by Alice. He has, so her write goes through. The same write driven by anyone else is denied.

### What does a policy contain?

The rule is an **access policy**. It lives on the account being written to, Bob's, and only Bob can publish, change or delete it.

**Fields of a go-moi v0.12.0 access policy**

| Field | What it constrains |
|---|---|
| `Resource` | The class of object governed — `storage` today |
| `ResourceID` | The specific resource; for storage, the Logic ID doing the write |
| `Actions` | The operations permitted; at least one must be set |
| `Caller` | The immediate invoker — the sender, or the calling logic in a cross-logic call |
| `Origin` | The original sender of the interaction |
| `Scope` | Intended to narrow a policy to part of a resource — reserved, unenforced |

Caller and origin are each unrestricted or a fixed set of participants and logics. Constraining both is what lets Bob say *this logic, driven by Alice* rather than *this logic, driven by anyone*.

Policies are published with `AccessCreate`, amended with `AccessUpdate` and removed with `AccessDelete`; `moi.AccessPolicy` reads one back and `moi.AccessPolicies` lists everything on an account. js-moi-sdk v0.8.0 wraps the three writes in a builder and exposes the two reads as provider calls.

Three things matter in practice.

**Only the owner publishes.** A dapp cannot publish a policy on a user's behalf. Each user publishes their own, from their own account.

**Nothing is grandfathered.** A dapp with existing users that writes actor state inside interactions those users did not sign stops working on go-moi v0.12.0 until each user has published a policy naming it.

**Only storage is enforced.** The model defines resource types for assets, logics, storage and keys, but go-moi v0.12.0 enforces `storage` alone; a policy naming any other class is rejected at validation. `Scope` is reserved and unenforced too.

Cocolab, the local lab you run Coco logic in, now emulates the runtime's default-deny through a `grant` statement that mirrors the policy's caller and origin constraints, so a logic that relied on writing other actors' state fails in the lab before failing on the network. One caveat: the lab applies default-deny only to projects whose `coco.nut` targets `[target.pisa] version = "0.8.0"`. A project still pinned to 0.7.1 keeps the old runtime, passes in the lab, and fails on the network.

Neither change is free for existing code: writes that assumed storage was nobody's problem stop working, and so do writes into accounts that never published consent.

## What do developers need to change?

Most application code keeps working. What does not, by package:

### go-moi v0.12.0

- **Interaction op-codes were renumbered.** `IxOpType` is an integer on the wire and the values were reordered; only `0`, `1` and `4` kept their meaning. A client that decodes interactions by numeric op-code reads wrong values with no error to say so. The full mapping is below.
- **Five asset operations fold into one.** Transfer, approve, revoke, mint and burn now travel as a single `IxAssetAction` carrying a callsite string and calldata encoded in POLO, the network's wire encoding. The callsite set is wider: `Lockup`, `Release` and `MintWithMetadata` ship too.
- **`TxFuelSupply` is dropped**, with no successor.
- **`moi.Registry` is removed.** `moi.Deeds` is new, and returns `{asset_id, asset_info}` entries for an account.
- **Return types changed** on `moi.LogicIDs`, `debug.Accounts` and `net.Peers`. The first two now return `identifiers.Identifier` and `net.Peers` returns `identifiers.KramaID`, all from the new identifiers package, so parsers need updating.

**Interaction op-codes, go-moi v0.11.3 → v0.12.0**

| v0.11.3 | v0.12.0 |
|---|---|
| 0 `IxInvalid`, 1 `IxParticipantCreate`, 4 `IxAssetCreate` | unchanged |
| 2 `IxAssetTransfer`, 5 `IxAssetApprove`, 6 `IxAssetRevoke`, 7 `IxAssetMint`, 8 `IxAssetBurn` | folded into 5 `IxAssetAction` |
| 3 `TxFuelSupply` | removed |
| 9 `IxLogicDeploy`, 10 `IxLogicInvoke`, 11 `IxLogicEnlist` | 11, 12, 13 |
| 12 `TxLogicInteract`, 13 `TxLogicUpgrade` | 14 `IxLogicInteract`, 15 `IxLogicUpgrade` |
| (new) | 2–3 account ops, 16–20 storage and access ops |

### PISA v0.8.0

- **A logic can no longer load another logic's actor state.** The runtime raises `ExceptLogicActorState`. The storage payer and access-control changes described above also live here.

### Coco v0.9.0

- **Asset methods need exact state qualifiers.** Every asset write is `dynamic`, every asset read is `static`, and the compiler enforces it. Asset logic written for 0.8.2 needs the qualifiers added.
- **`payer` on `mutate`** is new, as covered above; nothing breaks if you leave it out, since `payer Sender` is the default.
- **Field shorthand in class literals**: `Person{name, age}` instead of `Person{name: name, age: age}`.

### js-moi-sdk v0.8.0

- **State naming caught up with the manifest.** `PersistentState` is now `LogicState`; `EphemeralState` is now `ActorState`. Coco itself has used `state logic` and `state actor` since v0.6.0.
- **Native asset standards have their own flows.** Create MAS0, MAS1 and MAS2 through their respective asset logic's `create()` method. `AssetFactory` is now for custom MASX assets, and its `create()` requires a manifest, the logic's compiled interface description.
- **New accounts are funded automatically** on creation, as covered above, with the amount tunable through `RoutineOption.storageFund`.
- **IDs before creation.** The SDK can now give you an asset or logic account ID before the account exists, from the sender and, for assets, the standard.

### js-moi-agent-registry v0.3.0-rc1

- **What npm serves as latest.** It carries a new registry Logic ID, which older versions do not have, and pins `js-moi-sdk@0.8.0` as an exact peer dependency, so staying on v0.2.0 beside the new SDK fails at install. `SendOptions` adds fuel overrides on write calls.

### vscode-coco v0.4.0

- **Checks are gated on your target.** The extension reads `[target.pisa] version` from the `coco.nut` beside the file and gates every version-dependent check on it, reporting `VolumeCapacity()` as removed on a 0.8.0 target while accepting it on 0.7.1.
- **State qualifiers are inferred.** An omitted qualifier means `pure`, not `static`; the extension infers what a callable's body needs, so a mismatch surfaces as a diagnostic in the editor rather than at runtime.

The devnet was reset for go-moi v0.12.0: deployed logics and registered accounts there are gone, so redeploy and re-register.

## What else landed at the account level?

go-moi v0.12.0 also adds account-level features that are neither storage nor access control.

**Participant variants got first-class support.** `AccountInherit` lets a variant account (a sub-account under a participant) inherit context from its parent, and `AccountConfigure` is the separate interaction for adding and revoking keys. `moi.SubAccountCount` counts the variants under an account, and participant-create is now rejected when the target is itself a variant.

**Asset holdings and approvals became inspectable.** `moi.Lockups` returns an account's asset lockups, `moi.Mandates` returns asset approvals *and their expiry*, and `moi.Deeds` returns an account's asset deed records.

**Keys are enumerable.** `moi.AccountKeys` lists the keys on an account.

## What do node operators need to do?

Upgrade every node together. This one does not roll.

From the go-moi v0.12.0 release notes: access control, the storage cost mechanism and the new system object all change state-transition semantics, and access control adds new interaction types that older nodes cannot decode. Nodes running mixed versions will diverge. The protocol version moves to 0.12.0, config and genesis files need to be updated, and the build requirement is Go 1.24.6 or later (was 1.22).

The upgrade steps, as the release notes give them:

1. Stop all nodes — do not roll.
2. Pull the latest docker image.
3. Deploy the v0.12.0 binary or image to every node.
4. Restart bootnodes, then guardian nodes.
5. Verify peers connect on the `0.12.0` protocol IDs before resuming traffic.

Once it is running you will notice:

- Consensus and syncer traffic is compressed, reducing bandwidth on large ICS sets.
- Read locks let accounts take part in a tesseract with a latest-consistent-read guarantee instead of a full mutation, alongside consensus hot-path optimisation.
- Validator and consensus-node data lives in a dedicated system object, readable through `moi.Validators`, replacing ad-hoc tracking.
- The liveness algorithm is randomised, a slot-locking stall is fixed, and the Docker images are multi-OS and multi-arch.

## What changed in Voyage and the wallet?

Voyage shipped twice in this window, v0.8.2 and v0.9.0, and v0.9.0 changes how you get in.

**Sign in with your wallet.** Voyage v0.9.0 replaces the old sign-in (generate a MOI ID, log in with IOME, or import an existing ID) with the [MOI wallet Chrome extension](https://chromewebstore.google.com/detail/moi-wallet/abjpinodmdoipbdlihecmhjflebogjil). You sign a short message; no transaction is sent and no fuel is spent. You can connect several wallet accounts to one Voyage account.

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
| `vscode-coco:v0.4.0` | 14 Aug | Coco 0.9.0 and PISA 0.8.0 support, the `payer` clause, actor validation — [changelog](https://github.com/sarvalabs/vscode-coco/blob/v0.4.0/CHANGELOG.md) · [VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=sarvalabs.cocolang) |
| `js-moi-sdk:v0.8.0` | 15 Aug | Storage and access-policy operations, automatic funding on creation, account IDs before creation, MAS0/1/2 flows, state renames — [release notes](https://github.com/sarvalabs/js-moi-sdk/releases/tag/v0.8.0) · [on npm](https://www.npmjs.com/package/js-moi-sdk) |
| `js-moi-agent-registry:v0.3.0-rc1` | 16 Aug | New registry Logic ID, `SendOptions` for fuel overrides; pins `js-moi-sdk@0.8.0` as an exact peer dependency — [on npm](https://www.npmjs.com/package/js-moi-agent-registry) |
| `voyage:v0.9.0` · `voyage-api:v0.9.0` | 18 Aug | Wallet sign-in; faucet funds existing accounts only — [voyage.moi.technology](https://voyage.moi.technology) |
| `voyage:v0.8.2` · `voyage-api:v0.8.2` | 13 Aug | Participant registration with rate limits, tesseracts by participant with pagination, pending-interactions fix |
| `moi-wallet-extension:v0.1.5` | 14 Aug | Error handling and validation in network configuration; registration amount in the encoded payload raised from 1k to 100k — [Chrome Web Store](https://chromewebstore.google.com/detail/moi-wallet/abjpinodmdoipbdlihecmhjflebogjil) |
| `moi-wallet-extension:v0.1.4` | 12 Aug | Multi-account picker on Connect Wallet, a self-registration link, and the new address-truncation format — [Chrome Web Store](https://chromewebstore.google.com/detail/moi-wallet/abjpinodmdoipbdlihecmhjflebogjil) |

## What to do now

**If you build on MOI**, in this order:

1. Move to the new versions: `npm i js-moi-sdk@0.8.0`, and `npm i js-moi-agent-registry@0.3.0-rc1` if you use the registry. v0.3.0-rc1 pins `js-moi-sdk@0.8.0` as an exact peer dependency, so staying on v0.2.0 fails at install.
2. In js-moi-sdk v0.8.0, rename `PersistentState` and `EphemeralState`; in Coco v0.9.0, add `dynamic` and `static` qualifiers to custom asset logic. If anything you own decodes interaction op-codes, fix the mapping *before* it touches a v0.12.0 node.
3. Bump `[target.pisa]` version to `"0.8.0"` in `coco.nut`.
4. Run your logic in Cocolab under Coco v0.9.0; anything relying on a foreign actor-state write fails there first, where you want to find it.

If you already have users, go-moi v0.12.0 means planning for the policy step and the grant behind it. Nothing is grandfathered: writes to a user's actor state in interactions they did not sign are denied until that user publishes a policy naming your logic, from their own account; you cannot publish it for them. Each write draws on a storage grant on the user's account: their own deposit, or one you made on their behalf, which you cannot later withdraw. The FAQ carries the per-user order.

**If you run a node** — follow the five steps above, inside a coordinated window.

**If you use Voyage** — sign in with your wallet, and register as a participant before asking the faucet for anything.

When something breaks, the developer docs live at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) and [vscode-coco](https://github.com/sarvalabs/vscode-coco) take issues on their GitHub trackers. For the ideas underneath, start with [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/) and [how to give an agent authority without handing it your credentials](https://blog.moi.technology/article/how-to-give-an-ai-agent-authority-without-your-credentials/).
