
## Project Overview
VibeReader is a Firefox browser extension that transforms any webpage into a **90s synthwave cyberpunk retrofuture reading experience**. It provides an immersive interface with synthwave aesthetics and terminal-style side panels.

## Key Features
- **Hidden Tab Proxy Architecture**: Clean content extraction without page interference
- **90s Retrofuture Interface**: Fullscreen reader mode with cyberpunk aesthetics
- **Dual Terminal System**: SYSADMIN (left) and NETMON (right) diagnostic panels (additional terminals will be added for more features media, raindrop.io extensions, obsidian extensions, content extraction and more)
- **Four synthwave themes**: Nightdrive (smooth as an open highway), Neon Surge (High contrast electric neon on black), Outrun Storm (Miami vice hurricane storm chaser), Strange Days (Haunted Hacker Haloween)
- **Media Mode System**: media can be modified by overlays, especially aalib.js ASCII conversion for matrix vibes
- **Framework Detection**: Auto-detects React/Vue/Angular/Next.js/Svelte
- **Production Middleware Architecture**: Comprehensive middleware-driven subscription system replacing legacy event handling with intelligent, self-managing subscribers that provide validation, rate limiting, transformation, error recovery, and conditional delivery for bulletproof event-driven communication.
- **Keyboard shortcuts**: Ctrl+Shift+M to toggle VibeReader mode

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
1. **Nightdrive Enhanced** (default): Classic neon pink/cyan + Orbitron font
2. **Neon Surge**: Electric pink/blue high-contrast + Fira Code font
3. **Outrun Storm**: Purple/orange dramatic weather + Fira Code font
4. **Strange Days**: Phantom pink/lime underground + Orbitron font

## Commands & Shortcuts

### Keyboard Shortcuts
- **Ctrl+Shift+M**: Toggle VibeReader mode
- **Escape**: Close image previews

### Extension Commands  
```bash
##PRIMARY COMMANDS##

Bash(cd "C:\Users\jacks\experiments\WebStormProjects\vibe-reader-extension" && powershell.exe -ExecutionPolicy Bypass -File run-extension.ps1)  #this launches extension in Firefox with no auto-reload, outputs console to terminal, captures terminal and errors to file, then deduplicates with count to dump-sorted.log and displays the sorted log on the terminal THIS IS HOW USER WANTS YOU TO RUN THE EXTENSION EVERY TIME FOR NOW
# Modern Development Workflow (v2.2)
npm run dev:extension     # Launch extension in Firefox Developer Edition (no auto-reload)
npm run build:extension   # Build distribution package
npm run lint             # ESLint JavaScript code quality
npm run lint:webext      # Web-ext extension validation
npm run test             # Run all linting checks

# CSS Build Commands (Tailwind)
npm run build:css:prod   # Production build with minification
npm run dev              # Development watch mode
npm run build            # Alias for production build

# Legacy Commands (deprecated)
web-ext run --config=web-ext-config.cjs
zip -r vibe-reader.xpi * -x "*.DS_Store" "*.git*" "*.md" "test-exports/*" "node_modules/*" "src/*"
```

## Development Notes

### Key Implementation Details
- **Hidden Tab Proxy Architecture**: Creates invisible tab for clean content extraction without page interference
- **Middleware-Driven Event System**: All components use SubscriberEnabledComponent with intelligent subscription management, automatic error recovery, rate limiting, and data transformation pipelines
- **WeakMap Memory Management**: Automatic cleanup with comprehensive tab data tracking and timer management
- **Production Subscriber Architecture**: EventBus, MessageBridge, ThrottledEmitter, and VibeLogger enhanced with middleware for validation, serialization, timing, and category-aware routing
- **Framework Detection**: Automatic detection and waiting for React/Vue/Angular/Next.js/Svelte hydration with subscriber-based monitoring
- **Maximum Z-Index Isolation**: Uses `z-index: 2147483647` with CSS isolation for bulletproof overlay layering
- **Cross-Context Message Validation**: MessageBridge with middleware for structure validation, object serialization, and performance tracking
- **Terminal Category System**: SYSADMIN/NETMON panels with category-specific subscriptions (ERRORS=50ms, CSS=200ms rate limiting)
- **CSP Font Handling**: System font fallbacks to prevent Content-Security-Policy violations
- **Intelligent Media Pipeline**: Three-way display (emoji/ascii/normal) with transformation-based processing using subscriber middleware for quality filtering and format conversion
- **ASCII Art Processing**: aalib.js DOM rendering with subscriber-driven dimension calculation and aspect ratio preservation
- **Console Noise Filtering**: Middleware-based filtering with category routing for SYSADMIN/NETMON terminals
- **Error Quarantine System**: Failed subscribers automatically quarantined with exponential backoff (up to 64 minutes)
- **CSS Semantic Theming**: Role-based CSS variables with Tailwind integration for 4 synthwave themes

### Browser Compatibility
- ✅ **Firefox 88+** (Manifest V2)  
- ⚠️ **Chrome** (needs Manifest V3 conversion)
- ⚠️ **Safari** (needs additional modifications)

## Tech Stack & Architecture

### Core Technologies
- **Extension**: VibeReader v2.0.0 (Firefox Manifest V2)
- **Libraries**: Readability.js, aalib.js, RxJS v5.4.3
- **CSS Framework**: Tailwind CSS v3.4.17 with PostCSS build pipeline
- **Architecture**: Hidden tab proxy system with WeakMap memory management

### File Structure
```
vibe-reader-extension/
├── manifest.json                 # Extension configuration (loads background scripts)
├── src/                         # Core JavaScript modules (Manifest V2 loading order)
│   ├── vibe-subscribe.js        # Subscriber architecture & middleware system
│   ├── vibe-utils.js            # EventBus & Cross-context MessageBridge  
│   ├── background-enhanced.js   # BackgroundOrchestrator & SmartTab manager
│   ├── stealth-extractor.js     # Content extraction with pipeline middleware
│   ├── proxy-controller.js      # UI overlay with terminal integration
│   ├── unified-vibe.js          # Content processing pipeline (unified.js)
│   └── unified-entry.js         # Entry point for unified processing
├── lib/                         # External libraries
│   ├── unified-bundle.js        # Unified.js processing library
│   ├── readability.js           # Mozilla Readability extraction
│   ├── aalib.js                 # ASCII art conversion
│   └── purify.min.js            # DOM sanitization
├── styles/                      # CSS themes & build output
│   ├── generated.css            # Compiled Tailwind output (production)
│   ├── matrix-theme.css         # Legacy matrix theme (deprecated)
│   └── retrofuture-theme.css    # Legacy retrofuture theme (deprecated)
├── src/styles/                  # Tailwind source files
│   └── tailwind.css             # Complete Tailwind component system
├── popup/                       # Settings interface
├── icons/                       # Extension icons
├── package.json                 # NPM build pipeline & dependencies
├── tailwind.config.js           # Tailwind configuration with themes
└── postcss.config.js            # PostCSS build configuration
```

### Key Components
- **BackgroundOrchestrator** (`background-enhanced.js`): Core session management, SmartTab lifecycle, ScriptInjector, cross-context message routing with SubscriberEnabledComponent architecture
- **StealthExtractor** (`stealth-extractor.js`): Content extraction with ExtractionPipelineMiddleware, DOM observers, media discovery, and structure analysis using subscriber patterns  
- **ProxyController** (`proxy-controller.js`): UI management with MediaAggregationMiddleware, TerminalRoutingMiddleware, SmartTerminal integration, and content display pipeline
- **LocalEventBus** (`vibe-utils.js`): Local context event management with filtering, batching, and performance tracking
- **MessageBridge** (`vibe-utils.js`): Cross-context communication with routing strategies, delivery confirmation, and retry mechanisms

### Terminal Diagnostic System - Middleware Enhanced
- **SYSADMIN (Left)**: Extraction status, content stats, critical events with ERRORS category (50ms rate limit, priority 10)
- **NETMON (Right)**: Hidden tab status, framework detection, background activity with SYSTEM category (200ms rate limit, priority 2)
- **Category Subscriptions**: Each terminal subscribes to specific event categories with intelligent filtering and transformation
- **Performance Tracking**: Built-in timing middleware for all terminal events

### Core Reader Functionality
- ✅ **Matrix Reader Mode Toggle** - Ctrl+Shift+M or toolbar icon
- ✅ **Readability.js Content Extraction** - Clean article parsing with error handling (needs replacement or heavy modification)
- ✅ **90s Retrofuture Interface** - Complete cyberpunk transformation with 4 themes
- ✅ **Dynamic Content Monitoring** - MutationObserver with smooth glitch transitions
- ✅ **Smart Element Isolation** - Automatic hiding of ads, modals, sticky elements
- ✅ **Maximum Z-Index Protection** - Bulletproof overlay layering (z-index: 2147483647)

### Visual Themes & Interface
- ✅ **4 Synthwave Themes** - Nightdrive, Neon Surge, Outrun Storm, Strange Days
- ✅ **Theme Cycling** - Quick theme switching via button
- ✅ **Terminal-style Side Panels** - System info (left) and network status (right)
- ✅ **Retrofuture Header** - CYBER READER branding with timestamp
- ✅ **Scanline Effects** - CRT monitor aesthetics
- ✅ **Neon Glow Effects** - Glowing text and borders
- ✅ **LED Status Indicators** - Terminal window decorations

### Content Enhancement  
- ✅ **Enhanced Typography** - Custom fonts (VT323, Share Tech Mono, Orbitron)
- ✅ **Heading Decorations** - Retrofuture styling with symbols
- ✅ **Link Transformation** - Cyberpunk bracket styling
- ✅ **Reading Time Calculation** - Automatic word count and reading estimates
- ✅ **Meta Information Display** - Domain, date, reading stats

### Media Handling
- ✅ **Image Enhancement** - Neon borders and styling for loaded media
- ✅ **Video Support** - Inline video loading and enhancement
- ✅ **Lazy Image Loading** - Support for data-src attributes

### Table Handling
- ✅ **Complex Table Detection** - Automatically detects tables >8 rows, >6 columns, or with nested content
- ✅ **Table Placeholders** - Click-to-expand placeholders for complex tables (like images)
- ✅ **Original Table Preservation** - Stores original HTML for perfect reconstruction
- ✅ **Cyberpunk Table Styling** - Retrofuture styling for both simple and expanded tables
- ✅ **Simple Table Enhancement** - Basic tables get cyberpunk styling without placeholders

### Settings & Controls
- ✅ **Popup Settings Panel** - Full configuration interface
- ✅ **Browser Storage Sync** - Settings persistence across devices  
- ✅ **ASCII Images Toggle** - Enable/disable ASCII art mode
- ✅ **Side Scrolls Toggle** - Show/hide terminal panels
- ✅ **Matrix Rain Toggle** - Optional digital rain background
- ✅ **Auto-Activate Toggle** - Automatically transform pages
- ✅ **Settings Reset** - Restore default configuration

### Browser Integration
- ✅ **Browser Action Badge** - Shows ON/OFF status
- ✅ **Tab State Tracking** - Per-tab activation status
- ✅ **Message Passing** - Content script ↔ background script communication
- ✅ **Keyboard Shortcuts** - Ctrl+Shift+M activation
- ✅ **Extension Lifecycle** - Proper tab cleanup and state management

### Effects & Animation
- ✅ **Glitch Effects** - Random text glitching on headings
- ✅ **Neon Pulse Animation** - Button hover effects
- ✅ **Matrix Rain Effect** - Optional digital rain background
- ✅ **Terminal Scrolling** - Auto-scrolling side panel content
- ✅ **Loading Indicators** - Media loading feedback

---

## ⚠️ **ACTIVE DEVELOPMENT STATUS - CRITICAL ISSUES RESOLVED**

**🚧 Current Phase**: Middleware Architecture Implementation - Partially Functional  
**📋 Critical Issue**: ~~Extension activation broken~~ **FIXED: Syntax error resolved**  
**🎯 Focus Areas**: Missing base class dependencies, script loading order, subscriber initialization  
**STATUS**: Major syntax error in `vibe-subscribe.js` line 648 has been resolved (invalid regex literal `/` → comment `//`). Extension can now load scripts but still requires missing `SubscriberEnabledComponent` base class definition.

## 🔄 **MIDDLEWARE ARCHITECTURE IMPLEMENTATION (v2.3 - Under Development)**

### ✅ **Core Middleware System Complete:**

1. **SubscriberEnabledComponent Base Class** - Foundation for all components
   - **Automatic subscription management** with cleanup on deactivate/destroy
   - **Built-in middleware pipeline** (validation, rate limiting, transformation, error recovery)
   - **Memory leak prevention** with comprehensive reference tracking
   - **Category-aware event routing** for terminal system integration

2. **Production Middleware Classes** - Intelligent event processing
   - **MessageValidationMiddleware** - Structure validation for cross-context messages
   - **MessageSerializationMiddleware** - DOM/Error/Map/Set object handling
   - **MessageTimingMiddleware** - Performance tracking for all messages
   - **BypassLoggingMiddleware** - Prevents recursive logging loops
   - **ThrottlingAwareMiddleware** - Context-aware throttling information

3. **Enhanced Core Utilities** - Middleware-powered infrastructure
   - **EventBus** - Automatic categorization, isolated error handling, transformation pipelines
   - **MessageBridge** - Cross-context validation, serialization, performance monitoring
   - **ThrottledEmitter** - Target-aware behavior with middleware integration
   - **VibeLogger** - Category-specific subscriptions with rate limiting per terminal type

4. **Production Error Recovery** - Quarantine system with exponential backoff
   - **Automatic failure detection** with retry mechanisms (up to 3 attempts)
   - **Quarantine isolation** for repeatedly failing subscribers (5+ failures)
   - **Exponential backoff** from 1 minute to 64 minutes maximum
   - **Fallback callback system** for critical operations

### ⚠️ **Component Migration Status - Critical Dependency Issue:**

- **StealthExtractor** - ✅ IMPLEMENTED: Full pipeline with ExtractionPipelineMiddleware, content observers, media discovery (BLOCKED: Missing SubscriberEnabledComponent)
- **ProxyController** - ✅ IMPLEMENTED: MediaAggregationMiddleware, TerminalRoutingMiddleware, SmartTerminal integration (BLOCKED: Missing SubscriberEnabledComponent)
- **BackgroundOrchestrator** - ✅ IMPLEMENTED: SmartTab management, ScriptInjector, session lifecycle (BLOCKED: Missing SubscriberEnabledComponent)
- **LocalEventBus** - ✅ IMPLEMENTED: Event categorization, filtering, batching, throttling (BLOCKED: Missing SubscriberEnabledComponent)
- **MessageBridge** - ✅ IMPLEMENTED: Cross-context routing, validation, serialization, retry logic (BLOCKED: Missing SubscriberEnabledComponent)
- **SmartTerminal** - ✅ IMPLEMENTED: Category filtering, log management, cleanup (BLOCKED: Missing SubscriberEnabledComponent)

**🔴 CRITICAL BLOCKER**: `SubscriberEnabledComponent` base class not defined in any loaded script. All middleware classes extend `SubscriberMiddleware` which is also undefined.

## 🔧 **SCRIPT LOADING DEPENDENCIES & RESOLUTION (v2.5)**

### 📋 **Current Loading Order (Manifest V2):**
```json
"background": {
  "scripts": ["src/vibe-subscribe.js", "src/vibe-utils.js", "src/background-enhanced.js"],
  "persistent": true
}
```

### ⚠️ **Dependency Chain Issues:**

1. **Missing Base Classes** - Scripts reference undefined classes:
   - `SubscriberEnabledComponent` (extended by all main components)
   - `SubscriberMiddleware` (extended by all middleware classes) 
   - These need to be defined in `vibe-subscribe.js` or loaded separately

2. **Extension Context Detection** - Components determine context via:
   ```javascript
   getOrigin() {
     if (typeof window === "undefined") return "background";
     if (window.__vibeReaderProxyController) return "proxy";
     if (window.__vibeReaderStealthExtractor) return "extractor";
     if (window.location?.href?.includes("popup.html")) return "popup";
     return "unknown";
   }
   ```

3. **Cross-Context Script Injection** - Background loads scripts into tabs:
   ```javascript
   'proxy': ['src/vibe-subscribe.js', 'src/vibe-utils.js', 'src/proxy-controller.js']
   'extractor': ['src/vibe-subscribe.js', 'src/vibe-utils.js', 'src/unified-vibe.js', 'src/stealth-extractor.js']
   ```

### ✅ **RESOLVED ISSUES:**
- **Syntax Error Fixed**: `vibe-subscribe.js:648` invalid regex literal `/` → comment `//`

### 🔴 **REMAINING BLOCKERS:**
- **Missing Base Class Definitions**: Need to implement or import `SubscriberEnabledComponent` and `SubscriberMiddleware`
- **Global Subscriber Manager**: References to `window.__globalSubscriberManager` but initialization unclear
- **Script Order Dependencies**: Some scripts may need base classes loaded first

### 🎯 **IMMEDIATE FIXES NEEDED (v2.5.1):**

#### 1. Fix Context Detection (6 locations in vibe-subscribe.js)
**Lines: 52, 1124, 1707, 2210, 3410**

Replace all `getOrigin()` methods with:
```javascript
getOrigin() {
    // Check for background context FIRST using API availability
    if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest) {
        try {
            // Background has tabs API but content scripts don't
            if (browser.tabs && browser.tabs.query) {
                return "background";
            }
        } catch(e) {}
    }
    
    // Then check for specific component markers
    if (window.__vibeReaderProxyController) return "proxy";
    if (window.__vibeReaderStealthExtractor) return "extractor";
    if (window.location?.href?.includes("popup.html")) return "popup";
    
    // Fallback for Node.js style background (shouldn't happen in Firefox)
    if (typeof window === "undefined") return "background";
    
    return "unknown";
}
```

#### 2. Add Missing Methods to CrossContextRoutingMiddleware
**File: vibe-subscribe.js (after line 1196)**

Add these methods:
```javascript
async announceViaRuntime(action, data) {
    // Content scripts use runtime to send to background
    if (this.origin === 'background') {
        return { success: false, error: 'Background cannot use runtime.sendMessage to itself' };
    }
    
    try {
        await browser.runtime.sendMessage({
            action,
            data,
            method: 'runtime',
            sourceContext: this.origin
        });
        return { success: true, method: 'runtime' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async announceViaTabs(action, data) {
    // Only background can use tabs API
    if (this.origin !== 'background') {
        return { success: false, error: 'Only background can use tabs API' };
    }
    
    try {
        const tabs = await browser.tabs.query({});
        let successCount = 0;
        
        for (const tab of tabs) {
            try {
                await browser.tabs.sendMessage(tab.id, {
                    action,
                    data,
                    method: 'tabs',
                    sourceContext: this.origin
                });
                successCount++;
            } catch (e) {
                // Tab might not have content script, skip silently
            }
        }
        
        return { 
            success: successCount > 0, 
            method: 'tabs',
            sentTo: successCount 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

#### 3. Fix BackgroundOrchestrator Initialization
**File: background-enhanced.js (line 1582)**

Replace:
```javascript
// OLD:
if (typeof window === "undefined" || window.__globalSubscriberManager?.origin === "background") {

// NEW:
const isBackground = (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest && browser.tabs && browser.tabs.query) || 
                     typeof window === "undefined" ||
                     window.__globalSubscriberManager?.origin === "background";

if (isBackground) {
```

#### 4. Add Storage Listener
**File: vibe-subscribe.js (CrossContextRoutingMiddleware constructor ~line 1120)**

Add in constructor:
```javascript
this.setupStorageListener();
```

Add new method:
```javascript
setupStorageListener() {
    if (browser.storage && browser.storage.onChanged) {
        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;
            
            Object.keys(changes).forEach(key => {
                if (key.startsWith('context-announcement-')) {
                    const { newValue } = changes[key];
                    if (newValue && newValue.context !== this.origin) {
                        this.handleRemoteSubscriptionAnnouncement(newValue, {
                            storage: true,
                            context: newValue.context
                        });
                    }
                }
            });
        });
    }
}
```

---

## 🛠️ **DEVELOPMENT INFRASTRUCTURE (v2.4 - Production Hardening)**

### ✅ **Code Quality & Linting System Complete:**

1. **ESLint Production Configuration** - Zero-error codebase achieved
   - **Modern flat config** with security plugins (no-unsanitized, security) 
   - **85 linting issues resolved** → 0 errors, 50 warnings remaining (non-critical)
   - **WebExtensions-specific rules** with proper browser globals
   - **Custom class globals** for middleware architecture (SubscriberEnabledComponent, EventBus, etc.)

2. **Enhanced Development Workflow** - Automated debugging infrastructure
   - **Auto-start debugging mode** with `autoActivate: true` in popup settings
   - **Reddit auto-navigation** via web-ext-config.cjs for consistent testing
   - **PowerShell automation** with auto-close after 30 seconds and comprehensive logging
   - **Dump log processing** with sorted output and error frequency analysis

3. **Extension Activation System Fixes** - Resolved core architecture issues
   - **Fixed manifest script loading order** preventing class definition errors
   - **Restored dynamic injection** replacing premature auto-loading content scripts
   - **Script readiness verification** with proper dependency resolution
   - **Cross-context message validation** with comprehensive error handling

4. **Production Debugging Tools** - Advanced development capabilities
   - **Background job processing** for clean extension lifecycle management  
   - **Firefox Developer Edition integration** with devtools auto-open
   - **Comprehensive error logging** with categorized terminal output
   - **Memory leak detection** through WeakMap-based resource tracking

### **🔧 Development Workflow Benefits:**

- **Zero-click testing**: PowerShell script handles entire debug lifecycle
- **Automatic error analysis**: Sorted dump logs with frequency counts
- **Extension stability**: Proper script loading prevents runtime errors  
- **Debugging efficiency**: Auto-navigation to test sites with extension pre-activated

---

## 🆕 **TAILWIND CSS MIGRATION (v2.2 - Framework Modernization)**

### ✅ **Phase 1 Complete - Build Pipeline & Component System:**

1. **Complete Build Pipeline** - NPM & PostCSS integration
   - **Package.json configuration** with Tailwind CSS v3.4.17, PostCSS, autoprefixer, cssnano
   - **Production builds** (`npm run build:css:prod`) → 1,600 lines generated CSS
   - **Development watch** (`npm run dev`) → Real-time compilation with `--watch`
   - **Windows compatibility** with proper `set NODE_ENV=production` syntax

2. **Comprehensive Component System** - Complete legacy port + enhancements  
   - **50+ Tailwind components** ported from legacy nightdrive-tailwind.css
   - **Terminal variants** (left/right + modal versions) for sidebar system
   - **Button system** with neon/cyber border effects and gradient preservation
   - **Glass morphism** components with backdrop-blur utilities
   - **Enhanced animations** (neon-pulse, synthwave-scan) with keyframe definitions

3. **Advanced Theme System** - Multi-theme CSS variable integration
   - **4 complete themes** with full 50-900 color spectrums for all colors
   - **CSS custom properties** seamlessly integrated with Tailwind utilities
   - **Theme-responsive utilities** maintaining existing data-theme attribute switching
   - **Coherent z-index system** (extension/header/sidebar/content/media/modal/dropdown/tooltip/notification)

4. **Enhanced Utilities & Features** - Beyond basic Tailwind
   - **Custom utilities** (bg-glass, text-glow, border-neon, animate-synthwave-scan)
   - **Clip-path utilities** for cyberpunk geometric effects (preserved from config)
   - **Enhanced scrollbar styling** with theme-aware gradients
   - **Production optimization** with cssnano minification

### **🔧 Technical Implementation:**

- **Generated Output**: `styles/generated.css` (1,600 lines) ready for production use
- **Source System**: `src/styles/tailwind.css` with complete component definitions  
- **Configuration**: `tailwind.config.js` with themes, animations, z-index scale, custom utilities
- **Legacy Preservation**: Original CSS files maintained as fallback during transition

---

## 🔄 FUTURE FEATURES (Planned)

### Integration Features
- [ ] **Obsidian Integration** - Save articles to Obsidian vault
- [ ] **Raindrop.io Integration** - Bookmark articles to Raindrop collections  
- [ ] **Download Functionality** - Save transformed content as files

### Enhanced Media & Content
- [ ] **ASCII Art Mode** - Convert images to actual text art
- [ ] **Image-to-ASCII Converter** - Real ASCII generation from images
- [ ] **Sound Effects** - Optional cyberpunk audio feedback
- [ ] **Terminal Commands** - Interactive command system in side panels
- [ ] **Custom Themes** - User-created color schemes
- [ ] **Export Modes** - PDF/HTML export of transformed content

### Reading Experience
- [ ] **Reading Progress Bar** - Track reading position
- [ ] **Bookmarks** - Save position within articles
- [ ] **Annotation System** - Add notes to articles
- [ ] **Text-to-Speech** - Audio playback with synthwave voice
- [ ] **Speed Reading Mode** - Rapid serial visual presentation

### Browser Compatibility  
- [ ] **Chrome Support** - Manifest V3 conversion
- [ ] **Safari Support** - WebExtensions API adaptation
- [ ] **Edge Support** - Cross-browser compatibility

### Advanced Features
- [ ] **AI Content Summary** - Generate article summaries
- [ ] **Translation Mode** - Multi-language support
- [ ] **Archive Mode** - Local article storage
- [ ] **Sync Across Devices** - Cloud settings and bookmarks
- [ ] **Offline Reading** - Cache articles for offline access

### Developer Features
- [ ] **Theme Editor** - Visual theme creation tool
- [ ] **Plugin System** - Extensible architecture
- [ ] **API Integration** - Connect with external services
- [ ] **Analytics Dashboard** - Reading statistics and insights

## 🆕 RECENT IMPROVEMENTS (v2.2 - Development Workflow Enhancement)

### ✅ **Development Infrastructure Implemented:**

1. **Complete ESLint Setup** - Modern JavaScript linting with browser extension support
   - **ESLint 9 flat config** with security plugins (no-unsanitized, security)
   - **Mozilla WebExtensions plugin** with proper flat config integration
   - **Custom globals** for VibeReader utility classes (MessageBridge, VibeLogger, etc.)
   - **98 linting issues identified** for code quality improvements

2. **Comprehensive Web-ext Configuration** - Professional extension development setup
   - **Firefox Developer Edition integration** with debugging preferences
   - **Comprehensive ignore patterns** for clean builds and packaging
   - **Auto-reload disabled by default** for stable development
   - **Development tools auto-open** (devtools, browser console)

3. **Enhanced NPM Scripts** - Modern development workflow
   - **npm run dev:extension** - Launch extension in Firefox with full debugging
   - **npm run lint:webext** - Extension-specific validation (32 warnings, 0 errors)
   - **npm run test** - Combined linting pipeline (ESLint + Web-ext)
   - **npm run build:extension** - Production package building

4. **MessageBridge Bug Fix** - Resolved popup toggle functionality
   - **Fixed request.data handling** to support both nested and direct property formats
   - **Eliminated "tabId undefined" errors** in popup activation
   - **Backward compatibility** maintained for different message formats
   - **Comprehensive tab data storage** with performance metrics, settings, and timer tracking
   - **Automatic memory cleanup** when tabs are garbage collected
   - **Reverse lookup cache** for efficient tab reference management

2. **Complete Timer Cleanup System** - Eliminates memory leaks
   - **Centralized timer tracking** in WeakMap data structure  
   - **Proper cleanup** on deactivation, tab closure, and failed activation
   - **Memory leak prevention** with comprehensive resource management

3. **Fixed Race Conditions** - Resolves hidden tab premature closure
   - **Script readiness verification** via `waitForScriptReady()` method
   - **Sequential activation** ensures scripts are responsive before proceeding
   - **Eliminated timing issues** that caused hidden tabs to close unexpectedly

4. **Script Readiness Verification** - Robust injection system
   - **Ping-based verification** with configurable retry attempts (10 attempts × 200ms)
   - **Type checking** to ensure correct script responds (`extractor` vs `proxy`)
   - **Graceful fallback** with warning logs for debugging

5. **Improved Error Handling** - Better failure recovery
   - **Enhanced cleanup on failures** with proper resource deallocation
   - **Extended hidden tab cleanup delay** (8 seconds) to prevent premature closure
   - **Comprehensive error logging** with context and stack traces

### **🔧 Technical Architecture Updates:**

- **Hidden Tab Stability**: Proper lifecycle management prevents unexpected closures
- **Memory Management**: All timers, listeners, and references tracked and cleaned up
- **Activation Reliability**: Zero race conditions during script injection
- **Error Recovery**: Robust state cleanup on any failure scenario

### **🚀 Performance Improvements:**

- **Faster activation** with parallel script readiness checks
- **Better resource utilization** with automatic cleanup
- **Improved debugging** with detailed performance metrics logging
- **Enhanced reliability** across different frameworks (React, Vue, Angular, Next.js)

---

## Security Notes
The extension requires broad permissions for functionality:
- `activeTab`: Access current tab content
- `storage`: Save user settings  
- `<all_urls>`: Work on any website

All code focuses on defensive reading enhancement - no malicious functionality.
- **Test extension with verbose terminal output**:
```bash
cd "C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension" && web-ext run --verbose --devtools --browser-console --no-reload --firefox="C:\Program Files\Firefox Developer Edition\firefox.exe" > dump.log 2>&1 && sort dump.log | uniq -c
```

**Important**: The `--verbose` flag is **required** to see `dump()` output from the extension in the terminal. This enables real-time terminal logging of sidebar diagnostic information including:
- SYSADMIN terminal status (extraction state, content metrics, error logs)  
- NETMON terminal status (proxy connection, framework detection, background activity)
- currently we are calling > dump.log 2>&1 to dump to log and then deduplicating with count before reading to limit context leaks
### **🎯 Current Development Priorities:**

**Phase 1: Base Class Resolution** (CRITICAL - IMMEDIATE)
1. **Define missing base classes** in `vibe-subscribe.js`: `SubscriberEnabledComponent` and `SubscriberMiddleware`
2. **Initialize global subscriber manager** properly in background context
3. **Test extension loading** after base class definitions are complete
4. **Verify cross-context script injection** works with proper dependencies

**Phase 2: Middleware System Activation** (HIGH PRIORITY)
1. **Complete middleware pipeline testing** across all contexts (background, proxy, extractor)
2. **Verify cross-context message routing** with MessageBridge and LocalEventBus
3. **Test terminal integration** with SmartTerminal and routing middleware
4. **Validate content extraction pipeline** with StealthExtractor and ProxyController

**Phase 3: Production Hardening** (MEDIUM PRIORITY) 
1. **Stress test subscriber architecture** with high-frequency events and error scenarios
2. **Implement comprehensive logging** for all middleware operations and quarantine system
3. **Create fallback mechanisms** for middleware failures and missing dependencies
4. **Document subscriber patterns** and debugging tools for future development

### **⚠️ Critical Requirements:**

- **No feature additions** until middleware foundation is production-stable
- **All new components** must extend SubscriberEnabledComponent  
- **Legacy event listeners** must be migrated to subscription patterns
- **Error isolation** must be verified across all subscriber chains
- **Memory management** must be validated with comprehensive testing
- **Performance impact** of middleware must remain under 5ms per event

### **🔍 Success Criteria:**

- Zero memory leaks during 24-hour stress testing
- All subscribers handle failures gracefully with quarantine system
- Terminal categories maintain proper rate limiting (ERRORS=50ms, CSS=200ms)
- Message validation prevents all malformed cross-context communications
- Extension remains responsive under high event loads (>100 events/second)

---

## 📋 **DEFERRED: CSS MODERNIZATION (Post-Middleware Stability)**

The following Tailwind CSS enhancements are deferred until middleware foundation is production-ready:

**Deferred Tasks:**
- Component modernization with data attributes
- Theme-specific component files
- Advanced interactive patterns
- Clip-path effects and animations
- Form and input enhancements

## 📋 **EXPECTED LOGS FOR PROXY ARCHITECTURE DEBUGGING**

### 🔴 **CRITICAL - REVIEW ALL ERRORS FIRST**

### 🟡 **PROXY ARCHITECTURE INITIALIZATION LOGS:**
1. `StealthExtractor.init() starting immediate activation`
2. `Framework detected: [react|vue|angular|vanilla]`
3. `ProxyController.init() starting`
4. `ProxyController linked to hidden tab [id]`
5. `Sending hiddenTabId [id] to ProxyController in tab [id]`

### 🟢 **MESSAGE ROUTING LOGS:**
6. `Routing proxy command '[command]' to hidden tab [id]`
7. `Routing media discovery from hidden tab [id] to visible tab [id]`
8. `Routing framework detection from hidden tab [id] to visible tab [id]`
9. `Routing content stability from hidden tab [id] to visible tab [id]`

### 🔵 **PROXY COMMAND EXECUTION LOGS:**
10. `Sending proxy command '[command]' to hidden tab [id]`
11. `Starting proxy-triggered content discovery`
12. `Proxy-triggered re-extraction`
13. `Synced scroll position [y] to hidden tab`

### 🟣 **MEDIA DISCOVERY LOGS:**
14. `Media discovered from hidden tab: [type]`
15. `Found image: [filename]`
16. `Found video: [filename]`
17. `Found iframe: youtube|vimeo`

### 🟠 **EXTRACTION PROGRESS LOGS:**
18. `Starting immediate extraction pipeline`
19. `Preprocessing document with DOMPurify`
20. `Starting Readability extraction`
21. `Content extracted successfully!`
22. `Received extracted content from hidden tab`

### 🟤 **TERMINAL DIAGNOSTIC LOGS:**
23. `Connected to hidden tab [id]` (in SYSADMIN terminal)
24. `Framework: [type]` (in SYSADMIN terminal)
25. `Content stable after [n] mutations` (in SYSADMIN terminal)
26. `Triggering lazy content discovery` (in NETMON terminal)

**DO NOT use unicode in console or dump logs.**
- Looking through the codebase, I've identified several sophisticated categorization systems. Here's a comprehensive breakdown:

## Primary Categorization Classes

### 1. **CategoryRegistryMiddleware** (vibe-subscribe.js)
The most advanced categorization system with N-dimensional support.

**Search Methods:**
- RegExp pattern matching with multiple patterns per category
- Hierarchical parent-child relationships
- Multiple resolution strategies (first/specific/all/hierarchical)

**Categories:**
```javascript
// Universal
'errors': /error|fail|exception|❌/i
'warnings': /warn|slow|timeout|⚠/i  
'success': /success|complete|done|✅/i

// Context-specific with dimensions
Proxy: 'terminal-errors', 'terminal-media', 'terminal-network'
Extractor: 'images' → ['jpeg', 'png'], 'videos' → ['mp4']
Background: 'lifecycle', 'session'
```

### 2. **LocalEventBus** (vibe-utils.js)
Event categorization with RegExp-based routing.

**Categories:**
```javascript
UI: /^(ui|display|render)/i
DATA: /^(data|content|extract)/i
USER: /^(user|click|input|key)/i
DOM: /^(dom|mutation|change)/i
PERFORMANCE: /^(performance|metric|timing)/i
DEBUG: /^(error|warn|debug)/i
LIFECYCLE: /^(lifecycle|init|destroy)/i
LOCAL: /^(local|internal|private)/i
```

**Filter Strategies:**
- `highFrequency`: throttle scroll/mouse/DOM events at 16ms
- `batchable`: batch UI/data updates at 100ms
- `priority`: immediate processing for errors/clicks

### 3. **VibeSystemMiddleware** (vibe-subscribe.js)
Debug categorization with pattern-based filtering.

**Debug Categories:**
```javascript
'events' → all events
'messaging' → /handle-|cross-context|message/i
'injection' → /inject|script/i
'extraction' → /extract|content|media/i
'performance' → /performance|metric|timing/i
'errors' → /error|failed|exception/i
'lifecycle' → /init|destroy|cleanup|lifecycle/i
'ui' → /ui-|display|theme|terminal/i
'cross-context' → /cross-context|route|announcement/i
```

### 4. **EnhancedTerminalMiddleware** (proxy-controller.js)
Routes events to specific terminals based on category.

**Terminal Routing Map:**
```javascript
'errors' → 'error-terminal'
'media' → 'media-terminal'
'network' → 'network-terminal'
'system' → 'system-terminal'
'default' → 'main-terminal'
```

**Categorization Logic:**
- Checks for "error"/"failed" → ERROR
- Contains "media"/"image"/"video" → MEDIA
- Contains "extraction"/"proxy" → NETWORK
- Default → SYSTEM

### 5. **Content Segmentation** (unified-vibe.js)
DOM content scoring and segmentation.

**Segment Categories:**
```javascript
// Pattern-based
'navigation': /nav|menu|breadcrumb/i
'sidebar': /sidebar|aside|widget/i
'comments': /comment|discuss|reply/i
'metadata': /author|byline|dateline|publish|meta/i

// Score-based
'main': score > 200
'secondary': score > 50
```

**Scoring Algorithm:**
- Tag weights: article(50), main(40), section(20), p(10)
- Positive indicators: `/article|content|main|post/i` (+25)
- Negative indicators: `/sidebar|footer|nav|ad/i` (-25)
- Text length bonuses: >500 chars (+20), >1000 chars (+30)

### 6. **BatchingMiddleware** (vibe-subscribe.js)
Event batching strategies by type.

**Batching Configuration:**
```javascript
'extraction-progress': {strategy: 'replace', delay: 200}
'media-discovered': {strategy: 'accumulate', delay: 150}
'dom-mutation': {strategy: 'replace', delay: 100}
'scroll-event': {strategy: 'replace', delay: 50}
'content-updated': {strategy: 'merge', delay: 300}
'terminal-log': {strategy: 'accumulate', delay: 100}
```

### 7. **MessageBridge** (vibe-utils.js)
Cross-context message routing.

**Routing Strategies:**
```javascript
'content-extraction': {source: ['background','proxy'], target: 'extractor'}
'content-display': {source: ['extractor','background'], target: 'proxy'}
'user-command': {source: ['proxy','popup'], target: 'background'}
'system-notification': {source: 'background', target: ['proxy','extractor','popup']}
```

## Search/Match Methods Summary

1. **RegExp Testing**: Primary method for flexible pattern matching
2. **String.includes()**: Simple substring checking
3. **Scoring Algorithms**: Weighted scoring for content quality
4. **Hierarchical Resolution**: Parent-child category relationships
5. **Multi-dimensional Namespacing**: Categories organized by context/dimension
6. **Priority-based Selection**: Resolution by specificity and priority scores

The system uses a layered approach where events flow through multiple categorization layers, each adding metadata that downstream components can use for routing, filtering, batching, or display decisions.