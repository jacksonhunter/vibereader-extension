
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
├── content.js                 # Main content transformation (997 lines)
├── background.js              # Extension lifecycle (119 lines)  
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

### MatrixReader (content.js)
Main class handling page transformation and user interface:
- `activate()` - Transforms page using Readability.js extraction
- `createRetrofutureLayout()` - Builds 90s cyberpunk interface
- `processRetrofutureContent()` - Converts HTML to themed format
- `inlineLoadAllMedia()` - Loads images/videos directly in content
- `initRetrofutureSideScrollers()` - Populates terminal panels
- `cycleTheme()` - Switches between 4 synthwave themes

### MatrixReaderBackground (background.js)  
Handles extension lifecycle and browser integration:
- `toggleMatrixMode()` - Activates/deactivates reader on tabs
- `updateBadge()` - Shows ON/OFF status in browser toolbar
- `handleMessage()` - Processes settings and state changes

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
- Uses Readability.js for clean content extraction
- Replaces entire page DOM with retrofuture interface
- Stores original content for restoration on exit
- CSS themes use CSS custom properties for easy switching
- Image placeholders show hover hints for preview system
- Terminal panels auto-populate with page metadata
- Inline media loading replaces links with actual media elements
- Hybrid dynamic content detection (MutationObserver + progressive polling)
- Site-specific content pattern recognition for modern JavaScript sites

### Browser Compatibility
- ✅ **Firefox 88+** (Manifest V2)  
- ⚠️ **Chrome** (needs Manifest V3 conversion)
- ⚠️ **Safari** (needs additional modifications)

### Known Issues
- Some pages may block content extraction for security
- CORS policies can prevent image preview on external images
- Performance impact on pages with many images/videos
- Complex tables with merged cells may need manual review after expansion
- ~~Dynamic content loading sites (eCFR, Reddit, Gemini) may have incomplete extraction~~ **FIXED**

## 🟢 CURRENT FEATURES (Implemented)

### Core Reader Functionality
- ✅ **Matrix Reader Mode Toggle** - Ctrl+Shift+M or toolbar icon
- ✅ **Readability.js Content Extraction** - Clean article parsing
- ✅ **90s Retrofuture Interface** - Complete cyberpunk transformation
- ✅ **Original Page Restoration** - Exit back to normal web
- ✅ **Dynamic Content Detection** - Waits for JavaScript-loaded content on modern sites

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