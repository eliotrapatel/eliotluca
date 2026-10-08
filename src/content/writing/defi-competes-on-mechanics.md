---
title: "DeFi competes on mechanics"
description: "After my thesis: DeFi wins on settlement and transparency, falls short on credit and recourse, and will merge with finance everywhere else."
date: 2026-08-31
lang: en
kind: essay
draft: true
---

Finance is a bundle, and decentralised finance only competes with parts of it.

My thesis asked whether decentralised finance can compete with traditional finance. At its core were five semi-structured interviews with protocol executives, more than five hours in total. What follows is where I landed. Nobody I interviewed is quoted or paraphrased, and the conclusions are mine.

The question splits in two. Where finance is a matter of moving, holding and recording assets, DeFi often has better mechanics. Where finance is a matter of judging people and enforcing promises, it has very little to offer yet.

## Where the mechanics are better

**Settlement and custody as code.** In traditional markets, a trade and its settlement are separate events. Between them sit clearing houses, custodians and correspondent banks, plus a settlement window in which each side carries the risk that the other fails. On a public chain, the transfer of the asset and the payment can be one transaction: either both happen or neither does. Custody becomes a key and a contract instead of an entry at an intermediary. That removes a layer of counterparty risk and most of the reconciliation work that exists only because several ledgers have to agree.

**Transparency of positions.** Every loan, every collateral ratio and every liquidation threshold on a public protocol is readable by anyone, at any time. In traditional finance, a borrower's total leverage across all its lenders is often visible to no one, the lenders included, until something breaks. On chain, risk can be monitored before it does. Few people do monitor it, but the option exists, and the system is built around it.

**Composability.** A DeFi protocol is a set of public functions that any other protocol can call without asking permission. A lending market can read a price from an exchange contract, accept a stablecoin as collateral and hand the borrowed asset to a third protocol in a single transaction. Building a new product means assembling existing parts. The speed of iteration that follows has no real equivalent in a world of bilateral agreements and integration projects. The cost is that failures chain together as easily as features do.

**Continuous markets.** An order book needs market makers willing to post quotes, which they do only for assets with enough volume to pay them. An automated market maker replaces the book with a pool of two assets and a pricing formula. It always quotes, it never closes, and anyone can supply the liquidity. The trade-off is real: liquidity providers absorb losses when informed traders move the price against them, and large orders pay more slippage than they would on a deep book. For long-tail assets that no professional would quote, the pool wins by default.

**Stablecoins.** This is the clearest product-market fit in the whole sector. A dollar that moves on a weekend, across a border, to anyone with a wallet, and settles in minutes, is something people want without caring about the technology underneath. The most successful DeFi product is, in its dominant form, a claim on assets held in the traditional system. It competes by borrowing trust from the institutions it is supposed to replace.

## Where finance runs on judgement and law

**Credit without identity.** Lending is the business of knowing who will pay you back, and of being able to act when they do not. A protocol that cannot identify its borrowers can do neither. Its answer is overcollateralised lending: you deposit more than you borrow, and the contract sells your collateral if its value falls too far. That is a useful product for anyone who wants liquidity without selling an asset. It is not credit in the economic sense, because it only lends to people who already hold more than they need to borrow. The core social function of credit, financing someone whose future income exceeds their current assets, is out of reach.

**Legal recourse.** When something goes wrong in traditional finance, there is a court, a regulator, a chargeback, an ombudsman. On chain, a transaction is final. An exploited contract or a transfer to the wrong address has no appeal unless someone with privileged control intervenes, and the existence of that someone undermines the claim to be decentralised. Code removes discretion, which is the point. It also removes forgiveness.

**User protection.** Self-custody means self-responsibility. Lost keys, phishing, malicious approvals and interfaces that make dangerous actions look routine all land on the user. Most people would rather have an institution they can call, and will accept worse mechanics to have one.

**Governance that concentrates.** Token voting promises that the users run the protocol. In practice, voting power tends to gather around founders, early investors and a few large holders, participation is thin, and upgrades often sit behind a small group of signers. In many protocols, decentralisation describes the settlement layer far better than the decision layer. A system can be trustless in how it executes and still be governed by a handful of people.

## Where competition is real, and where the systems merge

The competition is real today in three places. Stablecoins compete with payment rails and cross-border transfers, and they win on speed, hours and reach. On-chain exchanges compete with centralised venues for trading crypto assets, especially in the long tail. Collateralised borrowing competes with margin lending for people who hold digital assets and do not want to sell them.

Everywhere else, I expect the two systems to merge rather than replace each other. The direction is visible in tokenisation: a traditional asset, issued and held by a regulated entity, recorded and settled on a public chain. The institution keeps the underwriting, the compliance and the liability. The chain provides the settlement, the transparency and the composability. From the other side, DeFi protocols add identity layers and permissioned pools so that institutions can use them without breaking their own rules.

That division of labour is the line I kept returning to. Mechanics migrate to the better machine. Judgement and law stay with whoever can be held responsible for them, because a court still needs a defendant.

DeFi will not replace finance. It will replace the parts of finance that were only ever paperwork.
