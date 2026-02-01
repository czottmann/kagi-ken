/**
 * @fileoverview Kagi summarizer functionality
 */

import { USER_AGENT } from "./utils/http.js";

// Supported language codes from Kagi Universal Summarizer API
export const SUPPORTED_LANGUAGES = [
  "BG",
  "CS",
  "DA",
  "DE",
  "EL",
  "EN",
  "ES",
  "ET",
  "FI",
  "FR",
  "HU",
  "ID",
  "IT",
  "JA",
  "KO",
  "LT",
  "LV",
  "NB",
  "NL",
  "PL",
  "PT",
  "RO",
  "RU",
  "SK",
  "SL",
  "SV",
  "TR",
  "UK",
  "ZH",
  "ZH-HANT",
];

/**
 * Performs a summarization request on Kagi.com and returns the summary
 *
 * @param {string} input - URL or text to summarize
 * @param {string} token - Kagi session token
 * @param {Object} options - Summarization options
 * @param {string} options.type - Type of summary ("summary" or "takeaway")
 * @param {string} options.language - Target language (2-character code, e.g., "EN")
 * @param {boolean} options.isUrl - Whether input is a URL (true) or text (false)
 * @returns {Promise<Object>} Object containing the summary data
 */
export async function summarize(input, token, options) {
  if (!input || typeof input !== "string") {
    throw new Error("Input is required and must be a string");
  }

  if (!token || typeof token !== "string") {
    throw new Error("Session token is required and must be a string");
  }

  const { type = "summary", language = "EN", isUrl = false } = options || {};

  if (!["summary", "takeaway"].includes(type)) {
    throw new Error("Type must be 'summary' or 'takeaway'");
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    const sl = SUPPORTED_LANGUAGES.join(", ");
    throw new Error(
      `Unsupported language code '${language}'. Supported languages: ${sl}`,
    );
  }

  try {
    let response;

    if (isUrl) {
      // GET request for URL summarization
      const url = new URL("https://kagi.com/mother/summary_labs");
      url.searchParams.set("url", input);
      url.searchParams.set("stream", "1");
      url.searchParams.set("target_language", language);
      url.searchParams.set("summary_type", type);

      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/vnd.kagi.stream",
          "Connection": "keep-alive",
          "Cookie": `kagi_session=${token}`,
          "Host": "kagi.com",
          "Pragma": "no-cache",
          "Referer": "https://kagi.com/summarizer",
          "User-Agent": USER_AGENT,
        },
      });
    } else {
      // POST request for text summarization
      const formData = new URLSearchParams();
      formData.set("text", input);
      formData.set("stream", "1");
      formData.set("target_language", language);
      formData.set("summary_type", type);

      response = await fetch("https://kagi.com/mother/summary_labs/", {
        method: "POST",
        headers: {
          "Accept": "application/vnd.kagi.stream",
          "Connection": "keep-alive",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": `kagi_session=${token}`,
          "Host": "kagi.com",
          "Pragma": "no-cache",
          "Referer": "https://kagi.com/summarizer",
          "User-Agent": USER_AGENT,
        },
        body: formData,
      });
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid or expired session token");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse streaming response
    const streamData = await response.text();
    const parsedResponse = parseStreamingSummary(streamData);

    // Extract output_data.markdown and return as data.output
    const output = parsedResponse?.output_data?.markdown ?? parsedResponse?.md ?? "";
    return { data: { output } };
  } catch (error) {
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error("Network error: Unable to connect to Kagi");
    }
    throw error;
  }
}

/**
 * Parses streaming summary response to extract and parse the final JSON data
 *
 * @param {string} streamData - Raw streaming response data
 * @returns {Object} Parsed JSON data from the final stream message
 */
function parseStreamingSummary(streamData) {
  try {
    // Split by NUL bytes and get the last non-empty message
    const messages = streamData.split("\x00").filter((msg) => msg.trim());

    if (messages.length === 0) {
      throw new Error("No summary data received");
    }

    const lastMessage = messages[messages.length - 1].trim();

    // Remove "final:" and "new_message.json:" prefixes if present
    const jsonString = lastMessage
      .replace(/^final:/, "")
      .replace(/^new_message\.json:/, "")
      .trim();

    if (!jsonString) {
      throw new Error("Empty summary received");
    }

    // Parse JSON response
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse summary JSON response");
    }
    throw new Error("Failed to parse summary response");
  }
}
