---
title: "x402 on MOI: an agent pays for an API call in one retry, and the seller needs no keys to confirm it"
summary: "x402 turns HTTP 402 into a payment step that agents can complete without an account. MOI now has an x402 scheme: the buyer pays with one interaction, proves it with a signed claim, and the seller confirms the payment by reading it back from the network. Here is how the flow works, what the seller and the buyer run, and what is still to come."
date: 2026-09-12
author:
  name: "Adithya Ganesh"
  role: "Ecosystem, Sarva Labs"
tags: ["agents", "protocol", "native-assets", "x402", "payments", "kmoi"]
takeaways:
  - "x402 is an open standard that puts a payment inside the HTTP 402 response. A client that gets 402 pays, retries with proof, and gets the resource. No account, no API key, no card."
  - "On MOI the buyer settles first and proves second. It sends one interaction that calls Transfer on a native asset, waits for the receipt, then signs a claim naming that transfer, the resource, the network, a time window and a nonce."
  - "The seller's facilitator holds no keys. It reads the interaction and its receipt back from a node, decodes the transfer, checks eight rules and marks the transfer hash spent. It can run inside the seller's own process."
  - "No token approval, no contract, no relayed signature. A MOI asset transfer is a protocol operation, and a participant identifier derives from the key that signs, so the claim can be tied to the payer by derivation alone."
  - "Three pieces make MOI an x402 network: a moi namespace for chain identifiers (moi:devnet), a scheme specification, and the @x402/moi TypeScript package with client, server and facilitator halves."
  - "A seller on Hono adds one middleware and one route config; a buyer wraps fetch. Prices are quoted in atomic units or as a KMOI string such as \"0.10 KMOI\"."
  - "Today this runs on Voyage devnet, with KMOI and MAS0 assets. Dollar prices need a converter you register, because MOI has no dollar-pegged default asset yet."
  - "The fee payer from moipod v0.13.0 and a Coco escrow logic open the other two x402 flows, authorization and escrow, as follow-ups. The first scheme keeps to the flow that settles in one interaction."
faq:
  - q: "What is x402 in one sentence?"
    a: "An open standard, published under Apache-2.0 by the x402 Foundation, that lets a server answer a request with HTTP 402 and a machine-readable price, and lets the client pay and retry with proof in the same exchange."
  - q: "Why does MOI pay first instead of signing an authorization like EVM chains do?"
    a: "Because it can. A MOI buyer submits its own asset transfer as one interaction and gets a receipt in one consensus round. There is nothing for a third party to relay and no allowance to grant, so the scheme uses x402's upfront flow: settle, then prove. The other flows are possible on MOI and are planned as follow-ups."
  - q: "Can someone copy a transfer hash off the network and use it to buy something?"
    a: "No. The claim is signed by a key that must derive to the paying account, it names one resource and one network, it carries a validity window and a nonce, and the facilitator marks each transfer hash spent on the first settlement. A lifted hash fails the derivation check."
  - q: "Does the seller need to run a facilitator service?"
    a: "No. The MOI facilitator only reads, so it can run inside the seller's process. The package ships a chain reader over a JSON-RPC node; you construct it, register it, and wrap it so core's resource server can call it. A shared facilitator service works too."
  - q: "What does a buyer need before its first paid request?"
    a: "A MOI account with enough KMOI for the price plus fuel, and a mnemonic the client can sign with. createMoiSigner connects a js-moi-sdk wallet to a node; the client half submits the transfer through it and signs the claim with key 0."
  - q: "How do I price in dollars?"
    a: "Register a money parser on the server half. MOI has no dollar-pegged default asset, so a bare \"$0.10\" is refused until you supply a conversion. \"0.10 KMOI\" and { asset, amount } in atomic units work without one."
  - q: "What stops the same payment settling twice?"
    a: "The spent store. Its reserve call is an atomic insert-if-absent keyed on the transfer hash. Two settlements that arrive together both read the same transfer off the network, and only the one that wins the reserve succeeds. The store must be durable in production."
  - q: "Which networks does this cover?"
    a: "Voyage devnet, identified as moi:devnet, with KMOI (the MASN standard) and MAS0 assets. Mainnet is reserved in the namespace profile and is added to the scheme when it launches."
  - q: "Is the code public?"
    a: "It is heading upstream as three contributions: the moi namespace to the Chain Agnostic Standards Alliance, the scheme specification to the x402 repository, and the @x402/moi package to the same repository. The order is fixed by the repositories: the namespace first, then the spec, then the package."
draft: false
---

**An agent can now buy one API call on MOI with a single HTTP retry, and the seller can confirm the payment without holding a key.** That is what an x402 scheme for MOI gives you. The buyer pays with one interaction, proves it with a signed claim, and the seller reads the payment back from the network instead of trusting anything in the request.

This post is for people who build services that agents call, and for people who build the agents. It explains what x402 is, why the MOI version settles before it proves, what happens inside one paid request, what the seller and the buyer each run, and what is still missing.

Six terms, glossed once. *x402* is the standard; the name is the HTTP status code 402, Payment Required. A *facilitator* is the component that checks a payment on the seller's behalf. A *scheme* is one way of paying under x402; the one here is called `exact`, a fixed price per request. An *interaction* is MOI's transaction. A *participant* is an account on MOI with its own state; every buyer, seller and agent is one. *Fuel* is what an interaction costs to run, paid in KMOI, the native token.

## What is x402, and why do agents care?

**x402 is an open standard that puts a payment inside an HTTP 402 response.** A server that wants to charge for a resource answers the first request with `402 Payment Required` and a header that says what it accepts: the price, the asset, the network and where to pay. The client pays, retries with a proof header, and gets the resource. No account is created, no API key is issued, no card is stored.

For an agent that is the whole point. An agent calling a data API at 3 a.m. cannot fill in a signup form or wait for a human to approve a card. It can hold a key and sign a payment. x402 turns every priced endpoint into something an agent can use on first contact.

The standard is published by the [x402 Foundation](https://github.com/x402-foundation/x402) under Apache-2.0. The reference repository lists EVM chains, Solana, Algorand, Aptos, Stellar, TON, Hedera and Keeta as supported networks, and three schemes: `exact` for a fixed price, `upto` for a capped amount, and `batch-settlement` for escrowed vouchers on EVM. The numbers on [x402.org](https://www.x402.org/) for the 30 days to 10 September 2026:

| Measure | Last 30 days |
|---|---|
| Transactions | 75.41M |
| Volume | $24.24M |
| Buyers | 94.06K |
| Sellers | 22K |

The same page lists Alchemy, AWS, Cloudflare, Stripe and Vercel among the companies using it. Stripe also launched its own [Machine Payments Protocol](https://stripe.com/blog/machine-payments-protocol) with Tempo in April 2026, which tells you that HTTP-native machine payments are a direction the whole industry is taking, not one company's experiment.

## What does x402 need from a network?

**Three things: a way to name the network, a written scheme, and code for the three parties.**

The name comes from [CAIP-2](https://chainagnostic.org/CAIPs/caip-2), the chain identifier format the Chain Agnostic Standards Alliance maintains. x402 v2 names every network as a CAIP-2 string, such as `eip155:8453` for Base. Nobody can use `moi:devnet` with confidence until the `moi` namespace is registered, so that registration is the first piece.

The scheme is a specification in the x402 repository that says, for one scheme on one network, what the seller emits, what the buyer sends, what the facilitator must check, and what comes back. The repository lands the spec before it reviews any code.

The code is a package with three halves. The client half is what a buyer runs to pay. The server half is what a seller runs to quote a price. The facilitator half is what checks the payment. In x402's TypeScript SDK each half implements a small interface, and the core library drives the HTTP exchange around them.

x402 v2 also defines three payment flows, and a scheme picks one:

| Flow | Order | Who moves the money |
|---|---|---|
| `authorization` | verify, serve, settle | The facilitator, using a signed authorization from the buyer |
| `upfront` | settle, serve, respond | The buyer, before the request is served |
| `escrow` | settle, serve, settle | Funds are held, then released |

Most chains use `authorization`. The MOI scheme uses `upfront`, and the next section is why.

## Why does MOI settle first and prove second?

**Because a MOI buyer can move the money itself, in one interaction, and get a receipt.** On an EVM chain the common x402 pattern is an EIP-3009 authorization: the buyer signs a message, the facilitator submits it, and a contract moves the tokens. The facilitator holds a key, pays gas, and stands between the buyer's signature and settlement.

MOI removes the reasons for that arrangement.

A transfer is a protocol operation. Fungible assets on MOI are native: KMOI runs on the MASN standard and developer tokens on MAS0. Moving one is an `ASSET_INVOKE` operation calling the asset's `Transfer` callsite, inside an interaction the buyer signs and submits from its own account. There is no contract to approve, no allowance to grant, and no relayer to trust with a signed instruction.

The interaction is final on commit. Consensus reaches finality in one round, and the node returns a receipt that says whether the interaction succeeded. The buyer waits for that receipt before it claims anything. A refused transfer still gets a hash and a receipt, so a hash on its own proves nothing; the receipt status does.

The identifier is derived from the key. A participant identifier on MOI contains a 24-byte slice of the account's compressed public key. A facilitator can take the public key that signed a claim, derive the identifier, and check that it equals the paying account, with no lookup and no registry. That one property is what lets the scheme tie a public transfer hash to a specific payer.

So the scheme settles first. The buyer transfers, waits, and signs a claim naming the settled transfer. The facilitator reads the transfer back and confirms it. Under this ordering core never calls the facilitator's `/verify` endpoint; every check runs inside `/settle`, which confirms a payment rather than executing one.

| | x402 on an EVM chain | x402 on MOI |
|---|---|---|
| Who submits the payment | Facilitator, from the buyer's signed authorization | Buyer, from its own account |
| Token approval | EIP-3009 or an allowance | None; native asset transfer |
| Facilitator keys | Holds a key, pays gas | None; reads only |
| Payment proof | The signed authorization | A signed claim over a settled transfer |
| Replay boundary | Authorization nonce on chain | Transfer hash in the facilitator's spent store |
| Can the seller self-facilitate | Yes, with a funded key | Yes, with a node URL |

The `upfront` flow is a choice, not a limit. MOI can express the other two: a signed interaction can be relayed by a third party, and from moipod v0.13.0 a separate fee payer can co-sign and pay the fuel, which is the shape `authorization` expects; and funds can be held pending release, natively or in a Coco logic. A first scheme should settle in one interaction and leave nothing pending on either side, so it does.

## What happens in one paid request?

**Eight steps, two of them on the network.**

1. The client requests the resource.
2. The server answers `402` with a `PAYMENT-REQUIRED` header. It carries the scheme, the network, the asset, the amount, where to pay, a timeout, and two extra fields: `paymentFlow: "upfront"`, which core writes, and `resource`, the URL being bought, which the server half copies in so the buyer can sign over it.
3. The client submits an interaction on the named MOI network with one `ASSET_INVOKE` operation calling `Transfer` on the quoted asset, for the quoted amount, to the seller.
4. The client waits until the receipt comes back successful, then signs a claim.
5. The client repeats the request with the claim in the `PAYMENT-SIGNATURE` header.
6. The server hands the claim and the quote to the facilitator's `/settle`.
7. The facilitator reads the interaction and its receipt back from a node, checks every rule, marks the transfer hash spent, and returns the result.
8. The server serves the resource and attaches a `PAYMENT-RESPONSE` header.

The claim is the part MOI adds. It repeats the quoted fields so the facilitator can compare them, and adds the transfer hash, the resource, a validity window and a nonce:

```json
{
  "publicKey": "02a1…",
  "keyId": 0,
  "signature": "0x…",
  "claim": {
    "from":        "0x00000000…",
    "network":     "moi:devnet",
    "to":          "0x00000000…",
    "asset":       "0x1080fffe…",
    "value":       "100000000",
    "txHash":      "0x…",
    "resource":    "https://api.example.com/forecast",
    "validAfter":  "1757600000",
    "validBefore": "1757600060",
    "nonce":       "0x…"
  }
}
```

The bytes that get signed are fixed: a JSON array with a domain separator first, then the fields in order, encoded the way `JSON.stringify` encodes them. Signer and verifier produce the same bytes in any language, and a signature made here cannot be reused as a signature over anything else the same key signs.

`keyId` is 0 because the identifier derives from key 0. The facilitator checks that the key which signed derives to `claim.from`. A valid signature from some other key would still be a valid signature, and it would still be someone else's transfer.

## What does the seller run?

**One middleware, one route config, and a facilitator that lives in the same process.** The example uses [Hono](https://hono.dev/), which x402 supports through `@x402/hono`; Express and Next.js adapters take the same shape.

```ts
import { Hono } from "hono";
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer } from "@x402/core/server";
import { x402Facilitator } from "@x402/core/facilitator";
import { ExactMoiScheme as MoiServer } from "@x402/moi/exact/server";
import {
  ExactMoiScheme as MoiFacilitator,
  createMoiChainReader,
} from "@x402/moi/exact/facilitator";

// The facilitator only reads. A node URL is all it needs.
const reader = createMoiChainReader({
  rpcUrl: "https://dev.voyage-rpc.moi.technology/devnet/",
});
const facilitator = new x402Facilitator().register(
  "moi:devnet",
  new MoiFacilitator(reader, { spentStore }),
);

// Core's resource server expects a FacilitatorClient; wrap the in-process one.
const local = {
  verify: (p, r) => facilitator.verify(p, r),
  settle: (p, r) => facilitator.settle(p, r),
  getSupported: async () => facilitator.getSupported(),
};
const server = new x402ResourceServer(local).register("moi:devnet", new MoiServer());

const app = new Hono();
app.use(
  paymentMiddleware(
    {
      "GET /forecast": {
        accepts: [
          {
            scheme: "exact",
            network: "moi:devnet",
            payTo: process.env.SELLER_ID,
            price: "0.10 KMOI",
            maxTimeoutSeconds: 60,
          },
        ],
        description: "Seven-day forecast",
      },
    },
    server,
  ),
);
app.get("/forecast", c => c.json({ tomorrow: "clear" }));
```

Three lines carry the MOI-specific part. `createMoiChainReader` builds the reads the facilitator needs over a JSON-RPC node: signature verification through js-moi-sdk, identifier derivation matching the SDK wallet, and the transfer read-back. `MoiFacilitator` is the checking half; `spentStore` is where it records redeemed transfer hashes, and it must be durable in production. `MoiServer` declares the `upfront` flow and copies the resource URL into the quote.

Prices take three forms. `{ asset, amount }` in atomic units passes through. A KMOI string such as `"0.10 KMOI"` converts with nine decimals, so it becomes 100,000,000 anu. A dollar string is refused until you register a converter, because MOI has no dollar-pegged default asset yet.

The wrapper around the facilitator exists because core's resource server takes a client whose `getSupported` returns a promise, while the in-process facilitator's is synchronous. Four lines and it is done. A seller that prefers a shared facilitator service points the resource server at its URL instead and skips the wrapper.

## What does the buyer run?

**A wrapped `fetch`.**

```ts
import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createMoiSigner } from "@x402/moi";
import { ExactMoiScheme } from "@x402/moi/exact/client";

const signer = await createMoiSigner(process.env.MOI_MNEMONIC, {
  rpcUrl: "https://dev.voyage-rpc.moi.technology/devnet/",
});
const client = new x402Client().register("moi:*", new ExactMoiScheme(signer));
const payingFetch = wrapFetchWithPayment(fetch, client);

const res = await payingFetch("https://api.example.com/forecast");
console.log(await res.json());
```

`createMoiSigner` turns a mnemonic into a js-moi-sdk wallet connected to a node, plus the account's participant identifier and compressed public key. The client half submits the transfer through that wallet, waits for the receipt, refuses to claim a transfer that was mined but did not succeed, and signs the claim with key 0. `"moi:*"` registers the scheme for every MOI network, so the same client works when mainnet is added.

For an agent, the buyer side is the whole integration. The agent holds a mnemonic, its account holds KMOI, and every priced endpoint on any x402 network it has a scheme for becomes callable through the same `payingFetch`.

## What does the facilitator check?

**Eight rules, in order, each with its own reason code.** The scheme specification writes them as MUSTs; the package enforces them inside `settle` and names the rule that failed.

| Rule | What it checks | Reason code on failure |
|---|---|---|
| 1 Shape | Claim, signature and public key are present | `moi_exact_invalid_payload` |
| 2 Signature | ECDSA over the canonical claim bytes verifies against the public key | `moi_exact_invalid_signature` |
| 3 Key controls payer | The identifier derived from the key equals `claim.from`, and `keyId` is 0 | `moi_exact_invalid_payload` |
| 4 Claim matches quote | Network, asset and payee equal the quote; value is at least the amount | `moi_exact_requirements_mismatch` |
| 5 Resource binding | `claim.resource` equals the URL being served; fails closed if absent | `moi_exact_requirements_mismatch` |
| 6 Freshness | Now is inside the window, and the window is no wider than the quoted timeout | `moi_exact_payment_expired` |
| 7 Settled on chain | The interaction and receipt exist, the receipt succeeded, the sender is the payer, the operation is a `Transfer` on the quoted asset, and the decoded beneficiary and amount match | `moi_exact_transfer_not_found`, `moi_exact_transfer_mismatch`, `moi_exact_chain_read_failed` |
| 8 Replay | The transfer hash has not been redeemed; reserve it atomically | `moi_exact_already_spent` |

Rule 7 is the one that makes this `upfront`. The receipt carries the status but neither the beneficiary nor the amount, so the read takes both `moi.InteractionByHash` and `moi.InteractionReceipt`, and the beneficiary and amount come from decoding the operation's calldata, which the node encodes in POLO, MOI's serialization format. Nothing in the request is believed; everything is read back.

Rule 8 is the replay boundary, and it is the transfer hash that is single use, not the nonce. Two settlements that arrive together can both read the same transfer off the network before either records it, so the spent store's reserve is an atomic insert-if-absent. A separate check-then-add would let one payment buy twice.

Overpayment is accepted: rules 4 and 7 compare with at-least. Underpayment is rejected. A seller that wants exact-amount semantics compares for equality on its side.

## What did we build, and where is it going?

**Three pieces, filed in the order the repositories require.**

| Piece | Where it goes | What it is |
|---|---|---|
| `moi` namespace | [ChainAgnostic/namespaces](https://github.com/ChainAgnostic/namespaces) | The CAIP-2 profile: `moi:<network>`, with `moi:devnet` live and `moi:mainnet` reserved |
| `scheme_exact_moi.md` | [x402-foundation/x402](https://github.com/x402-foundation/x402), `specs/schemes/exact/` | The scheme: quote, claim, canonical bytes, the eight rules, the response, and the duplicate-settlement mitigation |
| `@x402/moi` | Same repository, `typescript/packages/mechanisms/moi/` | Client, server and facilitator halves, a mnemonic signer, a JSON-RPC chain reader, unit and live integration tests |

The namespace goes first because the spec names `moi:devnet`. The spec goes second because the x402 repository reviews a specification before it reviews a package. The package goes last and mirrors the layout of `@x402/stellar`, the closest merged non-EVM mechanism.

Every protocol claim in the spec was checked against the node and SDK source and against Voyage devnet. The package's tests decode the calldata of a real devnet transfer, sign claims with the SDK's own ECDSA, and read a settled transfer back from a live node the way rule 7 describes.

## What are the limits today?

**Devnet, KMOI pricing, and one flow.**

The scheme lists one network, `moi:devnet`. Mainnet is reserved in the namespace profile and is added to the scheme when it launches.

Prices are in KMOI or in atomic units of any MAS0 asset. There is no dollar-pegged asset on MOI yet, so the dollar prices that x402 sellers usually quote need a converter you register on the server half. A stablecoin on MOI, or a price feed sellers can quote against, closes that gap.

The scheme does not use the fee payer. The buyer pays its own fuel, or names a payer itself; the facilitator sponsors nothing. That keeps the facilitator keyless, and it means a buyer needs KMOI for fuel as well as for the price.

Sub-accounts cannot pay yet. Rule 3 derives the identifier with variant 0, so a claim from a sub-account identifier fails it. A later version can derive with the variant the claim names.

Clock skew narrows the window. The validity window is the buyer's own timestamps, so a seller should quote `maxTimeoutSeconds` with skew in mind. A later version can anchor freshness to the transfer's tesseract timestamp instead.

## What comes next?

**The other two flows, and a network to run them on.**

The fee payer that shipped in [moipod v0.13.0](https://blog.moi.technology/article/moi-september-2026-release/) is the missing piece for an `authorization` scheme: a facilitator co-signs as the fee payer and submits the buyer's signed interaction, so the money moves after the resource, the way other x402 chains do it by default. The native `Approve` and `TransferFrom` allowance is the other route, with a cap and an expiry the protocol enforces.

An `escrow` scheme can hold a deposit in a Coco logic's own account and release it to the seller by code, with no custodian key. That is the shape larger purchases want, and the logic that does it already compiles; it needs a run on a live network and a refund rule before it becomes a scheme.

A hosted MOI facilitator with a free tier would do for MOI sellers what Coinbase's facilitator does for Base sellers: remove the last piece of infrastructure they have to run. It is cheap to operate, because it only reads.

If you build services that agents call, the seller example above is the whole integration. If you build agents, the buyer example is. The developer docs are at [docs.moi.technology](https://docs.moi.technology), and [js-moi-sdk](https://github.com/sarvalabs/js-moi-sdk) takes issues on GitHub. For how agents pay each other on MOI more generally, start with [how AI agents pay each other on MOI](https://blog.moi.technology/article/how-ai-agents-pay-each-other-moi/).

## Key takeaways, recap

- **x402 puts a payment inside HTTP 402.** The client pays and retries with proof; no account, no API key.
- **MOI settles first and proves second.** One interaction moves the money; a signed claim names it; the facilitator reads it back.
- **The facilitator holds no keys.** It reads an interaction and its receipt from a node, decodes the transfer, and checks eight rules. It can run inside the seller.
- **The claim, not the hash, is the proof.** Signed by a key that derives to the payer, bound to one resource and one network, with a window and a nonce; the hash is marked spent once.
- **A seller adds one middleware; a buyer wraps fetch.** Prices in atomic units or as a KMOI string.
- **Three pieces go upstream in order:** the `moi` namespace, the scheme spec, the `@x402/moi` package.
- **Devnet and KMOI today.** Dollar prices need a converter; sub-accounts and the fee payer are follow-ups.
- **The other two flows are next.** Fee payer for `authorization`, a Coco logic for `escrow`.

<Subscribe />
