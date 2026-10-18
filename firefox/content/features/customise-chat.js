/**
 * Better Gemini Extension - Customise Chat Feature
 *
 * This module allows customising the appearance of the chat interface,
 * including spawning custom-colored <hr> dividers before and after <model-response> elements.
 *
 * Supports both browser extensions and CommonJS (for Node.js testing).
 */

(function () {
  "use strict";

  // ========== ENVIRONMENT DETECTION ==========
  const IS_TEST_ENV = typeof module !== "undefined" && module.exports;
  const IS_BROWSER_ENV =
    typeof window !== "undefined" && typeof document !== "undefined";

  // ========== CONFIGURATION ==========
  const STYLE_ID = "better-gemini-customise-chat-styles";
  const STORAGE_KEY = "betterGemini_features";
  const DEFAULT_DIVIDER_COLOR = "#3c4043";

  const BASE_DIVIDER_CSS = `
hr.better-gemini-divider {
  border: none !important;
  height: 1px !important;
  background-color: var(--better-gemini-divider-color, ${DEFAULT_DIVIDER_COLOR}) !important;
  color: var(--better-gemini-divider-color, ${DEFAULT_DIVIDER_COLOR}) !important;
  margin: 16px 0 !important;
  width: 100% !important;
  display: block !important;
  box-sizing: border-box !important;
  opacity: 0.85 !important;
}
`;

  // ========== STATE ==========
  let isInitialized = false;
  let isEnabled = true; // Main feature toggle: customizeChat
  let isDividerEnabled = true; // Sub toggle: dividerColorEnabled
  let dividerColor = DEFAULT_DIVIDER_COLOR;
  let observer = null;
  let styleElement = null;
  let scanRafId = null;

  // ========== DOM OPERATIONS ==========

  /**
   * Injects the CSS styles for dividers into document head
   */
  function injectStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.type = "text/css";
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(style);
      }
    }
    style.textContent = BASE_DIVIDER_CSS;
    document.documentElement.style.setProperty(
      "--better-gemini-divider-color",
      dividerColor,
    );
    return style;
  }

  /**
   * Removes injected styles from document
   */
  function removeStyles() {
    const style = document.getElementById(STYLE_ID);
    if (style) {
      style.remove();
    }
    styleElement = null;
  }

  /**
   * Creates an <hr> divider element
   * @param {"before" | "after"} position
   * @returns {HTMLHRElement}
   */
  function createDivider(position) {
    const hr = document.createElement("hr");
    hr.className = `better-gemini-divider better-gemini-divider-${position}`;
    hr.setAttribute("data-better-gemini-divider", position);
    hr.style.setProperty("border", "none", "important");
    hr.style.setProperty("height", "1px", "important");
    hr.style.setProperty("background-color", dividerColor, "important");
    hr.style.setProperty("color", dividerColor, "important");
    hr.style.setProperty("margin", "16px 0", "important");
    hr.style.setProperty("width", "100%", "important");
    hr.style.setProperty("display", "block", "important");
    hr.style.setProperty("box-sizing", "border-box", "important");
    hr.style.setProperty("opacity", "0.85", "important");
    return hr;
  }

  /**
   * Spawns <hr> dividers before and after a <model-response> element
   * @param {Element} modelResponse
   */
  function applyDividersToElement(modelResponse) {
    if (!modelResponse || !modelResponse.parentNode) {
      return;
    }

    // 1. Divider before <model-response>
    const prev = modelResponse.previousElementSibling;
    if (!prev || !prev.classList.contains("better-gemini-divider")) {
      const hrBefore = createDivider("before");
      modelResponse.parentNode.insertBefore(hrBefore, modelResponse);
    } else if (prev.classList.contains("better-gemini-divider")) {
      prev.style.setProperty("background-color", dividerColor, "important");
      prev.style.setProperty("color", dividerColor, "important");
    }

    // 2. Divider after <model-response>
    const next = modelResponse.nextElementSibling;
    if (!next || !next.classList.contains("better-gemini-divider")) {
      const hrAfter = createDivider("after");
      modelResponse.parentNode.insertBefore(hrAfter, modelResponse.nextSibling);
    } else if (next.classList.contains("better-gemini-divider")) {
      next.style.setProperty("background-color", dividerColor, "important");
      next.style.setProperty("color", dividerColor, "important");
    }
  }

  /**
   * Scans the document for all <model-response> elements and applies dividers
   */
  function scanAndApplyDividers() {
    if (!isEnabled || !isDividerEnabled) {
      removeAllDividers();
      return;
    }

    const modelResponses = document.querySelectorAll("model-response");
    modelResponses.forEach(applyDividersToElement);
  }

  /**
   * Schedules a scan via requestAnimationFrame to avoid redundant DOM reads/writes
   */
  function scheduleScan() {
    if (scanRafId) {
      cancelAnimationFrame(scanRafId);
    }
    scanRafId = requestAnimationFrame(() => {
      scanRafId = null;
      scanAndApplyDividers();
    });
  }

  /**
   * Removes all spawned dividers from the DOM
   */
  function removeAllDividers() {
    const dividers = document.querySelectorAll("hr.better-gemini-divider");
    dividers.forEach((divider) => divider.remove());
  }

  // ========== SETTINGS HANDLING ==========

  /**
   * Updates state from settings object and updates DOM dividers
   * @param {Object} settings
   */
  function updateSettings(settings) {
    if (!settings) return;

    isEnabled = settings.customizeChat !== false;
    isDividerEnabled = settings.dividerColorEnabled !== false;
    if (settings.dividerColor) {
      dividerColor = settings.dividerColor;
    }

    document.documentElement.style.setProperty(
      "--better-gemini-divider-color",
      dividerColor,
    );

    if (!isEnabled || !isDividerEnabled) {
      removeAllDividers();
    } else {
      scanAndApplyDividers();
    }
  }

  /**
   * Loads settings from chrome.storage.sync
   */
  async function loadSettingsAndApply() {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.sync
      ) {
        const result = await chrome.storage.sync.get([STORAGE_KEY]);
        const settings = result[STORAGE_KEY] || {};
        updateSettings(settings);
      }
    } catch (error) {
      console.error("[Better Gemini Customise Chat] Error loading settings:", error);
    }
  }

  /**
   * Handles storage changes to update dividers in real-time
   */
  function handleStorageChange(changes, areaName) {
    if (areaName === "sync" && changes[STORAGE_KEY]) {
      const newSettings = changes[STORAGE_KEY].newValue || {};
      updateSettings(newSettings);
    }
  }

  // ========== OBSERVER SETUP ==========

  /**
   * Sets up MutationObserver to detect new <model-response> elements dynamically
   */
  function setupObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      let hasRelevantChange = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (
                node.tagName === "MODEL-RESPONSE" ||
                (node.querySelector && node.querySelector("model-response"))
              ) {
                hasRelevantChange = true;
                break;
              }
            }
          }
        }
        if (hasRelevantChange) break;
      }

      if (hasRelevantChange) {
        scheduleScan();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // ========== PUBLIC API ==========

  /**
   * Initializes the customise-chat feature
   */
  function init() {
    if (isInitialized) {
      return;
    }

    styleElement = injectStyles();
    setupObserver();

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged
    ) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    loadSettingsAndApply();
    scheduleScan();

    isInitialized = true;
  }

  /**
   * Destroys the customise-chat feature
   */
  function destroy() {
    if (!isInitialized) {
      return;
    }

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (scanRafId) {
      cancelAnimationFrame(scanRafId);
      scanRafId = null;
    }

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged
    ) {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    }

    removeAllDividers();
    removeStyles();

    isInitialized = false;
  }

  // ========== EXPORTS ==========

  if (IS_TEST_ENV) {
    module.exports = {
      init,
      destroy,
      updateSettings,
      scanAndApplyDividers,
      removeAllDividers,
      applyDividersToElement,
      createDivider,
      _internals: {
        STYLE_ID,
        DEFAULT_DIVIDER_COLOR,
        getState: () => ({
          isInitialized,
          isEnabled,
          isDividerEnabled,
          dividerColor,
        }),
      },
    };
  }

  if (IS_BROWSER_ENV && !IS_TEST_ENV) {
    window.BetterGeminiCustomiseChat = {
      init,
      destroy,
      updateSettings,
      scanAndApplyDividers,
      removeAllDividers,
    };
  }
})();
