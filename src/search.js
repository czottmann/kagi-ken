/**
 * @fileoverview Kagi search functionality
 */

import * as cheerio from "cheerio";
import { USER_AGENT } from "./utils/http.js";

/**
 * Performs a search on Kagi.com and returns structured results
 *
 * @param {string} query - Search query
 * @param {string} token - Kagi session token
 * @param {number} [limit=10] - Maximum number of search results to return (default: 10)
 * @returns {Promise<Object>} Object containing data array with search results and related searches
 */
export async function search(query, token, limit = 10) {
  if (!query || typeof query !== "string") {
    throw new Error("Search query is required and must be a string");
  }

  if (!token || typeof token !== "string") {
    throw new Error("Session token is required and must be a string");
  }

  if (
    limit !== undefined &&
    (typeof limit !== "number" || limit < 1 || !Number.isInteger(limit))
  ) {
    throw new Error("Limit must be a positive integer");
  }

  try {
    const response = await fetch(
      `https://kagi.com/html/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          "Cookie": `kagi_session=${token}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid or expired session token");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const results = parseSearchResults(html, limit);
    return { data: results };
  } catch (error) {
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error("Network error: Unable to connect to Kagi");
    }
    throw error;
  }
}

/**
 * Parses HTML content to extract search results
 *
 * @param {string} html - HTML content from Kagi search page
 * @param {number} limit - Maximum number of search results to return
 * @returns {Array} Array of search results and related searches
 */
function parseSearchResults(html, limit) {
  const $ = cheerio.load(html);
  const results = [];
  let resultCount = 0;

  try {
    // Extract main search results
    $(".search-result").each((_, element) => {
      if (resultCount >= limit) return false; // Stop if limit reached
      const result = extractSearchResult($, element);
      if (result) {
        results.push(result);
        resultCount++;
      }
    });

    // Extract grouped sub-results
    if (resultCount < limit) {
      $(".sr-group .__srgi").each((_, element) => {
        if (resultCount >= limit) return false; // Stop if limit reached
        const result = extractGroupedResult($, element);
        if (result) {
          results.push(result);
          resultCount++;
        }
      });
    }

    // Extract related searches (always included regardless of limit)
    const relatedSearches = extractRelatedSearches($);
    if (relatedSearches.length > 0) {
      results.push({
        t: 1,
        list: relatedSearches,
      });
    }

    return results;
  } catch (error) {
    throw new Error(
      "Failed to parse search results - unexpected HTML structure",
    );
  }
}

/**
 * Extracts a single search result from a search-result element
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {CheerioElement} element - Search result element
 * @returns {Object|null} Parsed search result or null if invalid
 */
function extractSearchResult($, element) {
  try {
    const $element = $(element);

    // Extract title and URL
    const titleLink = $element.find(".__sri_title_link").first();
    const title = titleLink.text().trim();
    const url = titleLink.attr("href");

    // Extract snippet
    const snippet = $element.find(".__sri-desc").text().trim();

    // Extract published date
    const published = $element.find(".__sri-time").first().text().trim() || null;

    if (!title || !url) {
      return null;
    }

    return {
      t: 0,
      url: url,
      title: title,
      snippet: snippet || "",
      published: published,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extracts a grouped search result from a __srgi element
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {CheerioElement} element - Grouped result element
 * @returns {Object|null} Parsed search result or null if invalid
 */
function extractGroupedResult($, element) {
  try {
    const $element = $(element);

    // Extract title and URL
    const titleLink = $element.find(".__srgi-title a").first();
    const title = titleLink.text().trim();
    const url = titleLink.attr("href");

    // Extract snippet
    const snippet = $element.find(".__sri-desc").text().trim();

    // Extract published date
    const published = $element.find(".__sri-time").first().text().trim() || null;

    if (!title || !url) {
      return null;
    }

    return {
      t: 0,
      url: url,
      title: title,
      snippet: snippet || "",
      published: published,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extracts related search terms
 *
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Array<string>} Array of related search terms
 */
function extractRelatedSearches($) {
  const relatedSearches = [];

  try {
    $(".related-searches a span").each((_, element) => {
      const term = $(element).text().trim();
      if (term) {
        relatedSearches.push(term);
      }
    });
  } catch (error) {
    // Return empty array if parsing fails
  }

  return relatedSearches;
}
