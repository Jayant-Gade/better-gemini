/**
 * Better Gemini - Popup Script
 *
 * Handles quick toggle settings with auto-save functionality
 */

// Storage keys (must match options.js)
const STORAGE_KEY = "betterGemini_features";
const MODEL_STORAGE_KEY = "betterGemini_defaultModel";

// Default settings - all features enabled by default
const DEFAULT_SETTINGS = {
  exportMarkdown: true,
  exportFullChat: true,
  keyboardShortcuts: true,
  widerChatWidth: true,
  widerPromptWidth: true,
  customizeChat: false,
  defaultModel: true,
};

// DOM element references
const elements = {
  exportMarkdown: null,
  exportFullChat: null,
  keyboardShortcuts: null,
  widerChatWidth: null,
  widerPromptWidth: null,
  customizeChat: null,
  defaultModel: null,
  openSettings: null,
  openCustomizeSettings: null,
  saveIndicator: null,
};

// Debounce timer for save indicator
let saveIndicatorTimer = null;

/**
 * Initialize DOM element references
 */
function initializeElements() {
  elements.exportMarkdown = document.getElementById("exportMarkdown");
  elements.exportFullChat = document.getElementById("exportFullChat");
  elements.keyboardShortcuts = document.getElementById("keyboardShortcuts");
  elements.widerChatWidth = document.getElementById("widerChatWidth");
  elements.widerPromptWidth = document.getElementById("widerPromptWidth");
  elements.customizeChat = document.getElementById("customizeChat");
  elements.defaultModel = document.getElementById("defaultModel");
  elements.openSettings = document.getElementById("openSettings");
  elements.openCustomizeSettings = document.getElementById("openCustomizeSettings");
  elements.saveIndicator = document.getElementById("saveIndicator");
}

/**
 * Load settings from chrome.storage.sync
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const settings = result[STORAGE_KEY] || DEFAULT_SETTINGS;

    // Apply settings to checkboxes
    elements.exportMarkdown.checked = settings.exportMarkdown !== false;
    elements.exportFullChat.checked = settings.exportFullChat !== false;
    elements.keyboardShortcuts.checked = settings.keyboardShortcuts !== false;
    elements.widerChatWidth.checked = settings.widerChatWidth !== false;
    elements.widerPromptWidth.checked = settings.widerPromptWidth !== false;
    elements.customizeChat.checked = settings.customizeChat === true;
    elements.defaultModel.checked = settings.defaultModel !== false;

    console.log("[Better Gemini Popup] Settings loaded:", settings);
  } catch (error) {
    console.error("[Better Gemini Popup] Error loading settings:", error);
    // Apply defaults on error
    elements.exportMarkdown.checked = true;
    elements.exportFullChat.checked = true;
    elements.keyboardShortcuts.checked = true;
    elements.widerPromptWidth.checked = true;
    elements.widerChatWidth.checked = true;
    elements.customizeChat.checked = false;
    elements.defaultModel.checked = true;
  }
}

/**
 * Save settings to chrome.storage.sync
 */
async function saveSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const currentSettings = result[STORAGE_KEY] || {};
    const settings = {
      ...currentSettings,
      exportMarkdown: elements.exportMarkdown.checked,
      exportFullChat: elements.exportFullChat.checked,
      keyboardShortcuts: elements.keyboardShortcuts.checked,
      widerChatWidth: elements.widerChatWidth.checked,
      widerPromptWidth: elements.widerPromptWidth.checked,
      customizeChat: elements.customizeChat.checked,
      defaultModel: elements.defaultModel.checked,
    };

    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
    console.log("[Better Gemini Popup] Settings saved:", settings);
    showSaveIndicator();
  } catch (error) {
    console.error("[Better Gemini Popup] Error saving settings:", error);
  }
}

/**
 * Show the save indicator briefly
 */
function showSaveIndicator() {
  // Clear any existing timer
  if (saveIndicatorTimer) {
    clearTimeout(saveIndicatorTimer);
  }

  // Show indicator
  elements.saveIndicator.classList.add("visible");

  // Hide after delay
  saveIndicatorTimer = setTimeout(() => {
    elements.saveIndicator.classList.remove("visible");
  }, 1500);
}

/**
 * Open the full options page
 */
function openOptionsPage(event) {
  if (event) event.preventDefault();
  if (chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage(() => {
      if (chrome.runtime.lastError) {
        chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html") });
      }
    });
  } else if (chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html") });
  } else {
    window.open(chrome.runtime.getURL("options/options.html"));
  }
}

/**
 * Open the theme customization page
 */
function openCustomizePage(event) {
  if (event) event.preventDefault();
  if (chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL("options/customize-options.html") });
  } else {
    window.open(chrome.runtime.getURL("options/customize-options.html"));
  }
}

/**
 * Attach event listeners to toggle inputs
 */
function attachEventListeners() {
  // Auto-save on any toggle change
  const toggles = [
    elements.exportMarkdown,
    elements.exportFullChat,
    elements.keyboardShortcuts,
    elements.widerChatWidth,
    elements.widerPromptWidth,
    elements.customizeChat,
    elements.defaultModel,
  ];

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", saveSettings);
  });

  // Open settings links
  if (elements.openSettings) {
    elements.openSettings.addEventListener("click", openOptionsPage);
  }
  if (elements.openCustomizeSettings) {
    elements.openCustomizeSettings.addEventListener("click", openCustomizePage);
  }

  // Failsafe for any .settings-link in the popup
  document.querySelectorAll(".settings-link").forEach((link) => {
    if (link !== elements.openSettings && link !== elements.openCustomizeSettings) {
      link.addEventListener("click", openOptionsPage);
    }
  });
}

/**
 * Initialize the popup
 */
function initialize() {
  initializeElements();
  loadSettings();
  attachEventListeners();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
