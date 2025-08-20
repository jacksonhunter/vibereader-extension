
## Project Overview
Matrix Reader is a Firefox browser extension that transforms any webpage into a **90s cyberpunk retrofuture reading experience**. It provides an immersive interface with synthwave aesthetics, terminal-style side panels, and Imagus-style image previews.

## Key Features
- **90s Retrofuture Interface**: Clean reader mode with cyberpunk web design
- **Terminal-style side panels**: System info and network status displays  
- **Scanline effects**: Authentic CRT monitor aesthetics
- **Four synthwave themes**: Nightdrive, Neon Surge, Outrun Storm, Strange Days
- **Imagus-style image preview**: Hover to preview images instantly
- **Readability.js integration**: Clean content extraction
- **Enhanced typography**: Neon glow effects and retrofuture styling
- **Keyboard shortcuts**: Ctrl+Shift+M to toggle Matrix Reader mode
- **Inline media loading**: Load all images and videos directly in content

## Tech Stack
- **Manifest Version**: 2 (Firefox compatible)
- **Libraries**: 
  - Readability.js (Mozilla's content extraction)
  - Custom Image Preview system
- **Styling**: CSS Grid & Flexbox with retrofuture themes
- **Fonts**: VT323, Share Tech Mono, Orbitron (Google Fonts)

## File Structure
```
matrix-reader-extension/
├── manifest.json              # Extension configuration
├── content.js                 # Display interface for proxied content
├── background.js              # Hidden tab manager & message router
├── stealth-extractor.js      # Hidden tab content extraction (NEW)
├── proxy-controller.js       # Bidirectional proxy communication (NEW)  
├── lib/
│   ├── readability.js         # Content extraction library
│   └── image-preview.js       # Imagus-style preview system
├── styles/
│   ├── retrofuture-theme.css  # 90s cyberpunk aesthetics
│   └── matrix-theme.css       # Additional matrix styling
├── popup/
│   ├── popup.html            # Settings interface
│   ├── popup.css             # Popup styling  
│   └── popup.js              # Settings functionality
├── icons/                    # Extension icons
├── assets/                   # Additional assets
└── README.md                 # Documentation
```

## Core Classes and Architecture

### 🔄 ARCHITECTURE UPDATE: Hidden Tab Proxy System (v2.0)
**Moving from overlay-based to hidden tab proxy architecture to solve bleedthrough issues**

### HiddenTabManager (background.js - ENHANCED)
Orchestrates hidden tab creation and lifecycle:
- `createStealthTab()` - Creates invisible browser tab for content extraction
- `waitForFullRender()` - Ensures React/Vue/Angular fully hydrates
- `routeProxyMessages()` - Handles bidirectional communication
- `syncTabStates()` - Keeps visible and hidden tabs synchronized
- `cleanupHiddenTab()` - Properly destroys hidden tabs

### StealthExtractor (stealth-extractor.js - NEW)
Runs in hidden tab for clean content extraction:
- `waitForFramework()` - Detects and waits for JS framework initialization
- `simulateHumanScroll()` - Natural scrolling to trigger lazy loading
- `extractCleanContent()` - Uses Readability.js after full page load
- `handleProxyCommands()` - Responds to user interactions from visible tab
- `reportExtraction()` - Sends clean HTML back to visible tab

### ProxyController (proxy-controller.js - NEW)  
Manages bidirectional proxy communication:
- `captureUserActions()` - Records scroll, click, type events
- `forwardToHiddenTab()` - Sends actions to hidden tab
- `receiveContentUpdates()` - Gets extracted content from hidden tab
- `updateVisibleInterface()` - Refreshes Matrix Reader display

### MatrixReader (content.js - REFACTORED)
Now focuses on display rather than extraction:
- `displayProxiedContent()` - Shows content from hidden tab
- `createRetrofutureLayout()` - Builds 90s cyberpunk interface
- `handleUserInteraction()` - Captures events for proxy forwarding
- `updateFromHiddenTab()` - Receives and displays new content

### ImagePreview (lib/image-preview.js)
Provides Imagus-style hover image previews with smart positioning.

## Installation & Development

### Load Extension in Firefox
1. Navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json` from the extension directory

### Testing
- Visit any article or blog post
- Press **Ctrl+Shift+M** or click toolbar icon
- Test theme switching with 🎨 THEME button
- Test inline media loading with 📥 LOAD ALL button

## Settings & Configuration

### Available Settings (stored in browser.storage.sync)
```javascript
{
    theme: 'nightdrive',        // Theme selection
    imagePreview: true,         // Imagus-style previews  
    sideScrolls: true,          // Terminal side panels
    matrixRain: false,          // Optional digital rain
    autoActivate: false,        // Auto-transform pages
    retrofuture: true           // 90s aesthetic mode
}
```

### Theme Options
1. **Nightdrive Enhanced** (default): Classic neon pink/cyan
2. **Neon Surge**: Electric pink/blue high-contrast  
3. **Outrun Storm**: Purple/orange dramatic weather
4. **Strange Days**: Phantom pink/lime underground

## Commands & Shortcuts

### Keyboard Shortcuts
- **Ctrl+Shift+M**: Toggle Matrix Reader mode
- **Escape**: Close image previews

### Extension Commands  
```bash
# Load temporary extension
firefox about:debugging → Load Temporary Add-on → manifest.json

# Package for distribution  
zip -r matrix-reader.xpi * -x "*.DS_Store" "*.git*" "README.md"
```

## Development Notes

### Key Implementation Details
- **Non-Destructive Overlay System**: Creates fullscreen overlay without destroying original page
- **Maximum Z-Index Isolation**: Uses `z-index: 2147483647` with CSS isolation for bulletproof layering
- **Smart Element Hiding**: Automatically hides sticky navbars, ads, modals, and high-z-index elements
- **Dynamic Content Monitoring**: MutationObserver with debounced updates for live content changes
- **Readability.js Integration**: Clean content extraction with smooth glitch transitions on updates
- **CSS themes**: Use CSS custom properties for easy switching between 4 synthwave themes
- **Image placeholders**: Show hover hints for preview system with inline loading capability
- **Terminal panels**: Auto-populate with page metadata and real-time system status
- **Complex table handling**: Placeholder system for large tables with click-to-expand functionality

### Browser Compatibility
- ✅ **Firefox 88+** (Manifest V2)  
- ⚠️ **Chrome** (needs Manifest V3 conversion)
- ⚠️ **Safari** (needs additional modifications)

### Known Issues (v1.0 - Overlay System)
- ~~Some pages may block content extraction for security~~ **SOLVED WITH HIDDEN TAB**
- ~~CORS policies can prevent image preview on external images~~ **SOLVED WITH PROXY**
- ~~Performance impact on pages with many images/videos~~ **IMPROVED WITH HIDDEN TAB**
- ~~Complex tables with merged cells may need manual review after expansion~~ **FIXED**
- ~~Dynamic content loading sites (eCFR, Reddit, Gemini) may have incomplete extraction~~ **FIXED**
- ~~Element bleeding on complex React/Vue sites with framework-specific styling patterns~~ **SOLVED WITH HIDDEN TAB**

### 🚀 MAJOR ARCHITECTURE UPDATE (v2.0 - In Progress)
#### Hidden Tab Proxy System (Currently Implementing)
**Problem**: Overlay system has fundamental limitations with modern web frameworks
**Solution**: Hidden tab architecture with proxy interaction system

**Problem**: React/Vue apps, Shadow DOM, CSS-in-JS, inline styles with random z-index values
**Solution**: Post-activation element analysis
- **Runtime Scanning**: After overlay creation, scan all elements for actual visibility
- **Geometric Detection**: Use `getBoundingClientRect()` to find elements in viewport
- **Behavioral Analysis**: Detect elements responding to mouse events over our overlay
- **Iterative Hiding**: Re-scan after hiding elements to catch newly visible ones
- **Smart Visibility**: Check `getComputedStyle()` for effective opacity/visibility

**Implementation Approach**:
```javascript
// After overlay activation
scanForVisibleElements() {
    const allElements = document.querySelectorAll('*');
    const problematic = [];
    
    allElements.forEach(el => {
        if (this.isElementVisible(el) && this.isElementProblematic(el)) {
            problematic.push(el);
        }
    });
    
    return problematic;
}
```

This will provide much better compatibility with modern JavaScript frameworks and complex sites.

## 🟢 CURRENT FEATURES (Implemented)

### Core Reader Functionality
- ✅ **Matrix Reader Mode Toggle** - Ctrl+Shift+M or toolbar icon
- ✅ **Non-Destructive Overlay System** - Fullscreen reader without destroying original page
- ✅ **Readability.js Content Extraction** - Clean article parsing with error handling
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
- ✅ **Image Placeholders** - "HOVER TO PREVIEW" hints
- ✅ **Inline Media Loading** - Load all images/videos directly (📥 LOAD ALL button)
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

## Security Notes
The extension requires broad permissions for functionality:
- `activeTab`: Access current tab content
- `storage`: Save user settings  
- `<all_urls>`: Work on any website

All code focuses on defensive reading enhancement - no malicious functionality.