---
title: "How I am using agents - Oct 2026 version"
description: ""
date: "2026-10-26"
tags: ["AI"]
published: true
---

I wrote about [my coding workflow few months ago](/posts/agentic-coding-workflow), while some of the flow remains the same, e.g. using Claude/ChatGPT app for remote coding, kicking off new sessions on local machine or on cloud servers, how I use the models have changed a lot.

I used to have buncha of skills and global rules, that is no longer the case.

# How I have been using agents nowadays

Now I prefer using the latest frontier lab models, e.g. Opus 5.5, GPT Sol 6.1, Astra 6, etc.

I simply prompt and let models do their thing, I have _**stopped prompting how it needs to be done**_, and _**just prompt what needs to be done**_. e.g. improve performance, better UX, what new feature, etc.

I do not use skills like 'Improve codebase', 'make codebase better', etc.

Giving them access to real data, ie. data from how you use the product, not mock stuff, so models get more context and don't make up stuff.

Pointing them to up-to-date docs of the libraries they are using, most libraries have agent friendly docs now.

Letting agents install whatever is needed to test & build the features, give them the full verfication loop. This will lead to much better results and less headaches for human review.

_**Prototype**_: ask to generate 5 or 20 prototypes ‼️ use sites/artifacts and pick one or combine multiple instead of building something then changing/iterating which is much slower.

Always asking them to attach videos/screenshots, ie. real proof of the work which is also for easier human review.

I don't always worry about changing mind mid-session (unless its totally different task), or adding something unrelated, latest models can handle confliting info mid-turn (ie. steering) just fine.