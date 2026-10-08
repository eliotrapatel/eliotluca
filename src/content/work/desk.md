---
name: The Desk
line: A local BTC/USDT trading desk for studying short-horizon markets and autonomous agents.
role: Builder
status: Prototype
visible: false
since: 2025
tier: lab
order: 4
facts:
  - value: BTC/USDT
    label: live Binance feed
  - value: 30, 60, 90 s
    label: position lengths
  - value: SQLite
    label: accounts and persistent storage
---

The Desk is a research prototype that runs on my own machine. I built it to study two things up close: how a market behaves over a few seconds, and how an autonomous agent behaves when it has to act inside one. It is not an investment product and gives no advice.

## What it does

The Desk reads a live BTC/USDT feed from Binance and lets a trader open positions that last 30, 60 or 90 seconds. Accounts and every position are kept in SQLite, so a session can be stopped, resumed and examined afterwards.

## The agent

The part I care most about is an agent that trades on market data and news without manual input. Watching it is a useful way to learn where an agent's judgement holds and where it does not, on a timescale short enough to see the result of each decision.

## Why it is here

It is a prototype and I treat it as one. It belongs on this page because it is where I test ideas about markets and agents before they go anywhere else.
