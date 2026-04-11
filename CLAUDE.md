# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

English Sentence Analyzer — a Chrome extension that helps non-native English speakers understand complex sentence structures. Users select text on a webpage, click "Analyze Sentence", and see grammatical components highlighted in different colors with a structural explanation.

## Architecture

Three-tier monorepo: Chrome Extension → Go API Gateway (:8080) → Python NLP Service (:8081) → LLM API

- `extension/` — Chrome Extension (Manifest V3), plain JavaScript, no build step
- `server/` — Go API gateway using standard library `net/http` (Go 1.22+ method routing), no frameworks
- `nlp/` — Python FastAPI service that calls an LLM for sentence analysis
- `doc/` — Design documentation

## Development Commands

```bash
# Go API gateway
cd server && go run .                    # Start on :8080
cd server && go build -o ../bin/server . # Build binary
cd server && go test ./...               # Run tests

# Python NLP service
cd nlp && pip install -r requirements.txt  # Install deps
cd nlp && uvicorn main:app --port 8081 --reload  # Start on :8081

# Or use Makefile
make server-run    # Start Go server
make nlp-run       # Start Python NLP service
make server-test   # Run Go tests
```

## Chrome Extension Loading

Load `extension/` as an unpacked extension at `chrome://extensions` with Developer Mode enabled. After code changes, click the reload button on the extension card.

## Key Data Contract

`POST /api/v1/analyze` accepts `{"sentence": "..."}` and returns components with character offsets (`start`/`end`) for in-page highlighting. The `category` field is either `"core"` or `"modifier"`. See `doc/design.md` for the full response schema.

## Environment Variables

- `PORT` — Go server port (default: 8080)
- `NLP_SERVICE_URL` — Python service URL (default: http://localhost:8081)
- `LLM_API_KEY` — OpenAI API key (required for NLP service)
- `LLM_MODEL` — LLM model name (default: gpt-4o-mini)
- `LLM_BASE_URL` — Custom LLM API base URL (optional)

## Code Conventions

- Go: standard library only, no external dependencies
- Python: FastAPI + Pydantic, async OpenAI client
- Extension: plain JS, all CSS classes use `esa-` prefix to avoid page style conflicts
- Content script highlighting uses character offsets from the API response to wrap text in colored `<span>` elements
