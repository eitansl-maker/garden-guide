# Garden Guide
A free guide to growing vegetables and fruit at home: what to sow now, how much to water, and why. Installable web app (PWA). Hebrew (default) and English, switchable in the app.

Status: draft. Crop content is not yet verified against Israeli sources.

## Tests
`NODE_PATH=$(npm root -g) node tests/smoke.js` runs a Playwright smoke test (he/en, all tabs, log, instructions, diagnosis with a mocked Gemini). Run before every push; bump VER in index.html and the cache name in sw.js.
