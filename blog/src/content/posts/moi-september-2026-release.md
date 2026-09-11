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
  - "KMOI now has a fixed supply. Nobody can create or destroy it, not even the asset manager. It also has a new asset id, exported from js-moi-sdk as KMOI_ASSET_ID."
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

**From moipod v0.13.0, one account can pay the fuel for another account's interaction.** Until now, anyone who wanted to use your app needed KMOI in their own account first. Now your app can pay for them.

The same release does two more things. KMOI, the MOI token, now has a fixed supply and a new id. And the network's prices for running code and storing data are now set in anu, the smallest unit of KMOI.

moipod is the software that runs a MOI node. Version 0.13.0 went live on [Voyage devnet](https://voyage.moi.technology) on 11 September 2026. This post is for people who build on MOI. For each change it says what you can now do, and it ends with a list of what to update. Three of the changes can break existing code. Each one is flagged where it comes up.

A few words, in plain terms, before we start:

- An *interaction* is MOI's word for a transaction. It is a signed request to change one or more accounts.
- *Fuel* is the fee for running an interaction. You pay it in KMOI.
- A *participant* is an account on MOI. Every user and every agent has one, and each account holds its own data.
- A *logic* is a program deployed on MOI.

## What changed in moipod v0.13.0?

Four things. Three of them can break existing code. The middle column says what each change gives you. The details come in the sections below.

| Change | What you get | Can it break your code? |
|---|---|---|
| Fee payer | Your app can pay fuel for users and agents that have no KMOI | No. It is optional |
| KMOI on MASN | KMOI's supply cannot change. Nobody can create or destroy it, not even the manager | Yes: the asset id changed |
| Prices in anu | Whole-number prices for fuel and storage, with the SDK doing the maths | Yes: fixed storage amounts |
| Participant list | One less thing to build by hand. The node works out the sender and the fee payer itself | Yes: lists built by hand |

The matching SDK versions are **js-moi-sdk 0.9.0-rc2** and **js-polo 0.1.5**. js-polo is the library that encodes MOI data. Both are on npm.

## What can a fee payer do for your app?

**With a fee payer, your users do not need KMOI before they can use your app.** Your app pays the fuel for them. Here is how it works. The user signs the interaction as before. A second account, the fee payer, signs the same interaction. The fuel comes out of the fee payer's account instead of the user's. Any value the user sends still comes from the user.

This fixes the first-run problem. Before v0.13.0, an account could not do anything on MOI without KMOI in it. So every new user and every new agent had to be funded first. A wallet with no KMOI could not save a setting or call your logic. Your onboarding flow had to get KMOI into the user's account before they could touch your product.

Now your app can carry that cost. Your backend holds a sponsor account with KMOI in it. When a user's interaction arrives, the sponsor checks it, signs it as the fee payer, and the interaction goes through. The user's balance is untouched. The user never sees fuel at all.

Two things make this safer than giving someone an allowance. First, the sponsor signs each interaction, one at a time. There is no open permission that a client can use later. If the sponsor does not sign, nothing is paid. Second, the sponsor's signature covers the fuel and nothing else. An account named only as the payer has no say over what the interaction does. A logic that asks "who signed this?" does not see the payer. If you want the sponsor to also vouch for what the interaction does, list it as a *notary*, MOI's word for a required co-signer. Then it signs for both.

In js-moi-sdk 0.9.0-rc2 it takes three calls. The user's wallet builds a KMOI transfer, names the sponsor as the payer, and hands the unsigned interaction to the sponsor. The sponsor's wallet signs it. It does not need the user's key to do that. The user's wallet then sends the interaction with the sponsor's signature attached.

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

`signRawInteractionObject` exists for exactly this. It signs an interaction as it is, without checking the payer field and without needing the sender's key. And `send` refuses an interaction that names a payer but has no matching signature. So a missing sponsor signature fails on your machine, not on the network.

Where the sponsor runs is up to you. In a web app, it is a small service. It receives the interaction, applies your rules (a budget per user, a list of allowed logics, a rate limit), signs, and returns the signature. For a fleet of agents, it is a treasury account that pays fuel for every agent from one place. Each agent still signs its own interactions with its own key.

The sponsor pays whether or not the interaction succeeds. A failed interaction still uses fuel, and that fuel comes from the payer. Budget for failed attempts, and run your checks before you sign.

Two things a fee payer does not do. It does not pay the value: if the interaction sends 5 KMOI, those 5 KMOI leave the sender. And it does not go in the participant list unless it is also a notary. The node rejects a fee payer listed as a plain participant.

## What changed for KMOI?

**KMOI now has a fixed supply, and you can rely on that.** It runs on MASN, a native asset standard made for KMOI alone. Nobody can create or destroy KMOI, not even the asset manager, the account that administers an asset. If your app holds KMOI, prices things in KMOI, or depends on the total supply, that number cannot change under you. The one thing that breaks is the asset id, covered below.

Until this release, KMOI was a MAS0 asset. MAS0 is the general standard that any developer can use to create a token. It has `Mint` and `Burn` endpoints, and the asset manager can call them. For a token you created yourself, that is useful. For the network's own fuel token, it is a risk. MASN removes it: `Mint`, `MintWithMetadata`, `Burn`, `SetStaticMetadata` and `SetDynamicMetadata` are reserved for the protocol itself and refused for everyone else.

Everything that moves KMOI works as before. `Transfer`, `TransferFrom`, `Lockup`, `Release`, `Approve` and `Revoke` keep the same names and the same arguments. A transfer is still one `ASSET_INVOKE` operation that calls `Transfer`. Code that moves KMOI through `MAS0AssetLogic` keeps working. The SDK also has a `MASNAssetLogic` class if you want the type to say which asset it is.

The part that breaks is the id. An asset id on MOI has the standard built into its bytes, so a new standard means a new id:

```
0x1080fffe4cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000
```

The `fffe` after `0x1080` means MASN. The old id had `0000` there, for MAS0. If you pasted the old id anywhere, replace it. js-moi-sdk 0.9.0-rc2 exports the new one as `KMOI_ASSET_ID`. Import that constant instead of pasting the hex, and the next change will not break you either.

## Why price in anu?

**Fuel and storage are now priced in anu, and two prices went up.** 1 KMOI is 1,000,000,000 anu. The lowest fuel price is now 50 anu. Storage now costs 1,000,000 anu per byte. Both were 1 anu before this release. If your code has either number hardcoded, it is now wrong.

Anu is the smallest unit of KMOI, the way [wei is the smallest unit of ether](https://ethereum.org/developers/docs/intro-to-ether/). The protocol counts in it so that it only ever deals in whole numbers. This release gives that unit its name, fixes it at one billionth of a KMOI, and raises the two floor prices that were set at 1.

The two numbers to know:

| Price | Before | v0.13.0 | In KMOI |
|---|---|---|---|
| Lowest fuel price, per unit of fuel | 1 anu | 50 anu | 0.00000005 |
| Storage, per byte | 1 anu | 1,000,000 anu | 0.001 |

Storage is the number that bites. Storing 1 KB of data costs 1 KMOI. A logic that saves a 200-byte record per user pays 0.2 KMOI to keep it. This is on purpose, and it follows from [August's storage costing work](https://blog.moi.technology/article/moi-august-2026-release/): running code is a one-time cost, but keeping data around is an ongoing one, and it is now priced that way.

The rule for your code: never work out an anu amount by hand. js-moi-sdk 0.9.0-rc2 has the conversions built in.

```ts
import { parseKmoi, formatKmoi } from "js-moi-sdk";

parseKmoi("0.5");            // 500000000n  (anu)
formatKmoi(1_500_000_000n);  // "1.5"       (KMOI)
```

Fuel needs nothing from you. The SDK's default fuel price is 50 anu, the new minimum, so an interaction sent without a price goes through. Set `fuel_price` yourself only if you want to pay more.

Storage is where existing code breaks. If your app funds a new logic or asset account with a fixed number, that number was set when a byte cost 1 anu. It is now a millionth of what the same bytes cost. The SDK's `DEFAULT_STORAGE_FUND` is 10,000,000,000 anu, which is 10 KMOI. The smallest storage deposit the network accepts is 1,000,000 anu, the price of one byte. Check every place you set `storageFund` or send a `StorageDeposit`, and write the value with `parseKmoi` so anyone reading the code can see what it means.

## What changed in the participant list?

**If you use js-moi-sdk 0.9.0-rc2, you can skip this section. The SDK handles it.** If you build interactions by hand, do not put the sender or the fee payer in the participant list. The node already knows both from the interaction itself, and it rejects an interaction that lists either of them again.

The participant list is where an interaction names every account it will touch, so the node can lock those accounts while it runs. The sender was always part of the interaction, so listing it again was harmless filler, and the SDK did it for you. Now that the fee payer is also part of the interaction, the node works out both by itself. The list is for everything else: the accounts you send to, the assets, the logics.

There is one case where the fee payer does go in the list. If the sponsor should sign off on what the interaction does, not only pay for it, so that a logic asking "who signed this?" sees the sponsor too, list it as a notary with a mutate lock. Then it signs for both. A fee payer listed without the notary flag is rejected.

The SDK leaves the sender out and leaves the payer out unless it is a notary. If you build interactions by hand, or with an older SDK, this is the third change that can break your code.

## What do developers need to change?

Most code keeps working. Here is what does not, starting with the most likely:

1. **Hardcoded KMOI asset ids.** Replace them with `KMOI_ASSET_ID` from js-moi-sdk 0.9.0-rc2. Search your code for `0x108000004cd973c4` to find every copy of the old one.
2. **Fixed storage amounts.** Any number you pass as `storageFund` or send in a `StorageDeposit` is now far too small. Write it in KMOI with `parseKmoi`, and check it against 1,000,000 anu per byte.
3. **Participant lists built by hand.** Remove the sender and the fee payer. Keep the fee payer only as a notary, and only when it should sign off on the operations too.
4. **SDK versions.** `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`. Older SDKs build the participant list the old way and do not know the new KMOI id.
5. **Anything that shows amounts.** If you display balances or fees, treat every number from the network as anu and format it with `formatKmoi`.

Using a fee payer is optional. The one change it brings for everyone is item 3: the node now works out the sender and the fee payer itself, so a list built by hand must leave them out.

## What does this mean for agents?

**An agent no longer needs its own KMOI to act on MOI.** That removes the awkward step in setting up an agent. Giving a new agent a key was easy. Giving it fuel meant a funding flow.

With a fee payer, an operator can run a whole fleet of agents from one funded treasury. Each agent signs its own interactions with its own key, so the record of who did what stays clear, and the treasury signs for the fuel. The treasury runs its rules before it signs, so an agent that misbehaves stops being paid for the moment the rules say so. That is a different kind of control from the [access policies](https://blog.moi.technology/article/moi-august-2026-release/) covered last month. Access policies decide what an agent may write. A fee payer decides what an operator is willing to pay for.

It also opens a payment path for machines. In the [x402 work](https://blog.moi.technology/article/how-ai-agents-pay-each-other-moi/), a buyer on MOI pays first from its own account and proves it afterwards, which needs no sponsor. From v0.13.0, an app or a facilitator can instead pay an agent's fuel by signing as its fee payer. That is the shape x402's authorization flow is built around. The scheme being filed does not depend on it, but it means MOI can offer that flow too.

## Everything shipped

Use these exact versions. Older SDK builds do not know the new KMOI id or the fee payer.

| Component | Version | What it carries |
|---|---|---|
| moipod | v0.13.0 | Fee payer; KMOI on MASN; prices in anu; sender and payer read from the interaction itself |
| js-moi-sdk | 0.9.0-rc2 | `payer()` on interaction contexts, `signRawInteractionObject`, `participantSignatures`; `KMOI_ASSET_ID`, `MASNAssetLogic`; `parseKmoi`, `formatKmoi`; default fuel price 50 anu |
| js-polo | 0.1.5 | The version the release note pairs with the SDK |

## What to do now

**If you build on MOI**, do these in order:

1. `npm i js-moi-sdk@0.9.0-rc2 js-polo@0.1.5`.
2. Replace every hardcoded KMOI id with `KMOI_ASSET_ID`.
3. Find every fixed storage amount and rewrite it with `parseKmoi`.
4. If you build interactions by hand, remove the sender and the fee payer from the participant list.
5. Decide whether your app should pay fuel for its users. If yes, set up a sponsor account and a small signing service around `signRawInteractionObject`, with your rules in front of it.

**If you run agents**, step five is the one that matters. A treasury that signs for fuel replaces funding each agent one by one.

If something breaks, the developer docs are at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) takes issues on GitHub. For the ideas behind all this, start with [what MOI Network is](https://blog.moi.technology/article/what-is-moi-network/).

## Key takeaways, recap

- **A fee payer pays the fuel, not the value.** It signs each interaction it pays for. There is no open allowance.
- **Your app can now take on users and agents that hold no KMOI.** A sponsor account and a signing service are the whole setup.
- **KMOI has a fixed supply and a new id.** Nobody can create or destroy it, the manager included. Use `KMOI_ASSET_ID`.
- **Everything is priced in anu.** 1 KMOI = 1,000,000,000 anu. Lowest fuel price 50 anu. Storage 1,000,000 anu per byte.
- **Fixed storage amounts are now a millionth of what they need to be.** Rewrite them with `parseKmoi`.
- **Leave the sender and the fee payer out of the participant list.** The one exception is a fee payer that is also a notary; list that one with a mutate lock. The node reads both from the interaction, and the SDK already does this.
- **Update to js-moi-sdk 0.9.0-rc2 and js-polo 0.1.5** before you build against the new network.

<Subscribe />
