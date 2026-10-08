---
title: "The bottleneck is physical"
description: "AI is capped by power, memory, packaging and networking; pricing power sits at the tightest point, so I mapped the chain as a graph."
date: 2026-09-29
lang: en
kind: essay
draft: true
---

Every frontier model ends up as a load on a substation.

The public story of AI runs on two feeds: model demos and stock tickers. One shows what software can do, the other shows what investors think it is worth. Neither shows how much of it can physically exist. That is settled by physical inputs with long lead times: power, copper, cooling, memory, packaging, optics. A model can be retrained in weeks. A grid connection can take years.

## Where the limit sits

Start with electricity. A data centre is, before anything else, a claim on power. Its size is set by the megawatts it can draw, and those megawatts arrive through a connection the grid operator has to agree to build. Transformers, substations and transmission lines move on utility timelines, with permits and queues. When demand for compute grows faster than the grid can connect new load, the scarce asset stops being the chip and becomes the right to switch it on.

Go one level down, under the processor. An accelerator is only as fast as the memory that feeds it, and the high-bandwidth memory stacked beside the die comes from very few suppliers. Chip and memory then have to be joined by advanced packaging, a step that once sat quietly at the end of the semiconductor chain and now decides how many finished accelerators leave the line. A shortage at either step caps output however many wafers are printed upstream.

Then look sideways. Training a large model means making thousands of chips behave as one machine. That depends on networking: switches, interconnects, optical transceivers, the cabling between racks. A cluster with excellent chips and a weak fabric spends its time waiting. The network is part of the computer, even if nobody puts it in a demo.

None of this appears on stage at a launch. All of it decides what the next launch can be.

## Pricing power follows the tight node

The useful question about any supply chain is where it is tightest, because that is where pricing power sits. A supplier at a constrained step can raise prices, choose its customers and set terms. A supplier at an abundant step competes on cost and hopes for volume.

The difficulty is that the tight node moves. Relieve one constraint and the pressure shifts to the next. More packaging capacity exposes the memory supply. More memory exposes the power connection. More power exposes the transformers, and the skilled crews needed to install them. A view that was right about the bottleneck a year ago can be wrong today without any single input looking different on a screen.

This is why I do not trust lists. A list of AI companies, sorted by size or by theme, tells you who is exposed to the story. It cannot tell you who sits at the constraint, who depends on whom, or what happens to one company when a step three layers away tightens. Those answers live in the relationships between companies, and a list throws the relationships away.

## Why THE ENTITY is a graph

I built THE ENTITY as an institutional-grade map of the AI supply chain, and I built it as a graph because the chain is one. It holds 835 companies across 80 chain nodes, organised in five layers: energy, chips, infrastructure, models and applications. Between them sit 2,808 calibrated links. Beneath them sit 624 geolocated facilities in 74 geographies, because every constraint is a physical place before it is a line in a model.

The method has three steps.

**Map the chain.** Every company is placed at the nodes where it actually operates, and every link records a dependency. The point is to follow a path from an application all the way down to the power it consumes, and to see where many paths pass through the same few suppliers. Those crossings are the chokepoints. The map currently counts 48.

**Follow the money.** The graph also tracks 103 elite funds and scores 92 of them. Positioning is evidence. When serious capital moves towards or away from a node, that tells you something the companies' own announcements will not.

**Run it forward.** Once the structure exists, you can ask what happens if a step gets tighter: which nodes absorb the shock, which companies sit in its path, where the pressure lands next. A list has no way to frame that question. A graph frames it properly, and that is most of the work.

## Accountability over prediction

Anyone can publish a view on where AI is going. Very few publish a record of where they were wrong, and that record is what should earn a reader's trust.

The standard I hold the work to is plain, and THE ENTITY keeps it in public. Every call is recorded the day it is made and graded afterwards, misses included. Every figure says what it is: a fact, an estimate, or the output of a model. Most analysis blends the three into one confident sentence, and the reader cannot tell which part was observed and which part was assumed. Separating them costs almost nothing, and it changes how a number can be used. The 871 narratives in THE ENTITY carry their sources for the same reason.

A forecast that is never scored teaches its author nothing and gives the reader no reason to weight it. A graded record shows where the method holds and where it breaks, and it forces the method either to improve or to admit its limits in the open. I would take a modest record that survives checking over a bold one nobody can check.

Part of this comes from where I trained. In private equity and M&A, a thesis is something you defend in front of people who will hold you to it, with a data room behind every claim. I wanted that discipline applied to a subject that is mostly discussed in headlines.

## The boundary

THE ENTITY shows where the AI supply chain is under pressure, who sits at those points and how the pressure is likely to travel. It does not choose positions for anyone. What a reader does with the map depends on their own mandate, horizon and tolerance for risk, and I have no view on those.

What it offers is a starting point made of megawatts, memory and fibre. The chain will keep moving, and the tight node with it. A map that stands still is just a list.
