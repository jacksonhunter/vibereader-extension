# VibeReader Extension - Comprehensive Technical Documentation

## Tech Stack
- **Manifest Version**: 2 (Firefox compatible)
- **Extension Name**: VibeReader (formerly Matrix Reader)
- **Version**: 2.0.0 
- **Libraries**: 
  - **Readability.js**: Mozilla's content extraction library
  - **aalib.js**: ASCII art conversion library
  - **RxJS**: v5.4.3 for Observable patterns in ASCII conversion
- **Styling**: CSS Grid & Flexbox with retrofuture themes
- **Fonts**: VT323, Share Tech Mono, Orbitron, Fira Code (Google Fonts)
- **Architecture**: Hidden tab proxy system with WeakMap memory management

## File Structure (CORRECTED)
```
vibe-reader-extension/
├── manifest.json                 # Extension configuration (VibeReader v2.0.0)
├── background-enhanced.js        # Hidden tab manager & message router
├── stealth-extractor.js         # Hidden tab content extraction  
├── proxy-controller.js          # Bidirectional proxy communication
├── lib/
│   ├── readability.js           # Mozilla content extraction library
│   ├── aalib.js                 # ASCII art conversion library
│   └── rxjs.min.js              # RxJS v5.4.3 for Observable patterns
├── styles/
│   ├── retrofuture-theme.css    # Main cyberpunk aesthetics
│   └── matrix-theme.css         # Additional matrix styling & effects
├── popup/
│   ├── popup.html              # Settings interface
│   ├── popup.css               # Popup styling  
│   └── popup.js                # Settings functionality
├── icons/                      # Extension icons (16, 32, 48, 128px + SVG)
├── assets/                     # Additional assets
├── test-exports/               # Test output files from VibeReader
├── CLAUDE.md                   # Development documentation
└── DEBUG.md                    # Current debugging information
```

## Core Classes and Architecture

### 🔄 ARCHITECTURE: Hidden Tab Proxy System (v2.0) - IMPLEMENTED
**Complete hidden tab proxy architecture with WeakMap memory management**

### HiddenTabManager (background-enhanced.js)
**Enhanced background script with comprehensive tab lifecycle management:**

**Core Methods:**
- `activateVibeMode(tab)` - Complete activation sequence with error handling
- `deactivateVibeMode(tabId)` - Cleanup with timer and WeakMap clearing
- `createHiddenTab(url)` - Creates pinned invisible tab with ready state waiting
- `injectStealthExtractor(tabId)` - Injects Readability.js + extractor with verification
- `injectProxyController(tabId)` - Injects aalib.js + controller + CSS themes
- `waitForScriptReady(tabId, scriptType)` - Race condition prevention with ping verification

**Memory Management:**
- `ensureSerializable(data)` - Recursive message serialization for browser APIs
- `tabRegistry` (WeakMap) - Automatic memory cleanup when tabs are garbage collected
- `tabDataCache` (Map) - Reverse lookup for tab ID → WeakMap key mapping
- `cleanupFailedActivation(tabId)` - Comprehensive cleanup on any failure

**Message Routing:**
- `handleExtractedContent(request, sender)` - Routes hidden tab content to visible tab
- `routeProxyCommand(request, sender)` - Forwards user actions to hidden tab
- `updateExtractionProgress(request, sender)` - Proxies progress updates

### StealthExtractor (stealth-extractor.js)
**Hidden tab content extraction with framework detection:**

**Extraction Pipeline:**
- `detectFramework()` - Identifies React/Vue/Angular/Next.js/Svelte frameworks
- `waitForFramework()` - Waits for framework hydration before extraction
- `extractContent()` - Uses Mozilla Readability.js with error verification
- `preprocessDocument(doc)` - Removes ads, scripts, hidden content before parsing
- `postprocessContent(content)` - Fixes relative URLs and cleans empty elements

**Background Processing:**
- `simulateHumanScroll()` - Natural scrolling to trigger lazy loading
- `waitForContentStability()` - Content hash monitoring for completion
- `reportExtraction(content)` - Sends content + metadata to visible tab
- `executeProxyCommand(command, data)` - Handles scroll/click commands from visible tab

**Data Collection:**
- `gatherDOMStats()` - Collects element count, mutations, performance metrics
- `getReadabilityScore(content)` - Calculates content density score (EXCELLENT/GOOD/FAIR/POOR)
- `detectFrameworks()` - Returns detected JS frameworks as comma-separated string

### ProxyController (proxy-controller.js)
**Visible tab UI management with console capture:**

**UI Management:**
- `activate()` - Creates fullscreen overlay with theme application
- `displayExtractedContent(content, metadata)` - Renders content in cyberpunk interface
- `createInterface()` - Builds header, layout, terminals from HTML templates
- `updateLiveTerminals()` - Real-time updates to SYSADMIN and NETMON displays

**Media System:**
- `processImages()` - Creates media wrappers for emoji/ascii/normal modes
- `createMediaWrapper(mediaElement)` - Stores original element for mode switching
- `cycleMediaMode()` - Global media mode toggle with state persistence
- `convertToAscii(src, wrapper)` - aalib.js integration with Observable pattern

**Console Capture:**
- `initConsoleCapture()` - Overrides console methods to capture output
- `shouldLogMessage(message)` - Filters out CSP/cookie/navigation noise
- `addToSysadminLog(level, message)` - Consolidates duplicate messages with counters
- `addToNetworkLog(source, message)` - Tracks extraction/background activity

**Terminal Display System:**
- `updateLiveTerminals()` - Filtered real-time logging to dual terminals
- **SYSADMIN (Left)**: Extraction status, content stats, critical events only
- **NETMON (Right)**: Hidden tab status, framework detection, background activity

**Error Handling:**
- `showError(message)` - Specific error display with troubleshooting hints
- `getDetailedErrorMessage(error)` - Context-aware error explanations
- `handleHiddenTabClosed(error)` - Recovery from hidden tab failures

## WeakMap Registry Implementation

### Memory-Safe Tab Tracking
The extension uses a sophisticated WeakMap-based system for automatic memory management:

```javascript
class HiddenTabManager {
    constructor() {
        // Enhanced WeakMap for automatic memory cleanup when tabs are garbage collected
        this.tabRegistry = new WeakMap();
        this.tabDataCache = new Map(); // tab ID -> WeakMap key for reverse lookup
        
        // Regular Maps for ID-based lookups (necessary for message routing)
        this.hiddenTabs = new Map(); // visible tab ID -> hidden tab ID
        this.extractionStatus = new Map(); // hidden tab ID -> extraction info
        this.activeTabIds = new Set(); // Currently active visible tab IDs
        
        // Enhanced injection tracking with cleanup support
        this.injectionStatus = new Map(); // tab ID -> { proxy: boolean, extractor: boolean, timers: [] }
    }
}
```

### Comprehensive Tab Data Structure
Each tab stores complete lifecycle data in WeakMap:

```javascript
const tabData = {
    activatedAt: Date.now(),
    url: tab.url,
    title: tab.title,
    hiddenTabId: null,
    extractionAttempts: 0,
    performanceMetrics: {
        activationStart: activationStart,
        injectionTimes: {},
        extractionTime: null
    },
    settings: await this.getTabSpecificSettings(),
    timers: new Set() // Store timer IDs for cleanup
};

this.tabRegistry.set(tab, tabData);
this.tabDataCache.set(tab.id, tab); // For reverse lookup
```

### Automatic Cleanup Benefits
- **Memory Leak Prevention**: When tabs are closed/garbage collected, WeakMap entries automatically disappear
- **Timer Cleanup**: All timers tracked in `tabData.timers` Set for comprehensive cleanup
- **Resource Management**: No manual tracking needed - JavaScript GC handles WeakMap cleanup
- **Performance**: No memory buildup over extended usage periods

## Message Serialization System

### Browser API Compatibility
Browser extension APIs require serializable messages. Our system handles complex objects:

```javascript
// Background Script (background-enhanced.js)
ensureSerializable(data) {
    if (data === undefined) return { success: true };
    if (data === null || typeof data !== 'object') return data;

    const safe = {};
    for (const [key, value] of Object.entries(data)) {
        // Skip functions and undefined values
        if (typeof value !== 'function' && value !== undefined) {
            if (typeof value === 'object' && value !== null) {
                safe[key] = this.ensureSerializable(value); // Recursive
            } else {
                safe[key] = value;
            }
        }
    }
    return safe;
}

// Content Scripts (proxy-controller.js, stealth-extractor.js)
makeSerializable(obj) {
    // Similar recursive serialization for content script responses
    // Ensures DOM elements, functions, etc. don't break message passing
}
```

### Why Serialization is Critical
- **DOM Elements**: Cannot be passed through browser.runtime.sendMessage()
- **Functions**: Not serializable - must be stripped from responses
- **Circular References**: Can cause message passing to fail
- **Performance**: Large objects need size optimization for message limits

## Dual Terminal Display System

### SYSADMIN Terminal (Left Panel)
**Purpose**: Foreground tab monitoring and critical event logging
```javascript
// Shows filtered meaningful events only
const meaningfulLogs = this.sysadminLogs.filter(log => 
    log.includes('ERR:') || 
    log.includes('extracted') || 
    log.includes('initialized') ||
    log.includes('activated')
).slice(0, 5);

// Display format
> STATUS: ACTIVE | SCORE: EXCELLENT
> CONTENT: 2847w (14min)
> RECENT ACTIVITY:
  ERR: Readability.js library not available
  LOG: Content extracted successfully
  LOG: ProxyController initialized x2
```

### NETMON Terminal (Right Panel)  
**Purpose**: Hidden tab activity and background process monitoring
```javascript
// Shows extraction and background activity
const networkLogs = this.networkLogs.filter(log =>
    log.includes('extraction') || 
    log.includes('BG:') ||
    log.includes('content')
).slice(0, 5);

// Display format
> PROXY: CONNECTED
> TARGET: www.reddit.com
> FRAMEWORK: vanilla | NODES: 1247
> BACKGROUND ACTIVITY:
  BG: extractionProgress: complete
  BG: contentExtracted
  BG: hiddenTabClosed
```

### Console Capture Implementation
**Real-time logging with noise filtering:**
```javascript
// Override console methods to capture all output
console.log = function(...args) {
    self._originalConsole.log.apply(console, args);
    const message = args.join(' ');
    if (self.shouldLogMessage(message)) {
        self.addToSysadminLog('LOG', message);
    }
};

// Filter out browser noise
shouldLogMessage(message) {
    const ignorePatterns = [
        'Content-Security-Policy',
        'Partitioned cookie',
        'Navigation API not supported',
        'GSI_LOGGER',
        'GRECAPTCHA',
        'downloadable font: failed',
        '📨 Received message: ping', // Too noisy
        'extractionProgress' // Handle separately
    ];
    
    return !ignorePatterns.some(pattern => message.includes(pattern));
}
```

### Log Consolidation
Prevents terminal spam by consolidating duplicate messages:
```javascript
// Instead of showing:
// LOG: extractionProgress
// LOG: extractionProgress  
// LOG: extractionProgress

// Shows:
// LOG: extractionProgress x3
```

## Installation & Development

### Load Extension in Firefox
1. Navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json` from the extension directory

### Testing Commands
```bash
# Load extension with verbose output for debugging
cd "C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension"
web-ext run --verbose --devtools --browser-console --firefox="C:\Program Files\Firefox Developer Edition\firefox.exe"

# Package for distribution  
zip -r vibe-reader.xpi * -x "*.DS_Store" "*.git*" "*.md" "test-exports/*"
```

### Testing
- Visit any article or blog post
- Press **Ctrl+Shift+M** or click toolbar icon
- Test theme switching with 🎨 THEME button
- Test inline media loading with 📥 LOAD ALL button

## Settings & Configuration

### Available Settings (stored in browser.storage.sync)
```javascript
{
    theme: 'nightdrive',        // Theme selection: nightdrive|neon-surge|outrun-storm|strange-days
    mediaMode: 'emoji',         // Media display: emoji|ascii|normal
    sideScrolls: true,          // Terminal side panels visibility
    vibeRain: false,            // Matrix rain background effect
    autoActivate: false         // Auto-transform pages on load
}
```

### Theme Options
1. **Nightdrive Enhanced** (default): Classic neon pink/cyan with Orbitron font
2. **Neon Surge**: Electric pink/blue high-contrast with Fira Code font
3. **Outrun Storm**: Purple/orange dramatic weather with Fira Code font
4. **Strange Days**: Phantom pink/lime underground with Orbitron font

## Commands & Shortcuts

### Keyboard Shortcuts
- **Ctrl+Shift+M**: Toggle VibeReader mode
- **Escape**: Close image previews

### Extension Commands  
```bash
# Load temporary extension
firefox about:debugging → Load Temporary Add-on → manifest.json

# Package for distribution  
zip -r vibe-reader.xpi * -x "*.DS_Store" "*.git*" "*.md" "test-exports/*"
```

## Key Implementation Details

### Hidden Tab Proxy Architecture
- **Hidden Tab Creation**: Creates invisible tab for clean content extraction without page interference
- **WeakMap Memory Management**: Automatic cleanup with comprehensive tab data tracking and timer management
- **Readability.js Verification**: Library injection verification before extraction with specific error handling
- **Framework Detection**: Automatic detection and waiting for React/Vue/Angular/Next.js/Svelte hydration

### UI & Theming
- **Maximum Z-Index Isolation**: Uses `z-index: 2147483647` with CSS isolation for bulletproof overlay layering
- **Message Serialization**: Complete object serialization for browser API compatibility
- **Dual Terminal System**: Real-time console capture with SYSADMIN/NETMON filtered logging
- **CSP Font Handling**: System font fallbacks to prevent Content-Security-Policy violations

### Media & Content Processing
- **Media Mode System**: Three-way media display (emoji/ascii/normal) with aalib.js ASCII conversion
- **Console Noise Filtering**: Intelligent filtering of browser warnings, cookies, and CSP messages
- **Error-Specific Messaging**: Context-aware error descriptions with troubleshooting hints
- **CSS Semantic Theming**: Role-based CSS variables for flexible theme switching across 4 synthwave themes

## Browser Compatibility
- ✅ **Firefox 88+** (Manifest V2)  
- ⚠️ **Chrome** (needs Manifest V3 conversion)
- ⚠️ **Safari** (needs additional modifications)

## Known Issues (v2.0 Status)

### ✅ RESOLVED (Hidden Tab Architecture)
- ~~Content extraction blocked for security~~ **SOLVED WITH HIDDEN TAB**
- ~~CORS policies preventing image preview~~ **SOLVED WITH PROXY**
- ~~Performance impact on complex pages~~ **IMPROVED WITH HIDDEN TAB**
- ~~Element bleeding on React/Vue sites~~ **SOLVED WITH HIDDEN TAB**
- ~~Dynamic content loading incompatibility~~ **FIXED WITH FRAMEWORK DETECTION**

### ⚠️ ACTIVE ISSUES (v2.0)
- ASCII conversion system requires debugging for aalib.js integration
- Complex table expansion may need manual review for merged cells
- Some browser console noise still appears in filtered logs
- Media wrapper CSS sizing needs refinement

## Security Notes
The extension requires broad permissions for functionality:
- `activeTab`: Access current tab content
- `tabs`: Create and manage hidden tabs
- `storage`: Save user settings  
- `<all_urls>`: Work on any website
- `webNavigation`: Track tab lifecycle events

All code focuses on defensive reading enhancement - no malicious functionality.

## Debugging & Development Notes

### Verbose Output Requirements
**Important**: The `--verbose` flag is **required** to see `dump()` output from the extension in the terminal. This enables real-time terminal logging of sidebar diagnostic information including:
- SYSADMIN terminal status (extraction state, content metrics, error logs)  
- NETMON terminal status (proxy connection, framework detection, background activity)

### Debug Output Format (Enhanced v2.1)
```
[DIAG] ERRORS:2 MEDIA:1 ASCII:0 SYSTEM:3 NETWORK:5 | Latest: Found 0 images for processing
[NETMON] NETWORK:5 | extractionProgress: complete x12
```

### Mini Console Protocol for Diagnostic Systems

#### SYSADMIN Terminal (Left Panel)
**Purpose**: Primary diagnostic display with collapsible categories  
**Categories**: ERRORS → MEDIA → ASCII → SYSTEM  
**Interaction**: Click category headers to expand/collapse  
**Format**: `🔴 ▼ ERRORS (2)` - Icon, arrow, name, count

#### NETMON Terminal (Right Panel) 
**Purpose**: Network and background activity monitoring  
**Categories**: NETWORK → ERRORS → SYSTEM  
**Interaction**: Click category headers to expand/collapse  
**Format**: `🌐 ▶ NETWORK (5)` - Icon, arrow, name, count

#### Category Classification Logic
```javascript
ERRORS: 'ERR:', '❌', 'failed', 'error'
MEDIA: 'MEDIA', '🔍', 'images', 'videos', '📦', 'Found'  
ASCII: 'ASCII', '🎯', 'conversion', 'aalib', '🎨'
NETWORK: 'BG:', 'extraction', 'proxy', 'NETMON', 'framework'
SYSTEM: 'LOG:', '✅', 'initialized', 'activated'
```

#### Interactive Features
- **Click to Toggle**: Category headers expand/collapse content
- **Visual Feedback**: Hover effects with neon glow
- **Smart Hiding**: Empty collapsed categories auto-hide
- **Smooth Animation**: 0.3s ease transitions
- **Persistent State**: Remember expand/collapse preferences

## Current Development Status

**🚧 Current Phase**: Debugging ASCII conversion system + enhanced diagnostics  
**📋 For ongoing troubleshooting**: See `DEBUG.md` for latest issues and next steps  
**🎯 Focus Areas**: Tab management stability, media CSS sizing, ASCII pipeline completion