# VibeReader Terminal Logging API v2.1

## Overview
The VibeReader extension implements a sophisticated dual-terminal diagnostic system with real-time console capture, categorized message filtering, and interactive collapsible UI elements. This API specification defines the extensible logging architecture for both development debugging and user-facing diagnostics.

## Architecture Components

### 🖥️ Dual Terminal System

#### SYSADMIN Terminal (Left Panel)
**Purpose**: Primary diagnostic display for foreground tab monitoring and critical events  
**Scope**: User-facing extraction status, content metrics, critical errors  
**Location**: `proxy-controller.js:updateLiveTerminals()`

#### NETMON Terminal (Right Panel) 
**Purpose**: Network and background activity monitoring  
**Scope**: Hidden tab status, framework detection, background processes  
**Location**: `proxy-controller.js:updateLiveTerminals()`

### 🏗️ Message Processing Pipeline

```
Console Output → shouldLogMessage() → Category Classification → Terminal Routing → UI Rendering
```

## Message Classification System

### Category Definitions
```javascript
const LOG_CATEGORIES = {
    ERRORS: {
        patterns: ['ERR:', '❌', 'failed', 'error', 'Error:', 'ERROR'],
        icon: '🔴',
        priority: 1,
        terminals: ['SYSADMIN', 'NETMON']
    },
    MEDIA: {
        patterns: ['MEDIA', '🔍', 'images', 'videos', '📦', 'Found', 'Loading'],
        icon: '📦',
        priority: 3,
        terminals: ['SYSADMIN']
    },
    ASCII: {
        patterns: ['ASCII', '🎯', 'conversion', 'aalib', '🎨', 'convertToAscii'],
        icon: '🎯',
        priority: 3,
        terminals: ['SYSADMIN']
    },
    NETWORK: {
        patterns: ['BG:', 'extraction', 'proxy', 'NETMON', 'framework', 'hiddenTab'],
        icon: '🌐',
        priority: 2,
        terminals: ['NETMON']
    },
    SYSTEM: {
        patterns: ['LOG:', '✅', 'initialized', 'activated', 'ProxyController'],
        icon: '✅',
        priority: 4,
        terminals: ['SYSADMIN', 'NETMON']
    }
};
```

### Message Filtering Rules
```javascript
// High-priority patterns that bypass noise filtering
const PRIORITY_PATTERNS = [
    /ERR:/,
    /❌/,
    /failed/i,
    /error/i,
    /extraction.*complete/i,
    /framework.*detected/i
];

// Noise patterns to ignore completely
const IGNORE_PATTERNS = [
    'Content-Security-Policy',
    'Partitioned cookie',
    'Navigation API not supported',
    'GSI_LOGGER',
    'GRECAPTCHA',
    'downloadable font: failed',
    '📨 Received message: ping', // Too noisy during active sessions
    'webextension-polyfill'
];
```

## Console Capture Implementation

### Core Override System
```javascript
class ConsoleCapture {
    constructor(proxyController) {
        this.proxy = proxyController;
        this._originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };
        this.initOverrides();
    }

    initOverrides() {
        const self = this;
        
        console.log = function(...args) {
            self._originalConsole.log.apply(console, args);
            self.processMessage('LOG', args.join(' '));
        };
        
        console.warn = function(...args) {
            self._originalConsole.warn.apply(console, args);
            self.processMessage('WARN', args.join(' '));
        };
        
        console.error = function(...args) {
            self._originalConsole.error.apply(console, args);
            self.processMessage('ERR', args.join(' '));
        };
    }

    processMessage(level, message) {
        if (this.shouldLogMessage(message)) {
            const category = this.classifyMessage(message);
            this.routeToTerminals(level, message, category);
        }
    }
}
```

## Terminal Display Protocol

### Interactive Category Headers
```javascript
const CATEGORY_HEADER_TEMPLATE = `
<div class="diagnostic-category" data-category="{category}">
    <div class="category-header" onclick="toggleCategory('{category}')">
        <span class="category-icon">{icon}</span>
        <span class="category-arrow">{arrow}</span>
        <span class="category-name">{name}</span>
        <span class="category-count">({count})</span>
    </div>
    <div class="category-content {collapsed}" data-category-content="{category}">
        {content}
    </div>
</div>
`;
```

### State Management
```javascript
class TerminalState {
    constructor() {
        this.categories = new Map();
        this.expandedStates = new Map(); // Persistent expand/collapse state
        this.messageCounters = new Map(); // Duplicate message consolidation
        this.lastUpdate = Date.now();
    }

    toggleCategory(categoryName) {
        const isExpanded = this.expandedStates.get(categoryName) || false;
        this.expandedStates.set(categoryName, !isExpanded);
        this.renderCategory(categoryName);
    }

    addMessage(category, message) {
        const key = `${category}:${message}`;
        const count = this.messageCounters.get(key) || 0;
        this.messageCounters.set(key, count + 1);
        this.updateCategoryDisplay(category);
    }
}
```

## Debug Output Formats

### Compact Diagnostic Summary
```
[DIAG] ERRORS:2 MEDIA:1 ASCII:0 SYSTEM:3 NETWORK:5 | Latest: Found 0 images for processing
```

**Format Specification:**
- `[DIAG]` - Diagnostic prefix identifier
- `CATEGORY:COUNT` - Space-separated category counts
- `|` - Separator for latest event
- `Latest: {message}` - Most recent meaningful diagnostic

### Terminal-Specific Output
```
[SYSADMIN] STATUS: ACTIVE | SCORE: EXCELLENT | CONTENT: 2847w (14min)
[NETMON] PROXY: CONNECTED | TARGET: www.reddit.com | FRAMEWORK: vanilla
```

### Detailed Error Context
```json
{
  "timestamp": "2025-08-22T10:30:45.123Z",
  "category": "ERRORS", 
  "level": "ERR",
  "message": "Readability.js library not available",
  "context": {
    "tabId": 12345,
    "url": "https://example.com",
    "extractionAttempt": 2,
    "framework": "react"
  },
  "stackTrace": "Error: Library not found\n    at inject..."
}
```

## Extensible Category System

### Adding New Categories
```javascript
// 1. Define category configuration
const NEW_CATEGORY = {
    patterns: ['CUSTOM:', 'specific-keyword'],
    icon: '🔧',
    priority: 3,
    terminals: ['SYSADMIN'],
    color: '--accent-500' // CSS custom property
};

// 2. Register category
LOG_CATEGORIES.CUSTOM = NEW_CATEGORY;

// 3. Update UI template
const CATEGORY_CSS = `
.diagnostic-category[data-category="CUSTOM"] .category-header {
    color: rgba(var(--accent-500), 1);
    border-left: 3px solid rgba(var(--accent-500), 0.6);
}
`;
```

### Dynamic Category Modification
```javascript
class CategoryManager {
    addCategory(name, config) {
        LOG_CATEGORIES[name] = {
            patterns: config.patterns || [],
            icon: config.icon || '📋',
            priority: config.priority || 5,
            terminals: config.terminals || ['SYSADMIN'],
            color: config.color || '--primary-500'
        };
        this.updateClassificationRules();
    }

    removeCategory(name) {
        delete LOG_CATEGORIES[name];
        this.cleanupCategoryUI(name);
    }

    modifyCategory(name, updates) {
        if (LOG_CATEGORIES[name]) {
            Object.assign(LOG_CATEGORIES[name], updates);
        }
    }
}
```

## Performance Optimization

### Message Deduplication
```javascript
class MessageDeduplicator {
    constructor(windowSize = 1000) {
        this.recentMessages = new Map();
        this.windowSize = windowSize;
    }

    shouldLog(message) {
        const hash = this.hashMessage(message);
        const lastSeen = this.recentMessages.get(hash);
        const now = Date.now();
        
        if (!lastSeen || (now - lastSeen) > 5000) { // 5 second cooldown
            this.recentMessages.set(hash, now);
            this.cleanup();
            return true;
        }
        
        return false;
    }

    cleanup() {
        if (this.recentMessages.size > this.windowSize) {
            const cutoff = Date.now() - 30000; // 30 second retention
            for (const [hash, timestamp] of this.recentMessages) {
                if (timestamp < cutoff) {
                    this.recentMessages.delete(hash);
                }
            }
        }
    }
}
```

### Throttled Updates
```javascript
class ThrottledRenderer {
    constructor(updateInterval = 3000) {
        this.updateInterval = updateInterval;
        this.pendingUpdates = new Set();
        this.updateTimer = null;
    }

    scheduleUpdate(terminalId) {
        this.pendingUpdates.add(terminalId);
        
        if (!this.updateTimer) {
            this.updateTimer = setTimeout(() => {
                this.processPendingUpdates();
                this.updateTimer = null;
            }, this.updateInterval);
        }
    }

    processPendingUpdates() {
        for (const terminalId of this.pendingUpdates) {
            this.renderTerminal(terminalId);
        }
        this.pendingUpdates.clear();
    }
}
```

## Usage Patterns

### Adding Custom Diagnostic Messages
```javascript
// In extension code
function reportCustomDiagnostic(category, message, metadata = {}) {
    const diagnostic = {
        timestamp: new Date().toISOString(),
        category: category.toUpperCase(),
        message: message,
        metadata: metadata
    };
    
    console.log(`[${category.toUpperCase()}] ${message}`, diagnostic);
}

// Usage examples
reportCustomDiagnostic('MEDIA', 'Found 12 images for processing', { count: 12, type: 'images' });
reportCustomDiagnostic('ASCII', 'Starting aalib conversion', { width: 80, height: 24 });
reportCustomDiagnostic('NETWORK', 'Hidden tab extraction complete', { extractionTime: 1250, framework: 'react' });
```

### Error Context Enhancement
```javascript
function enhancedError(message, context = {}) {
    const errorContext = {
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        extension: 'VibeReader v2.0.0',
        ...context
    };
    
    console.error(`ERR: ${message}`, errorContext);
    
    // Optional: Send to background script for aggregation
    browser.runtime.sendMessage({
        type: 'errorReport',
        message: message,
        context: errorContext
    });
}
```

### Performance Monitoring Integration
```javascript
class PerformanceLogger {
    static measureOperation(operationName, operation) {
        const startTime = performance.now();
        
        return Promise.resolve(operation()).then(result => {
            const duration = performance.now() - startTime;
            console.log(`SYSTEM: ${operationName} completed in ${duration.toFixed(2)}ms`);
            return result;
        }).catch(error => {
            const duration = performance.now() - startTime;
            console.error(`ERR: ${operationName} failed after ${duration.toFixed(2)}ms`, error);
            throw error;
        });
    }
}

// Usage
await PerformanceLogger.measureOperation('Content Extraction', async () => {
    return await extractContentFromPage();
});
```

## Terminal UI CSS Requirements

### Category Styling Framework
```css
/* Base category styles */
.diagnostic-category {
    margin-bottom: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(var(--bg-surface), 0.1);
}

.category-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
}

.category-header:hover {
    background: rgba(var(--primary-500), 0.1);
    box-shadow: 0 0 10px rgba(var(--glow-primary), 0.3);
}

.category-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 0 12px;
    transition: max-height 0.3s ease, padding 0.3s ease;
}

.category-content.collapsed {
    max-height: 0;
    padding: 0 12px;
    overflow: hidden;
}

/* Category-specific colors */
.diagnostic-category[data-category="ERRORS"] .category-header {
    border-left-color: rgba(var(--accent-500), 0.8);
}

.diagnostic-category[data-category="MEDIA"] .category-header {
    border-left-color: rgba(var(--secondary-500), 0.8);
}

.diagnostic-category[data-category="NETWORK"] .category-header {
    border-left-color: rgba(var(--primary-500), 0.8);
}
```

## Integration Points

### Background Script Integration
```javascript
// background-enhanced.js
class DiagnosticAggregator {
    constructor() {
        this.sessionLogs = new Map(); // tabId -> logs
        this.globalMetrics = new Map();
    }

    handleDiagnosticMessage(message, sender) {
        const tabId = sender.tab?.id;
        if (!tabId) return;

        if (!this.sessionLogs.has(tabId)) {
            this.sessionLogs.set(tabId, []);
        }

        this.sessionLogs.get(tabId).push({
            timestamp: Date.now(),
            ...message
        });

        this.updateGlobalMetrics(message);
    }

    generateSessionReport(tabId) {
        const logs = this.sessionLogs.get(tabId) || [];
        return {
            totalMessages: logs.length,
            categories: this.categorizeMessages(logs),
            timeline: this.generateTimeline(logs),
            performance: this.calculatePerformanceMetrics(logs)
        };
    }
}
```

### Development Debug Integration
```javascript
// Debug mode enhancement
if (DEBUG_MODE) {
    window.VibeReaderDebug = {
        dumpLogs: () => terminalState.dumpAllLogs(),
        clearLogs: () => terminalState.clearAllLogs(),
        addTestMessage: (category, message) => terminalState.addMessage(category, message),
        getCategoryStats: () => terminalState.getCategoryStatistics(),
        exportSession: () => terminalState.exportSessionData()
    };
}
```

## Future Extensions

### Planned Enhancements
- **Machine Learning Classification**: Auto-categorize unknown message patterns
- **Advanced Filtering**: User-defined filter rules and custom categories  
- **Export Functionality**: Session logs export in multiple formats
- **Real-time Analytics**: Performance metrics and usage statistics
- **Integration APIs**: Webhook endpoints for external monitoring systems

### Extensibility Points
- **Custom Renderers**: Plugin system for custom terminal display modes
- **Message Preprocessors**: Pipeline for message transformation before classification
- **Storage Backends**: Configurable persistence layers (IndexedDB, localStorage, remote)
- **Notification System**: Integration with browser notifications for critical events

---

## Implementation Checklist

- [x] Core console capture system
- [x] Message classification engine  
- [x] Dual terminal UI framework
- [x] Interactive category system
- [x] Performance optimization (deduplication, throttling)
- [ ] Advanced filtering rules
- [ ] Export functionality 
- [ ] Background script aggregation
- [ ] Development debug tools
- [ ] Documentation and examples

---

*This API specification is designed to be extensible and maintainable. When implementing new features, ensure they follow the established patterns and maintain backward compatibility with existing category definitions.*