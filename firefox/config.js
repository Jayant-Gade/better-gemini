/**
 * Better Gemini - Centralized Configuration
 *
 * This module contains all configuration constants, DOM selectors,
 * and settings used throughout the extension.
 *
 * Supports both ES6 modules (Chrome extension) and CommonJS (Node.js testing)
 */

// ========== ENVIRONMENT DETECTION ==========
const IS_TEST_ENV = typeof module !== "undefined" && module.exports;

const CONFIG = {
  // Extension metadata
  meta: {
    name: "Better Gemini Fork",
    version: "1.1.0",
  },

  // Timing configuration
  timing: {
    // Maximum time to wait for DOM elements (ms)
    domTimeout: 10000,
    // Interval between DOM polling attempts (ms)
    pollInterval: 100,
    // Maximum retry attempts for operations
    maxRetries: 5,
    // Delay between retry attempts (ms)
    retryDelay: 500,
    // Debounce delay for input handling (ms)
    debounceDelay: 150,
  },

  // DOM Selectors for Gemini UI elements
  // These may need updates if Gemini's UI changes
  selectors: {
    // Main input area
    promptInput: 'div[contenteditable="true"].ql-editor',
    promptInputFallback: "rich-textarea",

    // Submit/send button
    sendButton: 'button[aria-label="Send message"]',
    sendButtonFallback: "button.send-button",

    // Chat container
    chatContainer: ".conversation-container",

    // Individual message elements
    userMessage: ".user-message",
    modelResponse: ".model-response",

    // New chat button
    newChatButton: 'button[aria-label="New chat"]',

    // Sidebar elements
    sidebar: ".side-nav",
    chatHistory: ".chat-history",

    // Loading indicators
    loadingIndicator: ".loading-indicator",
    streamingResponse: ".streaming",
  },

  // Gemini URL patterns
  urls: {
    base: "https://gemini.google.com",
    app: "https://gemini.google.com/app",
    newChat: "https://gemini.google.com/app",
  },

  // Storage keys for chrome.storage
  storageKeys: {
    settings: "betterGemini_settings",
    history: "betterGemini_history",
    shortcuts: "betterGemini_shortcuts",
  },

  // Default user settings
  defaults: {
    autoFocus: true,
    enableShortcuts: true,
    debugMode: false,
  },
};

// Named exports for specific values used by other modules
const URL_PARAM = "bg_prompt";
const DEBUG = false; // Production mode

// Freeze the config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.meta);
Object.freeze(CONFIG.timing);
Object.freeze(CONFIG.selectors);
Object.freeze(CONFIG.urls);
Object.freeze(CONFIG.storageKeys);
Object.freeze(CONFIG.defaults);

// ========== EXPORTS ==========
// Support both ES6 modules (Chrome extension) and CommonJS (Node.js testing)

if (IS_TEST_ENV) {
  // CommonJS exports for Node.js testing
  module.exports = {
    CONFIG,
    URL_PARAM,
    DEBUG,
  };
}

// ES6 exports for Chrome extension
// These will be ignored in CommonJS environment
export { CONFIG, URL_PARAM, DEBUG };
