
## Project Overview
VibeReader is a Firefox browser extension that transforms any webpage into a **90s cyberpunk retrofuture reading experience**. It provides an immersive interface with synthwave aesthetics and terminal-style side panels.

## Key Features
- **Hidden Tab Proxy Architecture**: Clean content extraction without page interference
- **90s Retrofuture Interface**: Fullscreen reader mode with cyberpunk aesthetics
- **Dual Terminal System**: SYSADMIN (left) and NETMON (right) diagnostic panels
- **Four synthwave themes**: Nightdrive, Neon Surge, Outrun Storm, Strange Days
- **Media Mode System**: emoji/ascii/normal display with aalib.js ASCII conversion
- **Framework Detection**: Auto-detects React/Vue/Angular/Next.js/Svelte
- **WeakMap Memory Management**: Automatic cleanup and resource management
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
# Load extension with verbose debugging
cd "C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension"
web-ext run --verbose --devtools --browser-console --firefox="C:\Program Files\Firefox Developer Edition\firefox.exe" > dump.log 2>&1

# CSS Build Commands (Tailwind)
npm run build:css:prod    # Production build with minification
npm run dev              # Development watch mode
npm run build            # Alias for production build

# Package for distribution  
zip -r vibe-reader.xpi * -x "*.DS_Store" "*.git*" "*.md" "test-exports/*" "node_modules/*" "src/*"
```

## Development Notes

### Key Implementation Details
- **Hidden Tab Proxy Architecture**: Creates invisible tab for clean content extraction without page interference
- **WeakMap Memory Management**: Automatic cleanup with comprehensive tab data tracking and timer management
- **Readability.js Verification**: Library injection verification before extraction with specific error handling
- **Framework Detection**: Automatic detection and waiting for React/Vue/Angular/Next.js/Svelte hydration
- **Maximum Z-Index Isolation**: Uses `z-index: 2147483647` with CSS isolation for bulletproof overlay layering
- **Message Serialization**: Complete object serialization for browser API compatibility
- **Dual Terminal System**: Real-time console capture with SYSADMIN/NETMON filtered logging
- **CSP Font Handling**: System font fallbacks to prevent Content-Security-Policy violations
- **Media Mode System**: Three-way media display (emoji/ascii/normal) with aalib.js ASCII conversion
- **ASCII Art Aspect Ratio System**: Dynamic ASCII dimensions calculated from original image aspect ratio with direct DOM measurement for pixel-perfect wrapper sizing
- **aalib.js DOM Rendering**: ASCII conversion outputs actual HTML elements (not canvas), allowing direct offsetWidth/offsetHeight measurement for exact container sizing
- **Console Noise Filtering**: Intelligent filtering of browser warnings, cookies, and CSP messages
- **Error-Specific Messaging**: Context-aware error descriptions with troubleshooting hints
- **CSS Semantic Theming**: Role-based CSS variables for flexible theme switching across 4 synthwave themes

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
├── manifest.json                 # Extension configuration
├── background-enhanced.js        # Hidden tab manager & message router  
├── stealth-extractor.js         # Hidden tab content extraction
├── proxy-controller.js          # Visible tab UI management
├── lib/                         # External libraries
├── styles/                      # CSS themes (retrofuture + matrix + generated)
│   ├── generated.css            # Compiled Tailwind output (production)
│   ├── matrix-theme.css         # Legacy matrix theme (deprecated)
│   └── retrofuture-theme.css    # Legacy retrofuture theme (deprecated)
├── src/styles/                  # Tailwind source files
│   └── tailwind.css             # Complete Tailwind component system
├── tailwind.config.js           # Tailwind configuration with themes
├── postcss.config.js            # PostCSS build configuration
├── package.json                 # NPM build pipeline
├── popup/                       # Settings interface
└── icons/                       # Extension icons
```

### Key Components
- **HiddenTabManager** (`background-enhanced.js`): Tab lifecycle, memory management, message routing
- **StealthExtractor** (`stealth-extractor.js`): Content extraction with framework detection  
- **ProxyController** (`proxy-controller.js`): UI overlay with dual terminal system

### Known Issues (v2.0 Status)
- ✅ **RESOLVED**: Content extraction, CORS, performance, React/Vue compatibility
- ⚠️ **ACTIVE**: ASCII conversion debugging, media wrapper CSS, console noise filtering

### Current Development Status
**🚧 Phase**: Debugging ASCII conversion + enhanced diagnostics  
**🎯 Focus**: Tab stability, media CSS sizing, aalib.js pipeline completion

## Debugging Reference

### Terminal Diagnostic System
- **SYSADMIN (Left)**: Extraction status, content stats, critical events
- **NETMON (Right)**: Hidden tab status, framework detection, background activity

### Message Categories  
```javascript
ERRORS: 'ERR:', '❌', 'failed', 'error'
MEDIA: 'MEDIA', '🔍', 'images', 'videos', '📦', 'Found'  
ASCII: 'ASCII', '🎯', 'conversion', 'aalib', '🎨'
NETWORK: 'BG:', 'extraction', 'proxy', 'NETMON', 'framework'
SYSTEM: 'LOG:', '✅', 'initialized', 'activated'
```
### Essential File Locations  
- **background-enhanced.js**: Tab management, message routing, WeakMap registry
- **stealth-extractor.js**: Content extraction, framework detection  
- **proxy-controller.js**: UI overlay, media system, console capture
- **DEBUG.md**: Current issues and troubleshooting steps

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

## ⚠️ **ACTIVE DEVELOPMENT STATUS**

**🚧 Current Phase**: Tailwind CSS Migration Complete - Phase 1 ✅  
**📋 Next Phase**: Integration of generated.css into extension architecture  
**🎯 Focus Areas**: Replace legacy CSS injection with Tailwind utilities, convert components to utility classes
**IMPORTANT**: before and after editing CSS check CSS-API.md every time!
**IMPORTANT**: when editing terminal logging review terminal-log-API.md 
**IMPORTANT**: rewrite 'DEBUG.md' and update claude.md and README.md before exit

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

## 🆕 RECENT IMPROVEMENTS (v2.1 - Enhanced Stability)

### ✅ **Critical Bug Fixes Implemented:**

1. **Enhanced WeakMap Registry** - Complete rewrite of tab data management
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
- PHASE 1: Component Modernization with Data Attributes

    1.1 Convert All Components to Modern Data Attribute Patterns

    Files to modify: components/layout.css, components/terminals.css, components/buttons.css

    - Replace verbose [data-status="value"] selectors with Tailwind's inline data-[status=value]: syntax
    - Consolidate multiple selector blocks into single component definitions
    - Example: .vibe-status will become one line with all data states inline

    1.2 Implement Group/Peer Patterns for Interactivity

    New components to add:
    - Terminal windows with group-based LED indicators
    - Buttons with scan line effects on hover
    - Form fields with floating labels using peer
    - Toggle switches with peer-checked states

    PHASE 2: Theme Personality Enhancement

    2.1 Create Theme-Specific Component Files

    New files to create:
    - components/theme-nightdrive.css - Smooth, cruising animations
    - components/theme-neon-surge.css - Glitchy, electric chaos
    - components/theme-outrun-storm.css - Weather effects, lightning
    - components/theme-strange-days.css - Underground flicker, drift

    2.2 Utilize Unused Animations & Gradients

    Animations currently defined but unused:
    - nightdrive-pulse, electric-pulse, storm-pulse, phantom-flicker
    - electric-scan, storm-scan, underground-scan, storm-lightning
    - underground-drift, data-corruption, matrix-fall
    - Background gradients: bg-nightdrive, bg-neon-surge, bg-outrun-storm, bg-strange-days

    PHASE 3: Advanced Interactive Components

    3.1 Implement Clip-Path Effects

    Apply theme-aware geometric shapes:
    - Nightdrive: clip-corner → clip-corner-xl on hover
    - Neon Surge: clip-corner-sm → clip-bevel on hover
    - Outrun Storm: clip-corner-lg with dramatic transitions
    - Strange Days: clip-terminal for underground aesthetic

    3.2 Create Complex Interactive Patterns

    New interactive components:
    - Cyber buttons with before/after pseudo-elements for scan effects
    - Terminal windows with animated scan lines
    - Cards that morph shapes on hover
    - Input fields with futuristic validation states

    PHASE 4: Theme-Specific Effects

    4.1 Nightdrive Theme (Smooth Cruising)

    - Apply bg-nightdrive gradient to container
    - Use animate-nightdrive-pulse on buttons
    - Add shadow-button-nightdrive for neon glow
    - Implement smooth --pulse-speed: 4s timing

    4.2 Neon Surge Theme (Electric Chaos)

    - Apply bg-neon-surge gradient
    - Use animate-data-corruption on hover states
    - Add animate-electric-scan to terminals
    - Implement glitch effects on text

    4.3 Outrun Storm Theme (Weather Drama)

    - Apply bg-outrun-storm gradient
    - Add animate-storm-lightning to header
    - Use shadow-button-storm on interactive elements
    - Create weather overlay effects

    4.4 Strange Days Theme (Underground)

    - Apply bg-strange-days gradient
    - Use animate-phantom-flicker on headings
    - Add animate-underground-drift overlay
    - Implement noise texture backgrounds

    PHASE 5: Form & Input Enhancement

    5.1 Modern Form Components

    Create new form patterns:
    - Floating label inputs with peer states
    - Toggle switches with gradient fills
    - Radio groups with sibling selectors
    - Validation states with peer-invalid

    DETAILED TODO LIST:

    1. Update Layout Components (components/layout.css)
      - Convert .vibe-status to use inline data attributes
      - Add theme-specific container backgrounds
      - Implement animated overlays per theme
    2. Enhance Terminal System (components/terminals.css)
      - Add group-based LED indicators
      - Implement scan line effects
      - Add theme-specific terminal animations
    3. Revolutionize Buttons (components/buttons.css)
      - Create .btn-cyber with scan line effect
      - Add theme-specific hover animations
      - Implement clip-path transitions
    4. Create Theme Files (4 new files)
      - Define unique component styles per theme
      - Apply specific animations to each theme
      - Use theme gradients and shadows
    5. Build Interactive Forms (components/forms.css)
      - Create floating label system
      - Build toggle switch component
      - Add peer-based validation
    6. Apply Clip-Path Utilities (all component files)
      - Use geometric shapes on cards
      - Add hover transitions
      - Theme-specific clip variations
    7. Implement Unused Animations
      - Apply all 20+ defined animations
      - Create animation compositions
      - Theme-aware animation speeds
    8. Add Pseudo-Element Effects
      - Scan lines with ::before/::after
      - Gradient overlays
      - Animated backgrounds
    9. Create Sibling Relationships
      - Form field interactions
      - Navigation states
      - Toggle groups
    10. Test & Optimize
      - Build CSS and verify all effects
      - Check theme switching
      - Ensure smooth animations

    Expected Outcome:

    - 4 Dramatically Different Themes - Each with unique personality and feel
    - 30+ Active Animations - All defined animations in use
    - Modern Component Patterns - Using latest Tailwind features
    - Interactive Excellence - Group/peer patterns throughout
    - Geometric Aesthetics - Clip-paths creating cyberpunk shapes
    - Performance Optimized - Efficient CSS with minimal redundancy
- DO NOT use emoji, unicode or other extended characters in console or dump logs.