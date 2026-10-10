---
title: "DeFi competes on mechanics"
description: "Finance is several jobs sold together. Decentralised finance already does the mechanical ones better, and has almost nothing to offer for the ones that need judgement and law."
date: 2026-08-31
lang: en
kind: essay
draft: true
---

I have been in crypto since 2017, and I later wrote my thesis on a question I had been asked many times: can decentralised finance compete with traditional finance? For it I interviewed five executives of DeFi protocols, more than five hours of conversation in total. The conclusions below are mine, and none of them is quoted.

My answer is that the question is badly posed, because "finance" is several different jobs sold together. Some of those jobs are mechanical: moving an asset, holding it, recording who owns it, quoting a price. Others depend on judgement and on law: deciding who deserves a loan, and forcing someone to honour a promise. DeFi already does much of the first group better. It has almost nothing to offer for the second.

Take the mechanical side first. In a traditional market, agreeing a trade and actually exchanging the asset for the money are two separate events, often a day or two apart, with clearing houses and custodians in between to cover the risk that one side fails in the meantime. On a blockchain the exchange is one operation that either happens entirely or does not happen at all. A whole layer of intermediaries exists to manage a risk that this design removes.

The same goes for transparency. Every loan on a public lending protocol, with its collateral and the price at which it would be liquidated, can be read by anyone at any time. In traditional finance, the total debt of a large borrower across all its lenders is often known to nobody, the lenders included, until the day it fails.

Markets that never close are a third case. A normal exchange needs professional traders willing to quote prices, and they only bother for assets that trade enough to pay them. An automated market maker replaces them with a pool of two assets and a formula that always gives a price. It costs more for large trades, and the people who supply the pool lose out when the price moves sharply, which you can see for yourself in [Pool](/instruments/pool). But for the thousands of small assets no professional would ever quote, it is the only market there is.

The most successful product of all is the simplest one: the stablecoin. A dollar that can be sent to anyone, in any country, on a Sunday, and arrive within minutes is something people want without caring how it works. It is worth noticing what stands behind it, though. The largest stablecoins are claims on ordinary assets held in ordinary institutions. DeFi's best product borrows its credibility from the system it was meant to replace.

Now the other side. Lending is the business of knowing who will repay, and of being able to act when they do not. A protocol that does not know who its borrowers are can do neither. Its solution is to lend only against collateral worth more than the loan, and to sell that collateral automatically if its value falls. That is useful if you own an asset and need cash without selling it. It is not what most of the world means by credit, which is lending to someone whose future income is worth more than what they own today. A young company or a first-time buyer has nothing to offer such a protocol.

Enforcement is the second gap. When a bank transfer goes wrong there is a procedure, a regulator and, in the end, a court. On a blockchain a transaction is final. If funds are stolen through a flaw in a contract, or sent to the wrong address, there is nobody to appeal to, unless a small group holds special powers over the protocol, in which case it was never really decentralised. Given the choice, most people want an institution they can call.

So I do not expect one system to replace the other. I expect the mechanical layer of finance to move onto blockchains, because they do that part better, while the judgement and the legal responsibility stay with institutions that can be held to account. It is already happening from both directions: banks and asset managers are issuing traditional assets on public chains, and protocols are adding identity checks so that institutions are allowed to use them. Over time I expect the word DeFi to matter less, because much of what it describes will simply be how assets are settled.
