---
title: "MOI September 2026 Release: fee delegation, a new KMOI asset id, and prices in anu"
summary: "moipod v0.13.0 is live. An interaction can now name another account to pay its fuel, KMOI has a capped supply and a new asset id, and fuel and storage are priced in anu. What each change does, and what to update if you already build on MOI."
date: 2026-09-11
author:
  name: "Adithya Ganesh"
  role: "Ecosystem, Sarva Labs"
tags: ["protocol", "native-assets", "release", "moipod", "fee-delegation", "kmoi"]
takeaways:
  - "Fee delegation: an interaction can name another account to pay its fuel. That account signs too and pays only the fuel. The sender still pays any value it sends. Live on Voyage devnet since 11 September 2026."
  - "Your app can pay fuel for users that hold no KMOI. The payer signs each interaction one at a time, so there is no open tab anyone can run up."
  - "KMOI now has a capped supply. No account can create or destroy it, not even the asset manager. It has a new asset id, exported from js-moi-sdk as KMOI_ASSET_ID."
  - "Fuel and storage are priced in anu, the smallest unit of KMOI. 1 KMOI = 1,000,000,000 anu. The lowest fuel price is 50 anu. Storage costs 1,000,000 anu per byte, so 1 KB of stored data costs 1 KMOI."
  - "Use parseKmoi and formatKmoi from the SDK to convert. Any fixed storage amount in your code is now a millionth of what it needs to be."
  - "Do not list the sender or the fee payer in the participant list. The node reads both from the interaction itself. The one exception is a fee payer that also signs off on the operations; list that one as a notary."
  - "js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5 are the versions to pair with moipod v0.13.0. Update before you build against the new network."
  - "What breaks: hardcoded KMOI ids, participant lists you built by hand, fixed storage amounts, fuel prices below 50 anu, and assets created with max supply 0 or more than 18 decimals."
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
    a: "Before v0.13.0 a byte cost 1 anu. Now that prices are set in anu, storage can be priced properly: 1,000,000 anu per byte, so 1 KB of stored data costs 1 KMOI. The deposit comes back when you withdraw the data, so it locks KMOI rather than spending it. Running code is paid once."
  - q: "I build interactions by hand. What changes in the participant list?"
    a: "Leave out the sender and the fee payer. The node now reads both from the interaction and rejects them if they are listed. Add the fee payer only when it also signs off on the operations, as a notary with a mutate lock. If you use js-moi-sdk 0.9.0-rc2, the SDK already does this."
  - q: "Can the manager mint KMOI in an emergency?"
    a: "No. On the MASN standard, Mint, MintWithMetadata, Burn, SetStaticMetadata and SetDynamicMetadata are reserved for protocol code. That applies to every account, the asset manager included. Transfer, TransferFrom, Lockup, Release, Approve and Revoke still work."
draft: false
---

**You can now pay fuel for another user.** Until this release, the account that sent an interaction paid its fuel from its own KMOI. moipod v0.13.0 adds fee delegation: an interaction can name another account to pay its fuel. An app can cover that cost for the people who use it, so a new user can start without holding KMOI for fuel.

That is the new capability in this release. Outside of that, there are three breaking changes that affect developers. KMOI, the native token, now has a capped supply and a new asset id. Fuel and storage are priced in anu, the smallest unit of KMOI, which moves two prices your code may depend on. And the participant list no longer carries the sender. Each of these is covered in detail later in this post.

moipod is the software that runs a MOI node, and version 0.13.0 has been live on [Voyage devnet](https://voyage.moi.technology) since 11 September 2026.

Four terms come up throughout:

- *Interaction*: MOI's word for a transaction. A signed request to change one or more accounts.
- *Fuel*: the fee for running an interaction, paid in KMOI.
- *Participant*: an account on MOI. Every user has one.
- *Logic*: a program deployed on MOI.

## What changed in moipod v0.13.0?

Four changes for developers. Some may affect existing code.

| Change | What you get | Can it break your code? |
|---|---|---|
| Fee delegation | Your app can pay fuel for users that have no KMOI | No. It is optional |
| KMOI on MASN | KMOI's supply is capped. No account can create or destroy it, not even the manager | Yes: the asset id changed, and mint or burn calls on KMOI are refused |
| Prices in anu | Whole-number prices for fuel and storage, with the SDK doing the maths | Yes: fixed storage amounts, and any fuel price below 50 anu |
| Participant list | One less thing to build by hand. The node works out the sender and the fee payer itself | Yes: lists built by hand |

The matching SDK versions are **js-moi-sdk 0.9.0-rc2** and **js-polo 0.1.5**, the library that encodes MOI data. Both are on npm.

## What is fee delegation?

**An interaction can now name another account to pay its fuel.** The sender signs as before. The account named as fee payer signs too, and the network charges it for the fuel. The payer covers only the fuel. If the interaction also transfers KMOI, that KMOI still comes out of the sender's account.

This fixes the first-run problem. Before v0.13.0, an account with no KMOI could do nothing: not save a setting, not call your logic. You had to fund every new user first. Now your app can hold one funded account and name it as the payer on its users' interactions. The user never sees fuel.

Nobody can spend the payer's fuel without its signature. The payer signs each interaction one at a time. It approves nothing in advance, and an interaction it has not signed costs it nothing. Its signature also covers only the fuel. A payer has no say over what the interaction does, and a logic asking who signed does not see it. If you want the payer to vouch for the operations too, list it as a *notary*, MOI's word for a co-signer whose signature covers the operations as well as the fuel.

In js-moi-sdk 0.9.0-rc2 it takes three calls. The user builds the interaction and names the payer. The payer signs it without the user's key. The user sends it with the payer's signature attached.

```ts
import { MASNAssetLogic } from "js-moi-sdk";

// user side: build a KMOI transfer and name the payer.
// MASNAssetLogic is for KMOI. For a MAS0 asset use MAS0AssetLogic(assetId, wallet).
const transfer = new MASNAssetLogic(userWallet)
  .transfer(recipientId, amount)
  .payer(payerId);

const ixObject = await transfer.ixData();

// payer side: sign the same interaction object. The sender's key is not needed.
const payerSignatures = await payerWallet.signRawInteractionObject(
  ixObject,
  payerWallet.signingAlgorithms.ecdsa_secp256k1,
);

// user side: send with the payer's signature attached
await transfer.send({ participantSignatures: payerSignatures });
```

`signRawInteractionObject` signs an interaction as it is, without the sender's key. `send` refuses an interaction that names a payer but carries no matching signature, so a missing payer signature fails on your machine, not on the network.

Two things to plan for. The payer pays even when the interaction fails, because failed interactions still use fuel. And the payer does not go in the participant list unless it is also a notary; the node rejects a fee payer listed as a plain participant.

Fee delegation covers fuel only. The account that uses the bytes pays the storage deposit. An app that wants to cover that too makes a `StorageDeposit` for the user, as described in [August's release](https://blog.moi.technology/article/moi-august-2026-release/).

If you build agents, an agent no longer needs to hold KMOI for its fuel. The [Sponsor Interactions tutorial](https://docs.moi.technology/docs/build/tutorials/sponsored-ix-tutorial) walks through the whole flow end to end.

## What changed for KMOI?

**KMOI now has a capped supply.** It runs on MASN, a native asset standard made for KMOI alone. No account can create or destroy it, not even the asset manager, the account that administers an asset. Only the protocol touches supply: it minted the allocations at genesis, and it burns the fuel each interaction uses. If your app holds KMOI or prices in it, nobody can inflate it under you.

Until now KMOI was a MAS0 asset, the general standard anyone can create tokens on. MAS0 has `Mint` and `Burn`, and the manager can call them. For your own token that is useful. For the network's fuel token it is a risk. MASN reserves `Mint`, `MintWithMetadata`, `Burn`, `SetStaticMetadata` and `SetDynamicMetadata` for the protocol itself.

Moving KMOI is unchanged. `Transfer`, `TransferFrom`, `Lockup`, `Release`, `Approve` and `Revoke` keep their names and arguments, and a transfer is still one `ASSET_INVOKE` operation calling `Transfer`. `MAS0AssetLogic` keeps working for moving KMOI, though its mint, burn and metadata methods are now refused for it. `MASNAssetLogic` exists if you want the type to name the asset.

The breaking part is the id. An asset id encodes its standard, so a new standard means a new id:

```
0x1080fffe4cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000
```

The `fffe` after `0x1080` means MASN. The old id had `0000` there, for MAS0. Replace any pasted copy of the old id with `KMOI_ASSET_ID` from js-moi-sdk 0.9.0-rc2. Import the constant and the next change will not break you either.

## Why price in anu?

KMOI is the native token of the MOI network, like ETH on Ethereum. You pay fuel and storage deposits in KMOI, and the network counts it in anu, its smallest unit, the way Ethereum counts ETH in [wei](https://ethereum.org/developers/docs/intro-to-ether/).

Until this release KMOI had no decimal places. The smallest amount the network could count was 1, and every price was a whole number.

Now KMOI has nine decimal places. One KMOI is 1,000,000,000 anu. The network still counts in whole numbers, but what it counts is anu. Every balance, fee and deposit the network gives you is a count of anu.

Two prices that were 1 have moved. The table applies the new unit to the old numbers for comparison. Devnet was reset for this release, so no old balance carried over and there is nothing to convert.

| Price | Before | v0.13.0 | In KMOI |
|---|---|---|---|
| Lowest fuel price, per unit of fuel | 1 anu | 50 anu | 0.00000005 |
| Storage, per byte | 1 anu | 1,000,000 anu | 0.001 |

Fuel needs nothing from you unless you hardcoded a price. The SDK's default fuel price is 50 anu, the lowest a node accepts by default, so an interaction sent without a price goes through. A `fuel_price` written into your code below 50 anu is now rejected.

Storage is what breaks. A byte now costs a million anu, so 1 KB is 1 KMOI, and a logic that keeps a 200-byte record per user puts down 0.2 KMOI for each one. The deposit comes back when you withdraw the data, so it locks up KMOI rather than spending it. That is the model from [August's storage costing work](https://blog.moi.technology/article/moi-august-2026-release/).

If your code funds a new logic or asset account with a fixed number, you wrote that number when a byte cost 1. It now buys a millionth of the bytes it used to. The SDK's `DEFAULT_STORAGE_FUND` is 10,000,000,000 anu, which is 10 KMOI, about ten thousand bytes. The smallest deposit the network accepts is 1,000,000 anu, one byte. Go through every `storageFund` and `StorageDeposit` in your code.

Never work out an anu amount by hand. Write the KMOI amount and let the SDK convert it:

```ts
import { parseKmoi, formatKmoi } from "js-moi-sdk";

parseKmoi("0.5");            // 500000000n  (anu)
formatKmoi(1_500_000_000n);  // "1.5"       (KMOI)
```

## What changed in the participant list?

**If you use js-moi-sdk 0.9.0-rc2, skip this section. The SDK handles it.** If you build interactions by hand, leave the sender and the fee payer out of the participant list. The node reads both from the interaction itself and rejects a list that repeats them.

The participant list names every account an interaction will touch, so the node can lock them while it runs. You always had to list the sender, even though the node already knew it from the interaction. Now the node fills in the sender and the fee payer itself. The list is only for everything else: recipients, assets, logics.

One exception. If the payer should also sign off on the operations, list it as a notary with a mutate lock, the flag that says the interaction may change that account's state. The node rejects a fee payer listed without the notary flag.

## What do developers need to change?

Most code keeps working. Five things break, starting with the most likely, then two updates worth making at the same time:

1. **Hardcoded KMOI asset ids.** Replace them with `KMOI_ASSET_ID` from js-moi-sdk 0.9.0-rc2. Search your code for `0x108000004cd973c4` to find every copy of the old one.
2. **Fixed storage amounts.** Any number you pass as `storageFund` or send in a `StorageDeposit` is now far too small. Write it in KMOI with `parseKmoi`, and check it against 1,000,000 anu per byte.
3. **Participant lists built by hand.** Remove the sender and the fee payer. Keep the fee payer only as a notary, and only when it should sign off on the operations too.
4. **Hardcoded fuel prices.** The node rejects anything below 50 anu. Leave `fuel_price` unset and the SDK uses 50.
5. **Assets created with max supply 0 or more than 18 decimals.** The node now rejects both. Set a real cap and at most 18 decimals.
6. **SDK versions.** `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`. Older SDKs build the participant list the old way and do not know the new KMOI id.
7. **Anything that shows amounts.** Treat every number from the network as anu and format it with `formatKmoi`.

Fee delegation is optional. The participant list change shipped in the same release and applies to everyone.

## Everything shipped

Use these exact versions. Older SDK builds do not know the new KMOI id or the fee payer.

| Component | Version | What it carries |
|---|---|---|
| moipod | v0.13.0 | Fee delegation; KMOI on MASN; prices in anu; sender and payer read from the interaction itself |
| js-moi-sdk | 0.9.0-rc2 | `payer()` on interaction contexts, `signRawInteractionObject`, `participantSignatures`; `KMOI_ASSET_ID`, `MASNAssetLogic`; `parseKmoi`, `formatKmoi`; default fuel price 50 anu |
| js-polo | 0.1.5 | The version js-moi-sdk 0.9.0-rc2 pins |

## What to do now

**If you build on MOI**, in this order:

1. `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`.
2. Replace every hardcoded KMOI id with `KMOI_ASSET_ID`.
3. Rewrite every fixed storage amount with `parseKmoi`, and format amounts you display with `formatKmoi`.
4. Remove any hardcoded `fuel_price` below 50 anu.
5. If you build interactions by hand, remove the sender and the fee payer from the participant list.
6. Decide whether your app should pay fuel for its users. If yes, hold a funded account and sign as its payer. The [Sponsor Interactions tutorial](https://docs.moi.technology/docs/build/tutorials/sponsored-ix-tutorial) shows the full flow.

If something breaks, the developer docs are at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) takes issues on GitHub. For the ideas behind all this, start with [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/).

## Key takeaways, recap

- **A fee payer covers only the fuel.** It signs each interaction it pays for. Nobody can spend its fuel without that signature.
- **Your app can now take on users that hold no KMOI.** One funded account signing as payer is the whole setup.
- **KMOI has a capped supply and a new id.** No account can create or destroy it, the manager included. Use `KMOI_ASSET_ID`.
- **Everything is priced in anu.** 1 KMOI = 1,000,000,000 anu. Lowest fuel price 50 anu. Storage 1,000,000 anu per byte.
- **Fixed storage amounts are now a millionth of what they need to be.** Rewrite them with `parseKmoi`.
- **Leave the sender and the fee payer out of the participant list.** The one exception is a fee payer that is also a notary; list that one with a mutate lock. The SDK already does this.
- **Update to js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5** before you build against the new network.

<Subscribe />
