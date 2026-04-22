# Chrome Store Screenshot Script

This document turns the product story into a concrete screenshot script for the Chrome Web Store listing of `StructRead`.

## Goal

Each screenshot must answer one clear user question in under 2 seconds.

The five questions are:

1. What does this extension do?
2. How does it show the sentence core?
3. How does it unpack long clauses?
4. Does it help with vocabulary too?
5. Can I customize it?

## Shared Rules

Use these rules across the full screenshot set:

- canvas: `1280x800`
- brand name shown as `StructRead`
- use real-looking product UI, not poster art
- keep captions short
- one message per screenshot
- do not overload with long paragraphs
- use the same three representative demo sentences throughout the full set

## Screenshot 1

### Filename

- `screenshot-1-before-analysis.png`

### Product question

- `What does this extension do?`

### Demo sentence

`The experienced researchers at the university, who had spent years studying language acquisition, developed a practical method that helps non-native readers understand complex English sentences more quickly.`

### Scene

- show an article-style reading page
- the full long sentence is selected
- the StructRead popup is open
- the `Analyze Sentence` button is visible

### Caption

- `Select a long sentence on any page`

### What the user should understand immediately

- this works directly on normal web pages
- the workflow starts from selected text

## Screenshot 2

### Filename

- `screenshot-2-structure-highlight.png`

### Product question

- `How does it show the sentence core?`

### Demo sentence

Use the same sentence as Screenshot 1.

### Scene

- the sentence is now analyzed
- the main subject phrase is clearly highlighted
- the main verb is clearly highlighted
- the main object is clearly highlighted
- non-core parts are visible but weaker

### Caption

- `See the main sentence first`

### What the user should understand immediately

- StructRead extracts the core sentence
- the main idea becomes visually obvious

### Mandatory visible elements

- strong subject / verb / object emphasis
- weaker relative clause and support detail styling

## Screenshot 3

### Filename

- `screenshot-3-learning-mode.png`

### Product question

- `How does it unpack long clauses?`

### Demo sentence

`Although the committee had already approved the proposal, several members who had previously remained silent began raising concerns about its long-term cost.`

### Scene

- Learning mode is active
- the overlay shows three layers:
  - main sentence
  - secondary structure
  - short-sentence rewrites
- non-core clauses are visible in lower emphasis
- the rewrites are easy to scan

### Caption

- `Unpack long clauses into smaller ideas`

### What the user should understand immediately

- StructRead does more than color labeling
- long clauses become short readable meaning units

### Mandatory visible elements

- `Main sentence`
- `Secondary structure`
- `Short-sentence rewrites`

## Screenshot 4

### Filename

- `screenshot-4-word-lookup-vocabulary.png`

### Product question

- `Does it help with vocabulary too?`

### Demo sentence

Use a word from the reading context such as:

- `acquisition`
- `proposal`
- `modifiers`

### Scene

- selected word popup is visible
- one or more definitions are shown
- the save-to-vocabulary state is visible
- vocabulary list is also visible in the popup or extension panel

### Caption

- `Save new words while you read`

### What the user should understand immediately

- the extension supports vocabulary building during reading
- it is not only a sentence parser

## Screenshot 5

### Filename

- `screenshot-5-settings.png`

### Product question

- `Can I customize it?`

### Demo sentence

Optional background sentence:

`Many students find the writing style used in academic articles difficult because the main idea is often hidden inside long sentences with several layers of modifiers.`

### Scene

- settings panel is expanded
- reading mode toggle is visible
- highlight color controls are visible
- AI provider section is visible
- the layout feels configurable but simple

### Caption

- `Adapt StructRead to your study style`

### What the user should understand immediately

- users can switch reading modes
- users can adjust colors
- users can connect different AI providers

## Narrative Order

The five screenshots should tell this exact story:

1. select a hard sentence
2. reveal the main sentence
3. unpack long clauses further
4. collect vocabulary while reading
5. personalize the experience

## Caption Set

Use this exact caption set unless a later design pass improves it:

- `Select a long sentence on any page`
- `See the main sentence first`
- `Unpack long clauses into smaller ideas`
- `Save new words while you read`
- `Adapt StructRead to your study style`

## Review Standard

Reject a screenshot if:

- the main message is not obvious within 2 seconds
- the sentence structure is visible but not understandable
- the screenshot looks like an abstract ad rather than software
- too much text competes with the UI
- the long sentence is not actually representative

## Alignment With Reviewer Notes

When reviewers test the extension, they should see the same sentence styles and same user flow described in this screenshot set. Keep the public screenshots and reviewer demo story aligned.
