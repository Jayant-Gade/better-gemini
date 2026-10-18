/**
 * Better Gemini - Options Page Script
 *
 * Handles saving and loading of extension settings using chrome.storage.sync
 */

// Storage key for all feature settings
const STORAGE_KEY = "betterGemini_features";
const MODEL_STORAGE_KEY = "betterGemini_defaultModel";
const EFFORT_STORAGE_KEY = "betterGemini_thinkingLevel";

// Default settings - all features enabled by default
const DEFAULT_SETTINGS = {
  exportMarkdown: true,
  exportFullChat: true,
  keyboardShortcuts: true,
  widerChatWidth: true,
  widerPromptWidth: true,
  customizeChat: true,
  dividerColor: "#3c4043",
  dividerColorEnabled: true,
  promptBubbleColor: "#1e1f20",
  promptBubbleColorEnabled: true,
  responseAreaColor: "#131314",
  responseAreaColorEnabled: true,
  defaultModel: true,
};

// Default model (Flash exists on every account) and thinking level
const DEFAULT_MODEL = "flash";
const DEFAULT_EFFORT = ""; // empty = leave Gemini's default thinking level untouched

// DOM element references
const elements = {
  exportMarkdown: null,
  exportFullChat: null,
  keyboardShortcuts: null,
  widerChatWidth: null,
  widerPromptWidth: null,
  customizeChat: null,
  customizeChatHeader: null,
  themeCollapseIcon: null,
  dividerColorContainer: null,
  dividerColor: null,
  dividerColorEnabled: null,
  promptBubbleColorContainer: null,
  promptBubbleColor: null,
  promptBubbleColorEnabled: null,
  moreCustomizationContainer: null,
  defaultModel: null,
  selectedModel: null,
  modelSelectorContainer: null,
  selectedEffort: null,
  effortSelectorContainer: null,
  saveButton: null,
  saveStatus: null,
};

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
  elements.customizeChatRow = document.getElementById("customizeChatRow");
  elements.customizeChatHeader = document.getElementById("customizeChatHeader");
  elements.themeCollapseIcon = document.getElementById("themeCollapseIcon");
  elements.dividerColorContainer = document.getElementById(
    "dividerColorContainer",
  );
  elements.dividerColor = document.getElementById("dividerColor");
  elements.dividerColorEnabled = document.getElementById(
    "dividerColorEnabled",
  );
  elements.promptBubbleColorContainer = document.getElementById(
    "promptBubbleColorContainer",
  );
  elements.promptBubbleColor = document.getElementById("promptBubbleColor");
  elements.promptBubbleColorEnabled = document.getElementById(
    "promptBubbleColorEnabled",
  );
  elements.moreCustomizationContainer = document.getElementById(
    "moreCustomizationContainer",
  );
  elements.defaultModel = document.getElementById("defaultModel");
  elements.selectedModel = document.getElementById("selectedModel");
  elements.modelSelectorContainer = document.getElementById(
    "modelSelectorContainer",
  );
  elements.selectedEffort = document.getElementById("selectedEffort");
  elements.effortSelectorContainer = document.getElementById(
    "effortSelectorContainer",
  );
  elements.saveButton = document.getElementById("saveButton");
  elements.saveStatus = document.getElementById("saveStatus");
}

/**
 * Load settings from chrome.storage.sync
 * If no settings exist, use defaults
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([
      STORAGE_KEY,
      MODEL_STORAGE_KEY,
      EFFORT_STORAGE_KEY,
    ]);
    const settings = result[STORAGE_KEY] || DEFAULT_SETTINGS;
    const selectedModel = result[MODEL_STORAGE_KEY] || DEFAULT_MODEL;
    const selectedEffort = result[EFFORT_STORAGE_KEY] ?? DEFAULT_EFFORT;

    // Apply settings to checkboxes
    elements.exportMarkdown.checked = settings.exportMarkdown !== false;
    elements.exportFullChat.checked = settings.exportFullChat !== false;
    elements.keyboardShortcuts.checked = settings.keyboardShortcuts !== false;
    elements.widerChatWidth.checked = settings.widerChatWidth !== false;
    elements.widerPromptWidth.checked = settings.widerPromptWidth !== false;
    elements.customizeChat.checked = settings.customizeChat !== false;
    elements.dividerColor.value = settings.dividerColor || "#3c4043";
    elements.dividerColorEnabled.checked =
      settings.dividerColorEnabled !== false;
    elements.promptBubbleColor.value = settings.promptBubbleColor || "#1e1f20";
    elements.promptBubbleColorEnabled.checked =
      settings.promptBubbleColorEnabled !== false;
    elements.defaultModel.checked = settings.defaultModel !== false;

    // Apply selected model and thinking level
    elements.selectedModel.value = selectedModel;
    elements.selectedEffort.value = selectedEffort;

    // Initialize collapse state based on saved customizeChat toggle
    isThemeSubOptionsCollapsed = !elements.customizeChat.checked;

    // Update model selector visibility
    updateModelSelectorVisibility();
    updateThemeSettingsVisibility();

    console.log(
      "[Better Gemini] Settings loaded:",
      settings,
      "Model:",
      selectedModel,
      "Effort:",
      selectedEffort,
    );
  } catch (error) {
    console.error("[Better Gemini] Error loading settings:", error);
    // Apply defaults on error
    elements.exportMarkdown.checked = true;
    elements.exportFullChat.checked = true;
    elements.keyboardShortcuts.checked = true;
    elements.widerChatWidth.checked = true;
    elements.widerPromptWidth.checked = true;
    elements.customizeChat.checked = true;
    elements.dividerColor.value = "#3c4043";
    elements.dividerColorEnabled.checked = true;
    elements.promptBubbleColor.value = "#1e1f20";
    elements.promptBubbleColorEnabled.checked = true;
    elements.defaultModel.checked = true;
    elements.selectedModel.value = DEFAULT_MODEL;
    elements.selectedEffort.value = DEFAULT_EFFORT;
    isThemeSubOptionsCollapsed = false;
    updateModelSelectorVisibility();
    updateThemeSettingsVisibility();
  }
}

/**
 * Updates the visibility of the model selector based on defaultModel toggle
 */
function updateModelSelectorVisibility() {
  const display = elements.defaultModel.checked ? "flex" : "none";
  elements.modelSelectorContainer.style.display = display;
  elements.effortSelectorContainer.style.display = display;
}

let isThemeSubOptionsCollapsed = false;

/**
 * Toggles collapse/expand of the theme sub-options list
 */
function toggleThemeCollapse(event) {
  // If the user clicked directly on the toggle switch, do not toggle collapse
  if (event && event.target && event.target.closest(".toggle")) {
    return;
  }
  isThemeSubOptionsCollapsed = !isThemeSubOptionsCollapsed;
  updateThemeSettingsVisibility();
}

/**
 * Updates the visibility of the theme sub-settings based on collapsed/expanded state
 */
function updateThemeSettingsVisibility() {
  const isVisible = !isThemeSubOptionsCollapsed;
  const display = isVisible ? "flex" : "none";

  if (elements.dividerColorContainer) {
    elements.dividerColorContainer.style.display = display;
  }
  if (elements.promptBubbleColorContainer) {
    elements.promptBubbleColorContainer.style.display = display;
  }
  if (elements.moreCustomizationContainer) {
    elements.moreCustomizationContainer.style.display = display;
  }

  if (elements.themeCollapseIcon) {
    if (isVisible) {
      elements.themeCollapseIcon.classList.add("expanded");
      elements.themeCollapseIcon.classList.remove("collapsed");
      elements.themeCollapseIcon.title = "Collapse options";
    } else {
      elements.themeCollapseIcon.classList.remove("expanded");
      elements.themeCollapseIcon.classList.add("collapsed");
      elements.themeCollapseIcon.title = "Expand options";
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

    const settings = {
      ...currentSettings,
      exportMarkdown: elements.exportMarkdown.checked,
      exportFullChat: elements.exportFullChat.checked,
      keyboardShortcuts: elements.keyboardShortcuts.checked,
      widerChatWidth: elements.widerChatWidth.checked,
      widerPromptWidth: elements.widerPromptWidth.checked,
      customizeChat: elements.customizeChat.checked,
      dividerColor: elements.dividerColor ? elements.dividerColor.value : "#3c4043",
      dividerColorEnabled: elements.dividerColorEnabled
        ? elements.dividerColorEnabled.checked
        : true,
      promptBubbleColor: elements.promptBubbleColor
        ? elements.promptBubbleColor.value
        : "#1e1f20",
      promptBubbleColorEnabled: elements.promptBubbleColorEnabled
        ? elements.promptBubbleColorEnabled.checked
        : true,
      defaultModel: elements.defaultModel.checked,
    };

    const selectedModel = elements.selectedModel.value;
    const selectedEffort = elements.selectedEffort.value;

    await chrome.storage.sync.set({
      [STORAGE_KEY]: settings,
      [MODEL_STORAGE_KEY]: selectedModel,
      [EFFORT_STORAGE_KEY]: selectedEffort,
    });
    console.log(
      "[Better Gemini] Settings saved:",
      settings,
      "Model:",
      selectedModel,
      "Effort:",
      selectedEffort,
    );
    showSaveConfirmation();
  } catch (error) {
    console.error("[Better Gemini] Error saving settings:", error);
    showSaveError();
  }
}

/**
 * Show save confirmation message
 */
function showSaveConfirmation() {
  elements.saveStatus.textContent = "Settings saved!";
  elements.saveStatus.className = "save-status success";

  // Clear the message after 3 seconds
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

  // Clear the message after 3 seconds
  setTimeout(() => {
    elements.saveStatus.textContent = "";
    elements.saveStatus.className = "save-status";
  }, 3000);
}

/**
 * Initialize the options page
 */
function initialize() {
  initializeElements();
  loadSettings();

  // Add event listener for save button
  elements.saveButton.addEventListener("click", saveSettings);

  // Add event listener for defaultModel toggle to show/hide model selector
  elements.defaultModel.addEventListener(
    "change",
    updateModelSelectorVisibility,
  );

  // Add event listener for customizeChat toggle to auto-expand when turned on or collapse when off
  elements.customizeChat.addEventListener("change", () => {
    isThemeSubOptionsCollapsed = !elements.customizeChat.checked;
    updateThemeSettingsVisibility();
  });

  // Add click handler on the main option row to collapse/uncollapse sub-options without toggling the setting
  if (elements.customizeChatRow) {
    elements.customizeChatRow.addEventListener("click", toggleThemeCollapse);
  }
  if (elements.themeCollapseIcon) {
    elements.themeCollapseIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleThemeCollapse();
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
