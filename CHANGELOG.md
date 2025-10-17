# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-10-17

### Added

- Optional `limit` parameter to `search()` function to control maximum number of search results returned
- Parameter validation for limit (must be positive integer)
- Default limit of 10 results when no limit is specified
- Support for limiting main search results and grouped sub-results while always including related searches

### Changed

- Updated `parseSearchResults()` function to accept and apply limit parameter
- Modified result counting to stop when limit is reached

### Technical Details

- Limit applies to main search results (`.search-result`) first, then grouped sub-results (`.sr-group .__srgi`)
- Related searches (`t: 1`) are always included regardless of limit
- Backward compatible - existing function calls without limit continue to work

## [1.1.0] - 2025-08-13

### Added

- Initial search functionality with HTML parsing
- Summarizer functionality with streaming JSON support
- Session token authentication
- Structured JSON output matching Kagi API schemas

## [1.0.0] - 2025-08-10

Initial release!
