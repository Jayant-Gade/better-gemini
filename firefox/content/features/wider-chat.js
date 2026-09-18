/**
 * Better Gemini Extension - Wider Chat Width Feature
 *
 * This module increases the chat container and table block width for a better reading experience.
 *
 * Features:
 * - Injects CSS to set max-width to 98% on conversation containers
 * - Expands table blocks and nested table containers to full width
 * - Uses MutationObserver to handle dynamically loaded content
 * - Persists styles across SPA navigation
 *
 * Supports both ES6 modules (Chrome extension) and CommonJS (Node.js testing)
 */

(function () {
  "use strict";

  // ========== ENVIRONMENT DETECTION ==========
  const IS_TEST_ENV_WIDER = typeof module !== "undefined" && module.exports;
  const IS_BROWSER_ENV_WIDER =
    typeof window !== "undefined" && typeof document !== "undefined";

  // ========== CONFIGURATION ==========

  const STYLE_ID = "better-gemini-wider-chat";

  const WIDER_CHAT_CSS = `
.conversation-container,
.input-area-container,
.bottom-container,response-element,.md-content,.md-content:not(#_):not(#_),
.md-content > :not(#_):not(#_),
.md-content > * ,
user-query {
  max-width: 98% !important;
  width: 98% !important;
}

/* Expanded styling for table-block containers and nested tables */
table-block,
div.table-block,
div.table-block .table-content,
div.table-block .table-content table {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  
}
`;

  // Selectors to watch for dynamic content
  const WATCHED_SELECTORS = [
    ".conversation-container",
    ".input-area-container",
    ".bottom-container",
    "user-query",
    "table-block",
    "div.table-block",
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
    style.textContent = WIDER_CHAT_CSS;

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
   * Initializes the wider chat feature
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
   * Destroys the wider chat feature
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

  if (IS_TEST_ENV_WIDER) {
    module.exports = {
      init,
      destroy,
      _internals: {
        STYLE_ID,
        WIDER_CHAT_CSS,
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

  if (IS_BROWSER_ENV_WIDER && !IS_TEST_ENV_WIDER) {
    window.BetterGeminiWiderChat = {
      init,
      destroy,
    };
  }
})();
