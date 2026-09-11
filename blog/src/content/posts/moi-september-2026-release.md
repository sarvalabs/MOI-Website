---
title: "MOI September 2026 Release: fee payers, KMOI on MASN, and pricing in anu"
summary: "moipod v0.13.0 is live. One account can now pay the fuel for another account's interaction, KMOI has a fixed supply and a new id, and fuel and storage are priced in anu. What each change means for your app, and what to update."
date: 2026-09-11
author:
  name: "Adithya Ganesh"
  role: "Ecosystem, Sarva Labs"
tags: ["protocol", "agents", "native-assets", "release", "moipod", "fee-payer", "kmoi"]
takeaways:
  - "Someone else can now pay your fuel. An interaction can name a fee payer. That account signs too and pays the fuel. The sender pays only the value it sends. Live on Voyage devnet since 11 September 2026."
  - "Your app can pay fuel for users and agents that have no KMOI. The payer signs each interaction one at a time, so there is no open tab anyone can run up."
  - "KMOI now has a fixed supply. Nobody can create or destroy it, not even the asset manager. It has a new asset id, exported from js-moi-sdk as KMOI_ASSET_ID."
  - "Fuel and storage are priced in anu, the smallest unit of KMOI. 1 KMOI = 1,000,000,000 anu. The lowest fuel price is 50 anu. Storage costs 1,000,000 anu per byte, so 1 KB of stored data costs 1 KMOI."
  - "Use parseKmoi and formatKmoi from the SDK to convert. Any fixed storage amount in your code is now a millionth of what it needs to be."
  - "Do not list the sender or the fee payer in the participant list. The node reads both from the interaction itself. The one exception is a fee payer that also signs off on the operations; list that one as a notary."
  - "js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5 support all of this. Update before you build against the new network."
  - "Three things break: hardcoded KMOI ids, participant lists you built by hand, and fixed storage amounts."
faq:
  - q: "Does the fee payer pay for the value being sent too?"
    a: "No. It pays only the fuel. If the sender sends 5 KMOI, those 5 KMOI still leave the sender's account. On the node, FeePayer() returns the payer when one is set and the sender otherwise, and only the fuel is charged to it."
  - q: "Can someone name my account as their fee payer without asking me?"
    a: "No. The node rejects an interaction that names a payer unless the payer has signed it. Naming a payer is a request. The payer's signature is the yes."
  - q: "My app still holds the old KMOI asset id. What happens?"
    a: "Transfers that use the old id will not find KMOI. Replace it with KMOI_ASSET_ID from js-moi-sdk 0.9.0-rc2, which is 0x1080fffe4cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000. Only the bytes that name the standard changed, from MAS0 to MASN. The rest of the id is the same."
  - q: "How much is 50 anu?"
    a: "Fifty billionths of a KMOI. 1 KMOI is 1,000,000,000 anu, so the lowest fuel price is 0.00000005 KMOI per unit of fuel. Use formatKmoi to show anu amounts and parseKmoi to turn a KMOI string into anu. Do not multiply by hand."
  - q: "Why did storage jump from 1 anu to 1,000,000 anu per byte?"
    a: "Before v0.13.0 a byte cost 1 anu. Now that prices are set in anu, the protocol can price storage properly: 1,000,000 anu per byte means 1 KB of stored data costs 1 KMOI. Storage is a cost that keeps going. Running code is a one-time cost. The two are priced separately."
  - q: "I build interactions by hand. What changes in the participant list?"
    a: "Leave out the sender and the fee payer. The node now reads both from the interaction and rejects them if they are listed. Add the fee payer only when it also signs off on the operations, as a notary with a mutate lock. If you use js-moi-sdk 0.9.0-rc2, the SDK already does this."
  - q: "Can the manager mint KMOI in an emergency?"
    a: "No. On the MASN standard, Mint, MintWithMetadata, Burn, SetStaticMetadata and SetDynamicMetadata are reserved for protocol code. That applies to every account, the asset manager included. Transfer, TransferFrom, Lockup, Release, Approve and Revoke still work."
  - q: "Does this change anything for x402 or agent payments on MOI?"
    a: "It adds an option. An x402 buyer on MOI pays first and proves it afterwards, so it does not need a fee payer. From v0.13.0, an app or a facilitator can also pay an agent's fuel by signing as the fee payer, which is the shape x402's authorization flow expects. The upfront scheme being filed does not depend on it."
draft: false
---

**Your app can now pay fuel for its users.** Before this release, anyone who wanted to use an app on MOI needed KMOI in their own account first. moipod v0.13.0 removes that step.

Two more changes ship with it. KMOI, the MOI token, now has a fixed supply and a new id. Fuel and storage are now priced in anu, the smallest unit of KMOI.

moipod is the software that runs a MOI node. Version 0.13.0 went live on [Voyage devnet](https://voyage.moi.technology) on 11 September 2026. This post says what each change lets you do and what to update. Three changes can break existing code. Each is flagged where it comes up.

Four terms:

- *Interaction*: MOI's word for a transaction. A signed request to change one or more accounts.
- *Fuel*: the fee for running an interaction, paid in KMOI.
- *Participant*: an account on MOI. Every user and every agent has one.
- *Logic*: a program deployed on MOI.

## What changed in moipod v0.13.0?

Four changes. Three can break existing code.

| Change | What you get | Can it break your code? |
|---|---|---|
| Fee payer | Your app can pay fuel for users and agents that have no KMOI | No. It is optional |
| KMOI on MASN | KMOI's supply cannot change. Nobody can create or destroy it, not even the manager | Yes: the asset id changed |
| Prices in anu | Whole-number prices for fuel and storage, with the SDK doing the maths | Yes: fixed storage amounts |
| Participant list | One less thing to build by hand. The node works out the sender and the fee payer itself | Yes: lists built by hand |

The matching SDK versions are **js-moi-sdk 0.9.0-rc2** and **js-polo 0.1.5**, the library that encodes MOI data. Both are on npm.

## What can a fee payer do for your app?

**With a fee payer, your users do not need KMOI to use your app.** The user signs the interaction as before. A second account, the fee payer, signs it too and pays the fuel. Any value the user sends still comes from the user.

This fixes the first-run problem. Before v0.13.0, an account with no KMOI could do nothing: not save a setting, not call your logic. Every new user and every new agent had to be funded first.

Now your app carries that cost. Your backend holds a sponsor account with KMOI in it. When a user's interaction arrives, the sponsor checks it, signs it as the fee payer, and it goes through. The user never sees fuel.

This is safer than an allowance for two reasons. The sponsor signs each interaction one at a time, so there is no open permission to draw on later. And its signature covers only the fuel. A payer has no say over what the interaction does, and a logic asking who signed does not see it. If you want the sponsor to vouch for the operations too, list it as a *notary*, MOI's word for a required co-signer.

In js-moi-sdk 0.9.0-rc2 it takes three calls. The user builds the transfer and names the sponsor. The sponsor signs it without the user's key. The user sends it with the sponsor's signature attached.

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

`signRawInteractionObject` signs an interaction as it is, without the sender's key. `send` refuses an interaction that names a payer but carries no matching signature, so a missing sponsor signature fails on your machine, not on the network.

Where the sponsor runs is up to you. In a web app it is a small service: receive the interaction, apply your rules (a budget per user, a list of allowed logics, a rate limit), sign, return the signature. For a fleet of agents it is one treasury account that pays fuel for every agent, while each agent signs its own interactions.

The sponsor pays even when the interaction fails. Failed interactions still use fuel. Budget for that, and run your checks before you sign.

Two things a fee payer does not do. It does not pay the value: if the interaction sends 5 KMOI, those leave the sender. And it does not go in the participant list unless it is also a notary. The node rejects a fee payer listed as a plain participant.

## What changed for KMOI?

**KMOI now has a fixed supply.** It runs on MASN, a native asset standard made for KMOI alone. Nobody can create or destroy it, not even the asset manager, the account that administers an asset. If your app holds KMOI or prices in it, that supply cannot change under you.

Until now KMOI was a MAS0 asset, the general standard anyone can create tokens on. MAS0 has `Mint` and `Burn`, and the manager can call them. For your own token that is useful. For the network's fuel token it is a risk. MASN reserves `Mint`, `MintWithMetadata`, `Burn`, `SetStaticMetadata` and `SetDynamicMetadata` for the protocol itself.

Moving KMOI is unchanged. `Transfer`, `TransferFrom`, `Lockup`, `Release`, `Approve` and `Revoke` keep their names and arguments, and a transfer is still one `ASSET_INVOKE` operation calling `Transfer`. `MAS0AssetLogic` keeps working. `MASNAssetLogic` exists if you want the type to name the asset.

The breaking part is the id. An asset id encodes its standard, so a new standard means a new id:

```
0x1080fffe4cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000
```

The `fffe` after `0x1080` means MASN. The old id had `0000` there, for MAS0. Replace any pasted copy of the old id with `KMOI_ASSET_ID` from js-moi-sdk 0.9.0-rc2. Import the constant and the next change will not break you either.

## Why price in anu?

**Fuel and storage are now priced in anu, and two prices went up.** 1 KMOI is 1,000,000,000 anu. The lowest fuel price is 50 anu, and storage is 1,000,000 anu per byte. Both were 1 anu before. A hardcoded copy of either number is now wrong.

Anu is the smallest unit of KMOI, as [wei is the smallest unit of ether](https://ethereum.org/developers/docs/intro-to-ether/). The protocol counts in it so it only ever deals in whole numbers.

| Price | Before | v0.13.0 | In KMOI |
|---|---|---|---|
| Lowest fuel price, per unit of fuel | 1 anu | 50 anu | 0.00000005 |
| Storage, per byte | 1 anu | 1,000,000 anu | 0.001 |

Storage is the number that bites. 1 KB of stored data costs 1 KMOI, so a logic that saves a 200-byte record per user pays 0.2 KMOI to keep it. That is on purpose. It follows [August's storage costing work](https://blog.moi.technology/article/moi-august-2026-release/): running code is a one-time cost, keeping data is an ongoing one, and it is now priced that way.

Never work out an anu amount by hand. The SDK has the conversions:

```ts
import { parseKmoi, formatKmoi } from "js-moi-sdk";

parseKmoi("0.5");            // 500000000n  (anu)
formatKmoi(1_500_000_000n);  // "1.5"       (KMOI)
```

Fuel needs nothing from you. The SDK's default fuel price is 50 anu, the new minimum. Set `fuel_price` only if you want to pay more.

Storage is where code breaks. A fixed funding amount set when a byte cost 1 anu is now a millionth of what the same bytes cost. The SDK's `DEFAULT_STORAGE_FUND` is 10,000,000,000 anu, which is 10 KMOI. The smallest deposit the network accepts is 1,000,000 anu, one byte. Check every `storageFund` and `StorageDeposit`, and write the value with `parseKmoi`.

## What changed in the participant list?

**If you use js-moi-sdk 0.9.0-rc2, skip this section. The SDK handles it.** If you build interactions by hand, leave the sender and the fee payer out of the participant list. The node reads both from the interaction itself and rejects a list that repeats them.

The participant list names every account an interaction will touch, so the node can lock them while it runs. The sender was always known, so listing it was harmless filler. Now the fee payer is known too. The list is only for everything else: recipients, assets, logics.

One exception. If the sponsor should sign off on the operations, not only pay for them, list it as a notary with a mutate lock. A fee payer listed without the notary flag is rejected.

## What do developers need to change?

Most code keeps working. What does not, starting with the most likely:

1. **Hardcoded KMOI asset ids.** Replace them with `KMOI_ASSET_ID` from js-moi-sdk 0.9.0-rc2. Search your code for `0x108000004cd973c4` to find every copy of the old one.
2. **Fixed storage amounts.** Any number you pass as `storageFund` or send in a `StorageDeposit` is now far too small. Write it in KMOI with `parseKmoi`, and check it against 1,000,000 anu per byte.
3. **Participant lists built by hand.** Remove the sender and the fee payer. Keep the fee payer only as a notary, and only when it should sign off on the operations too.
4. **SDK versions.** `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`. Older SDKs build the participant list the old way and do not know the new KMOI id.
5. **Anything that shows amounts.** Treat every number from the network as anu and format it with `formatKmoi`.

Using a fee payer is optional. Item 3 is the only change it brings for everyone.

## What does this mean for agents?

**An agent no longer needs its own KMOI to act on MOI.** Giving an agent a key was easy. Giving it fuel meant a funding flow. That step is gone.

An operator can run a fleet from one treasury. Each agent signs its own interactions with its own key, so the record of who did what stays clear, and the treasury signs for the fuel. The treasury applies its rules before it signs, so a misbehaving agent stops being paid the moment the rules say so. [Access policies](https://blog.moi.technology/article/moi-august-2026-release/) decide what an agent may write. A fee payer decides what an operator is willing to pay for.

It also adds a payment path for machines. In the [x402 work](https://blog.moi.technology/article/how-ai-agents-pay-each-other-moi/), a buyer pays first from its own account and proves it afterwards, with no sponsor. From v0.13.0 an app or facilitator can instead pay an agent's fuel as its fee payer, the shape x402's authorization flow expects. The scheme being filed does not depend on it.

## Everything shipped

Use these exact versions. Older SDK builds do not know the new KMOI id or the fee payer.

| Component | Version | What it carries |
|---|---|---|
| moipod | v0.13.0 | Fee payer; KMOI on MASN; prices in anu; sender and payer read from the interaction itself |
| js-moi-sdk | 0.9.0-rc2 | `payer()` on interaction contexts, `signRawInteractionObject`, `participantSignatures`; `KMOI_ASSET_ID`, `MASNAssetLogic`; `parseKmoi`, `formatKmoi`; default fuel price 50 anu |
| js-polo | 0.1.5 | The version the release note pairs with the SDK |

## What to do now

**If you build on MOI**, in this order:

1. `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`.
2. Replace every hardcoded KMOI id with `KMOI_ASSET_ID`.
3. Rewrite every fixed storage amount with `parseKmoi`.
4. If you build interactions by hand, remove the sender and the fee payer from the participant list.
5. Decide whether your app should pay fuel for its users. If yes, set up a sponsor account and a small signing service around `signRawInteractionObject`, with your rules in front of it.

**If you run agents**, step 5 is the one that matters. One treasury that signs for fuel replaces funding each agent one by one.

If something breaks, the developer docs are at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) takes issues on GitHub. For the ideas behind all this, start with [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/).

## Key takeaways, recap

- **A fee payer pays the fuel, not the value.** It signs each interaction it pays for. There is no open allowance.
- **Your app can now take on users and agents that hold no KMOI.** A sponsor account and a signing service are the whole setup.
- **KMOI has a fixed supply and a new id.** Nobody can create or destroy it, the manager included. Use `KMOI_ASSET_ID`.
- **Everything is priced in anu.** 1 KMOI = 1,000,000,000 anu. Lowest fuel price 50 anu. Storage 1,000,000 anu per byte.
- **Fixed storage amounts are now a millionth of what they need to be.** Rewrite them with `parseKmoi`.
- **Leave the sender and the fee payer out of the participant list.** The one exception is a fee payer that is also a notary; list that one with a mutate lock. The SDK already does this.
- **Update to js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5** before you build against the new network.

<Subscribe />
