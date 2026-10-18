/**
 * Better Gemini - Theme Customization Page Script
 *
 * Handles saving and loading of all chat theme sub-options
 * using chrome.storage.sync.
 */

const STORAGE_KEY = "betterGemini_features";

// Default settings for theme customization
const DEFAULT_THEME_SETTINGS = {
  dividerColor: "#3c4043",
  dividerColorEnabled: true,
  promptBubbleColor: "#1e1f20",
  promptBubbleColorEnabled: true,
  responseAreaColor: "#131314",
  responseAreaColorEnabled: true,
};

// DOM element references
const elements = {
  dividerColor: null,
  dividerColorEnabled: null,
  promptBubbleColor: null,
  promptBubbleColorEnabled: null,
  responseAreaColor: null,
  responseAreaColorEnabled: null,
  saveButton: null,
  saveStatus: null,
};

/**
 * Initialize DOM element references
 */
function initializeElements() {
  elements.dividerColor = document.getElementById("dividerColor");
  elements.dividerColorEnabled = document.getElementById("dividerColorEnabled");
  elements.promptBubbleColor = document.getElementById("promptBubbleColor");
  elements.promptBubbleColorEnabled = document.getElementById(
    "promptBubbleColorEnabled",
  );
  elements.responseAreaColor = document.getElementById("responseAreaColor");
  elements.responseAreaColorEnabled = document.getElementById(
    "responseAreaColorEnabled",
  );
  elements.saveButton = document.getElementById("saveButton");
  elements.saveStatus = document.getElementById("saveStatus");
}

/**
 * Load settings from chrome.storage.sync
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const settings = result[STORAGE_KEY] || {};

    if (elements.dividerColor) {
      elements.dividerColor.value =
        settings.dividerColor || DEFAULT_THEME_SETTINGS.dividerColor;
    }
    if (elements.dividerColorEnabled) {
      elements.dividerColorEnabled.checked =
        settings.dividerColorEnabled !== false;
    }

    if (elements.promptBubbleColor) {
      elements.promptBubbleColor.value =
        settings.promptBubbleColor || DEFAULT_THEME_SETTINGS.promptBubbleColor;
    }
    if (elements.promptBubbleColorEnabled) {
      elements.promptBubbleColorEnabled.checked =
        settings.promptBubbleColorEnabled !== false;
    }

    if (elements.responseAreaColor) {
      elements.responseAreaColor.value =
        settings.responseAreaColor || DEFAULT_THEME_SETTINGS.responseAreaColor;
    }
    if (elements.responseAreaColorEnabled) {
      elements.responseAreaColorEnabled.checked =
        settings.responseAreaColorEnabled !== false;
    }

    console.log("[Better Gemini Customization] Settings loaded:", settings);
  } catch (error) {
    console.error("[Better Gemini Customization] Error loading settings:", error);
    // Apply defaults on error
    if (elements.dividerColor) {
      elements.dividerColor.value = DEFAULT_THEME_SETTINGS.dividerColor;
    }
    if (elements.dividerColorEnabled) {
      elements.dividerColorEnabled.checked = true;
    }
    if (elements.promptBubbleColor) {
      elements.promptBubbleColor.value = DEFAULT_THEME_SETTINGS.promptBubbleColor;
    }
    if (elements.promptBubbleColorEnabled) {
      elements.promptBubbleColorEnabled.checked = true;
    }
    if (elements.responseAreaColor) {
      elements.responseAreaColor.value = DEFAULT_THEME_SETTINGS.responseAreaColor;
    }
    if (elements.responseAreaColorEnabled) {
      elements.responseAreaColorEnabled.checked = true;
    }
  }
}

/**
 * Save settings to chrome.storage.sync
 */
async function saveSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const currentSettings = result[STORAGE_KEY] || {};

    const updatedSettings = {
      ...currentSettings,
      dividerColor: elements.dividerColor
        ? elements.dividerColor.value
        : DEFAULT_THEME_SETTINGS.dividerColor,
      dividerColorEnabled: elements.dividerColorEnabled
        ? elements.dividerColorEnabled.checked
        : true,
      promptBubbleColor: elements.promptBubbleColor
        ? elements.promptBubbleColor.value
        : DEFAULT_THEME_SETTINGS.promptBubbleColor,
      promptBubbleColorEnabled: elements.promptBubbleColorEnabled
        ? elements.promptBubbleColorEnabled.checked
        : true,
      responseAreaColor: elements.responseAreaColor
        ? elements.responseAreaColor.value
        : DEFAULT_THEME_SETTINGS.responseAreaColor,
      responseAreaColorEnabled: elements.responseAreaColorEnabled
        ? elements.responseAreaColorEnabled.checked
        : true,
    };

    await chrome.storage.sync.set({ [STORAGE_KEY]: updatedSettings });
    console.log(
      "[Better Gemini Customization] Settings saved:",
      updatedSettings,
    );
    showSaveConfirmation();
  } catch (error) {
    console.error("[Better Gemini Customization] Error saving settings:", error);
    showSaveError();
  }
}

/**
 * Show save confirmation message
 */
function showSaveConfirmation() {
  elements.saveStatus.textContent = "Settings saved!";
  elements.saveStatus.className = "save-status success";

  setTimeout(() => {
    elements.saveStatus.textContent = "";
    elements.saveStatus.className = "save-status";
  }, 3000);
}

/**
 * Show save error message
 */
function showSaveError() {
  elements.saveStatus.textContent = "Error saving settings";
  elements.saveStatus.className = "save-status error";

  setTimeout(() => {
    elements.saveStatus.textContent = "";
    elements.saveStatus.className = "save-status";
  }, 3000);
}

/**
 * Initialize the customization page
 */
function initialize() {
  initializeElements();
  loadSettings();

  if (elements.saveButton) {
    elements.saveButton.addEventListener("click", saveSettings);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
