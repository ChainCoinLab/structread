# StructRead

StructRead is a Chrome extension for non-native English readers. It helps users understand long English sentences by extracting the main sentence, highlighting sentence structure, unpacking supporting clauses, and saving vocabulary while reading.

## Repo Layout

- `extension/` — Chrome extension source
- `server/` — Go API gateway
- `nlp/` — Python NLP service
- `site/` — simple landing page and privacy policy
- `assets/store/` — Chrome Web Store visual assets

## Current Packaging

The uploadable extension package is built from `extension/` only. The repository also includes Chrome Web Store listing copy, reviewer notes, and privacy materials under `doc/`.
