# VibeReader UI Architecture

## Overview
VibeReader transforms any webpage into a **90s cyberpunk retrofuture reading experience** using a **non-destructive overlay system**. The architecture consists of three main components: **Hidden Tab Proxy**, **Visible Tab Controller**, and **Background Manager**.

## Core UI Architecture

### 1. Hidden Tab Proxy System
**File**: `stealth-extractor.js` (injected into hidden tab)
- **Purpose**: Clean content extraction without page interference
- **Operation**: Creates invisible background tab for Readability.js processing
- **Benefits**: Zero DOM pollution, perfect content isolation, framework compatibility

### 2. Visible Tab Controller  
**File**: `proxy-controller.js` (injected into visible tab)
- **Purpose**: Cyberpunk UI overlay management
- **Operation**: Fullscreen reader interface with terminal diagnostics
- **Features**: 90s retrofuture styling, dual terminal system, media handling

### 3. Background Manager
**File**: `background-enhanced.js` (service worker)
- **Purpose**: Message routing and tab lifecycle management
- **Operation**: Coordinates communication between hidden/visible tabs
- **Features**: WeakMap memory management, timer cleanup, error handling

---

## UI Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USER CLICK    │    │  HIDDEN TAB     │    │  VISIBLE TAB    │
│ Ctrl+Shift+M    │───▶│  (Extraction)   │───▶│  (UI Overlay)   │
│   or Button     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ BACKGROUND.JS   │    │ stealth-        │    │ proxy-          │
│ Message Router  │    │ extractor.js    │    │ controller.js   │
│ Tab Manager     │    │ Readability.js  │    │ Terminal UI     │
│ Memory Cleanup  │    │ Framework Wait  │    │ Theme System    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Message Flow Architecture

### Activation Sequence
```javascript
1. USER TRIGGER (Ctrl+Shift+M)
   ↓
2. BACKGROUND: createHiddenTab()
   ↓  
3. BACKGROUND: injectScript(stealth-extractor.js)
   ↓
4. HIDDEN TAB: waitForScriptReady() verification
   ↓
5. HIDDEN TAB: extract content via Readability.js
   ↓
6. BACKGROUND: forward extracted content  
   ↓
7. VISIBLE TAB: render cyberpunk UI overlay
   ↓
8. TERMINAL SYSTEM: activate dual diagnostics
```

### Message Types & Handlers

#### Background → Hidden Tab
```javascript
{
  action: 'EXTRACT_CONTENT',
  url: currentUrl,
  settings: userSettings,
  tabInfo: { id, windowId }
}
```

#### Hidden Tab → Background  
```javascript
{
  action: 'CONTENT_EXTRACTED', 
  success: true,
  data: {
    title: extractedTitle,
    content: cleanHTML,
    byline: author,
    length: wordCount,
    siteName: domain
  },
  performance: timingMetrics
}
```

#### Background → Visible Tab
```javascript
{
  action: 'ACTIVATE_READER',
  extractedData: contentObject,
  settings: themeSettings,
  tabId: sourceTabId
}
```

---

## Terminal Diagnostic System

### SYSADMIN Terminal (Left Panel)
**Purpose**: Content extraction status and system diagnostics
```javascript
MESSAGE_CATEGORIES = {
  SYSTEM: ['LOG:', '✅', 'initialized', 'activated'],
  ERRORS: ['ERR:', '❌', 'failed', 'error'],
  MEDIA: ['MEDIA', '🔍', 'images', 'videos', '📦']
}
```

**Sample Output**:
```
[12:34:56] ✅ CYBER READER v2.0.0 INITIALIZED
[12:34:57] LOG: Content extraction successful
[12:34:58] MEDIA: Found 12 images, 2 videos  
[12:34:59] ✅ Reader mode activated
```

### NETMON Terminal (Right Panel)  
**Purpose**: Network activity and background processes
```javascript
MESSAGE_CATEGORIES = {
  NETWORK: ['BG:', 'extraction', 'proxy', 'NETMON'],
  ASCII: ['ASCII', '🎯', 'conversion', 'aalib', '🎨'],
  FRAMEWORK: ['React', 'Vue', 'Angular', 'Next.js', 'hydration']
}
```

**Sample Output**:
```
[12:34:56] BG: Hidden tab created (ID: 1847)
[12:34:57] NETMON: Framework detected: React
[12:34:58] BG: Extraction proxy established  
[12:34:59] 🎯 ASCII conversion initialized
```

---

## Theme System Architecture

### CSS Variable System
**File**: `styles/matrix-theme.css`
```css
:root {
  /* Semantic Color Roles */
  --primary-neon: #ff00ff;      /* Main accent color */
  --secondary-neon: #00ffff;    /* Secondary accent */  
  --bg-dark: #0a0a0a;          /* Background base */
  --text-primary: #ffffff;     /* Primary text */
  --terminal-green: #00ff41;   /* Terminal text */
}
```

### Theme Switching Flow
```javascript
1. User clicks theme button
   ↓
2. proxy-controller.js: cycleTheme()
   ↓  
3. Update CSS custom properties
   ↓
4. browser.storage.sync.set({theme: newTheme})
   ↓
5. Apply new color scheme instantly
```

### Available Themes
1. **Nightdrive Enhanced**: Neon pink/cyan + Orbitron font
2. **Neon Surge**: Electric pink/blue + Fira Code font  
3. **Outrun Storm**: Purple/orange + Fira Code font
4. **Strange Days**: Phantom pink/lime + Orbitron font

---

## Media Handling System

### Three-Mode Media Display
```javascript
MEDIA_MODES = {
  'emoji': '📷 [IMAGE]',     // Emoji placeholders
  'ascii': convertToASCII,   // aalib.js conversion
  'normal': loadAllMedia     // Direct loading
}
```

### ASCII Conversion Pipeline
**Library**: `lib/aalib.js` (RxJS v5.4.3 + Observable pattern)
```javascript
1. Image detected in content
   ↓
2. aalib.js: convert to ASCII art  
   ↓
3. Calculate aspect ratio dimensions
   ↓
4. Render ASCII as HTML elements
   ↓  
5. Apply cyberpunk ASCII styling
```

### Media Wrapper CSS System  
**Problem**: ASCII art needs pixel-perfect container sizing
**Solution**: Dynamic DOM measurement after aalib.js rendering
```javascript
// ASCII dimensions calculated from original aspect ratio
const asciiWrapper = document.createElement('div');
asciiWrapper.className = 'ascii-media-wrapper';
// aalib.js outputs HTML elements, allowing direct measurement
asciiWrapper.style.width = `${ascii.offsetWidth}px`;
asciiWrapper.style.height = `${ascii.offsetHeight}px`;
```

---

## Component Interaction Patterns

### WeakMap Memory Management
```javascript
// background-enhanced.js
const tabDataRegistry = new WeakMap();

tabDataRegistry.set(tabReference, {
  performanceMetrics: {},
  settings: userConfig,
  timers: new Set(),        // Track all active timers
  extractionData: {},
  proxyConnection: null
});
```

### Script Readiness Verification
```javascript
// Prevents race conditions during activation
async waitForScriptReady(tabId, expectedType, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await browser.tabs.sendMessage(tabId, {
        action: 'PING',
        expectedType: expectedType  // 'extractor' or 'proxy'
      });
      if (response?.scriptType === expectedType) {
        return true;  // Script ready and responsive
      }
    } catch (error) {
      // Script not ready, continue retrying
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return false;  // Failed to verify readiness
}
```

### Framework Detection System
```javascript
// stealth-extractor.js - Wait for SPA hydration
const FRAMEWORK_PATTERNS = {
  'React': () => window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
  'Vue': () => window.Vue || document.querySelector('[data-v-]'),
  'Angular': () => window.ng || document.querySelector('[ng-app]'),
  'Next.js': () => window.__NEXT_DATA__ || window.__NEXT_LOADED_PAGES__,
  'Svelte': () => document.querySelector('[class*="svelte-"]')
};

async function waitForFramework() {
  // Detection logic with timeout fallback
  // Ensures content extraction after SPA is fully loaded
}
```

---

## Error Handling & Recovery

### Comprehensive Cleanup System
```javascript
// Triggered on deactivation, tab closure, or errors
function performCleanup(tabId, reason) {
  const tabData = tabDataRegistry.get(tabReference);
  if (tabData) {
    // Clear all active timers
    tabData.timers.forEach(timer => clearTimeout(timer));
    tabData.timers.clear();
    
    // Close hidden tabs
    if (tabData.hiddenTabId) {
      browser.tabs.remove(tabData.hiddenTabId);
    }
    
    // Remove event listeners
    // Clear WeakMap entry automatically handled by GC
  }
}
```

### Context-Aware Error Messages
```javascript
ERROR_CONTEXTS = {
  'EXTRACTION_FAILED': 'Content could not be extracted. Try refreshing the page.',
  'SCRIPT_INJECTION_FAILED': 'Extension scripts blocked. Check site permissions.',
  'FRAMEWORK_TIMEOUT': 'Page still loading. Wait a moment and try again.',
  'HIDDEN_TAB_ERROR': 'Background processing failed. Extension may need restart.'
}
```

---

## Performance Optimization

### Lazy Loading Patterns
```javascript
// Only load heavy libraries when needed
async function loadASCIIConverter() {
  if (!window.aalib) {
    await import('./lib/aalib.js');
  }
  return window.aalib;
}
```

### Efficient Message Filtering
```javascript
// Terminal system processes only relevant messages
function categorizeMessage(text) {
  for (const [category, keywords] of Object.entries(MESSAGE_CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  return 'UNCATEGORIZED';
}
```

### CSS Isolation Strategy
```javascript
// Maximum z-index with complete CSS isolation
const READER_OVERLAY = {
  zIndex: '2147483647',           // Maximum possible z-index
  position: 'fixed',
  isolation: 'isolate',           // Create new stacking context
  contain: 'layout style paint'   // Optimize rendering performance
}
```

---

## Development Debugging

### Verbose Terminal Output
**Command**: `web-ext run --verbose --devtools --browser-console`
- **Terminal Logging**: Real-time extension activity via `dump()` function
- **SYSADMIN Messages**: Content extraction status and system events  
- **NETMON Messages**: Background processes and network activity
- **Error Context**: Detailed error descriptions with troubleshooting hints

### Message Flow Visualization
```bash
# View deduplicated log output with counts
sort dump.log | uniq -c
```

### Key Debug Points
1. **Script Injection**: Verify hidden/visible tab script readiness
2. **Content Extraction**: Monitor Readability.js success/failure  
3. **Framework Detection**: Check SPA hydration completion
4. **Memory Management**: Confirm proper timer and resource cleanup
5. **UI Rendering**: Validate theme switching and terminal updates

---

## Future Architecture Enhancements

### Plugin System Foundation
```javascript
// Extensible architecture for future plugins
const PLUGIN_HOOKS = {
  'beforeExtraction': [],
  'afterExtraction': [], 
  'beforeRender': [],
  'afterRender': [],
  'onThemeChange': []
};
```

### Service Integration Framework
```javascript
// Planned integrations: Obsidian, Raindrop.io, etc.
const SERVICE_ADAPTERS = {
  'obsidian': ObsidianAdapter,
  'raindrop': RaindropAdapter,
  'readwise': ReadwiseAdapter
};
```

This architecture provides a solid foundation for the current cyberpunk reader functionality while maintaining extensibility for future enhancements.