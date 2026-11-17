---
title: "I Made a Font From My Handwriting With Claude"
description: "A fun experiment: Claude Fable 5.2 designed a template, I filled it in with a pen, and it turned the scans into a working font in under an hour."
date: "2026-11-16"
tags: ["AI"]
published: true
---

Fun experiment for a Monday night: can an agent turn my handwriting into a real font, with me doing nothing but the handwriting?

Short answer, yes. From the first prompt to an installed font took about 55 minutes, and most of that was me printing pages and writing letters.

I used Claude Fable 5.2 in Claude Code, in an empty folder. This was the whole prompt:

> I would like to create fonts based on my own handwritings. I would upload pictures (or anything else you need to make your job easier) and you will be in charge of creating the actual fonts. let's start. let me know what you'd need from me

No plan, no tools picked, no "use this library". Same as [how I use agents these days](/posts/using-agents-oct-26): say what needs to be done, not how.

## It asked four questions

Before writing any code, Claude asked me four things:

- **How will you write the samples?** Printed template, iPad, or plain paper. I picked the printed template.
- **Which characters?** I picked English letters, digits and punctuation.
- **Print or cursive?** I said both, print first.
- **How natural should repeated letters look?** One version of each letter, or three that the font rotates through. I picked three.

## Then it made a template

Seven minutes in, I had a 4-page PDF to print.

<figure class="my-8">
  <img
    src="/static/images/handwriting-font-template.png"
    alt="Two pages of the empty template: a grid of labelled boxes with guide lines for each character, and a page of sentences to copy on ruled lines. Each page has a black square marker in every corner."
    class="w-full rounded-lg border border-border bg-white"
  />
  <figcaption class="mt-2 text-sm text-muted"><p>The empty template: page 1 of the letter grid, and the natural-writing page.</p></figcaption>
</figure>

It also wrote a test before I had printed anything: render the template, draw fake pen strokes, warp it like a bad phone photo, and check the strokes come back out of the right boxes.

## My part

I printed the pages, filled them in with a black pen, scanned them, and dropped the files into a folder. That's it.

<figure class="my-8">
  <img
    src="/static/images/handwriting-font-filled.jpg"
    alt="The same two template pages filled in by hand with a black pen: three attempts at each letter, and six sentences each written out twice."
    class="w-full rounded-lg border border-border bg-white"
  />
  <figcaption class="mt-2 text-sm text-muted"><p>The same two pages after I was done with them.</p></figcaption>
</figure>

## What it did with the scans

All I said was "Ok I dropped the pdf + images". About 16 minutes later there was a font. In between, Claude:

- **Sorted the pages** using the corner markers. My files were named `PNG image.png` through `PNG image 4.png` and were not in page order.
- **Cut out all 282 samples.** None missing, no rescans.
- **Traced each one** from pixels into smooth outlines and assembled a `.ttf` and a `.woff2`.
- **Wired up the three versions** of each letter so the font cycles through them. The two l's in "hello" are different l's.
- **Measured my spacing** from the natural-writing page: how far apart my letters sit, and how wide my word gaps are (wide, it turns out).
- **Added kerning** by looking at the shapes of the letters, so a pair like "To" tucks together. 2,439 pairs, none typed by hand.

It also caught two things on its own, without me pointing them out.

First, it noticed I wrote letters big to fill the guides, but wrote digits and symbols at my everyday size. So in the first build the numbers were tiny and the letters looked thinner than my real writing. It worked out the right proportions from the natural-writing page, enlarged the digits and symbols by 1.39x, and thickened the letter strokes to match.

Second, one of my three y's had a blot on it from a correction. It spotted the blot, skipped that attempt, and told me.

It also checked its own work instead of asking me to. It rendered test sentences and looked at them, set the font next to my actual handwriting at the same scale, loaded it in a browser to confirm the letter rotation and kerning really work there, and wrote tests that build a whole font from a fake filled-in template.

## The result

Top line of each pair is me with a pen. Bottom line is the font typing the same sentence.

<figure class="my-8">
  <img
    src="/static/images/handwriting-font-comparison.png"
    alt="Four pairs of lines. In each pair the upper line is a scanned handwritten sentence and the lower line is the same sentence typed in the generated font, at the same size."
    class="w-full rounded-lg border border-border bg-white"
  />
  <figcaption class="mt-2 text-sm text-muted"><p>Pen on top, font underneath.</p></figcaption>
</figure>

And this was typed, not written:

<figure class="my-8">
  <img
    src="/static/images/handwriting-font-typed.png"
    alt="Three lines typed in the handwriting font: This sentence was typed, not written. hello balloon coffee mississippi. Room 204, 16 Nov 2026."
    class="w-full rounded-lg border border-border bg-white"
  />
  <figcaption class="mt-2 text-sm text-muted"><p>Repeated letters come out slightly different each time.</p></figcaption>
</figure>

Or type in it yourself. Click the text to edit it, and drag the slider to resize.

<post-demo name="handwriting-font">
Interactive demo: an editable block of text set in the handwriting font, with a slider to change its size. Open the post on saad.sh to use it.
</post-demo>

Or go all in and [read this post in my handwriting](/posts/handwriting-font-with-claude?style=notebook). It's a new look for the site called Notebook, and you can keep it from the Style menu.

## What's not perfect

- The font is tidier than I am. Letters written one per box are more separate than my real writing, where I join things like "Th" and "fo".
- My brackets came out small, because I drew them small in the boxes. Rewriting those few boxes would fix it.

## Under the hood

For the curious, it is all Python: OpenCV to find the markers and separate ink from paper, potrace to turn pixels into curves, fontTools to build the font file and its features, and HarfBuzz to check the result behaves like it would in a real app.

What I like about this one is the split of work. The agent did not try to guess my handwriting from a random photo. It designed a form that makes its own job easy, asked me to do the one thing only I can do, and took it from there.
