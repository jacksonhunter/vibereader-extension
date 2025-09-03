# VibeReader Extension

> Transform any webpage into a **90s synthwave cyberpunk retrofuture reading experience**

[![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-orange)](https://www.mozilla.org/firefox/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.5-orange.svg)](manifest.json)
[![Status](https://img.shields.io/badge/Status-Development-yellow.svg)](#-known-issues)

VibeReader is a Firefox browser extension that provides an immersive reading experience with synthwave aesthetics, terminal-style diagnostic panels, and advanced content extraction capabilities.

> ⚠️ **DEVELOPMENT STATUS**: This extension is currently under active development. While the middleware architecture is fully implemented, there are missing base class dependencies that prevent full functionality. See [Known Issues](#-known-issues) for current blockers.

## 🌟 Features

### Core Reading Experience
- **Hidden Tab Proxy Architecture**: Clean content extraction without page interference
- **90s Retrofuture Interface**: Fullscreen reader mode with cyberpunk aesthetics  
- **Dual Terminal System**: SYSADMIN (left) and NETMON (right) diagnostic panels
- **Four Synthwave Themes**: Nightdrive, Neon Surge, Outrun Storm, Strange Days
- **Smart Content Detection**: Auto-detects and waits for React/Vue/Angular/Next.js/Svelte hydration
- **Advanced Media Handling**: Three display modes (emoji/ASCII/normal) with aalib.js integration

### Technical Architecture  
- **Production Middleware System**: Event-driven architecture with SubscriberEnabledComponent base
- **Memory Management**: WeakMap-based resource tracking with automatic cleanup
- **Error Recovery**: Quarantine system with exponential backoff for failed subscribers
- **Cross-Context Validation**: MessageBridge with comprehensive serialization and validation
- **Performance Monitoring**: Built-in timing middleware and rate limiting (ERRORS=50ms, CSS=200ms)

### Development Infrastructure
- **Zero-Error Codebase**: ESLint flat config with 85+ issues resolved  
- **Automated Debugging**: PowerShell scripts with auto-close and dump log analysis
- **Production Build Pipeline**: Tailwind CSS with PostCSS, cssnano optimization
- **Firefox Developer Edition Integration**: Auto-start debugging with Reddit navigation

## 🚀 Quick Start

### Prerequisites
- **Firefox Developer Edition** (recommended) or Firefox 88+
- **Node.js 14+** and npm for development
- **Windows PowerShell** for automated development workflow

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vibe-reader-extension.git
   cd vibe-reader-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build CSS assets**
   ```bash
   npm run build:css:prod
   ```

4. **Load extension in Firefox**
   ```bash
   npm run dev:extension
   # OR use PowerShell automation:
   .\run-extension.ps1
   ```

### First Use
1. Extension auto-loads Firefox Developer Edition → Reddit.com
2. Extension auto-activates due to debugging settings
3. Press **Ctrl+Shift+M** or click toolbar icon to toggle VibeReader mode
4. Use popup settings to customize themes and features

## 📁 Project Structure

```
vibe-reader-extension/
├── manifest.json                 # Extension configuration (Manifest V2, loads background scripts)
├── src/                         # Core JavaScript modules
│   ├── vibe-subscribe.js        # Subscriber architecture & middleware system (⚠️ Missing base classes)
│   ├── vibe-utils.js            # LocalEventBus & Cross-context MessageBridge
│   ├── background-enhanced.js   # BackgroundOrchestrator, SmartTab management, ScriptInjector
│   ├── stealth-extractor.js     # Content extraction with ExtractionPipelineMiddleware
│   ├── proxy-controller.js      # UI overlay with MediaAggregationMiddleware & SmartTerminal
│   ├── unified-vibe.js          # Content processing pipeline (unified.js integration)
│   └── unified-entry.js         # Entry point for unified processing
├── lib/                         # External libraries
│   ├── unified-bundle.js        # Unified.js processing library
│   ├── readability.js           # Mozilla Readability extraction
│   ├── aalib.js                 # ASCII art conversion
│   └── purify.min.js            # DOM sanitization
├── popup/
│   ├── popup.html               # Settings interface
│   ├── popup.js                 # Settings controller with persistence
│   └── popup.css                # Settings styling
├── styles/
│   ├── generated.css            # Compiled Tailwind output (1,600 lines)
│   └── src/styles/tailwind.css  # Source components and utilities
├── fonts/                       # Custom synthwave fonts (Orbitron, Fira Code, VT323)
└── icons/                       # Extension icons
```

## 🛠️ Development Workflow

### Daily Development Commands
```bash
# Start development with automated debugging
.\run-extension.ps1                    # Auto-close after 30s, full logging

# Manual development commands  
npm run dev:extension                  # Launch Firefox Developer Edition
npm run lint                          # ESLint code quality check
npm run lint:webext                   # Web-ext extension validation
npm run test                          # Run all linting checks

# CSS development
npm run dev                           # Tailwind watch mode  
npm run build:css:prod               # Production CSS build
```

### PowerShell Automation Features
```powershell
# Auto-close options
.\run-extension.ps1                    # Default: 30 second auto-close
.\run-extension.ps1 -AutoClose 60     # Custom timeout (60 seconds)  
.\run-extension.ps1 -AutoClose 0      # Disable auto-close

# Output includes:
# - Full sorted dump log with error frequency analysis
# - Automatic Firefox Developer Edition process cleanup  
# - Comprehensive extension lifecycle management
```

### Architecture Overview

#### Middleware System (Production Ready)
```javascript
// All components extend SubscriberEnabledComponent
class MyComponent extends SubscriberEnabledComponent {
  constructor() {
    super();
    
    // Automatic subscription management with middleware pipeline
    this.subscribe('eventCategory', this.handleEvent.bind(this), {
      validation: true,        // Message structure validation
      rateLimit: 200,         // 200ms throttling  
      transform: true,        // Data transformation pipeline
      errorRecovery: true     // Quarantine on repeated failures
    });
  }
}
```

#### Hidden Tab Proxy Pattern
```javascript
// background-enhanced.js → HiddenTabManager
// Creates invisible tab for content extraction
// stealth-extractor.js → Runs in hidden tab, extracts content  
// proxy-controller.js → Displays content in visible tab overlay
```

#### Terminal System Integration
```javascript
// SYSADMIN terminal (left): Extraction status, critical errors
// NETMON terminal (right): Hidden tab status, framework detection  
// Category-specific subscriptions with rate limiting
```

## 🎨 Themes & Customization

### Available Themes
1. **Nightdrive Enhanced** (default): Classic neon pink/cyan + Orbitron font
2. **Neon Surge**: Electric pink/blue high-contrast + Fira Code font  
3. **Outrun Storm**: Purple/orange dramatic weather + Fira Code font
4. **Strange Days**: Phantom pink/lime underground + Orbitron font

### Settings Configuration
```javascript
// Stored in browser.storage.sync
{
    theme: 'nightdrive',        // Theme selection
    mediaMode: 'emoji',         // Media display: emoji|ascii|normal  
    sideScrolls: true,          // Terminal panels visibility
    vibeRain: false,            // Matrix rain background effect
    autoActivate: true          // Auto-transform on page load (debugging)
}
```

## 🔧 Debugging & Troubleshooting

### Common Issues

**Extension not loading (v2.5 critical):**
- Check browser console for `ReferenceError: SubscriberEnabledComponent is not defined`
- Look for `ReferenceError: SubscriberMiddleware is not defined` 
- Verify `window.__globalSubscriberManager` is initialized in `vibe-subscribe.js`
- Current error: Syntax error fixed, but base classes missing

**Extension activation failures:**
- Ensure all base classes are defined before component instantiation
- Check script loading order: vibe-subscribe.js → vibe-utils.js → background-enhanced.js
- Look for initialization sequence in browser console

**Performance issues:**  
- Monitor terminal output for subscriber quarantine messages
- Check middleware rate limiting (ERRORS=50ms, CSS=200ms)
- Review dump log for excessive event frequency

**CSS not loading:**
- Rebuild Tailwind: `npm run build:css:prod`  
- Check Content-Security-Policy violations in console
- Verify generated.css file size (~1,600 lines expected)

### Debug Output Analysis
```bash
# PowerShell script generates sorted dump log:
#   3 console.warn messages  
#  15 Extension loaded successfully
#  42 Middleware pipeline initialized
# 128 Content extraction completed
```

### Development Tips
- Use `autoActivate: true` for debugging (already configured)
- Reddit.com auto-loads for consistent testing environment
- Monitor SYSADMIN/NETMON terminals for real-time diagnostics
- Check subscriber quarantine status if events stop processing

## 🚀 Production Build

### Extension Packaging
```bash
npm run build:extension          # Creates web-ext-artifacts/vibe-reader-{version}.zip
npm run lint:webext              # Validates extension structure (0 errors expected)
```

### CSS Optimization  
```bash
npm run build:css:prod           # Minified production CSS (~1,600 lines → ~800KB)
```

## 📋 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Shift+M** | Toggle VibeReader mode |
| **Escape** | Close image previews |

## 🔮 Planned Features

- **Obsidian Integration**: Save articles to vault
- **Raindrop.io Integration**: Bookmark to collections
- **ASCII Art Mode**: Real ASCII generation from images  
- **Sound Effects**: Optional cyberpunk audio feedback
- **Reading Progress**: Track position within articles
- **Chrome/Safari Support**: Cross-browser compatibility

## 🐛 Known Issues

### 🔴 Critical Blockers (v2.5)

1. **Missing Base Classes** - Extension fails to load due to undefined classes:
   - `SubscriberEnabledComponent` (referenced by all main components)
   - `SubscriberMiddleware` (extended by all middleware classes)
   - These need to be defined in `vibe-subscribe.js`

2. **Global Subscriber Manager** - Never initialized:
   - `window.__globalSubscriberManager` is referenced but not created
   - Background scripts check for `window.__globalSubscriberManager?.origin === "background"`
   - Must be initialized before any components are instantiated

3. **Script Loading Dependencies** - Components extend undefined classes:
   - `BackgroundOrchestrator extends SubscriberEnabledComponent` → ReferenceError
   - `StealthExtractor extends SubscriberEnabledComponent` → ReferenceError  
   - `ProxyController extends SubscriberEnabledComponent` → ReferenceError

### ⚠️ Secondary Issues

- **Chrome Compatibility**: Requires Manifest V3 conversion
- **Readability.js Dependency**: May need replacement for better content extraction
- **Framework Detection Timing**: Occasional race conditions with dynamic content

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Ensure all ESLint checks pass: `npm run test`  
4. Commit with architecture notes: `git commit -m "feat: description"`
5. Push and create Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/vibe-reader-extension/issues)
- **Debugging**: Use PowerShell automation with dump log analysis
- **Architecture Questions**: Review CLAUDE.md for AI development context

---

*Built with ❤️ for the synthwave cyberpunk reading experience*