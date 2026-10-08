---
name: KEPLUM
line: A concept for cutting what applications pay to call large language models.
role: Author
status: Concept
since: 2025
tier: lab
order: 3
facts:
  - value: "3"
    label: levers under study, token reduction, caching and routing
  - value: Prepaid
    label: credits as the intended billing model
---

KEPLUM is a concept I am studying, not a product. The question behind it is simple: an application that calls large language models pays for every token, and much of that spend is avoidable.

## The idea

Three levers, applied before a request reaches a model:

- **Token reduction.** Send the model what it needs to answer and nothing more.
- **Prompt caching.** Reuse the parts of a prompt that repeat between calls instead of paying for them each time.
- **Routing.** Send each request to the cheapest model that can answer it well, and keep the expensive ones for the requests that need them.

## How it would be sold

As prepaid credits, so a team knows its spend before it happens.

## Where it stands

KEPLUM came out of the same habit as THE ENTITY: reading AI as infrastructure with real costs. For now it is a concept under study, kept here because it is part of the work.
