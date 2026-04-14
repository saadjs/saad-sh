---
name: content-style
description: Write, edit, and review blog content for saad.sh. Use this whenever the user asks to draft or revise a post, title, metadata, outline, intro, examples, references, or editorial feedback for content in content/posts/, even if they only say "make this sound like my blog" or "review this article."
compatibility:
  tools:
    - view
    - rg
---

# saad.sh Content Style

Use this skill for **writing and reviewing technical blog content** for this repository.

The target is not generic "developer writing." The target is the voice already present in `content/posts/*.mdx`: concise, practical, technically grounded, and easy to scan.

Before writing or reviewing, inspect the relevant existing posts in `content/posts/` and check `site.config.ts` if you need project context.

## What good saad.sh writing feels like

Bias toward the **newer voice** in posts like:

- `how-to-save-tokens.mdx`
- `share-to-llms-with-query.mdx`
- `automate-git-github-workflow-with-agent-skills.mdx`
- `agentic-coding-workflow.mdx`
- `building-personal-ai-assistant.mdx`

That voice is:

- direct and calm
- technical without sounding academic
- practical before performative
- opinionated when useful, but not loud
- written for engineers who want the point quickly

Older posts in the archive are often shorter and more tutorial-like. Keep their practicality, but prefer the tighter structure and cleaner phrasing from the newer posts.

## Core style rules

### 1. Start with the point

Open with the main idea, not a warm-up.

Good opening moves:

- state the problem plainly
- explain the key distinction
- summarize the useful mental model
- say what the workflow/tool/pattern enables

Avoid generic introductions like:

- "In today's fast-paced world..."
- "If you've ever wondered..."
- "Let's dive in"
- "This comprehensive guide..."

### 2. Prefer explanation over hype

The writing should sound like an experienced engineer explaining something to another engineer.

Prefer:

- "That detail matters for two reasons"
- "A simple way to think about it"
- "That is the core idea"
- "In practice, that often looks like this"

Avoid exaggerated language unless the post is intentionally personal or opinionated.

### 2a. Avoid AI writing tells

This blog should sound like it was written by a competent engineer, not generated. Watch for these patterns:

**Vocabulary to avoid:**
Inflated or LLM-typical words: delve, tapestry, ecosystem (when metaphorical), showcase, seamless, robust, leverage (verb), utilize, empower, foster, facilitate, synergy, holistic, groundbreaking, cutting-edge, innovative, transformative, multifaceted, nuanced, paradigm shift, unpack, navigate, vibrant, resonate, crucial, diverse, vital, comprehensive, exhaustive, meticulous, in-depth, spearhead, revolutionize, streamline, dynamic, enhance, underscore.

**Copula avoidance:**
Replacing simple "is" and "has" with fancier verbs reads as AI. Prefer direct language.

- Avoid: "The tool serves as a hub", "features an elegant design", "boasts powerful features"
- Use: "The tool is a hub", "has an elegant design", "has powerful features"

**Generic patterns to cut:**

- "Rule of three" rhythms: "efficiency, excellence, and empowerment" (when artificial)
- Synonym cycling: don't rotate between "the method", "the approach", "the technique" — pick one word and repeat it
- False ranges: "from small startups to Fortune 500 companies" — say exactly what you mean instead
- Vague attributions: avoid "experts say", "studies show", "industry reports suggest" without naming the source

**Filler to trim:**

- "In order to" → "To"
- "Due to the fact that" → "Because"
- "It is important to note that" → restructure or cut
- "At this point in time" → "Now"

**Hedging to eliminate:**
Stacked uncertainty modifiers ("could potentially possibly") — pick one qualifier or commit to a claim.

**Promotional language to replace:**

Words like "stunning", "enchanting", "charming", "breathtaking", "vibrant", "thriving" — use specific facts instead. "Open since 1987" beats "the charming café."

**Endings to avoid:**

- "The future looks bright"
- "Exciting times ahead"
- "Only time will tell"
- Generic feel-good closings

Finish on something concrete: a specific implication, next step, or open question.

### 3. Keep paragraphs short

Most paragraphs should be 1-4 sentences.

Long sections should be broken with:

- descriptive headings
- bullets
- small code examples
- short contrast blocks

### 4. Make sections earn their place

Every section should do one job:

- explain a concept
- show an example
- compare approaches
- give a workflow
- add a caveat

If a section only restates the previous one in softer words, cut it.

### 5. Use bullets for scanability

This blog regularly uses bullets for:

- short lists of reasons
- workflow steps
- tool capabilities
- tradeoffs
- practical takeaways

Bullets should be compact and parallel in shape.

### 6. Be specific

Prefer concrete nouns, APIs, commands, and file paths over vague phrasing.

Prefer:

- `TransformStream`
- `encodeURIComponent`
- `gh pr checkout`
- `content/posts/*.mdx`

Over:

- "some streaming utility"
- "an encoding helper"
- "GitHub command"

### 7. Use light personality, not filler

A little personality is good. Generic padding is not.

Allowed:

- a brief opinion
- a practical aside
- a short first-person note when it adds credibility

Avoid padded endings and chatbot artifacts like:

- "I hope this article helped" or "I hope this helps!"
- "the possibilities are endless"
- "Feel free to reach out"
- "Let me know if you have questions"
- "Happy Coding!" unless the user explicitly wants the older archive tone

## Common post shapes

Pick the shape that matches the topic instead of forcing every post into the same mold.

### Quick tip

Best for narrow coding fixes or command-line answers.

Typical flow:

1. one-line setup or problem statement
2. code or command
3. brief explanation
4. one caveat if needed

Keep it short.

### Explainer

Best for patterns, concepts, or API behavior.

Typical flow:

1. direct opening
2. define the concept
3. explain why it matters
4. show examples
5. end with the rule of thumb

### Workflow / tooling note

Best for AI, Git, terminal, or personal setup posts.

Typical flow:

1. what the workflow/tool does
2. the principles behind it
3. concrete examples or commands
4. tradeoffs / guardrails
5. a short conclusion if needed

## Titles

Titles on this blog are practical and search-friendly.

Common patterns:

- `How to ...`
- `Validate ... with ...`
- `Share ... using ...`
- `Avoid bugs when using ...`
- `My ... workflow`

Prefer titles that clearly name:

- the tool or framework
- the task
- the pattern or outcome

Avoid vague or clever-only titles.

## Metadata guidance

Every post should match the MDX metadata shape used by this repo:

```ts
export const metadata = {
  title: "...",
  description: "...",
  date: "YYYY-MM-DD",
  tags: ["..."],
  published: true,
};
```

### Description

Descriptions should be:

- one sentence
- concrete
- useful in previews/search
- aligned with the body, not broader than it

Good descriptions usually describe the exact task, pattern, or benefit.

### Tags

Reuse existing tags when possible. The archive contains mixed casing (`AI` and `ai`, `Javascript` and `javascript`, `docker` and `postgres`), so do not invent a global normalization rule inside a single post. Instead:

1. inspect adjacent or related posts
2. prefer the most established local convention for that topic
3. keep the tag list short

## Structure and formatting

### Headings

Use headings to make the article skimmable.

Good headings:

- explain what the section answers
- are concrete
- often read like claims or tasks

Examples:

- `## What "stateless" means`
- `## Build the URL in one line`
- `## The useful rule`

### Code blocks

Code should be:

- minimal
- correct
- relevant to the point being made

Prefer short examples over giant dumps unless the post is explicitly a walkthrough.

When helpful, label files inside code comments like:

```ts
// File: src/agent.ts
```

### Images

Use images only when they add real value:

- architecture diagrams
- screenshots
- comparison visuals
- animated demos

Do not add decorative images.

## Technical rigor

### Explain the why

Do not only present steps. Explain the reason behind them, especially when:

- comparing two approaches
- warning about a pitfall
- recommending a workflow
- describing model or framework behavior

### Separate facts from preference

Be clear whether something is:

- platform behavior
- a personal workflow
- a recommendation
- a tradeoff

For personal workflow posts, first-person language is good when it is genuinely personal:

- "I built these 3 skills..."
- "I almost always start in plan mode."

### Add caveats when they matter

A short caveat is better than pretending a pattern is universal.

Examples:

- older/newer API differences
- pricing or provider behavior changing over time
- when a pattern is good, but not always right

### Use references selectively

For posts with claims about models, APIs, platform behavior, or external tools, add a short `## Sources` or `## References` section with links.

For small self-contained tips, references are optional.

## Review checklist

When reviewing draft content, check for these issues:

1. **Weak opening**: Does the post delay the point?
2. **AI-sounding filler**: Are there generic transitions, padded conclusions, or hype?
3. **Low information density**: Can two paragraphs become one?
4. **Missing concrete detail**: Are commands, APIs, filenames, or examples too vague?
5. **Poor structure**: Would headings or bullets make it easier to scan?
6. **Unclear claim type**: Is the draft mixing facts, opinions, and recommendations without signaling which is which?
7. **Missing caveat**: Is there an important tradeoff or limitation that should be stated?
8. **Weak metadata**: Does the title/description overpromise or underspecify the topic?
9. **Tag drift**: Are tags unnecessarily novel or inconsistent with nearby posts?
10. **Bloated ending**: Can the conclusion be cut down to a short rule, takeaway, or final note?
11. **AI vocabulary tells**: Are there inflated words (seamless, robust, revolutionary) or LLM-typical phrases that should be replaced with direct language?
12. **Copula avoidance**: Are simple verbs ("is", "has") being replaced with fancier ones for no reason?
13. **Vague attributions**: Are claims backed by unnamed sources ("experts say", "studies show") that need specificity?
14. **Hedging overload**: Are there stacked qualifiers ("could potentially") that need commitment?
15. **Generic conclusions**: Does the post end on a concrete point or drift into "bright future" clichés?

When giving feedback, be concrete. Prefer:

- "Cut the first two paragraphs and start at the distinction between X and Y."
- "Rename this heading to match the actual takeaway."
- "Add one example showing the failure mode."

Over:

- "Make it punchier"
- "Needs more clarity"

## Writing workflow

When asked to draft a post for this repo:

1. Inspect 2-4 related posts in `content/posts/`.
2. Identify the closest post shape: quick tip, explainer, or workflow note.
3. Draft metadata first.
4. Write the opening so the main point appears immediately.
5. Add only the sections needed to support the claim.
6. Include examples, commands, or code where they clarify the point.
7. Trim filler and repetitive conclusions.
8. Review against the checklist above.

## Output expectations

If the user asks for a **new post**, produce a full MDX draft with metadata.

If the user asks for a **rewrite**, keep the technical meaning but tighten the language toward this house style.

If the user asks for a **review**, return:

1. a short verdict
2. the most important issues
3. concrete edits or a revised version

The main job is to preserve the blog's voice: practical, technically specific, concise, and written like a clear note from an engineer who has already done the thing.
