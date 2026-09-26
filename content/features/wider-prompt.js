/**
 * Better Gemini Extension - Wider Prompt Width Feature
 *
 * This module increases the chat's prompt container width for a better readability experience.
 *
 * Features:
 * - Injects CSS to expand prompt containers and input boxes
 * - Uses MutationObserver to handle dynamically loaded content
 * - Persists styles across SPA navigation
 *
 * Supports both ES6 modules (Chrome extension) and CommonJS (Node.js testing)
 */

(function () {
  "use strict";

  // ========== ENVIRONMENT DETECTION ==========
  const IS_TEST_ENV_PROMPT = typeof module !== "undefined" && module.exports;
  const IS_BROWSER_ENV_PROMPT =
    typeof window !== "undefined" && typeof document !== "undefined";

  // ========== CONFIGURATION ==========

  const STYLE_ID = "better-gemini-wider-prompt";

  const WIDER_PROMPT_CSS = `
/* Selectors for prompt containers, input areas, and user query boxes */
.prompt-container,.file-preview-container,.user-query-container,user-query-content,
textarea {
  max-width: 98% !important;
  width: max-content !important;
  margin-left: auto !important;
  box-sizing: content-box !important;
}

.query-text-line,.query-content,.query-bubble-with-status,.user-query-bubble-with-background {
  max-width: 100% !important;
  width: max-content !important;
  box-sizing: content-box !important;
  text-align: left !important;   /* Keeps the text reading normally inside */
  margin-left: 0 !important;     /* Prevents children from inheriting auto margins */
  margin-right: 0 !important;
}
  
`;

  // Selectors to watch for dynamic content related to prompts
  const WATCHED_SELECTORS = [
    ".input-area-container",
    "rich-textarea",
    "user-query",
    ".prompt-container",
  ];

  // ========== STATE ==========

  let styleElement = null;
  let observer = null;
  let isInitialized = false;

  // ========== INTERNAL FUNCTIONS ==========

  /**
   * Creates and injects the style element into the document head
   * @returns {HTMLStyleElement} The created style element
   */
  function injectStyles() {
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      return existingStyle;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.type = "text/css";
    style.textContent = WIDER_PROMPT_CSS;

    const targetParent = document.head || document.documentElement;
    if (targetParent) {
      targetParent.appendChild(style);
    }

    return style;
  }

  /**
   * Removes the style element from the document
   */
  function removeStyles() {
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  /**
   * Checks if any of the watched elements exist in the DOM
   * @returns {boolean} True if any watched elements exist
   */
  function hasWatchedElements() {
    return WATCHED_SELECTORS.some(
      (selector) => document.querySelector(selector) !== null,
    );
  }

  /**
   * Callback for MutationObserver
   * Re-injects styles if they were removed (e.g., during SPA navigation)
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  function handleMutations(mutations) {
    if (!document.getElementById(STYLE_ID)) {
      styleElement = injectStyles();
    }

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        if (hasWatchedElements() && !document.getElementById(STYLE_ID)) {
          styleElement = injectStyles();
        }
      }
    }
  }

  /**
   * Sets up the MutationObserver to watch for DOM changes
   * @returns {MutationObserver} The created observer
   */
  function setupObserver() {
    const mutationObserver = new MutationObserver(handleMutations);

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return mutationObserver;
  }

  // ========== PUBLIC API ==========

  /**
   * Initializes the wider prompt feature
   * - Injects CSS styles
   * - Sets up MutationObserver for dynamic content
   */
  function init() {
    if (isInitialized) {
      return;
    }

    styleElement = injectStyles();

    if (typeof MutationObserver !== "undefined") {
      observer = setupObserver();
    }

    isInitialized = true;
  }

  /**
   * Destroys the wider prompt feature
   * - Removes injected styles
   * - Disconnects MutationObserver
   */
  function destroy() {
    if (!isInitialized) {
      return;
    }

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    removeStyles();
    styleElement = null;

    isInitialized = false;
  }

  // ========== EXPORTS ==========

  if (IS_TEST_ENV_PROMPT) {
    module.exports = {
      init,
      destroy,
      _internals: {
        STYLE_ID,
        WIDER_PROMPT_CSS,
        WATCHED_SELECTORS,
        injectStyles,
        removeStyles,
        hasWatchedElements,
        handleMutations,
        setupObserver,
        getState: () => ({ styleElement, observer, isInitialized }),
      },
    };
  }

  if (IS_BROWSER_ENV_PROMPT && !IS_TEST_ENV_PROMPT) {
    window.BetterGeminiWiderPrompt = {
      init,
      destroy,
    };
  }
})();
