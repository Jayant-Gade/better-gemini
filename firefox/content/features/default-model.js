/**
 * Better Gemini Extension - Default Model Feature
 *
 * Automatically sets the preferred model AND thinking-effort level on every chat.
 * It watches for page loads, model-picker availability and SPA navigation, then
 * selects the user's preferences.
 *
 * Gemini's model picker is volatile, so this module avoids brittle assumptions:
 *  - Per-option data-test-ids are rotating hashes ("bard-mode-option-<hash>"), not
 *    stable names, so we match options by the version-agnostic tier NAME instead.
 *  - Labels carry a version prefix ("3.1 Pro", "3.5 Flash"); the prefix is stripped
 *    before matching.
 *  - The lineup varies by account (e.g. "Flash-Lite / Flash / Pro" or
 *    "Flash / Thinking / Pro"); an unavailable preference simply no-ops.
 *  - A "Thinking level" submenu (Standard / Extended) controls reasoning effort.
 */

(function () {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  const CONFIG = {
    // Model tiers keyed by the value stored in settings. `name` is the stable tier
    // label we match against (after stripping any version prefix). Matching is
    // anchored so "Flash" never matches "Flash-Lite" (see nameMatches()).
    MODELS: {
      auto: { name: 'Auto' },
      'flash-lite': { name: 'Flash-Lite' },
      flash: { name: 'Flash' },
      fast: { name: 'Flash', alias: 'flash' }, // "fast" is an alias for Flash
      thinking: { name: 'Thinking' },
      pro: { name: 'Pro' },
      argon: { name: 'Argon' },
    },

    // Thinking-effort levels (the "Thinking level" submenu inside the mode picker).
    EFFORTS: {
      low: { name: 'Low' },
      medium: { name: 'Medium' },
      high: { name: 'High' },
      standard: { name: 'Standard' },
      extended: { name: 'Extended' },
    },

    SELECTORS: {
      MODEL_PICKER_BUTTON: '[data-test-id="bard-mode-menu-button"]',
      // Real model options in the open menu. The "bard-mode-option-" prefix excludes
      // the "Sign in for all models" row and the "Thinking level" submenu trigger.
      MODEL_OPTION: '[data-test-id^="bard-mode-option-"]',
      // The "Thinking level" submenu trigger inside the open mode menu.
      THINKING_LEVEL_ITEM: 'gem-menu-item[value="thinking_level"]',
      // Visible current-model label inside the picker button.
      CURRENT_MODEL_LABEL: '.input-area-switch-label',
    },

    // Storage keys
    STORAGE_KEY: 'betterGemini_defaultModel',
    STORAGE_KEY_EFFORT: 'betterGemini_thinkingLevel',

    // Timing
    RETRY_DELAY: 500,
    MAX_RETRIES: 10,
    MENU_OPEN_DELAY: 120,   // poll interval while waiting for a (sub)menu to render
    MENU_OPEN_TRIES: 12,    // ~1.4s max wait for a menu to open

    // Debug mode
    DEBUG: false,
  };

  // ============================================================================
  // UTILITIES
  // ============================================================================

  function log(message, data = null) {
    if (CONFIG.DEBUG) {
      const prefix = '[Better Gemini Default Model]';
      if (data !== null) console.log(prefix, message, data);
      else console.log(prefix, message);
    }
  }

  function logError(message, error = null) {
    const prefix = '[Better Gemini Default Model Error]';
    if (error) console.error(prefix, message, error);
    else console.error(prefix, message);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Strips optional leading "Gemini " and version token ("3.1 ", "3.5 ", "3.6 ", "3.8 ", "4 ") from a label.
  function stripVersionPrefix(text) {
    return String(text || '')
      .replace(/^\s*(?:gemini\s+)?(?:\d+(?:\.\d+)*\s+)?/i, '')
      .trim();
  }

  // True if `label` names `name` as its leading tier, NOT followed by a hyphen or
  // word character. This is what keeps "Flash" from matching "Flash-Lite" while
  // still matching "Flash All-around help" (and "Flash-Lite" matching itself).
  function nameMatches(label, name) {
    const stripped = stripVersionPrefix(label).toLowerCase();
    return new RegExp('^' + escapeRe(name.toLowerCase()) + '(?![-\\w])').test(stripped);
  }

  // ============================================================================
  // STATE
  // ============================================================================

  let currentPreferredModel = null;
  let currentPreferredEffort = null;
  let isApplying = false;
  let observer = null;
  let lastAppliedUrl = null;
  let urlModelOverride = null; // Model from URL query param

  // ============================================================================
  // URL QUERY PARAM HANDLING
  // ============================================================================

  /**
   * Gets the model from URL query parameter if present.
   * @returns {string|null} Model key or null
   */
  function getModelFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const model = urlParams.get('model');
      if (model && CONFIG.MODELS[model]) {
        log('Model from URL param:', model);
        return model;
      }
    } catch (error) {
      logError('Failed to parse URL for model param', error);
    }
    return null;
  }

  /**
   * Removes the model param from the URL without triggering navigation.
   */
  function cleanModelFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('model')) {
        url.searchParams.delete('model');
        history.replaceState(null, '', url.toString());
        log('Cleaned model param from URL');
      }
    } catch (error) {
      logError('Failed to clean model from URL', error);
    }
  }

  // ============================================================================
  // STORAGE
  // ============================================================================

  async function loadFromStorage(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        const result = await chrome.storage.sync.get(key);
        return result[key] || null;
      }
    } catch (error) {
      logError('Failed to load ' + key, error);
    }
    return null;
  }

  /**
   * Sets up a storage change listener for both the model and effort preferences.
   * Changing a preference re-applies immediately to the current tab.
   */
  function setupStorageListener() {
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;
        let changed = false;
        if (changes[CONFIG.STORAGE_KEY]) {
          currentPreferredModel = changes[CONFIG.STORAGE_KEY].newValue || null;
          changed = true;
        }
        if (changes[CONFIG.STORAGE_KEY_EFFORT]) {
          currentPreferredEffort = changes[CONFIG.STORAGE_KEY_EFFORT].newValue || null;
          changed = true;
        }
        if (changed) {
          log('Preferences changed', { model: currentPreferredModel, effort: currentPreferredEffort });
          // Allow re-application even though the URL hasn't changed.
          lastAppliedUrl = null;
          waitAndApplyModel();
        }
      });
    }
  }

  // ============================================================================
  // MODEL DETECTION & SELECTION
  // ============================================================================

  /**
   * Gets the currently selected model key, or null if unknown.
   */
  function getCurrentModel() {
    const button = document.querySelector(CONFIG.SELECTORS.MODEL_PICKER_BUTTON);
    if (!button) return null;

    // Prefer the accessible name ("Open mode picker, currently Flash"), then the
    // visible label element, then the button's raw text content.
    let text = (button.getAttribute('aria-label') || '').match(/currently\s+(.+)$/i)?.[1];
    if (!text) {
      const label = button.querySelector(CONFIG.SELECTORS.CURRENT_MODEL_LABEL);
      text = (label || button).textContent;
    }
    text = (text || '').trim();
    if (!text) return null;

    for (const [key, model] of Object.entries(CONFIG.MODELS)) {
      if (model.alias) continue; // only reverse-map to canonical keys
      if (nameMatches(text, model.name)) return key;
    }
    return null;
  }

  function isModelPickerAvailable() {
    return !!document.querySelector(CONFIG.SELECTORS.MODEL_PICKER_BUTTON);
  }

  /**
   * Whether the model picker menu is open (options visible). Keyed off the option
   * elements themselves so it never depends on a panel class.
   */
  function isModelMenuOpen() {
    return !!document.querySelector(CONFIG.SELECTORS.MODEL_OPTION);
  }

  /**
   * Opens the model picker menu, polling until the options render.
   * @returns {Promise<boolean>}
   */
  async function openModelPicker() {
    const pickerButton = document.querySelector(CONFIG.SELECTORS.MODEL_PICKER_BUTTON);
    if (!pickerButton) {
      log('Model picker button not found');
      return false;
    }
    if (isModelMenuOpen()) return true;

    pickerButton.click();
    for (let i = 0; i < CONFIG.MENU_OPEN_TRIES; i++) {
      await sleep(CONFIG.MENU_OPEN_DELAY);
      if (isModelMenuOpen()) return true;
    }
    return isModelMenuOpen();
  }

  /**
   * Checks whether a menu option is locked (e.g. requires Google Plus/pro/ultra).
   */
  function isOptionLocked(element) {
    if (!element) return true;
    if (element.getAttribute('aria-disabled') === 'true' || element.disabled) return true;
    if (element.classList.contains('disabled') || element.classList.contains('locked')) return true;
    const hasLockIcon = element.querySelector(
      'mat-icon, [data-icon*="lock"], [aria-label*="lock" i], svg'
    );
    if (hasLockIcon) {
      const lockText = (element.getAttribute('aria-label') || '') + ' ' + element.innerHTML;
      if (/lock/i.test(lockText)) return true;
    }
    return false;
  }

  /**
   * Finds the menu option element for a model key (menu must be open).
   */
  function findModelOption(modelKey) {
    const model = CONFIG.MODELS[modelKey];
    if (!model) return null;

    const options = Array.from(document.querySelectorAll(CONFIG.SELECTORS.MODEL_OPTION));
    let option = options.find(opt => nameMatches(opt.textContent || '', model.name) && !isOptionLocked(opt));

    // Fallback for UI variants: role-based menu items, excluding the sign-in row
    // and the "Thinking level" submenu trigger.
    if (!option) {
      const items = document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]');
      option = Array.from(items).find(opt => {
        const t = (opt.textContent || '').toLowerCase();
        if (t.includes('sign in') || t.includes('thinking level')) return false;
        return nameMatches(opt.textContent || '', model.name) && !isOptionLocked(opt);
      });
    }
    return option || null;
  }

  /**
   * Selects a model from the open menu.
   * @returns {boolean} True if an option was found and clicked.
   */
  function selectModel(modelKey) {
    const model = CONFIG.MODELS[modelKey];
    if (!model) {
      logError('Unknown model:', modelKey);
      return false;
    }
    const option = findModelOption(modelKey);
    if (!option) {
      logError('Model option not found (account may not offer it):', modelKey);
      return false;
    }
    option.click();
    log('Selected model:', model.name);
    return true;
  }

  /**
   * Closes the model picker if open.
   */
  function closeModelPicker() {
    if (!isModelMenuOpen()) return;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    setTimeout(() => {
      const overlay = document.querySelector('.cdk-overlay-backdrop');
      if (overlay) overlay.click();
      else if (isModelMenuOpen()) document.body.click();
    }, 50);
  }

  // ============================================================================
  // THINKING-LEVEL (EFFORT) DETECTION & SELECTION
  // ============================================================================

  /**
   * Finds the "Thinking level" submenu trigger inside the open mode menu.
   */
  function findThinkingLevelItem() {
    const byValue = document.querySelector(CONFIG.SELECTORS.THINKING_LEVEL_ITEM);
    if (byValue) return byValue;
    // Fallback by text if the `value` attribute changes.
    return Array.from(document.querySelectorAll('gem-menu-item, [role="menuitem"]'))
      .find(el => /thinking level/i.test(el.textContent || '')) || null;
  }

  /**
   * Reads the currently-selected effort from the "Thinking level X" label.
   * The mode menu must be open. Returns an effort key or null.
   */
  function getCurrentEffortFromMenu() {
    const item = findThinkingLevelItem();
    if (!item) return null;
    const after = (item.textContent || '').replace(/^\s*thinking level/i, '').trim();
    for (const [key, effort] of Object.entries(CONFIG.EFFORTS)) {
      if (nameMatches(after, effort.name)) return key;
    }
    return null;
  }

  /**
   * Finds an effort option inside the open thinking-level submenu.
   */
  function findEffortOption(effortKey) {
    const effort = CONFIG.EFFORTS[effortKey];
    if (!effort) return null;
    const items = Array.from(document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]'));
    return items.find(el => {
      const t = (el.textContent || '').trim();
      if (/thinking level/i.test(t)) return false; // exclude the parent trigger
      return new RegExp('^' + escapeRe(effort.name.toLowerCase()) + '(?![-\\w])').test(t.toLowerCase());
    }) || null;
  }

  /**
   * Applies the preferred thinking-effort level. Opens its own menu session
   * (model selection closes the menu). No-ops gracefully when the control is
   * absent for the current model/account.
   * @returns {Promise<boolean>} True if already correct or successfully changed.
   */
  async function applyEffort(effortKey) {
    const effort = CONFIG.EFFORTS[effortKey];
    if (!effort) return false;

    if (!(await openModelPicker())) {
      log('Could not open menu to set effort');
      return false;
    }
    await sleep(50);

    const trigger = findThinkingLevelItem();
    if (!trigger) {
      log('Thinking level control not present; skipping effort');
      closeModelPicker();
      return false;
    }

    if (getCurrentEffortFromMenu() === effortKey) {
      log('Effort already set to', effortKey);
      closeModelPicker();
      return true;
    }

    // Expand the submenu, then wait for the effort options to render.
    if (trigger.getAttribute('aria-expanded') !== 'true') {
      trigger.click();
    }
    let option = null;
    for (let i = 0; i < CONFIG.MENU_OPEN_TRIES; i++) {
      await sleep(CONFIG.MENU_OPEN_DELAY);
      option = findEffortOption(effortKey);
      if (option) break;
    }
    if (!option) {
      logError('Effort option not found:', effortKey);
      closeModelPicker();
      return false;
    }
    option.click();
    log('Selected effort:', effort.name);
    setTimeout(closeModelPicker, 100);
    return true;
  }

  // ============================================================================
  // MAIN LOGIC
  // ============================================================================

  /**
   * The model to apply (URL override takes precedence over the stored preference).
   */
  function getEffectiveModel() {
    if (urlModelOverride) return urlModelOverride;
    return currentPreferredModel;
  }

  /**
   * Applies the preferred model and thinking-effort level if needed.
   * @returns {Promise<boolean>} True if anything was changed.
   */
  async function applyDefaults() {
    const targetModel = getEffectiveModel();
    const targetEffort = currentPreferredEffort;

    if (!targetModel && !targetEffort) {
      log('Nothing to apply (no preferred model or effort)');
      return false;
    }
    if (isApplying) {
      log('Already applying, skipping');
      return false;
    }
    if (!isModelPickerAvailable()) {
      log('Model picker not available yet');
      return false;
    }

    const currentUrl = window.location.href;
    if (!urlModelOverride && lastAppliedUrl === currentUrl) {
      log('Already applied for this URL');
      return false;
    }

    isApplying = true;
    let didSomething = false;

    try {
      // 1) Model — only touch the picker when a change is actually needed.
      if (targetModel && CONFIG.MODELS[targetModel]) {
        const currentModel = getCurrentModel();
        log('Model current/target:', currentModel, targetModel);
        if (currentModel !== targetModel) {
          if (await openModelPicker()) {
            await sleep(50);
            if (selectModel(targetModel)) {
              didSomething = true;
              await sleep(300); // let Gemini commit the selection (closes the menu)
            }
            closeModelPicker();
            await sleep(200);
          } else {
            logError('Failed to open model picker');
          }
        }
      }

      // 2) Thinking-effort level — separate menu session.
      if (targetEffort && CONFIG.EFFORTS[targetEffort]) {
        if (await applyEffort(targetEffort)) didSomething = true;
        await sleep(150);
      }

      lastAppliedUrl = currentUrl;
      log('Applied defaults', { model: targetModel, effort: targetEffort, changed: didSomething });

      if (urlModelOverride) {
        cleanModelFromUrl();
        urlModelOverride = null;
      }
      return didSomething;

    } catch (error) {
      logError('Error applying defaults', error);
      closeModelPicker();
      return false;
    } finally {
      isApplying = false;
    }
  }

  // Back-compat alias.
  const applyDefaultModel = applyDefaults;

  /**
   * Waits for the model picker to be available, then applies the defaults.
   */
  async function waitAndApplyModel(retries = CONFIG.MAX_RETRIES) {
    if (retries <= 0) {
      log('Max retries reached, giving up');
      return;
    }
    if (!currentPreferredModel && !currentPreferredEffort) {
      log('No preferences configured');
      return;
    }
    if (isModelPickerAvailable()) {
      await applyDefaults();
    } else {
      log('Model picker not ready, retrying...', retries - 1);
      setTimeout(() => waitAndApplyModel(retries - 1), CONFIG.RETRY_DELAY);
    }
  }

  // ============================================================================
  // NAVIGATION OBSERVER
  // ============================================================================

  function setupNavigationObserver() {
    let lastUrl = window.location.href;

    const originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(history, arguments);
      handleNavigation();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      handleNavigation();
    };

    window.addEventListener('popstate', handleNavigation);

    observer = new MutationObserver((mutations) => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        handleNavigation();
        return;
      }

      // Re-apply when the model picker button (re)appears.
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches?.(CONFIG.SELECTORS.MODEL_PICKER_BUTTON) ||
                node.querySelector?.(CONFIG.SELECTORS.MODEL_PICKER_BUTTON)) {
                log('Model picker appeared');
                waitAndApplyModel();
                return;
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function handleNavigation() {
      log('Navigation detected');
      lastAppliedUrl = null;
      urlModelOverride = getModelFromUrl();
      setTimeout(() => waitAndApplyModel(), 500);
    }

    log('Navigation observer set up');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    currentPreferredModel = null;
    currentPreferredEffort = null;
    urlModelOverride = null;
    isApplying = false;
    lastAppliedUrl = null;
    log('Default model feature destroyed');
  }

  async function init() {
    log('Initializing Default Model feature');

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      logError('Not in browser context, skipping initialization');
      return;
    }
    if (!window.location.hostname.includes('gemini.google.com')) {
      log('Not on Gemini, skipping initialization');
      return;
    }

    urlModelOverride = getModelFromUrl();
    if (urlModelOverride) log('URL model override:', urlModelOverride);

    currentPreferredModel = await loadFromStorage(CONFIG.STORAGE_KEY);
    currentPreferredEffort = await loadFromStorage(CONFIG.STORAGE_KEY_EFFORT);
    log('Loaded preferences', { model: currentPreferredModel, effort: currentPreferredEffort });

    setupStorageListener();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeFeature);
    } else {
      initializeFeature();
    }
  }

  function initializeFeature() {
    setupNavigationObserver();
    setTimeout(() => waitAndApplyModel(), 1000);
    log('Default Model feature initialized');
  }

  // ============================================================================
  // EXPORTS
  // ============================================================================

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      init,
      destroy,
      CONFIG,
      getCurrentModel,
      applyDefaults,
      applyDefaultModel,
      nameMatches,
      stripVersionPrefix,
    };
  }

  if (typeof window !== 'undefined') {
    window.BetterGeminiDefaultModel = {
      init,
      destroy,
      getCurrentModel,
      applyDefaults,
      applyDefaultModel,
      applyEffort,
      getModelFromUrl,
      // Exposed for debugging / testing
      getPreferredModel: () => currentPreferredModel,
      setPreferredModel: (model) => { currentPreferredModel = model; },
      getPreferredEffort: () => currentPreferredEffort,
      setPreferredEffort: (effort) => { currentPreferredEffort = effort; },
      getCurrentEffortFromMenu,
      getUrlOverride: () => urlModelOverride,
      setUrlOverride: (model) => { urlModelOverride = model; },
    };
  }

})();
