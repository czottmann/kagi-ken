# kagi-ken

A lightweight Node package that provides programmatic access to Kagi.com services using session tokens:

- **Search**: Searches Kagi.com and returns structured JSON data matching Kagi's official search API schema
- **Summarizer**: Uses Kagi's Summarizer to create summaries from URLs or text content

Unlike the official Kagi API which requires API access, this package uses your existing Kagi session to access both search and summarization features programmatically.

_"Kagi-ken"_ is a portmanteau of _"Kagi"_ (the service) and _"token"_.

## Why?

The [Kagi API](https://help.kagi.com/kagi/api/overview.html) requires a separate API key, which are invite-only at the moment. If you already have a Kagi subscription and want to programmatically access Kagi's services from your applications, this package provides an alternative by:

- Using your existing Kagi session token (no additional API costs)
- Parsing Kagi's HTML search results into structured JSON (matching official API format)
- Accessing Kagi's Summarizer for URL and text summarization
- Providing a clean JavaScript API for both services

## Installation

```bash
npm install czottmann/kagi-ken#1.3.0
```

## Usage

```javascript
import { search, summarize, SUPPORTED_LANGUAGES } from 'kagi-ken';

// Search example
const searchResults = await search('steve jobs', 'your-session-token');
console.log(searchResults);

// Summarize URL example
const urlSummary = await summarize(
  'https://en.wikipedia.org/wiki/Steve_Jobs',
  'your-session-token',
  { type: 'summary', language: 'EN', isUrl: true }
);
console.log(urlSummary);

// Summarize text example
const textSummary = await summarize(
  'Long article content...',
  'your-session-token',
  { type: 'takeaway', language: 'DE', isUrl: false }
);
console.log(textSummary);
```

## API

### `search(query, token)`

Performs a search on Kagi.com and returns structured results.

**Parameters:**
- `query` (string) - Search query to execute
- `token` (string) - Kagi session token

**Returns:** Promise resolving to object with `data` array containing search results and related searches.

**Example:**
```javascript
const results = await search('javascript frameworks', token);
// Returns: { data: [{ t: 0, url: "...", title: "...", snippet: "..." }, ...] }
```

### `summarize(input, token, options)`

Performs a summarization request on Kagi.com and returns the summary.

**Parameters:**
- `input` (string) - URL or text content to summarize
- `token` (string) - Kagi session token
- `options` (object) - Summarization options
  - `type` (string) - Summary type: 'summary' or 'takeaway' (default: 'summary')
  - `language` (string) - Target language code (default: 'EN')
  - `isUrl` (boolean) - Whether input is a URL (true) or text (false)

**Returns:** Promise resolving to object with `data.output` containing the markdown summary.

**Example:**
```javascript
const summary = await summarize(
  'https://example.com/article',
  token,
  { type: 'summary', language: 'EN', isUrl: true }
);
// Returns: { data: { output: "# Summary\n\n..." } }
```

### `SUPPORTED_LANGUAGES`

Array of supported language codes for summarization: `['BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'ES', 'ET', 'FI', 'FR', 'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TR', 'UK', 'ZH', 'ZH-HANT']`

## JSON Output Formats

### Search Results
Results match the [Kagi Search API schema](https://help.kagi.com/kagi/api/search.html#objects) in a simplified form:

- **Search Results** (`t: 0`): Web search results with `url`, `title`, `snippet`
- **Related Searches** (`t: 1`): Suggested search terms in `list` array

```json
{
  "data": [
    {
      "t": 0,
      "url": "https://en.wikipedia.org/wiki/Steve_Jobs",
      "title": "Steve Jobs - Wikipedia", 
      "snippet": "Steven Paul Jobs (February 24, 1955 – October 5, 2011) was an American businessman..."
    },
    {
      "t": 1,
      "list": ["steve jobs death", "steve jobs quotes", "steve jobs film"]
    }
  ]
}
```

### Summarizer Results
Results match the [Kagi Summarizer API schema](https://help.kagi.com/kagi/api/summarizer.html#objects) in a simplified form:

```json
{
  "data": {
    "output": "# Summary\n\nSteve Jobs was an American entrepreneur and inventor who co-founded Apple Inc..."
  }
}
```

## Authentication

Get your Kagi session token:

1. Visit [Kagi Settings](https://kagi.com/settings/user_details) in your browser
2. Copy the **Session Link**
3. Extract the `token` value from the link
4. Use that value as your session token in function calls

> [!WARNING]
> **Security Note**: Keep your session token private. It provides access to your Kagi account.

## Error Handling

Both functions throw errors for:
- Invalid or missing parameters
- Network connectivity issues
- Invalid or expired session tokens
- Parsing failures

```javascript
try {
  const results = await search('query', 'invalid-token');
} catch (error) {
  console.error('Search failed:', error.message);
  // Possible errors: "Invalid or expired session token", "Network error: Unable to connect to Kagi"
}
```

## Author

Carlo Zottmann, <carlo@zottmann.dev>, https://c.zottmann.dev, https://github.com/czottmann.

This project is neither affiliated with nor endorsed by Kagi. I'm just a very happy customer.

> [!TIP]
> I make Shortcuts-related macOS & iOS productivity apps like [Actions For Obsidian](https://actions.work/actions-for-obsidian), [Browser Actions](https://actions.work/browser-actions) (which adds Shortcuts support for several major browsers), and [BarCuts](https://actions.work/barcuts) (a surprisingly useful contextual Shortcuts launcher). Check them out!

### Contributors

- [kdcokenny (Kenny)](https://github.com/kdcokenny)
- [rnavarro (Robert Navarro)](https://github.com/rnavarro)

## Related Projects

- [czottmann/kagi-ken-mcp](https://github.com/czottmann/kagi-ken-mcp) - MCP server using this package
- [czottmann/kagi-ken-cli](https://github.com/czottmann/kagi-ken-cli) - Command-line tool using this package

---

## Technical Details

- **Architecture**: ES Modules with clean functional API
- **Search**: Uses Kagi's `/html/search` endpoint for server-side rendered results (HTML parsing)
- **Summarizer**: Uses Kagi's `/mother/summary_labs` endpoint with streaming JSON responses
- **Authentication**: Session token via Cookie header (caller must provide token)
- **Error Handling**: Network errors, invalid tokens, parsing failures, stream processing
- **User Agent**: Mimics Safari browser for compatibility
- **Dependencies**: Only `cheerio` for HTML parsing
