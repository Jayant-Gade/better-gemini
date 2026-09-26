/**
 * Chrome API Mock for Unit Tests
 * Provides a comprehensive mock of the Chrome Extension APIs
 */

/**
 * Creates a mock storage area
 */
function createStorageArea() {
  let data = {};

  // Implementation functions
  const getImpl = (keys, callback) => {
    if (typeof keys === "function") {
      callback = keys;
      keys = null;
    }
    const result = keys
      ? Object.fromEntries(
          (Array.isArray(keys) ? keys : [keys])
            .filter((k) => k in data)
            .map((k) => [k, data[k]]),
        )
      : { ...data };
    if (callback) callback(result);
    return Promise.resolve(result);
  };

  const setImpl = (items, callback) => {
    Object.assign(data, items);
    if (callback) callback();
    return Promise.resolve();
  };

  const removeImpl = (keys, callback) => {
    (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete data[k]);
    if (callback) callback();
    return Promise.resolve();
  };

  const clearImpl = (callback) => {
    data = {};
    if (callback) callback();
    return Promise.resolve();
  };

  const mock = {
    get: jest.fn(getImpl),
    set: jest.fn(setImpl),
    remove: jest.fn(removeImpl),
    clear: jest.fn(clearImpl),
    _getData: () => data,
    _setData: (newData) => {
      data = newData;
    },
    _reset: () => {
      data = {};
      mock.get.mockClear();
      mock.set.mockClear();
      mock.remove.mockClear();
      mock.clear.mockClear();
      // Re-apply implementations
      mock.get.mockImplementation(getImpl);
      mock.set.mockImplementation(setImpl);
      mock.remove.mockImplementation(removeImpl);
      mock.clear.mockImplementation(clearImpl);
    },
  };

  return mock;
}

/**
 * Creates mock tabs API
 */
function createTabsMock() {
  let tabs = [{ id: 1, url: "https://example.com", active: true, windowId: 1 }];

  // Implementation functions (not mocks)
  const createImpl = async (options) => {
    const newTab = { id: tabs.length + 1, ...options, windowId: 1 };
    tabs.push(newTab);
    return newTab;
  };

  const updateImpl = async (tabId, updateProperties) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) Object.assign(tab, updateProperties);
    return tab;
  };

  const queryImpl = async (queryInfo) => {
    const result = tabs.filter((tab) => {
      if (queryInfo.active !== undefined && tab.active !== queryInfo.active)
        return false;
      if (queryInfo.currentWindow && tab.windowId !== 1) return false;
      return true;
    });
    return result;
  };

  const getImpl = async (tabId) => tabs.find((t) => t.id === tabId);

  const removeImpl = async (tabId) => {
    tabs = tabs.filter((t) => t.id !== tabId);
  };

  const mock = {
    create: jest.fn(createImpl),
    update: jest.fn(updateImpl),
    query: jest.fn(queryImpl),
    get: jest.fn(getImpl),
    remove: jest.fn(removeImpl),
    _getTabs: () => tabs,
    _setTabs: (newTabs) => {
      tabs = newTabs;
    },
    _reset: () => {
      tabs = [{ id: 1, url: "https://example.com", active: true, windowId: 1 }];
      // Clear call history but keep implementation
      mock.create.mockClear();
      mock.update.mockClear();
      mock.query.mockClear();
      mock.get.mockClear();
      mock.remove.mockClear();
      // Re-apply implementations
      mock.create.mockImplementation(createImpl);
      mock.update.mockImplementation(updateImpl);
      mock.query.mockImplementation(queryImpl);
      mock.get.mockImplementation(getImpl);
      mock.remove.mockImplementation(removeImpl);
    },
  };

  return mock;
}

/**
 * Creates mock omnibox API
 */
function createOmniboxMock() {
  const listeners = {
    onInputChanged: [],
    onInputEntered: [],
    onInputStarted: [],
    onInputCancelled: [],
  };

  return {
    setDefaultSuggestion: jest.fn(),
    onInputChanged: {
      addListener: jest.fn((callback) =>
        listeners.onInputChanged.push(callback),
      ),
      removeListener: jest.fn((callback) => {
        const idx = listeners.onInputChanged.indexOf(callback);
        if (idx > -1) listeners.onInputChanged.splice(idx, 1);
      }),
      _trigger: (text, suggest) =>
        listeners.onInputChanged.forEach((cb) => cb(text, suggest)),
    },
    onInputEntered: {
      addListener: jest.fn((callback) =>
        listeners.onInputEntered.push(callback),
      ),
      removeListener: jest.fn((callback) => {
        const idx = listeners.onInputEntered.indexOf(callback);
        if (idx > -1) listeners.onInputEntered.splice(idx, 1);
      }),
      _trigger: (text, disposition) =>
        listeners.onInputEntered.forEach((cb) => cb(text, disposition)),
    },
    onInputStarted: {
      addListener: jest.fn((callback) =>
        listeners.onInputStarted.push(callback),
      ),
    },
    onInputCancelled: {
      addListener: jest.fn((callback) =>
        listeners.onInputCancelled.push(callback),
      ),
    },
    _reset: () => {
      Object.keys(listeners).forEach((k) => {
        listeners[k] = [];
      });
    },
  };
}

/**
 * Creates mock runtime API
 */
function createRuntimeMock() {
  const messageListeners = [];
  const installedListeners = [];

  return {
    getManifest: jest.fn(() => ({
      name: "Better Gemini",
      version: "1.1.0",
      manifest_version: 3,
    })),
    onMessage: {
      addListener: jest.fn((callback) => messageListeners.push(callback)),
      removeListener: jest.fn((callback) => {
        const idx = messageListeners.indexOf(callback);
        if (idx > -1) messageListeners.splice(idx, 1);
      }),
      _trigger: (message, sender, sendResponse) =>
        messageListeners.forEach((cb) => cb(message, sender, sendResponse)),
    },
    onInstalled: {
      addListener: jest.fn((callback) => installedListeners.push(callback)),
      _trigger: (details) => installedListeners.forEach((cb) => cb(details)),
    },
    sendMessage: jest.fn(async (message) => ({ received: true })),
    _reset: () => {
      messageListeners.length = 0;
      installedListeners.length = 0;
    },
  };
}

/**
 * Complete Chrome API Mock
 */
const chromeMock = {
  storage: {
    local: createStorageArea(),
    sync: createStorageArea(),
    session: createStorageArea(),
  },
  tabs: createTabsMock(),
  omnibox: createOmniboxMock(),
  runtime: createRuntimeMock(),
  scripting: {
    executeScript: jest.fn(async () => [{ result: true }]),
    insertCSS: jest.fn(async () => {}),
    removeCSS: jest.fn(async () => {}),
  },

  /**
   * Resets all mocks to initial state
   */
  reset() {
    // Reset internal state first (before clearing mocks)
    this.storage.local._reset();
    this.storage.sync._reset();
    this.storage.session._reset();
    this.tabs._reset();
    this.omnibox._reset();
    this.runtime._reset();
    // Note: Don't call jest.clearAllMocks() here as it clears mock implementations
    // Individual _reset() methods handle clearing their own mocks
  },
};

module.exports = {
  chromeMock,
  createStorageArea,
  createTabsMock,
  createOmniboxMock,
  createRuntimeMock,
};
