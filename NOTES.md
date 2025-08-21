# 🚀 Complete Technical Flow: Popup → Set Vibes → Content Display

## Phase 1: Popup Initialization

```javascript
// popup.js loads when popup.html opens
1. new VibeReaderPopup() // Constructor called
   ├─ this.currentTab = null
   ├─ this.settings = { theme: 'nightdrive', mediaMode: 'emoji', ... }
   └─ this.init() // Async initialization
      ├─ await this.getCurrentTab()
      │  └─ browser.tabs.query({ active: true, currentWindow: true })
      ├─ await this.loadSettings()
      │  └─ browser.storage.sync.get('vibeReaderSettings')
      ├─ await this.updateStatus()
      │  └─ browser.tabs.sendMessage(tab.id, { action: 'getStatus' })
      ├─ this.setupEventListeners()
      │  └─ document.getElementById('toggle-btn').addEventListener('click', ...)
      └─ this.initGlitchEffects()
         └─ setInterval for glitch animations (3000ms)
```

## Phase 2: User Clicks "Set Vibes" Button

```javascript
2. toggleVibeMode() triggered // popup.js:182
   ├─ toggleBtnText.textContent = 'PROCESSING...'
   ├─ window.close() // Close popup
   └─ browser.runtime.sendMessage({
        action: 'toggleFromPopup',
        tabId: this.currentTab.id
      })
```

## Phase 3: Background Script Receives Message

```javascript
3. HiddenTabManager.handleMessage() // background-enhanced.js
   └─ case 'toggleFromPopup':
      └─ this.toggleVibeMode(tab)
         ├─ const tabState = this.tabStates.get(tab.id)
         └─ if (!tabState?.active)
            └─ await this.activateVibeMode(tab)
```

## Phase 4: Hidden Tab Creation & Setup

```javascript
4. activateVibeMode(tab) // background-enhanced.js:61
   ├─ console.log('🔥 Set Vibes // initializing hidden tab proxy...')
   ├─ const hiddenTab = await this.createHiddenTab(tab.url)
   │  └─ browser.tabs.create({
   │       url: tab.url,
   │       active: false,
   │       index: 9999 // Hidden position
   │     })
   │
   ├─ this.extractionStatus.set(hiddenTab.id, {
   │    visibleTabId: tab.id,
   │    status: 'extracting'
   │  })
   │
   ├─ await browser.tabs.executeScript(hiddenTab.id, {
   │    file: 'lib/readability.js'
   │  })
   │
   ├─ await browser.tabs.executeScript(hiddenTab.id, {
   │    file: 'stealth-extractor.js'
   │  })
   │
   └─ setTimeout(() => {
        browser.tabs.sendMessage(hiddenTab.id, {
          action: 'extractContent',
          config: {
            waitForFramework: true,
            simulateScroll: true,
            extractDelay: 500
          }
        })
      }, 500)
```

## Phase 5: Stealth Extractor Initialization (Hidden Tab)

```javascript
5. new StealthExtractor() // stealth-extractor.js:5
   ├─ this.extractionAttempts = 0
   ├─ this.mutationObserver = null
   └─ this.init()
      ├─ browser.runtime.onMessage.addListener(...)
      ├─ this.detectFramework()
      │  └─ Sets: 'react'|'vue'|'angular'|'vanilla'
      └─ this.reportProgress('initialized', 0)
```

## Phase 6: Content Extraction Begins

```javascript
6. StealthExtractor.handleMessage() receives 'extractContent'
   └─ this.startExtraction(config, sendResponse)
      ├─ this.reportProgress('waiting_for_framework', 10)
      │
      ├─ await this.waitForFramework() // ~800ms for React
      │  └─ this.waitForReactReady(resolve, 800)
      │     └─ requestAnimationFrame(checkReact) // Polls until ready
      │
      ├─ this.reportProgress('extracting', 40)
      │
      ├─ const content = await this.extractWithReadability()
      │  └─ this.extractContent()
      │     ├─ const documentClone = document.cloneNode(true)
      │     ├─ this.preprocessDocument(documentClone)
      │     │  └─ Remove ads, popups, modals, etc.
      │     ├─ const reader = new Readability(documentClone, {
      │     │    maxElemsToParse: 0,
      │     │    nbTopCandidates: 5,
      │     │    charThreshold: 500
      │     │  })
      │     ├─ const article = reader.parse()
      │     └─ this.postprocessContent(article.content)
      │        └─ Fix image srcs, remove empty paragraphs
      │
      ├─ this.reportProgress('complete', 90)
      │
      ├─ this.reportExtraction(content)
      │  └─ browser.runtime.sendMessage({
      │       action: 'contentExtracted',
      │       content: article.content,
      │       metadata: { title, byline, excerpt, ... }
      │     })
      │
      └─ this.backgroundScrollAndUpdate() // Non-blocking
         └─ await this.simulateHumanScroll()
            └─ Scrolls page for lazy loading
```

## Phase 7: Background Receives Extracted Content

```javascript
7. HiddenTabManager.handleMessage() // background-enhanced.js
   └─ case 'contentExtracted':
      └─ this.handleExtractedContent(request, sender)
         ├─ const extractionInfo = this.extractionStatus.get(sender.tab.id)
         ├─ browser.tabs.sendMessage(extractionInfo.visibleTabId, {
         │    action: 'displayExtractedContent',
         │    content: request.content,
         │    metadata: request.metadata
         │  })
         └─ setTimeout(() => browser.tabs.remove(sender.tab.id), 5000)
```

## Phase 8: Proxy Controller Injection (Visible Tab)

```javascript
8. Background injects proxy-controller.js into visible tab
   └─ browser.tabs.executeScript(tab.id, {
        file: 'proxy-controller.js'
      })
```

## Phase 9: Proxy Controller Initialization

```javascript
9. new ProxyController() // proxy-controller.js:5
   ├─ this.container = null
   ├─ this.isActive = false
   ├─ this.settings = { theme: 'nightdrive', sideScrolls: true, ... }
   └─ this.init()
      └─ browser.runtime.onMessage.addListener(...)
```

## Phase 10: Display Extracted Content

```javascript
10. ProxyController.handleMessage() receives 'displayExtractedContent'
    └─ this.displayExtractedContent(content, metadata)
       ├─ this.extractedContent = content
       ├─ this.metadata = metadata
       │
       ├─ this.createInterface()
       │  ├─ this.hideOriginalContent()
       │  │  └─ document.querySelectorAll('*').forEach(hideHighZIndex)
       │  ├─ this.container = document.createElement('div')
       │  ├─ this.container.className = 'vibe-reader-container'
       │  ├─ this.container.innerHTML = `
       │  │    <div class="vibe-layout">
       │  │      ${this.createLeftPanel()} // Terminal panel
       │  │      <main class="vibe-content">
       │  │        <article class="vibe-article">
       │  │          ${this.processContent(content)}
       │  │        </article>
       │  │      </main>
       │  │      ${this.createRightPanel()} // Terminal panel
       │  │    </div>
       │  │  `
       │  ├─ document.body.appendChild(this.container)
       │  └─ this.loadStyles()
       │     ├─ Inject retrofuture-theme.css
       │     └─ Inject matrix-theme.css
       │
       ├─ this.setupEventListeners()
       │  ├─ .theme-btn → this.cycleTheme()
       │  ├─ .media-btn → this.cycleMediaMode()
       │  └─ .disconnect-btn → this.disconnect()
       │
       ├─ this.initializeEffects()
       │  ├─ this.startGlitchEffects()
       │  │  └─ setInterval random glitch (3000ms)
       │  ├─ this.createMatrixRain() // If enabled
       │  └─ this.startTerminalEffects()
       │     └─ setInterval updateLiveTerminals (2000ms)
       │
       └─ this.processMediaElements()
          └─ Replace images with placeholders or ASCII
```

## Phase 11: Media Processing

```javascript
11. processMediaElements() // proxy-controller.js
    └─ images.forEach(img => {
         const wrapper = this.createMediaWrapper(img)
         └─ Based on this.settings.mediaMode:
            ├─ 'emoji': createEmojiDisplay()
            ├─ 'ascii': createAsciiDisplay()
            │  └─ this.convertToAscii(src)
            │     └─ window.aalib.read.image.fromURL(src)
            │        .map(aalib.aa({ width: 80, height: 40 }))
            │        .subscribe(...)
            └─ 'normal': createNormalDisplay()
       })
```

## Phase 12: Terminal Effects & Updates

```javascript
12. startTerminalEffects() // Runs every 2000ms
    └─ this.updateLiveTerminals()
       ├─ leftTerminal.innerHTML = [
       │    '> VIBE READER v2.0 ACTIVE',
       │    `> CPU: ${Math.random() * 100}% USAGE`,
       │    `> TIME: ${new Date().toLocaleTimeString()}`
       │  ]
       └─ rightTerminal.innerHTML = [
            '> PROXY STATUS: CONNECTED',
            `> BANDWIDTH: ${Math.random() * 1000}KB/s`
          ]
```

## Phase 13: Background Scroll & Update (Async)

```javascript
13. backgroundScrollAndUpdate() // Still running in hidden tab
    ├─ await this.simulateHumanScroll()
    │  └─ Scrolls page incrementally with MutationObserver watching
    ├─ await this.waitForContentStability()
    │  └─ MutationObserver detects changes, waits 800ms stable
    └─ if (newContent.length > originalContent * 1.2)
       └─ this.reportExtraction(newContent) // Send update
```

## Key Objects & Lifecycles

### Living Objects
- **HiddenTabManager** (background) - Singleton, lives forever
- **ProxyController** (visible tab) - Lives while reader is active
- **StealthExtractor** (hidden tab) - Lives until tab closes
- **MutationObserver** (hidden tab) - Lives during content stability check

### Message Flow
```
Popup → Background → Hidden Tab → Background → Visible Tab
         ↓            ↓                          ↓
    Tab creation   Extraction              Display UI
```

### Performance Critical Points
1. Framework detection wait (300-1000ms)
2. Readability.js parsing (100-500ms)
3. DOM cloning & preprocessing (50-200ms)
4. Style injection & layout (100-300ms)

**Total time from click to display: ~1.5-3 seconds**