---
title: "The bottleneck is physical"
description: "How much AI the world can run is set by power, memory, packaging and networking. Whichever is scarcest decides who earns the most, and it keeps changing."
date: 2026-09-29
lang: en
kind: essay
draft: true
---

When a new AI model is announced, the conversation is about what it can do. I have become more interested in a duller question: how many of these models can be run at the same time, and what stops that number from being larger.

The answer has very little to do with software. A model runs in a data centre, and a data centre is first of all a request for electricity. Its size is fixed by the megawatts it is allowed to draw, and that permission comes from a grid operator who has to build the connection: transformers, a substation, sometimes a new line. A model can be retrained in a few weeks. A grid connection of that size can take years, and no amount of money makes a transformer arrive before a factory has built it.

Power is only the first limit. The processors that do the work need a particular kind of fast memory placed right beside them, and only a handful of companies make it. Chip and memory then have to be assembled together, in a packaging step that used to be an afterthought of the semiconductor industry and now sets how many finished processors leave the factory each month. After that, thousands of those processors have to be wired together so that they behave as one machine, which takes switches, optical links and cabling that are in short supply as well.

So the amount of AI the world can run in a given year is set by whichever of these inputs is scarcest at that moment. Having twice as many chips as you can power gives you nothing extra. I built a small instrument, [Bottleneck](/instruments/bottleneck), to make that visible: it is a barrel whose staves have different heights, and the water stops at the shortest one.

Two things follow from this.

The first is about money. The company that controls the scarce input can raise its prices and choose its customers, because everyone further along the chain is waiting for it. Companies whose input is plentiful have to compete with one another. If you want to know who will earn the most from the growth of AI over the next year, the size of a company tells you less than whether it sits at the tight point.

The second is that the tight point moves. When more packaging capacity comes online, memory becomes the limit. When memory catches up, the grid connection does. Someone who correctly identified the constraint a year ago can be wrong today without any single company having changed much. What changed is the relationship between them.

This is why a list of "AI stocks" is so little help. A list tells you which companies are involved. It cannot tell you which company depends on which, or what happens to one of them when something tightens three steps away. That information is in the links between companies, and a list has no links.

It is also why I built THE ENTITY as a graph. Every company is placed on the part of the chain it supplies or depends on, from power at the bottom to applications at the top, and every dependency is a link. Today that is 835 companies on 80 nodes, joined by 2,808 links, with 624 physical facilities placed on a globe. Every night the whole graph is scored again, to see which part has tightened and where the pressure is likely to go next.

I find this a more useful way to look at AI than demos and share prices. The software is extraordinary. It is also the last step of a very long industrial chain, and the chain decides how fast any of it can grow.
