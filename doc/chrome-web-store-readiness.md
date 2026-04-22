# Chrome Web Store Readiness

This document captures what is needed to publish `English Sentence Analyzer` to the Chrome Web Store.

## Decision

You do **not** need to provide a separate "Google plugin store skill".

This project is a Chrome extension, not a Codex plugin. For Chrome Web Store publication, what you need is:

- a reviewable extension package
- complete store listing metadata
- privacy disclosures
- screenshots and promo graphics
- reviewer instructions

## Current Product Summary

The extension already has real core functionality:

- analyze selected text on a page
- highlight sentence structure with different colors
- show a simplified main sentence and explanation
- break long clauses into lower-priority support structures
- support short-sentence style rewrites for comprehension-oriented presentation
- save looked-up words in a vocabulary list
- let the user configure AI providers and colors

## Current Submission Risks

These are the main issues likely to block or slow review.

### 1. Localhost-only backend

Current manifest host permission:

- `http://127.0.0.1:8082/*`

Current default endpoint in the extension:

- `http://127.0.0.1:8082`

This is fine for local development, but not acceptable as the real production experience. Before submission, the extension should either:

- point to a deployed HTTPS API, or
- provide a first-run setup flow that reviewers can actually use

### 2. On-page access still requires clear justification

The extension injects its analysis UI into the current page only after the user triggers an action such as:

- clicking the extension
- using the context menu
- selecting text and starting analysis

This is a lower-risk model than a persistent all-pages content script, but the listing, privacy fields, and reviewer notes should still explain that page access is user-triggered and limited to the active tab.

### 3. Privacy disclosures are not yet packaged

The extension processes selected text and can send it to:

- your own NLP backend
- third-party LLM providers configured by the user

That requires accurate privacy fields and a public privacy policy URL.

### 4. Listing assets are incomplete in-repo

The repository has extension icons, but Chrome Web Store publication also needs:

- at least 1 screenshot at `1280x800` or `640x400`
- one small promo tile at `440x280`
- optional marquee image at `1400x560`

### 5. Reviewer setup is not documented in the package

Because the extension depends on an API service, you should give reviewers exact test instructions and, ideally, a working hosted endpoint or a test account/environment.

## Required Launch Materials

Prepare these before submission:

1. Extension ZIP from `extension/`
2. Public privacy policy page
3. Store summary and detailed description
4. Permission justifications for every manifest permission
5. Single-purpose statement
6. Reviewer instructions
7. Screenshots
8. Small promo tile
9. Support URL
10. Homepage URL

## Recommended Pre-Submission Work

### Must fix

- Deploy the API behind HTTPS
- Replace localhost defaults in the release build
- Confirm the final permission set is minimal
- Publish the privacy policy on a public URL
- Create real screenshots and promo graphics

### Should fix

- Add `_locales` if you want localized store listings
- Add an onboarding/help page for first-run setup
- Add a clearer support channel for review and users
- Verify that all data transmission is HTTPS in production

## Privacy Tab Inputs

Use these as the starting point in the Chrome Web Store dashboard.

### Single purpose

`Help non-native English readers understand long English sentences on web pages by splitting sentence structure, highlighting grammar roles, and saving new vocabulary.`

### Permission justifications

- `activeTab`: used to analyze text from the current tab after the user clicks the extension action
- `scripting`: used to inject the analysis UI into the active tab only after the user explicitly triggers the extension
- `contextMenus`: used to add the "Analyze Sentence" right-click action for selected text
- `storage`: used to save vocabulary, color settings, mode preferences, endpoint settings, and provider settings
- host access: used only to send selected text to the StructRead API and receive analysis or word lookup results

## Release Checklist

- Confirm manifest version and extension metadata are final
- Build a release ZIP that contains only the extension files
- Replace dev endpoints with production HTTPS endpoints
- Verify install flow on a clean Chrome profile
- Verify analyze flow on 3 to 5 real pages
- Verify vocab save/export works
- Verify no console errors in popup, content script, or service worker
- Fill in Store Listing, Privacy, Distribution, and Test Instructions tabs
- Submit with deferred publishing enabled

## Repository References

- [manifest.json](/Users/fcihpy/Desktop/fc/english-chrome/extension/manifest.json:1)
- [popup.js](/Users/fcihpy/Desktop/fc/english-chrome/extension/popup/popup.js:1)
- [service-worker.js](/Users/fcihpy/Desktop/fc/english-chrome/extension/background/service-worker.js:1)
- [content.js](/Users/fcihpy/Desktop/fc/english-chrome/extension/content/content.js:1)
