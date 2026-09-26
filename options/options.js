/**
 * Better Gemini - Options Page Script
 *
 * Handles saving and loading of extension settings using chrome.storage.sync
 */

// Storage key for all feature settings
const STORAGE_KEY = 'betterGemini_features';
const MODEL_STORAGE_KEY = 'betterGemini_defaultModel';
const EFFORT_STORAGE_KEY = 'betterGemini_thinkingLevel';

// Default settings - all features enabled by default
const DEFAULT_SETTINGS = {
  exportMarkdown: true,
  exportFullChat: true,
  keyboardShortcuts: true,
  widerChatWidth: true,
  widerPromptWidth: true,
  defaultModel: true
};

// Default model (Flash exists on every account) and thinking level
const DEFAULT_MODEL = 'flash';
const DEFAULT_EFFORT = ''; // empty = leave Gemini's default thinking level untouched

// DOM element references
const elements = {
  exportMarkdown: null,
  exportFullChat: null,
  keyboardShortcuts: null,
  widerChatWidth: null,
  widerPromptWidth: null,
  defaultModel: null,
  selectedModel: null,
  modelSelectorContainer: null,
  selectedEffort: null,
  effortSelectorContainer: null,
  saveButton: null,
  saveStatus: null
};

/**
 * Initialize DOM element references
 */
function initializeElements() {
  elements.exportMarkdown = document.getElementById('exportMarkdown');
  elements.exportFullChat = document.getElementById('exportFullChat');
  elements.keyboardShortcuts = document.getElementById('keyboardShortcuts');
  elements.widerChatWidth = document.getElementById('widerChatWidth');
  elements.widerPromptWidth = document.getElementById('widerPromptWidth');
  elements.defaultModel = document.getElementById('defaultModel');
  elements.selectedModel = document.getElementById('selectedModel');
  elements.modelSelectorContainer = document.getElementById('modelSelectorContainer');
  elements.selectedEffort = document.getElementById('selectedEffort');
  elements.effortSelectorContainer = document.getElementById('effortSelectorContainer');
  elements.saveButton = document.getElementById('saveButton');
  elements.saveStatus = document.getElementById('saveStatus');
}

/**
 * Load settings from chrome.storage.sync
 * If no settings exist, use defaults
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY, MODEL_STORAGE_KEY, EFFORT_STORAGE_KEY]);
    const settings = result[STORAGE_KEY] || DEFAULT_SETTINGS;
    const selectedModel = result[MODEL_STORAGE_KEY] || DEFAULT_MODEL;
    const selectedEffort = result[EFFORT_STORAGE_KEY] ?? DEFAULT_EFFORT;

    // Apply settings to checkboxes
    elements.exportMarkdown.checked = settings.exportMarkdown !== false;
    elements.exportFullChat.checked = settings.exportFullChat !== false;
    elements.keyboardShortcuts.checked = settings.keyboardShortcuts !== false;
    elements.widerChatWidth.checked = settings.widerChatWidth !== false;
    elements.widerPromptWidth.checked = settings.widerPromptWidth !== false;
    elements.defaultModel.checked = settings.defaultModel !== false;

    // Apply selected model and thinking level
    elements.selectedModel.value = selectedModel;
    elements.selectedEffort.value = selectedEffort;

    // Update model selector visibility
    updateModelSelectorVisibility();

    console.log('[Better Gemini] Settings loaded:', settings, 'Model:', selectedModel, 'Effort:', selectedEffort);
  } catch (error) {
    console.error('[Better Gemini] Error loading settings:', error);
    // Apply defaults on error
    elements.exportMarkdown.checked = true;
    elements.exportFullChat.checked = true;
    elements.keyboardShortcuts.checked = true;
    elements.widerChatWidth.checked = true;
    elements.widerPromptWidth.checked = true;
    elements.defaultModel.checked = true;
    elements.selectedModel.value = DEFAULT_MODEL;
    elements.selectedEffort.value = DEFAULT_EFFORT;
    updateModelSelectorVisibility();
  }
}

/**
 * Updates the visibility of the model selector based on defaultModel toggle
 */
function updateModelSelectorVisibility() {
  const display = elements.defaultModel.checked ? 'flex' : 'none';
  elements.modelSelectorContainer.style.display = display;
  elements.effortSelectorContainer.style.display = display;
}

/**
 * Save settings to chrome.storage.sync
 */
async function saveSettings() {
  const settings = {
    exportMarkdown: elements.exportMarkdown.checked,
    exportFullChat: elements.exportFullChat.checked,
    keyboardShortcuts: elements.keyboardShortcuts.checked,
    widerChatWidth: elements.widerChatWidth.checked,
    widerPromptWidth: elements.widerPromptWidth.checked,
    defaultModel: elements.defaultModel.checked
  };

  const selectedModel = elements.selectedModel.value;
  const selectedEffort = elements.selectedEffort.value;

  try {
    await chrome.storage.sync.set({
      [STORAGE_KEY]: settings,
      [MODEL_STORAGE_KEY]: selectedModel,
      [EFFORT_STORAGE_KEY]: selectedEffort
    });
    console.log('[Better Gemini] Settings saved:', settings, 'Model:', selectedModel, 'Effort:', selectedEffort);
    showSaveConfirmation();
  } catch (error) {
    console.error('[Better Gemini] Error saving settings:', error);
    showSaveError();
  }
}

/**
 * Show save confirmation message
 */
function showSaveConfirmation() {
  elements.saveStatus.textContent = 'Settings saved!';
  elements.saveStatus.className = 'save-status success';

  // Clear the message after 3 seconds
  setTimeout(() => {
    elements.saveStatus.textContent = '';
    elements.saveStatus.className = 'save-status';
  }, 3000);
}

/**
 * Show save error message
 */
function showSaveError() {
  elements.saveStatus.textContent = 'Error saving settings';
  elements.saveStatus.className = 'save-status error';

  // Clear the message after 3 seconds
  setTimeout(() => {
    elements.saveStatus.textContent = '';
    elements.saveStatus.className = 'save-status';
  }, 3000);
}

/**
 * Initialize the options page
 */
function initialize() {
  initializeElements();
  loadSettings();

  // Add event listener for save button
  elements.saveButton.addEventListener('click', saveSettings);

  // Add event listener for defaultModel toggle to show/hide model selector
  elements.defaultModel.addEventListener('change', updateModelSelectorVisibility);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
