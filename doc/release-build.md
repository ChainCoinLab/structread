# Release Build

Use this flow to produce a Chrome Web Store release package without changing the development defaults.

## Development Behavior

The source extension continues to default to:

- `http://127.0.0.1:8082`

That keeps local development unchanged.

## Release Build Command

Run:

```bash
make extension-release ESA_API_ORIGIN=https://your-production-api.example.com
```

This generates:

- `dist/extension-release/`
- `dist/english-sentence-analyzer.zip`

## What The Release Build Changes

The release builder rewrites only the generated package:

- `manifest.json` host permissions are set to `https://.../*`
- `shared/runtime-config.js` is set to the production API origin

The checked-in source under `extension/` remains on localhost defaults for development.

## Submission Requirements

Before uploading the ZIP to the Chrome Web Store:

- use a real HTTPS API origin
- confirm the production API is reachable by reviewers
- verify analysis and vocabulary features against the generated package
- ensure your privacy policy and reviewer notes match the production backend behavior
