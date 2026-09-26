# Better Gemini (Community Fork)

> **Note**: This project is a community fork of the original [Better Gemini](https://github.com/balakumardev/better-gemini) by [balakumardev](https://github.com/balakumardev).

A browser extension that enhances Google Gemini with wider chat layout, Markdown export, keyboard shortcuts, automatic model selection, and omnibox quick launch.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange.svg)](https://addons.mozilla.org/en-US/firefox/addon/better-gemini-fork-wide-ui/)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-brightgreen.svg)](#privacy--permissions)

---

## Features

- **Wide Chat Layout**: Expands chat width to 98% of the screen for better readability of code and tables.
- **Export to Markdown**: Copy individual responses as Markdown or export the entire session.
- **40+ Keyboard Shortcuts**: Power-user shortcuts with an in-app help overlay (`Ctrl+Shift+?` / `Cmd+Shift+?`).
- **Default Model Selector**: Automatically switch to your preferred model (Flash-Lite, Flash, Thinking, Pro) and reasoning effort.
- **Omnibox Quick Launch**: Type `gem` in the address bar, press `Tab`, and submit queries directly to Gemini.
- **Extension Popup & Options**: Easily toggle features and manage settings.

---

<details>
<summary><strong>View Keyboard Shortcuts Reference</strong> (Press <code>Cmd/Ctrl + Shift + ?</code> on Gemini to view in-app)</summary>

<br>

| Category             | Shortcut                       | Description                    |
| :------------------- | :----------------------------- | :----------------------------- |
| **Chat Management**  | `Ctrl/Cmd + Shift + O`         | Open new chat                  |
|                      | `Ctrl/Cmd + Shift + Backspace` | Delete current chat            |
|                      | `Ctrl/Cmd + B`                 | Toggle sidebar                 |
|                      | `Alt + 1-9`                    | Jump to nth chat in sidebar    |
|                      | `Ctrl/Cmd + Shift + =`         | Next chat                      |
|                      | `Ctrl/Cmd + Shift + -`         | Previous chat                  |
| **Text & Input**     | `Shift + Esc`                  | Focus prompt input             |
|                      | `Ctrl/Cmd + Shift + E`         | Edit last prompt               |
|                      | `Ctrl/Cmd + Shift + C`         | Copy last response             |
|                      | `Ctrl/Cmd + Shift + ;`         | Copy last code block           |
|                      | `Ctrl/Cmd + Shift + '`         | Copy second-to-last code block |
|                      | `Ctrl/Cmd + Shift + K`         | Stop / resume generation       |
| **Draft Navigation** | `Ctrl/Cmd + Shift + D`         | Generate more drafts           |
|                      | `Ctrl/Cmd + Shift + ,`         | Previous draft                 |
|                      | `Ctrl/Cmd + Shift + .`         | Next draft                     |
| **Sharing & Audio**  | `Ctrl/Cmd + Shift + L`         | Copy response link             |
|                      | `Ctrl/Cmd + Shift + M`         | Copy chat share link           |
|                      | `Ctrl/Cmd + Shift + Y`         | Play / pause audio             |
|                      | `Ctrl/Cmd + Shift + S`         | Toggle microphone input        |
|                      | `Ctrl/Cmd + O`                 | Open file upload dialog        |

</details>

---

## Installation

### Chrome / Chromium Browsers

1. Clone or download this repository.
2. Go to `chrome://extensions/` and enable **Developer Mode**.
3. Click **Load unpacked** and select the `better-gemini` directory.

### Firefox

- **Install from Firefox Add-ons:** [Better Gemini Fork on AMO](https://addons.mozilla.org/en-US/firefox/addon/better-gemini-fork-wide-ui/)
- **Or Load Temporarily for Development:**
  1. Go to `about:debugging#/runtime/this-firefox`.
  2. Click **Load Temporary Add-on...** and select `firefox/manifest.json`.

---

## Usage

1. Focus the address bar (`Ctrl+L` or `Cmd+L`).
2. Type `gem` and press `Tab` or `Space`.
3. Enter your prompt and press `Enter`.

### Tab Controls

- `Enter` — Open in current tab
- `Alt + Enter` — Open in new foreground tab
- `Ctrl + Enter` — Open in new background tab

---

## Testing & Development

```bash
cd tests
npm install
npm test              # Unit & integration tests
npm run test:e2e      # Playwright E2E tests
npm run test:coverage # Coverage report
```

---

## Project Structure

```
better-gemini/
├── manifest.json              # Extension Manifest V3
├── background.js              # Service worker (omnibox handler)
├── config.js                  # Selectors and configuration
├── content/
│   ├── injector.js            # Content script entrypoint
│   ├── feature-loader.js      # Feature lifecycle manager
│   └── features/              # Modular feature scripts
├── popup/                     # Toolbar popup UI
├── options/                   # Options settings dashboard
├── firefox/                   # Firefox build adaptation
├── icons/                     # Extension branding icons
└── tests/                     # Test suite
```

---

## Privacy & Permissions

- **Zero Data Collection**: No telemetry or external tracking.
- **Local Storage Only**: All settings are saved locally in the browser.
- **Narrow Scope**: Runs exclusively on `https://gemini.google.com/*`.

| Permission  | Purpose                                          |
| :---------- | :----------------------------------------------- |
| `activeTab` | Access active Gemini tab for feature injection.  |
| `scripting` | Inject custom UI elements and shortcut handlers. |
| `storage`   | Store user settings locally.                     |

---

## License & Credits

- Originally created by **[Bala Kumar](https://balakumar.dev)** ([original repository](https://github.com/balakumardev/better-gemini)).
- Fork maintained by **[Jayant Gade](https://github.com/Jayant-Gade)**.
- Licensed under the [MIT License](LICENSE).
