# VibeReader Extension

> Transform any webpage into a **90s synthwave cyberpunk retrofuture reading experience**

[![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-orange)](https://www.mozilla.org/firefox/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.4-green.svg)](manifest.json)

VibeReader is a Firefox browser extension that provides an immersive reading experience with synthwave aesthetics, terminal-style diagnostic panels, and advanced content extraction capabilities.

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
├── manifest.json                 # Extension configuration (Manifest V2)
├── src/
│   ├── background-enhanced.js    # Hidden tab manager & message routing
│   ├── stealth-extractor.js     # Content extraction with framework detection  
│   ├── proxy-controller.js      # UI overlay with terminal system
│   ├── unified-vibe.js          # ContentTransformer & PipelineProcessor
│   ├── vibe-subscribe.js        # SubscriberEnabledComponent middleware architecture
│   └── vibe-utils.js            # Core utilities (MessageBridge, EventBus, VibeLogger)
├── popup/
│   ├── popup.html               # Settings interface
│   ├── popup.js                 # Settings controller with persistence
│   └── popup.css                # Settings styling
├── styles/
│   ├── generated.css            # Compiled Tailwind output (1,600 lines)
│   └── src/styles/tailwind.css  # Source components and utilities
├── lib/                         # External libraries (Readability.js, aalib.js)
├── fonts/                       # Custom synthwave fonts
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

**Extension not activating:**
- Check browser console for class definition errors
- Verify script loading order in manifest.json
- Ensure SubscriberEnabledComponent loads before other scripts

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