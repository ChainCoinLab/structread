# Store Assets Production

This document defines the first production-ready asset set for Chrome Web Store submission for `StructRead`.

## Asset Package

Prepare this exact set:

1. `icon-128.png`
2. `screenshot-1-before-analysis.png`
3. `screenshot-2-structure-highlight.png`
4. `screenshot-3-learning-mode.png`
5. `screenshot-4-word-lookup-vocabulary.png`
6. `screenshot-5-settings.png`
7. `promo-tile-440x280.png`
8. `marquee-1400x560.png`

## Visual System

Use this visual system consistently across screenshots and promo graphics.

- brand name: `StructRead`
- headline style: short, direct, no marketing fluff
- background: light, clean, academic
- accent colors:
  - subject: `#bfdbfe`
  - verb: `#fecaca`
  - object: `#bbf7d0`
  - attributive: `#a78bfa`
  - adverbial: `#fb923c`
  - weak modifier: `#d1d5db`

## Demo Sentence

Use this sentence consistently for screenshots 1 to 3:

`Although the committee had already approved the proposal, several members who had previously remained silent began raising concerns about its long-term cost.`

Expected visible structure:

- subject: `several members`
- verb: `began raising`
- object: `concerns`
- modifiers:
  - `Although the committee had already approved the proposal`
  - `who had previously remained silent`
  - `about its long-term cost`

## Screenshot Plan

### Screenshot 1

Filename:

- `screenshot-1-before-analysis.png`

Purpose:

- show the natural reading context before the extension acts

Canvas:

- `1280x800`

Content:

- an article-like page with one long English sentence selected
- the StructRead popup visible
- the `Analyze Sentence` button visible and ready

Optional caption text inside the screenshot:

- `Select a long sentence on any page`

### Screenshot 2

Filename:

- `screenshot-2-structure-highlight.png`

Purpose:

- show the clearest value proposition immediately

Canvas:

- `1280x800`

Content:

- the same sentence after analysis
- subject / verb / object visibly highlighted
- modifiers visually separated
- the structure legend visible

Optional caption text inside the screenshot:

- `See the sentence core at a glance`

### Screenshot 3

Filename:

- `screenshot-3-learning-mode.png`

Purpose:

- show explanation and learning value

Canvas:

- `1280x800`

Content:

- Learning mode active
- explanation panel visible
- core sentence visible
- legend and overlay in a readable position

Optional caption text inside the screenshot:

- `Learn how the sentence is built`

### Screenshot 4

Filename:

- `screenshot-4-word-lookup-vocabulary.png`

Purpose:

- show vocabulary feature, not only parsing

Canvas:

- `1280x800`

Content:

- selected word popup visible
- one or more definitions shown
- popup text showing the word saved to vocabulary
- popup or side view showing the vocabulary list

Optional caption text inside the screenshot:

- `Save new words while you read`

### Screenshot 5

Filename:

- `screenshot-5-settings.png`

Purpose:

- show customization and AI capability

Canvas:

- `1280x800`

Content:

- settings panel expanded
- mode switch visible
- color customization visible
- model provider section visible

Optional caption text inside the screenshot:

- `Adapt StructRead to your study style`

## Promo Tile

Filename:

- `promo-tile-440x280.png`

Canvas:

- `440x280`

Primary headline:

- `Understand English by Structure`

Composition:

- one long sentence broken into colored blocks
- one compact explanation card
- brand name `StructRead`
- no crowded UI chrome

Do not include:

- too many feature bullets
- small unreadable labels
- too much browser chrome

## Marquee

Filename:

- `marquee-1400x560.png`

Canvas:

- `1400x560`

Primary headline options:

- `Understand Long English Sentences Faster`
- `Read English by Structure, Not Guesswork`

Composition:

- panoramic layout
- sentence structure transforms from dense text into clear color-coded parts
- one refined UI card or explanation panel
- keep text minimal

## Recommended In-Image Copy

Keep text short. Use at most one line per image.

Suggested lines:

- `Select a long sentence on any page`
- `See the sentence core at a glance`
- `Learn how the sentence is built`
- `Save new words while you read`
- `Adapt StructRead to your study style`

## Asset Generation Order

Generate in this order:

1. icon
2. promo tile
3. screenshot key visual direction
4. marquee
5. final screenshot set

## Quality Standard

Reject an asset if:

- text is too small to read
- too many colors compete at once
- it looks like a generic AI education ad
- it does not visually communicate sentence structure within 2 seconds
- the brand name is weak or missing

## Ready-To-Use Prompt Set

### Prompt A: screenshot key visual

`Create a polished educational product screenshot for a Chrome extension named StructRead. Show a clean desktop browser page with a long English sentence analyzed into colored structure segments. Subject is blue, verb is coral, object is green, modifiers are purple, orange, and soft gray. A floating explanation card shows a simple core sentence and short explanation. Use a bright, refined, professional interface with strong readability and realistic UI composition.`

### Prompt B: promo tile

`Create a 440x280 Chrome Web Store promo tile for StructRead. Show a long English sentence transformed into color-coded structure blocks with a compact explanation panel. Use a bright editorial layout, modern educational product style, restrained UI, and the headline "Understand English by Structure". Include the StructRead brand name.`

### Prompt C: marquee

`Create a 1400x560 Chrome Web Store marquee image for StructRead. Show dense English text becoming visually understandable through structure highlighting and a clean explanation card. Use a premium educational SaaS aesthetic, bright background, strong composition, and minimal text. Headline: "Understand Long English Sentences Faster".`
