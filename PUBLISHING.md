# Better Gemini Fork - Chrome Web Store Publishing Guide

## Store Listing Details

### Extension Name
```
Better Gemini (Community Fork)
```

### Short Description (132 characters max)
```
Supercharge Google Gemini with wider chat, keyboard shortcuts, Markdown export, and auto model selection. Power-user features for AI.
```

### Detailed Description (Plain text, no Markdown/HTML)
```
Better Gemini Fork transforms your Google Gemini experience with powerful features that serious AI users have been asking for.

FEATURES:

Wider Chat Layout
Expands the narrow default chat width to use 98% of your screen. No more squinting at tiny columns - enjoy full-width responses, especially for code and tables. Inspired by Wide Gemini X.

Export as Markdown
One-click "MD" button on every response to copy it as properly formatted Markdown. Export entire conversations with a floating button - download as .md files or copy to clipboard instantly.

Power-User Keyboard Shortcuts
40+ keyboard shortcuts for the Gemini power user:
- Cmd/Ctrl+Shift+O: New chat
- Cmd/Ctrl+B: Toggle sidebar
- Cmd/Ctrl+Shift+C: Copy last response
- Cmd/Ctrl+Shift+;: Copy last code block
- Alt+1-9: Quick-switch between chats
- Press Cmd/Ctrl+Shift+? to see all shortcuts

Default Model Selection
Automatically switch to your preferred model (Flash, Thinking, or Pro) on every chat. No more manually selecting your favorite model each time.

Omnibox Quick Launch
Type "gem" in your address bar, press Tab, then type your prompt. Hit Enter to launch Gemini with your query pre-filled and auto-submitted.

PRIVACY FIRST:
- No data collection
- No external servers
- All settings stored locally in your browser
- Open source on GitHub

PERMISSIONS EXPLAINED:
- activeTab: To inject features into the Gemini page you're viewing
- scripting: To add UI elements like the Export button and shortcuts
- storage: To save your preferences locally

Works exclusively on gemini.google.com - this extension only activates on Google Gemini.

Fork maintained by Jayant Gade | Originally created by Bala Kumar (balakumar.dev)
```

### Category
```
Productivity
```

### Language
```
English
```

---

## Permission Justifications

| Permission | Justification |
|------------|---------------|
| `activeTab` | Required to inject content scripts into the current Gemini tab when the user interacts. This is the most privacy-respecting way to access page content - it only works on the active tab when triggered by user action. |
| `scripting` | Required to programmatically inject CSS and JS for features like wider chat layout, floating export button, and keyboard shortcuts. Cannot be avoided for content script functionality. |
| `storage` | Required to persist user preferences (which features are enabled, default model choice) across browser sessions using chrome.storage.sync. No external servers - all data stays in the browser. |

### Host Permission
| Host | Justification |
|------|---------------|
| `https://gemini.google.com/*` | The extension only works on Google Gemini. This narrow scope means it cannot access any other websites, protecting user privacy. |

---

## Required Assets

### Icons (Already Present)
- `icons/icon16.png` - 16x16 px (toolbar)
- `icons/icon48.png` - 48x48 px (extensions page)
- `icons/icon128.png` - 128x128 px (Chrome Web Store)

### Screenshots Needed (1280x800 or 640x400)
Create screenshots showing:
1. **Wider Chat** - Before/after comparison of chat width
2. **Export Button** - Floating "Export Chat" button in action
3. **Keyboard Shortcuts** - The help popup (Cmd+Shift+?)
4. **Popup UI** - The extension popup with toggles
5. **Options Page** - The full settings page

### Promotional Images (Optional but Recommended)
- Small tile: 440x280 px
- Large tile: 920x680 px
- Marquee: 1400x560 px

---

## Publishing Steps

### 1. Prepare the Package

```bash
# From the better-gemini directory, create a ZIP excluding dev files
cd /Users/bkumara/personal/better-gemini
zip -r better-gemini-v1.0.0.zip . \
  -x "*.git*" \
  -x "tests/*" \
  -x "scripts/*" \
  -x "*.md" \
  -x "*.sh" \
  -x ".DS_Store" \
  -x "node_modules/*"
```

### 2. Chrome Web Store Developer Dashboard

1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Pay the one-time $5 developer registration fee (if not already paid)

### 3. Create New Item

1. Click "New Item"
2. Upload the ZIP file created in step 1
3. Fill in the store listing:
   - **Name**: Better Gemini (Community Fork)
   - **Summary**: Use the short description above
   - **Description**: Use the detailed description above
   - **Category**: Productivity
   - **Language**: English

### 4. Upload Assets

1. Upload all required screenshots (min 1, max 5)
2. Upload promotional images if prepared
3. Set the primary category

### 5. Privacy Practices

Fill out the privacy section:
- **Single Purpose**: Enhance Google Gemini with productivity features (wider chat, export, shortcuts, model selection)
- **Permission Justifications**: Copy from the table above
- **Data Usage**:
  - Does not collect user data
  - Does not transmit data to external servers
  - All storage is local to the browser

### 6. Distribution

- **Visibility**: Public
- **Regions**: All regions
- **Mature content**: No

### 7. Submit for Review

1. Review all entered information
2. Accept the Developer Agreement
3. Click "Submit for Review"

**Expected Review Time**: 1-3 business days

---

## Post-Publish Checklist

- [ ] Verify extension installs correctly from the store
- [ ] Test all features work in the published version
- [ ] Monitor the Reviews section for user feedback
- [ ] Set up analytics (optional) for install tracking

---

## Version History

### v1.0.0 (Initial Release)
- Wider chat layout (98% width)
- Copy as Markdown (per-response)
- Export full chat as Markdown
- 40+ keyboard shortcuts
- Default model selection
- Omnibox quick launch (type "gem")
- Popup quick toggles
- Full options page
