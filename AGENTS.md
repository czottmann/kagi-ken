# AGENTS.md

This file provides guidance to LLM agents when working with code in this repository.

## Project

kagi-ken is a Node.js (>=22) ES module library providing access to Kagi.com search and summarizer via session tokens. It parses Kagi's web interface (HTML for search, streaming JSON for summarizer) and outputs structured JSON matching official API schemas. Forked from `czottmann/kagi-ken`.

## Commands

No build steps, test suite, or linter. Manual testing only:

```bash
npm install
node -e "import('./src/index.js').then(m => console.log(m.SUPPORTED_LANGUAGES))"
```

Session token is required for live testing. Get tokens from Kagi Settings → Session Link.

## Architecture

- `src/index.js` — re-exports public API: `search`, `summarize`, `SUPPORTED_LANGUAGES`
- `src/search.js` — HTML parsing with Cheerio CSS selectors against `kagi.com/html/search`
- `src/summarize.js` — streaming response parser against `kagi.com/mother/summary_labs`
- `src/utils/http.js` — shared `USER_AGENT` constant (Safari)
- Single dependency: `cheerio`

### API Authentication

Both modules use session-based authentication via Cookie headers:
```javascript
headers: {
  "Cookie": `kagi_session=${token}`,
  "User-Agent": USER_AGENT,
}
```

### Error Handling Strategy

Consistent error handling across both services:
- Parameter validation (type and presence checks)
- Network error detection (`ENOTFOUND`, `ECONNREFUSED`)
- HTTP status code handling (401/403 for auth, others for general errors)
- Parsing error recovery with informative messages

### Search Result Parsing (src/search.js)

HTML parsing strategy using Cheerio selectors:
- **Main results**: `.search-result` elements → `extractSearchResult()`
- **Grouped results**: `.sr-group .__srgi` elements → `extractGroupedResult()`
- **Related searches**: `.related-searches a span` elements
- Results use type indicator `t: 0` for search results, `t: 1` for related searches
- These selectors are brittle and break when Kagi changes their markup

### Summarizer Streaming (src/summarize.js)

Handles Kagi's streaming response format:
- **URL summarization**: GET request with query parameters
- **Text summarization**: POST request with form data
- **Stream parsing**: Splits by NUL bytes (`\x00`), scans backwards for `new_message.json:` (current) or `final:` (legacy) prefixed messages, strips prefix, parses JSON
- **Output extraction**: Fields tried in order: `md` → `reply` → `output_data.markdown`

## File Modification Guidelines

### When Modifying Search Logic (src/search.js)
- **HTML selectors**: Update CSS selectors if Kagi changes their HTML structure
- **Result extraction**: Maintain the `{t: 0, url, title, snippet}` format for API compatibility
- **Error handling**: Follow existing pattern of returning `null` for individual parsing failures

### When Modifying Summarizer Logic (src/summarize.js)
- **Stream parsing**: The NUL-byte splitting and prefix handling is critical for response parsing
- **Request format**: URL vs text requests use different HTTP methods and headers
- **Language validation**: Update `SUPPORTED_LANGUAGES` array if Kagi adds new languages

### Adding New Features
- Follow ES modules pattern with named exports
- Add parameter validation at function entry points
- Use consistent error message format
- Export new functions through index.js
- Maintain compatibility with official Kagi API response schemas

## Companion Project

[kagi-ken-mcp](https://github.com/rnavarro/kagi-ken-mcp) is the MCP server that wraps this library. It depends on this package via `github:rnavarro/kagi-ken`. Changes here require updating and pushing the MCP server's lockfile.
