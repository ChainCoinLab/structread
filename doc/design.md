# English Sentence Analyzer - Design Document

## Context
A browser extension for non-native English speakers to analyze complex English sentences. The user selects text on a webpage, clicks "Analyze Sentence", and the extension highlights grammatical components in-place with different colors and shows a structural explanation.

**Architecture: Go API gateway + Python NLP service.** Go handles HTTP/routing/validation, Python handles the AI-powered sentence analysis.

## Request Flow
```
Browser Extension → Go API (:8080) → Python NLP (:8081) → LLM API (OpenAI/Anthropic)
                         ↓                    ↓
                   validation/CORS      prompt + parse + validate offsets
```

## Project Structure
```
english-chrome/
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                  # Popup UI (analyze button, results)
│   ├── content/                # Content script (DOM highlighting + overlay)
│   ├── background/             # Service worker (context menu + API relay)
│   └── icons/
├── server/                     # Go API Gateway
│   ├── main.go
│   ├── handler/analyze.go      # POST /api/v1/analyze
│   ├── model/sentence.go       # Request/response structs
│   ├── config/config.go        # Env var config
│   └── middleware/cors.go
├── nlp/                        # Python NLP Service
│   ├── main.py                 # FastAPI server
│   ├── analyzer.py             # LLM-based sentence analysis
│   ├── models.py               # Pydantic models
│   └── requirements.txt
├── Makefile
└── .gitignore
```

## Data Contract

### Request
```json
POST /api/v1/analyze
{
  "sentence": "The quick brown fox that lives in the forest jumps over the lazy dog."
}
```

### Response
```json
{
  "original": "The quick brown fox that lives in the forest jumps over the lazy dog.",
  "core": {
    "subject": { "text": "fox", "start": 20, "end": 23 },
    "verb": { "text": "jumps", "start": 53, "end": 58 },
    "object": { "text": "dog", "start": 73, "end": 76 }
  },
  "components": [
    {
      "text": "The",
      "role": "determiner",
      "category": "modifier",
      "start": 0,
      "end": 3,
      "modifies": "subject"
    },
    {
      "text": "quick brown",
      "role": "adjective",
      "category": "modifier",
      "start": 4,
      "end": 15,
      "modifies": "subject"
    },
    {
      "text": "fox",
      "role": "subject",
      "category": "core",
      "start": 20,
      "end": 23,
      "modifies": null
    },
    {
      "text": "that lives in the forest",
      "role": "relative_clause",
      "category": "modifier",
      "start": 24,
      "end": 48,
      "modifies": "subject"
    },
    {
      "text": "jumps",
      "role": "verb",
      "category": "core",
      "start": 53,
      "end": 58,
      "modifies": null
    },
    {
      "text": "over the lazy dog",
      "role": "prepositional_phrase",
      "category": "modifier",
      "start": 59,
      "end": 76,
      "modifies": "verb"
    }
  ],
  "core_sentence": "Fox jumps over dog.",
  "explanation": "The core sentence is 'Fox jumps over dog.' The subject 'fox' is modified by adjectives 'quick brown' and a relative clause 'that lives in the forest'. The verb 'jumps' is followed by a prepositional phrase 'over the lazy dog' indicating direction."
}
```

### Component Fields
| Field | Type | Description |
|-------|------|-------------|
| `text` | string | The exact text from the original sentence |
| `role` | string | Grammatical role: subject, verb, object, determiner, adjective, adverb, prepositional_phrase, relative_clause, conjunction, infinitive_phrase, participle_phrase |
| `category` | string | `"core"` or `"modifier"` |
| `start` | int | Start character offset in original sentence |
| `end` | int | End character offset in original sentence |
| `modifies` | string? | Which core element this modifier relates to (null for core elements) |

## Highlight Color Scheme
| Category | Role | Color |
|----------|------|-------|
| Core | subject | Blue (#dbeafe) |
| Core | verb | Green (#dcfce7) |
| Core | object | Orange (#fed7aa) |
| Modifier | adjective/adverb | Purple (#e9d5ff) |
| Modifier | prepositional_phrase | Yellow (#fef9c3) |
| Modifier | relative_clause | Pink (#fce7f3) |
| Modifier | determiner | Gray (#f3f4f6) |

## Key Design Decisions
- **Go API + Python NLP split**: Go handles HTTP concerns (fast, concurrent), Python handles AI/NLP (rich ecosystem, LLM SDKs)
- **LLM for analysis**: more accurate than rule-based, simpler code, negligible cost (<$0.001/req), ~1s latency
- **Character offsets** in response: enables precise in-page highlighting without re-parsing
- **No bundler for extension V1**: plain JS, load as unpacked extension
- **Standard library HTTP** in Go: sufficient for proxying one endpoint

## Future Extensions (not V1)
- Pronunciation and spelling display per word
- Vocabulary database (save/review words)
- Distinguish between linguistic and reading-related core sentences
- Rule-based fast path for simple sentences, LLM fallback for complex ones
