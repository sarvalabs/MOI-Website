---
title: "MOI September 2026 Release: fee payers, KMOI on MASN, and pricing in anu"
summary: "moipod v0.13.0 lets any account pay the fuel for someone else's interaction, moves KMOI to a fixed-supply native standard, and prices fuel and storage in anu. Here is what each change gives you as a developer, and what to update."
date: 2026-09-11
author:
  name: "Adithya Ganesh"
  role: "Ecosystem, Sarva Labs"
tags: ["protocol", "agents", "native-assets", "release", "moipod", "fee-payer", "kmoi"]
takeaways:
  - "moipod v0.13.0: an interaction can name a fee payer. That account co-signs and pays the fuel; the sender pays only what it transfers. Live on Voyage devnet from 11 September 2026."
  - "Fee payers let your app fund fuel for users and agents that hold no KMOI. The sponsor approves each interaction with its own signature, so there is no standing allowance to drain."
  - "KMOI moved to MASN, a native standard of its own. Nobody can mint or burn it, the asset manager included. It has a new asset id, exported from js-moi-sdk as KMOI_ASSET_ID."
  - "Fuel and storage are priced in anu, the smallest unit of KMOI: 1 KMOI = 1,000,000,000 anu. Minimum fuel price is 50 anu; storage is 1,000,000 anu per byte, so a kilobyte of state costs 1 KMOI."
  - "Convert with parseKmoi and formatKmoi from the SDK. Any fixed storage-funding number in your code is now a millionth of what it needs to be."
  - "Do not list the sender or the fee payer in an interaction's participants. The node reads both from the header. The one exception is a fee payer that also co-signs for the operations, listed as a notary."
  - "js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5 carry all of this. Update before you build against the new network."
  - "The changes are breaking: hardcoded KMOI ids, hand-built participant lists, and fixed storage amounts all need attention."
faq:
  - q: "Does the fee payer pay for the value being transferred too?"
    a: "No. The fee payer covers fuel only. If the sender transfers 5 KMOI, those 5 KMOI still leave the sender's account. FeePayer() on the node returns the payer when one is set and the sender otherwise, and only fuel is charged to it."
  - q: "Can someone name my account as their fee payer without asking?"
    a: "No. A fee-delegated interaction is rejected unless it carries the payer's signature over the same bytes the sender signed. Naming a payer is a request; the payer's signature is the consent."
  - q: "My app still holds the old KMOI asset id. What happens?"
    a: "Transfers against the old id will not find KMOI. Replace it with KMOI_ASSET_ID from js-moi-sdk 0.9.0-rc2, which is 0x1080fffe4cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000. The standard bytes changed from MAS0 to MASN; the rest of the id is the same."
  - q: "How much is 50 anu?"
    a: "Fifty billionths of a KMOI. 1 KMOI is 1,000,000,000 anu, so the minimum fuel price is 0.00000005 KMOI per unit of fuel. Use formatKmoi to display anu amounts and parseKmoi to turn a KMOI string into anu; do not multiply by hand."
  - q: "Why did storage jump from 1 anu to 1,000,000 anu per byte?"
    a: "Before v0.13.0 the per-byte price was 1 anu. Pricing in anu gives the protocol a real unit to price in, and 1,000,000 anu per byte puts a kilobyte of persisted state at 1 KMOI. Storage is the ongoing cost; execution is the one-off one, and the two are priced separately."
  - q: "I build interactions by hand. What changes in the participant list?"
    a: "Leave the sender and the fee payer out. The node now derives both from the interaction header and rejects them as redundant participants. Add the fee payer only when it also signs for the operations, as a notary with a mutate lock. If you build through js-moi-sdk 0.9.0-rc2, the SDK already does this."
  - q: "Can KMOI be minted by the manager for an emergency?"
    a: "No. The MASN standard reserves Mint, MintWithMetadata, Burn, SetStaticMetadata and SetDynamicMetadata for protocol code. That applies to every account, including the asset manager. Transfer, TransferFrom, Lockup, Release, Approve and Revoke remain."
  - q: "Does this change anything for x402 or agent payments on MOI?"
    a: "It adds a path. An x402 buyer on MOI pays first and proves it afterwards, which needs no fee payer. With v0.13.0, a facilitator or an app can also cover an agent's fuel by co-signing as the fee payer, which is the shape x402's authorization flow expects. The upfront scheme being filed does not depend on it."
draft: false
---

**From moipod v0.13.0, an account can pay the fuel for an interaction it did not send.** That one line changes who has to hold KMOI before they can use your app. The same release moves KMOI onto a native standard with a fixed supply and reprices fuel and storage in anu, the smallest unit of KMOI.

moipod is the MOI node software; v0.13.0 landed on [Voyage devnet](https://voyage.moi.technology) on 11 September 2026. This post is for people who build on MOI. It takes each change, says what you can do with it that you could not do before, and ends with the list of things to update. The release is breaking in three specific places, and each one is flagged where it comes up.

Four terms, glossed once. An *interaction* is MOI's transaction: a signed unit of change against one or more accounts. *Fuel* is what execution costs, paid in KMOI, the native token. A *participant* is an account that holds its own state; on MOI, every user and every agent is one. A *logic* is a deployed program.

## What changed in moipod v0.13.0?

Four things, three of them breaking.

| Change | What it is | Breaking? |
|---|---|---|
| Fee payer | An interaction can name a second account that co-signs and pays the fuel | No, opt-in |
| KMOI on MASN | KMOI moves to its own native asset standard; no mint, no burn; new asset id | Yes: the asset id |
| Pricing in anu | Fuel and storage priced in the smallest unit of KMOI; minimum fuel price 50 anu, storage 1,000,000 anu per byte | Yes: fixed storage amounts |
| Participant list | Sender and fee payer come from the header, not the list | Yes: hand-built lists |

The SDK side is **js-moi-sdk 0.9.0-rc2** and **js-polo 0.1.5**, MOI's serialization library. Both are on npm.

## What can a fee payer do for your app?

**A fee payer lets your app pay the fuel for interactions your users send.** The user signs the interaction as before. A second account, the fee payer, signs the same interaction, and the fuel comes out of that account instead of the sender's. The value being moved still comes from the sender.

The problem this solves is the first-run problem. Before v0.13.0, every account that wanted to do anything on MOI needed KMOI in it first, which meant every new user and every new agent started with a funding step. A wallet with no KMOI could not register a preference or call your logic. Your onboarding flow had to get KMOI into the user's account before the user could touch your product.

Now the app can carry that cost. Your backend holds a sponsor account with KMOI in it. When a user's interaction arrives, the sponsor checks it, signs it as the fee payer, and the user's interaction goes through with the user's balance untouched. The user never sees fuel.

Two properties make this safer than an allowance. First, the payer signs *each* interaction. There is no standing permission a client can draw on later; if the sponsor does not sign, nothing is paid. Second, the payer's signature covers the fuel and nothing else. On the node, a payer that is named only in the header pays the fuel and has no authority over what the interaction does; a logic asking who signed does not see the payer. If you want the sponsor to also vouch for the operations, you list it in the participants as a *notary*, which is MOI's term for a required co-signer, and then it signs for both.

In js-moi-sdk 0.9.0-rc2 the sequence is three calls. The user's wallet builds a KMOI transfer, names the sponsor as payer, and hands the raw interaction to the sponsor to sign. The sponsor's wallet signs it without needing the sender's key. The user's wallet then sends the interaction with the sponsor's signature attached.

```ts
import { MASNAssetLogic } from "js-moi-sdk";

// user side: build a KMOI transfer and name the sponsor as fee payer
// (MASNAssetLogic is KMOI-only; use MAS0AssetLogic(assetId, wallet) for other assets)
const transfer = new MASNAssetLogic(userWallet)
  .transfer(recipientId, amount)
  .payer(sponsorId);

const ixObject = await transfer.ixData();

// sponsor side: sign the same interaction object, no sender key needed
const sponsorSignatures = await sponsorWallet.signRawInteractionObject(
  ixObject,
  sponsorWallet.signingAlgorithms.ecdsa_secp256k1,
);

// user side: send with the sponsor's signature attached
await transfer.send({ participantSignatures: sponsorSignatures });
```

`signRawInteractionObject` exists for exactly this: it signs an interaction object as-is, without checking the payer field or requiring the sender's key to be on the wallet. `send` refuses an interaction that names a payer but carries no matching signature, so a missing sponsor signature fails on your machine, not on the network.

Where the sponsor lives is up to you. In a web app it is a small service that receives the interaction object, applies whatever policy you want (a per-user budget, an allowlist of logics, a rate limit), signs, and returns the signatures. For a fleet of agents it is a treasury account that funds every agent's fuel from one place, with each agent still signing its own interactions from its own key.

The sponsor pays whether or not the interaction succeeds: a failed interaction still burns the fuel it used, and that fuel comes from the payer. Budget for failed attempts, and put your policy check before the signature.

What a fee payer does not do: it does not pay the value. If the interaction transfers 5 KMOI, those 5 KMOI leave the sender. And it does not appear in the participant list unless it is also a notary; the node rejects a fee payer listed as a plain participant as redundant.

## What changed for KMOI?

**KMOI now runs on MASN, a native asset standard for KMOI alone, and its supply is fixed.** Nobody can mint or burn it. That includes the asset manager, the account that administers an asset.

Until this release KMOI was a MAS0 asset, the general fungible standard that any developer can create tokens on. MAS0 has a `Mint` and a `Burn` endpoint, and the manager can call them. For a user-created token that is a feature. For the network's own fuel token it is a risk, so MASN removes it in the standard: `Mint`, `MintWithMetadata`, `Burn`, `SetStaticMetadata` and `SetDynamicMetadata` are reserved for protocol code and refused for everyone else.

Everything that moves KMOI is unchanged. `Transfer`, `TransferFrom`, `Lockup`, `Release`, `Approve` and `Revoke` keep the same names and the same arguments, and a transfer is still one `ASSET_INVOKE` operation calling `Transfer`. If your code moves KMOI through `MAS0AssetLogic`, it keeps working; the SDK also ships a `MASNAssetLogic` class if you want the type to say what the asset is.

The breaking part is the identifier. An asset id on MOI encodes the standard in its bytes, so a standard change means a new id:

```
0x1080fffe4cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000
```

The `fffe` after `0x1080` is the MASN standard; the old id had `0000` there for MAS0. If you hardcoded the old id anywhere, replace it. js-moi-sdk 0.9.0-rc2 exports the new one as `KMOI_ASSET_ID`, and importing that constant instead of pasting the hex is the fix that survives the next change too.

## Why price in anu?

**Fuel and storage are now priced in anu, and 1 KMOI is 1,000,000,000 anu.** Two prices changed with the unit: the minimum fuel price is 50 anu, and storage is 1,000,000 anu per byte.

Anu is to KMOI what wei is to ether: the integer the protocol counts in, so that no amount ever needs a fraction. The release names that unit, fixes it at one billionth of a KMOI, and raises the two floor prices that were set at 1 of it.

The two numbers to know:

| Price | Before | v0.13.0 | In KMOI |
|---|---|---|---|
| Minimum fuel price, per unit of fuel | 1 anu | 50 anu | 0.00000005 |
| Storage, per byte | 1 anu | 1,000,000 anu | 0.001 |

The storage number is the one that bites. A kilobyte of persisted state costs 1 KMOI. A logic that writes a 200-byte record per user pays 0.2 KMOI to keep it. That is the deliberate outcome of [August's storage costing work](https://blog.moi.technology/article/moi-august-2026-release/): execution is a one-off cost, keeping bytes is an ongoing one, and the second is now priced like it.

For your code, the rule is: never compute an anu amount by hand. js-moi-sdk 0.9.0-rc2 ships the conversions.

```ts
import { parseKmoi, formatKmoi } from "js-moi-sdk";

parseKmoi("0.5");            // 500000000n  (anu)
formatKmoi(1_500_000_000n);  // "1.5"       (KMOI)
```

Fuel needs nothing from you. The SDK's default fuel price is 50 anu, the new minimum, so an interaction sent with no explicit price clears it. Set `fuel_price` yourself only if you want to pay more.

Storage is where existing code breaks. If your application funds a new logic or asset account with a fixed number, that number was set against a price of 1 per byte. It is now a millionth of what the same bytes cost. The SDK's `DEFAULT_STORAGE_FUND` is 10,000,000,000 anu, which is 10 KMOI, and the smallest storage deposit the network accepts is 1,000,000 anu, one byte's worth. Check every place you set `storageFund` or send a `StorageDeposit`, and express the value with `parseKmoi` so the intent is readable.

## What changed in the participant list?

**Do not add the sender or the fee payer to an interaction's participants.** The node reads both from the interaction header and rejects either as a redundant participant.

The participant list is where an interaction declares every account it will touch, so the node can lock them for execution. The sender was always in the header; adding it to the list again was harmless boilerplate that the SDK did for you. With the fee payer also in the header, the node now derives both, and the list is for everything else: recipients, assets, logics.

There is one case where the fee payer does go in the list. If the sponsor should sign for the *operations* as well as the fuel, so that a logic asking who signed sees the sponsor too, list it as a notary with a mutate lock. Then it co-signs for both. A fee payer listed without the notary flag is rejected.

If you build interactions with js-moi-sdk 0.9.0-rc2, this is already handled: the SDK drops the sender from the list and drops the payer unless it is a notary. If you build interactions by hand or with an older SDK, this is the third breaking change.

## What do developers need to change?

Most code keeps working. What does not, in order of how likely it is to bite:

1. **Hardcoded KMOI asset ids.** Replace with `KMOI_ASSET_ID` from js-moi-sdk 0.9.0-rc2. Search your codebase for `0x108000004cd973c4` and you will find every copy of the old one.
2. **Fixed storage amounts.** Any literal you pass as `storageFund` or send in a `StorageDeposit` is now far too small. Re-express it in KMOI with `parseKmoi`, and check it against the 1,000,000 anu per byte rate.
3. **Hand-built participant lists.** Remove the sender and the fee payer. Keep the fee payer only as a notary, and only when it should co-sign the operations.
4. **SDK versions.** `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`. Older SDKs serialize the participant list the old way and do not know the new KMOI id.
5. **Anything that decodes amounts.** If you display balances or fees, treat every protocol number as anu and format it with `formatKmoi`.

Nothing in the fee-payer feature requires a change. It is there when you want it.

## What does this mean for agents?

**An agent no longer needs KMOI of its own to act on MOI.** That removes the step that made agent onboarding awkward: giving a new agent a key was easy, giving it fuel was a funding flow.

With a fee payer, an operator can run a fleet of agents from one funded treasury. Each agent signs its own interactions from its own key, so the record of who did what is intact, and the treasury co-signs for the fuel. The treasury's policy, whatever it is, runs before its signature, so a misbehaving agent stops being sponsored the moment the policy says so. That is a different kind of control from the [access policies](https://blog.moi.technology/article/moi-access-policies-agent-authority/) covered last month: those decide what an agent may write; a fee payer decides what an operator is willing to pay for.

It also adds a payment path for machines. In the [x402 work](https://blog.moi.technology/article/how-ai-agents-pay-each-other-moi/), the MOI scheme has a buyer pay first from its own account and prove it afterwards, which needs no sponsor. With v0.13.0 a facilitator or app can instead cover an agent's fuel by co-signing as its fee payer, which is the shape x402's authorization flow is built around. The scheme being filed does not depend on that; it means MOI can offer the other flow too.

## Everything shipped

| Component | Version | What it carries |
|---|---|---|
| moipod | v0.13.0 | Fee payer; KMOI on MASN; anu pricing; header-derived sender and payer |
| js-moi-sdk | 0.9.0-rc2 | `payer()` on interaction contexts, `signRawInteractionObject`, `participantSignatures`; `KMOI_ASSET_ID`, `MASNAssetLogic`; `parseKmoi`, `formatKmoi`; fuel price default 50 anu |
| js-polo | 0.1.5 | Named by the release note as the version to pair with the SDK |

## What to do now

**If you build on MOI**, in this order:

1. `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`.
2. Replace every hardcoded KMOI id with `KMOI_ASSET_ID`.
3. Find every fixed storage amount and re-express it with `parseKmoi`.
4. If you build interactions by hand, drop the sender and the fee payer from the participant list.
5. Decide whether your app should sponsor fuel. If yes, stand up a sponsor account and a small signing service around `signRawInteractionObject`, with the policy you want in front of it.

**If you run agents**, the fifth step is the one that matters: a treasury that co-signs for fuel replaces per-agent funding.

When something breaks, the developer docs are at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) takes issues on GitHub. For the ideas underneath, start with [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/).

## Key takeaways, recap

- **A fee payer pays fuel, not value.** It co-signs each interaction it sponsors; there is no standing allowance.
- **Your app can now onboard users and agents that hold no KMOI.** A sponsor account and a signing service are the whole setup.
- **KMOI has a fixed supply and a new id.** No mint, no burn, manager included. Use `KMOI_ASSET_ID`.
- **Everything is priced in anu.** 1 KMOI = 1,000,000,000 anu; fuel floor 50 anu; storage 1,000,000 anu per byte.
- **Fixed storage amounts are now a millionth of what they need to be.** Re-express them with `parseKmoi`.
- **Leave the sender and fee payer out of the participant list.** The header carries both; the SDK already does this.
- **Update to js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5** before building against the new network.
