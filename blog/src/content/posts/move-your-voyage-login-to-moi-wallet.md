---
title: "How to move your Voyage login to MOI Wallet"
summary: "Voyage now signs you in with MOI Wallet. Import the same seed phrase you already use and your account, history and settings come with you."
date: 2026-08-27
author:
  name: "Sarva Labs"
  role: "Engineering"
tags: ["protocol", "voyage", "wallet", "validators"]
takeaways:
  - "Voyage authenticates through MOI Wallet now, as a browser extension or a mobile app, instead of its own login."
  - "Import the same seed phrase you already used and nothing about your account changes."
  - "Voyage identifies you by your moi_id, which is derived from your wallet, not from a login record."
  - "The browser extension approves through a popup on your computer; the mobile app approves by scanning a QR code."
  - "Voyage previously offered Login with IOMe, Generate MOI ID and Import MOI ID. All three are gone, and all three migrate the same way."
  - "Voyage will never ask you for your seed phrase. Only ever type it into MOI Wallet itself."
  - "The faucet no longer creates accounts. Register on chain first, then fund."
  - "The network is now called Devnet in the selector and in URLs. Old links containing babylon will not resolve."
faq:
  - q: "Do I need a new seed phrase?"
    a: "No. Import the same seed phrase you already used with Voyage. A different seed phrase produces a different moi_id, which Voyage reads as a different participant."
  - q: "Will I lose my history?"
    a: "No, as long as you import the same seed phrase. Voyage keys your profile, history and settings to your moi_id, so the same wallet returns you to the same account."
  - q: "Do I have to use the mobile app?"
    a: "No. The browser extension and the mobile app both work. Pick whichever you already have installed."
  - q: "Is there a deadline?"
    a: "None has been published. The old login is being retired in favour of wallet authentication, so migrating sooner avoids being locked out later."
  - q: "Why does Voyage need me to sign something?"
    a: "Signing is how you prove you hold the key. Voyage issues a challenge, your wallet signs it, and Voyage verifies the signature against your account. No password is stored anywhere."
  - q: "What is a moi_id?"
    a: "The identifier for your participant account on MOI. It is derived from your wallet, so any wallet holding the same seed phrase resolves to the same moi_id."
  - q: "Can I connect more than one account?"
    a: "Yes. MOI Wallet v1.2.0 added multi-account selection, so you can choose several accounts as part of one connection and pick which to authenticate with."
  - q: "The faucet says my account does not exist. Why?"
    a: "The faucet stopped creating accounts. It only funds accounts that already exist on chain, so register as a participant first and then use the faucet."
  - q: "My old Voyage bookmark stopped working."
    a: "The network was renamed from babylon to Devnet in the selector and in URL parameters. Update any saved link that still carries the old value."
  - q: "I logged in to Voyage the old way. Does this apply to me?"
    a: "Yes. Voyage previously offered Login with IOMe, Generate MOI ID and Import MOI ID. All three have been removed. Your account is still tied to its original moi_id, so you migrate by importing that account's seed phrase into MOI Wallet. Steps: https://voyage-docs.moi.technology/docs/wallet-authentication/"
  - q: "I used Login with IOMe and do not have my seed phrase."
    a: "IOMe still holds it. Sign in at iome.ai, open Settings from the profile menu, find Security Recovery Phrase and click copy seedphrase, then confirm with your IOMe password. The full guide is at https://voyage-docs.moi.technology/docs/wallet-authentication/iome-seed-phrase-recovery"
  - q: "Can I just make a new wallet instead?"
    a: "Not if you want your old account. A new wallet is a new key and a new moi_id, which the protocol treats as a different participant. You would be starting fresh rather than migrating."
  - q: "Voyage is asking for my seed phrase. Should I enter it?"
    a: "No. Voyage never asks for a seed phrase, and neither does any part of this migration outside MOI Wallet itself. Treat any page that asks as a phishing attempt."
draft: false
---

**[Voyage](https://voyage.moi.technology) signs you in with MOI Wallet now.** The login it used before has been replaced by wallet authentication, which means you prove who you are by signing a challenge with a key you hold rather than by handing Voyage a credential it stores.

If you already use Voyage, the move takes about two minutes and your account comes with you.

## What actually changed?

Voyage used to keep its own login. You authenticated to Voyage, and Voyage decided who you were.

That is now inverted. Your wallet decides who you are, and Voyage checks the proof. When you log in, Voyage issues a challenge, your wallet signs it, and Voyage verifies that signature against your account. Nothing about you is stored as a credential on Voyage's side, because there is no longer a credential to store.

The identifier that ties this together is your `moi_id`, the address of your participant account on MOI. It is derived from your wallet, which is the reason the migration is as simple as importing a seed phrase: the same seed phrase produces the same keys, the same keys produce the same `moi_id`, and Voyage returns you to the same account.

## What do you need to do?

Five steps.

1. Install MOI Wallet on your device, either the [browser extension](https://chromewebstore.google.com/detail/moi-wallet/abjpinodmdoipbdlihecmhjflebogjil) or the mobile app.
2. In MOI Wallet, choose **Import an existing wallet** and enter your seed phrase.
3. Open Voyage and click **Login**.
4. In the login modal, choose **Browser extension** or **Mobile wallet**.
5. Select the account you want to use, then click **Sign & Authenticate**.

That is the whole migration. There is no separate account transfer and nothing to file. The same five steps are in the [Voyage wallet authentication docs](https://voyage-docs.moi.technology/docs/wallet-authentication/), with screenshots.

## What if you signed in the old way?

Voyage used to offer three ways in: **Login with IOMe**, **Generate MOI ID**, and **Import MOI ID**. All three have been removed, and all three migrate the same way.

Whichever you used, your account is still tied to its original `moi_id`. Nothing was reset. The only thing that changes is where the key lives: Voyage used to hold it on your behalf, and now you hold it yourself.

So the question to answer first is whether you have that account's seed phrase. If you do, the five steps above are the whole job.

### If you used Login with IOMe and do not have the seed phrase

IOMe is an identity platform, and it still holds your recovery phrase. You can get it back:

1. Sign in at [iome.ai](https://iome.ai/login/).
2. Open the profile menu in the top-right and choose **Settings**.
3. Find **Security Recovery Phrase** and click **copy seedphrase**.
4. Enter your IOMe password to confirm, then submit.
5. Store the phrase somewhere private, then import it into MOI Wallet.

The full walkthrough is in the [IOMe seed phrase recovery guide](https://voyage-docs.moi.technology/docs/wallet-authentication/iome-seed-phrase-recovery).

Whatever you do, do not create a fresh wallet and hope it reconnects to your old account. It will not. A new wallet is a new key, a new `moi_id`, and a new participant as far as the protocol is concerned.

## Will you lose your account?

No, provided you import the same seed phrase you used before.

Voyage keys your profile, your history and your settings to your `moi_id`. Because that identifier comes from your wallet rather than from a login record, connecting with the same wallet puts you back into the same account. Nothing needs to be moved because nothing moved.

The corollary matters more than the reassurance: a *different* seed phrase gives you a different `moi_id`, and Voyage will treat you as a participant it has never seen. If you find yourself looking at an empty account after logging in, the seed phrase is the first thing to check.

## Should you use the extension or the mobile app?

Either works. They differ in how you approve things.

| | Browser extension | Mobile wallet |
|---|---|---|
| Where it runs | Chrome on your computer | Your phone |
| How you connect | Popup approval | Scan a QR code |
| Where connections live | The extension | App Drawer → DApp Connections |

If you already have one installed, use that one. If you have neither, the extension is slightly less work when you are signing from a desktop, because approval happens in the same place you are already looking.

The mobile route arrived with Voyage v0.9.1, which added WalletConnect support so that the mobile wallet can talk to Voyage at all. MOI Wallet v1.2.0 shipped the other half, including multi-account selection: you can bring several accounts into one connection and choose which to authenticate with.

## What should you never do?

Type your seed phrase anywhere that is not MOI Wallet.

Voyage will never ask for it. No step in this migration asks for it outside the wallet's own import screen. A wallet migration is exactly the moment phishing works, because everyone is expecting to be asked for a seed phrase by something. Anything that asks you outside MOI Wallet is not part of this.

## What else changed in Voyage this month?

Two things that will look like bugs if you have not heard about them.

**The faucet no longer creates accounts.** It funds accounts that already exist on chain. If you try to fund an address that was never registered, you get an error telling you the account does not exist. Register as a participant first, then use the faucet.

**The network is now called Devnet.** Both changes shipped alongside [the August release](https://blog.moi.technology/article/moi-august-2026-release/). It was called babylon, in the network selector and in URL parameters. Any bookmark or shared link still carrying the old value will not resolve to the right place.

## What if something goes wrong?

Four things account for almost every failed migration. Work through them in order.

- **You signed in and the account is empty.** The seed phrase is wrong. Nothing has been lost, you are simply signed in as a participant Voyage has never seen. Log out, check the phrase against the account you had before, and import again.

- **The signature will not verify.** The wrong account was selected. A wallet holding several accounts offers all of them in the modal, and only one of them is the account Voyage knows you by. Go back a step and pick a different one.

- **The mobile QR code will not connect.** This is usually Voyage rather than your wallet. WalletConnect arrived on the Voyage side in v0.9.1, and the mobile app has supported it since v1.1.0, so a stale Voyage tab is the more likely culprit. Reload it and generate a fresh code.

- **The faucet says your account does not exist.** It is not a migration problem. The faucet stopped creating accounts and only funds ones already registered on chain. Register as a participant first, then come back to it.

If none of that resolves it, ask in [Discord](https://discord.gg/5gG6efFN4s) rather than retrying against a page you are unsure about. Nothing here is fixed by entering your seed phrase somewhere new.

## Key takeaways, recap

- **Voyage authenticates through MOI Wallet now.** You prove you hold a key rather than presenting a stored credential.
- **The same seed phrase keeps the same account.** Your `moi_id` is derived from your wallet, so nothing needs migrating.
- **Five steps, about two minutes.** Install, import, log in, choose extension or mobile, sign.
- **Extension and mobile both work.** They differ only in how approval happens, popup or QR.
- **A different seed phrase looks like a lost account.** It is not lost, you are signed in as someone else.
- **Nothing outside MOI Wallet should ever ask for your seed phrase.** Voyage does not, and neither does this migration.
- **The faucet needs you to exist first.** Register on chain, then fund.
- **babylon is now Devnet.** Update saved links.
