/**
 * Better Gemini Extension - Injector Core Module
 *
 * Testable core logic extracted from injector.js for unit testing.
 */

export const CONFIG = {
  URL_PARAM: "bg_prompt",
  TIMEOUTS: {
    DOM_READY: 10000,
    BEFORE_INJECTION: 500, // Wait after input field appears before injecting
    AFTER_INJECTION: 300, // Wait after injection before clicking send
    RETRY_INTERVAL: 100,
  },
  RETRY: { MAX_ATTEMPTS: 3, DELAY: 200 },
  SELECTORS: {
    INPUT_FIELD: [
      'div[contenteditable="true"]',
      '.ql-editor[contenteditable="true"]',
      '[data-placeholder="Enter a prompt here"]',
      'rich-textarea div[contenteditable="true"]',
    ],
    SEND_BUTTON: [
      'button[aria-label="Send message"]',
      'button[aria-label="Send"]',
      'button[data-testid="send-button"]',
      ".send-button",
      'button[mattooltip="Send message"]',
    ],
    // Elements that indicate user IS logged in to Gemini
    LOGGED_IN_INDICATORS: [
      'div[contenteditable="true"]', // Chat input only appears when logged in
      "rich-textarea", // Gemini's rich text input component
      '[data-placeholder="Enter a prompt here"]', // Input placeholder
    ],
    // URL patterns that definitively indicate NOT logged in
    LOGIN_PAGE_PATTERNS: [
      "accounts.google.com/signin",
      "accounts.google.com/v3/signin",
      "accounts.google.com/ServiceLogin",
    ],
  },
  DEBUG: true,
};

export function getPromptFromURL(searchString) {
  const urlParams = new URLSearchParams(searchString);
  const encodedPrompt = urlParams.get(CONFIG.URL_PARAM);
  if (!encodedPrompt) return null;
  try {
    return decodeURIComponent(encodedPrompt);
  } catch (e) {
    return null;
  }
}

export function cleanupURL(urlString) {
  const url = new URL(urlString);
  url.searchParams.delete(CONFIG.URL_PARAM);
  return url.toString();
}

export function queryWithSelectors(selectors, context = document) {
  for (const selector of selectors) {
    const element = context.querySelector(selector);
    if (element) return element;
  }
  return null;
}

/**
 * Checks if the user is logged out by:
 * 1. Checking if we're on a Google login page URL
 * 2. Checking if logged-in indicators are ABSENT
 *
 * This avoids false positives from accounts.google.com links that appear
 * on logged-in Gemini pages (like profile menu links).
 *
 * @param {string} currentUrl - Current page URL
 * @param {Document} doc - Document object for DOM queries
 * @returns {boolean} True if user appears to be logged out
 */
export function isUserLoggedOut(currentUrl, doc = document) {
  // Check if we're on an actual Google login page (not just a link)
  for (const pattern of CONFIG.SELECTORS.LOGIN_PAGE_PATTERNS) {
    if (currentUrl.includes(pattern)) {
      console.log("[Better Gemini] Detected login page URL pattern:", pattern);
      return true;
    }
  }

  // If we're on gemini.google.com, check for logged-in indicators
  // If ANY logged-in indicator is present, user is logged in
  for (const selector of CONFIG.SELECTORS.LOGGED_IN_INDICATORS) {
    if (doc.querySelector(selector)) {
      console.log("[Better Gemini] Found logged-in indicator:", selector);
      return false; // User IS logged in
    }
  }

  // If we're on gemini.google.com but no logged-in indicators found,
  // the page might still be loading. We should NOT immediately assume logged out.
  // Only consider logged out if we're NOT on a Gemini page
  if (currentUrl.includes("gemini.google.com")) {
    console.log(
      "[Better Gemini] On Gemini page, no logged-in indicators yet - assuming still loading",
    );
    return false; // Let the page continue loading
  }

  // Not on Gemini or login page - don't interfere
  console.log("[Better Gemini] Not on Gemini or login page");
  return false;
}

export function injectText(inputElement, text) {
  inputElement.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(inputElement);
  selection.removeAllRanges();
  selection.addRange(range);
  return document.execCommand("insertText", false, text);
}

export function injectTextWithInputEvent(inputElement, text) {
  inputElement.textContent = "";
  const beforeInputEvent = new InputEvent("beforeinput", {
    inputType: "insertText",
    data: text,
    bubbles: true,
    cancelable: true,
  });
  inputElement.dispatchEvent(beforeInputEvent);
  inputElement.textContent = text;
  const inputEvent = new InputEvent("input", {
    inputType: "insertText",
    data: text,
    bubbles: true,
    cancelable: false,
  });
  inputElement.dispatchEvent(inputEvent);
  return true;
}

export function findSendButton(doc = document) {
  return queryWithSelectors(CONFIG.SELECTORS.SEND_BUTTON, doc);
}

export function clickSendButton(
  button,
  attempt = 1,
  maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS,
) {
  if (!button) return { success: false, reason: "not_found" };
  if (button.disabled || button.getAttribute("aria-disabled") === "true") {
    if (attempt < maxAttempts)
      return { success: false, reason: "disabled", retry: true };
    return { success: false, reason: "disabled_after_retries" };
  }
  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  });
  button.dispatchEvent(clickEvent);
  return { success: true };
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
