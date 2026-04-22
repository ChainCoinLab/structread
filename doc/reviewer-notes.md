# Chrome Web Store Reviewer Notes

Use this in the "Test instructions" section of the Chrome Web Store dashboard.

## Product Purpose

StructRead helps non-native English speakers understand long English sentences on web pages. The extension analyzes user-selected text, extracts the main sentence, weakens lower-priority modifiers visually, and can unpack longer clauses into smaller readable ideas.

## Core User Flow

1. Open any English article or page with long sentences.
2. Select a sentence or short paragraph.
3. Use either:
   - the extension popup and click `Analyze Sentence`, or
   - the right-click context menu item `Analyze Sentence`, or
   - the floating action that appears after text selection
4. The extension sends only the user-selected text for analysis.
5. The page shows:
   - the main sentence core
   - highlighted sentence components
   - secondary structure blocks for longer clauses or support details
   - short-sentence rewrites for easier reading

## Why Page Access Is Needed

The extension must access the current page in order to:

- read only the text the user selects
- inject highlighting into the selected page content
- display the sentence explanation overlay next to the selection

The extension is user-invoked. It uses active-tab access and on-demand script injection after the user starts an action. It is not intended to silently analyze pages in the background.

## Stored Data

The extension stores the following in `chrome.storage.local`:

- vocabulary list
- reading mode
- highlight colors
- provider configuration
- active provider selection
- endpoint configuration

## External Services

The extension can call a backend analysis service for:

- sentence analysis
- word lookup

It can also use user-configured third-party AI providers for sentence analysis.

## Reviewer Environment

Before submission, replace these placeholders with your actual review setup:

- Production extension endpoint: `[TODO: HTTPS endpoint]`
- Support contact: `[TODO: support email or URL]`
- Demo page: `[TODO: test article URL]`
- Optional reviewer account or key: `[TODO: if required]`

## Recommended Reviewer Test Cases

Sentence example 1:

`The experienced researchers at the university, who had spent years studying language acquisition, developed a practical method that helps non-native readers understand complex English sentences more quickly.`

Expected result:

- the main sentence is visible as `Researchers developed a practical method`
- the relative clause and `that` clause are shown as secondary structure
- the supporting clauses can be understood as separate short ideas

Sentence example 2:

`Although the committee had already approved the proposal, several members who had previously remained silent began raising concerns about its long-term cost.`

Expected result:

- the main sentence is visible as `Several members began raising concerns`
- the opening clause and relative clause are lower-emphasis support structures
- the user can understand the sentence as multiple smaller ideas

Sentence example 3:

`Many students find the writing style used in academic articles difficult because the main idea is often hidden inside long sentences with several layers of modifiers.`

Expected result:

- the product shows that the sentence is not only color-labeled
- the cause clause is separated from the main sentence
- the explanation reinforces the reading-comprehension use case

Word lookup example:

- select `committee`
- confirm the word popup appears
- confirm the word can be saved into vocabulary

## Important Pre-Submission Note

The development repository currently uses localhost defaults. Those must be replaced or fully documented in the submitted build so reviewers can test the extension without local setup.
