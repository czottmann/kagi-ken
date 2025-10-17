# AGENTS.md

This file provides guidance to LLM agents when working with code in this repository.

## Project Overview

kagi-ken is a Node.js library that provides programmatic access to Kagi.com services (search and summarizer) using session tokens. It outputs structured JSON matching official API schemas, serving as an alternative to the official Kagi API that requires invite-only API keys.

## Architecture

### Core Structure
- **index.js**: Main entry point exporting `search`, `summarize`, and `SUPPORTED_LANGUAGES`
- **src/search.js**: Kagi search functionality using HTML parsing with Cheerio
- **src/summarize.js**: Kagi summarizer functionality using streaming JSON API
- **src/utils/http.js**: Shared HTTP utilities (USER_AGENT constant)

### Key Design Patterns

#### API Authentication
Both modules use session-based authentication via Cookie headers:
```javascript
headers: {
  "Cookie": `kagi_session=${token}`,
  "User-Agent": USER_AGENT,
}
```

#### Error Handling Strategy
Consistent error handling across both services:
- Parameter validation (type and presence checks)
- Network error detection (`ENOTFOUND`, `ECONNREFUSED`)
- HTTP status code handling (401/403 for auth, others for general errors)
- Parsing error recovery with informative messages

#### Search Result Parsing (src/search.js)
HTML parsing strategy using Cheerio selectors:
- **Main results**: `.search-result` elements → `extractSearchResult()`
- **Grouped results**: `.sr-group .__srgi` elements → `extractGroupedResult()`
- **Related searches**: `.related-searches a span` elements
- Results use type indicator `t: 0` for search results, `t: 1` for related searches

#### Summarizer Streaming (src/summarize.js)
Handles Kagi's streaming response format:
- **URL summarization**: GET request with query parameters
- **Text summarization**: POST request with form data
- **Stream parsing**: Splits by NUL bytes (`\x00`), extracts final JSON message
- **Output extraction**: `output_data.markdown` → `data.output`

### HTTP Endpoints
- **Search**: `https://kagi.com/html/search?q=${query}` (HTML response)
- **Summarizer**: `https://kagi.com/mother/summary_labs` (streaming JSON)

### Dependencies
- **cheerio**: HTML parsing for search results
- **Built-in fetch**: HTTP requests (Node.js 18+ required)

## Development Commands

This is a simple library with no build steps or scripts defined in package.json. Development workflow:

```bash
# Install dependencies
npm install

# Run individual functions (no test suite currently)
node -e "import('./index.js').then(m => console.log(m.SUPPORTED_LANGUAGES))"

# Test search function
node -e "
import('./index.js').then(async m => {
  try {
    const result = await m.search('test query', 'your-token-here');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
  }
});
"

# Test summarizer function
node -e "
import('./index.js').then(async m => {
  try {
    const result = await m.summarize('https://example.com', 'your-token', {
      type: 'summary', language: 'EN', isUrl: true
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err.message);
  }
});
"
```

## Session Token Authentication

Critical for development and testing: Get session tokens from Kagi Settings → Session Link. Extract the `token` value from the URL for use in function calls.

## File Modification Guidelines

### When Modifying Search Logic (src/search.js:59-186)
- **HTML selectors**: Update CSS selectors if Kagi changes their HTML structure
- **Result extraction**: Maintain the `{t: 0, url, title, snippet}` format for API compatibility
- **Error handling**: Follow existing pattern of returning `null` for individual parsing failures

### When Modifying Summarizer Logic (src/summarize.js:149-176)
- **Stream parsing**: The NUL-byte splitting and "final:" prefix handling is critical for response parsing
- **Request format**: URL vs text requests use different HTTP methods and headers
- **Language validation**: Update `SUPPORTED_LANGUAGES` array if Kagi adds new languages

### Adding New Features
- Follow ES modules pattern with named exports
- Add parameter validation at function entry points
- Use consistent error message format
- Export new functions through index.js
- Maintain compatibility with official Kagi API response schemas

## Key Implementation Details

- **ES Modules**: Uses `"type": "module"` in package.json
- **Safari User Agent**: Mimics Safari browser for compatibility
- **Session Authentication**: No API keys needed, uses existing Kagi login session
- **Streaming Response**: Summarizer uses Kagi's streaming protocol with NUL-byte delimiters
- **Error Recovery**: Graceful degradation when parsing individual results fails
