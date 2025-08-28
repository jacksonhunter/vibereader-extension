# VibeReader System Messaging & Logging API v3.0

## Overview
The VibeReader extension implements a unified messaging and logging system that coordinates communication between background scripts, content scripts (proxy-controller and stealth-extractor), and UI components. This API specification defines the event-driven architecture, message broker system, terminal logging, and cross-component communication protocols.

## Architecture Overview

### 🏗️ System Components

```
Background Script (background-enhanced.js)
    ↕️ [Runtime Messages]
Proxy Controller (proxy-controller.js) 
    ↕️ [Tab Messages]
Stealth Extractor (stealth-extractor.js)
    ↕️ [Event Emissions]
Terminal Logger (integrated)
    ↕️ [MessageBroker]
UI Components (DOM)
```

### 📨 Message Flow Pipeline

```
Event Source → MessageBroker → Event Listeners → Terminal Logger → UI Update
                     ↓
              Serialization
                     ↓
            Cross-Tab Message
                     ↓
              Target Handler
```

## Core Messaging System

### MessageBroker Class

The central hub for all event-driven communication within the extension.

```javascript
class MessageBroker {
    constructor(proxyController) {
        this.proxy = proxyController;
        this.messageQueue = [];
        this.listeners = new Map();
        this.messageHistory = []; // Optional: for debugging
    }
    
    // Send message to different targets
    async send(target, action, data = {}) {
        const message = {
            target,
            action,
            data,
            timestamp: Date.now(),
            id: this.generateMessageId()
        };
        
        // Log outgoing messages for debugging
        if (this.proxy.settings?.debug) {
            this.messageHistory.push(message);
        }
        
        switch(target) {
            case 'background':
                return await browser.runtime.sendMessage({ action, ...data });
            case 'hidden':
                return await this.sendToHiddenTab(action, data);
            case 'self':
                return this.proxy.handleMessage({ action, ...data });
            case 'broadcast':
                return this.broadcastToAll(action, data);
        }
    }
    
    // Event listener registration
    on(event, callback, options = {}) {
        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0
        };
        
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const listeners = this.listeners.get(event);
        listeners.push(listener);
        listeners.sort((a, b) => b.priority - a.priority);
    }
    
    // Event emission with error handling
    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        const errors = [];
        
        listeners.forEach((listener, index) => {
            try {
                listener.callback(data);
                if (listener.once) {
                    listeners.splice(index, 1);
                }
            } catch (error) {
                errors.push({ event, error, listener });
                console.error(`Event handler error for ${event}:`, error);
            }
        });
        
        if (errors.length > 0) {
            this.emit('handler-errors', { errors });
        }
    }
}
```

### Message Serialization

Ensures all messages can be safely passed between contexts:

```javascript
class MessageSerializer {
    static serialize(obj, seen = new WeakSet()) {
        if (obj === undefined) return { __undefined: true };
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        
        // Prevent circular references
        if (seen.has(obj)) return { __circular: true };
        seen.add(obj);
        
        // Handle special types
        if (obj instanceof Error) {
            return {
                __type: 'Error',
                name: obj.name,
                message: obj.message,
                stack: obj.stack
            };
        }
        
        if (obj instanceof Element) {
            return {
                __type: 'Element',
                tagName: obj.tagName,
                id: obj.id,
                className: obj.className,
                textContent: obj.textContent?.substring(0, 100)
            };
        }
        
        if (obj instanceof Date) {
            return { __type: 'Date', value: obj.toISOString() };
        }
        
        if (obj instanceof RegExp) {
            return { __type: 'RegExp', source: obj.source, flags: obj.flags };
        }
        
        // Handle arrays and objects
        if (Array.isArray(obj)) {
            return obj.map(item => MessageSerializer.serialize(item, seen));
        }
        
        const serialized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value !== 'function') {
                serialized[key] = MessageSerializer.serialize(value, seen);
            }
        }
        return serialized;
    }
    
    static deserialize(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        // Handle special types
        if (obj.__undefined) return undefined;
        if (obj.__circular) return '[Circular Reference]';
        
        if (obj.__type) {
            switch(obj.__type) {
                case 'Error':
                    const error = new Error(obj.message);
                    error.name = obj.name;
                    error.stack = obj.stack;
                    return error;
                case 'Date':
                    return new Date(obj.value);
                case 'RegExp':
                    return new RegExp(obj.source, obj.flags);
                case 'Element':
                    return obj; // Can't reconstruct DOM elements
            }
        }
        
        // Handle arrays and objects
        if (Array.isArray(obj)) {
            return obj.map(item => MessageSerializer.deserialize(item));
        }
        
        const deserialized = {};
        for (const [key, value] of Object.entries(obj)) {
            deserialized[key] = MessageSerializer.deserialize(value);
        }
        return deserialized;
    }
}
```

## Event Categories & Definitions

### 📊 Extraction Events

| Event | Data | Description |
|-------|------|-------------|
| `extraction-start` | `{}` | Extraction process initiated |
| `extraction-progress` | `{status, progress}` | Progress update (0-100) |
| `extraction-complete` | `{content, metadata}` | Content successfully extracted |
| `extraction-failed` | `{error, reason}` | Extraction failed |
| `framework-detected` | `{framework}` | Page framework identified |
| `readability-score` | `{score, details}` | Content quality assessment |

### 🎨 CSS & Theme Events

| Event | Data | Description |
|-------|------|-------------|
| `css-loading` | `{}` | CSS injection started |
| `css-loaded` | `{rules, sheets}` | CSS successfully loaded |
| `css-failed` | `{error, attempt}` | CSS loading failed |
| `css-verification` | `{attempt, maxAttempts}` | CSS verification status |
| `theme-change` | `{theme, previous}` | Theme switched |

### 📷 Media Events

| Event | Data | Description |
|-------|------|-------------|
| `media-found` | `{count, type}` | Media elements discovered |
| `media-mode-change` | `{mode, previous}` | Display mode changed |
| `ascii-conversion-start` | `{src, dimensions}` | ASCII art generation started |
| `ascii-conversion-complete` | `{src, output}` | ASCII art ready |
| `ascii-conversion-failed` | `{src, error}` | Conversion failed |

### 🖥️ Terminal Events

| Event | Data | Description |
|-------|------|-------------|
| `terminal-log` | `{level, message, category}` | Log entry added |
| `terminal-category-toggle` | `{category, expanded}` | Category expanded/collapsed |
| `terminal-clear` | `{side}` | Terminal cleared |
| `terminals-updated` | `{categories}` | Terminal content refreshed |

### ⚠️ Error Events

| Event | Data | Description |
|-------|------|-------------|
| `error` | `{message, stack, context}` | General error |
| `warning` | `{message, context}` | Warning condition |
| `console-error` | `{message, source}` | Console error captured |
| `handler-errors` | `{errors}` | Event handler failed |

### 🔄 Lifecycle Events

| Event | Data | Description |
|-------|------|-------------|
| `activation-start` | `{}` | Vibe Mode activation begun |
| `activation-complete` | `{tabId}` | Vibe Mode active |
| `deactivation-request` | `{}` | User requested deactivation |
| `deactivation-complete` | `{}` | Cleanup complete |
| `hidden-tab-created` | `{hiddenTabId}` | Background tab ready |
| `hidden-tab-closed` | `{error}` | Background tab lost |

## Terminal Logging System

### Enhanced Diagnostic Categories

```javascript
const DIAGNOSTIC_CATEGORIES = {
    ERRORS: {
        patterns: ['ERR:', '❌', 'failed', 'error', 'Error:'],
        icon: '🔴',
        priority: 1,
        color: '#ff4757',
        terminals: ['SYSADMIN', 'NETMON'],
        maxLogs: 10,
        autoExpand: true
    },
    CSS: {
        patterns: ['CSS:', '🎨', 'stylesheet', '--tw-', 'generated.css'],
        icon: '🖌️',
        priority: 2,
        color: '#3742fa',
        terminals: ['SYSADMIN'],
        maxLogs: 8,
        autoExpand: true
    },
    MEDIA: {
        patterns: ['MEDIA', '📷', 'images', 'videos', 'Found'],
        icon: '🎬',
        priority: 3,
        color: '#3742fa',
        terminals: ['SYSADMIN'],
        maxLogs: 8,
        autoExpand: true
    },
    ASCII: {
        patterns: ['ASCII', '🎯', 'conversion', 'aalib'],
        icon: '🎨',
        priority: 3,
        color: '#ff9ff3',
        terminals: ['SYSADMIN'],
        maxLogs: 8,
        autoExpand: true
    },
    NETWORK: {
        patterns: ['BG:', 'extraction', 'proxy', 'NETMON', 'framework'],
        icon: '🌐',
        priority: 2,
        color: '#ff6348',
        terminals: ['NETMON'],
        maxLogs: 10,
        autoExpand: false
    },
    SYSTEM: {
        patterns: ['LOG:', '✅', 'initialized', 'activated'],
        icon: '⚙️',
        priority: 4,
        color: '#2ed573',
        terminals: ['SYSADMIN', 'NETMON'],
        maxLogs: 10,
        autoExpand: false
    }
};
```

### Centralized Logging API

```javascript
class CentralizedLogger {
    constructor(messageBroker) {
        this.broker = messageBroker;
        this.logBuffer = [];
        this.maxBufferSize = 1000;
    }
    
    log(level, message, category, source, metadata = {}) {
        const entry = {
            timestamp: Date.now(),
            level: level.toUpperCase(),
            message: this.truncateMessage(message),
            category: this.categorizeMessage(category, message),
            source,
            metadata,
            id: this.generateLogId()
        };
        
        // Add to buffer
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
        
        // Emit to terminals
        this.broker.emit('terminal-log', entry);
        
        // Emit specific events for errors
        if (level === 'ERR' || level === 'ERROR') {
            this.broker.emit('error', { message, ...metadata });
        }
        
        return entry;
    }
    
    // Convenience methods
    info(message, category, metadata) {
        return this.log('INFO', message, category, 'internal', metadata);
    }
    
    warn(message, category, metadata) {
        return this.log('WARN', message, category, 'internal', metadata);
    }
    
    error(message, category, metadata) {
        return this.log('ERR', message, category, 'internal', metadata);
    }
    
    debug(message, category, metadata) {
        if (this.broker.proxy.settings?.debug) {
            return this.log('DEBUG', message, category, 'internal', metadata);
        }
    }
}
```

## Cross-Component Communication

### Message Routes

```javascript
// Background → Proxy Controller
browser.tabs.sendMessage(tabId, {
    action: 'displayContent',
    content: extractedContent,
    metadata: metadata
});

// Proxy Controller → Background
browser.runtime.sendMessage({
    action: 'getSettings'
}).then(settings => {
    // Handle settings
});

// Proxy Controller → Hidden Tab
this.messageBroker.send('hidden', 'extractContent', {
    config: { waitForFramework: true }
});

// Internal Event Broadcasting
this.messageBroker.emit('extraction-complete', {
    content: content,
    metadata: metadata
});
```

### Message Handler Registration

```javascript
// In proxy-controller.js
async handleMessage(request, sender) {
    const { action, ...data } = request;
    
    // Log incoming message
    this.messageBroker.emit('message-received', { action, sender });
    
    try {
        switch (action) {
            case 'displayContent':
                this.displayExtractedContent(data.content, data.metadata);
                return { success: true };
                
            case 'logFromBackground':
                this.centralizedLogger.log(
                    data.level,
                    data.message,
                    data.category,
                    'background',
                    data.metadata
                );
                return { success: true };
                
            // ... other cases
            
            default:
                console.warn('Unknown action:', action);
                return { success: false, error: 'Unknown action' };
        }
    } catch (error) {
        this.messageBroker.emit('message-handler-error', { action, error });
        return { success: false, error: error.message };
    }
}
```

## Usage Examples

### Basic Event Emission

```javascript
// Simple event
this.messageBroker.emit('extraction-start');

// Event with data
this.messageBroker.emit('extraction-progress', {
    status: 'parsing',
    progress: 45
});

// Error event
this.messageBroker.emit('error', {
    message: 'Failed to parse content',
    code: 'PARSE_ERROR',
    context: { url: window.location.href }
});
```

### Event Listener Registration

```javascript
// Basic listener
this.messageBroker.on('theme-change', (data) => {
    console.log(`Theme changed to ${data.theme}`);
});

// One-time listener
this.messageBroker.on('activation-complete', () => {
    console.log('Vibe Mode ready!');
}, { once: true });

// Priority listener (executes first)
this.messageBroker.on('error', (error) => {
    // Critical error handler
    this.emergencyCleanup(error);
}, { priority: 100 });
```

### Cross-Component Messaging

```javascript
// Send to background and wait for response
async function fetchSettings() {
    const response = await this.messageBroker.send('background', 'getSettings');
    if (response.success) {
        this.applySettings(response.settings);
    }
}

// Broadcast to all components
this.messageBroker.send('broadcast', 'settings-update', {
    theme: 'neon-surge',
    mediaMode: 'ascii'
});
```

### Terminal Logging

```javascript
// Direct terminal logging
this.centralizedLogger.info('Extraction started', 'SYSTEM');
this.centralizedLogger.error('CSS failed to load', 'CSS', {
    attempt: 3,
    file: 'generated.css'
});

// Via events
this.messageBroker.emit('terminal-log', {
    level: 'INFO',
    message: 'Custom log entry',
    category: 'CUSTOM',
    source: 'my-component'
});
```

## Performance Considerations

### Message Throttling

```javascript
class ThrottledEmitter {
    constructor(broker, delay = 100) {
        this.broker = broker;
        this.delay = delay;
        this.queue = new Map();
        this.timer = null;
    }
    
    emit(event, data) {
        this.queue.set(event, data);
        
        if (!this.timer) {
            this.timer = setTimeout(() => {
                this.flush();
                this.timer = null;
            }, this.delay);
        }
    }
    
    flush() {
        for (const [event, data] of this.queue) {
            this.broker.emit(event, data);
        }
        this.queue.clear();
    }
}
```

### Memory Management

```javascript
// Automatic log rotation
class LogRotation {
    static rotate(logs, maxSize = 100) {
        if (logs.length > maxSize) {
            // Keep most recent
            return logs.slice(-maxSize);
        }
        return logs;
    }
    
    static cleanup(broker) {
        broker.emit('cleanup-needed', {
            reason: 'scheduled',
            timestamp: Date.now()
        });
    }
}

// Schedule cleanup
setInterval(() => LogRotation.cleanup(this.messageBroker), 60000);
```

## Error Recovery

### Message Retry Logic

```javascript
async function sendWithRetry(broker, target, action, data, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await broker.send(target, action, data);
            if (response.success) return response;
            
            lastError = response.error;
        } catch (error) {
            lastError = error;
            broker.emit('message-retry', { 
                attempt, 
                maxRetries, 
                target, 
                action 
            });
        }
        
        // Exponential backoff
        await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
    }
    
    throw new Error(`Message failed after ${maxRetries} attempts: ${lastError}`);
}
```

## Testing & Debugging

### Message Inspector

```javascript
class MessageInspector {
    constructor(broker) {
        this.broker = broker;
        this.history = [];
        this.enabled = false;
    }
    
    start() {
        this.enabled = true;
        // Intercept all events
        const originalEmit = this.broker.emit.bind(this.broker);
        this.broker.emit = (event, data) => {
            if (this.enabled) {
                this.record('emit', event, data);
            }
            return originalEmit(event, data);
        };
    }
    
    record(type, event, data) {
        this.history.push({
            type,
            event,
            data: MessageSerializer.serialize(data),
            timestamp: Date.now(),
            stack: new Error().stack
        });
    }
    
    dump() {
        return this.history;
    }
    
    clear() {
        this.history = [];
    }
}

// Usage
const inspector = new MessageInspector(messageBroker);
inspector.start();
// ... perform actions ...
console.log('Message history:', inspector.dump());
```

### Debug Mode

```javascript
// Enable debug mode
this.settings.debug = true;

// Debug events are now emitted
this.messageBroker.on('debug-info', (data) => {
    console.log('[DEBUG]', data);
});

// All messages are logged
this.messageBroker.on('message-received', (data) => {
    console.log('[MSG IN]', data);
});

this.messageBroker.on('message-sent', (data) => {
    console.log('[MSG OUT]', data);
});
```

## Migration Guide

### From Direct Method Calls to Events

```javascript
// OLD: Direct method call
this.displayExtractedContent(content, metadata);

// NEW: Event emission
this.messageBroker.emit('extraction-complete', { content, metadata });

// OLD: Callback pattern
extractContent((error, content) => {
    if (error) handleError(error);
    else displayContent(content);
});

// NEW: Event pattern
this.messageBroker.on('extraction-complete', ({ content }) => {
    displayContent(content);
});
this.messageBroker.on('extraction-failed', ({ error }) => {
    handleError(error);
});
```

## Future Extensions

### Planned Enhancements
- **Message Persistence**: IndexedDB storage for message history
- **Message Encryption**: For sensitive data transmission
- **WebSocket Support**: Real-time external service integration
- **Message Batching**: Automatic batching for performance
- **Circuit Breaker**: Automatic failure detection and recovery
- **Event Sourcing**: Complete event replay capability
- **Distributed Tracing**: Cross-tab message correlation

### Extension Points
- Custom serializers for complex data types
- Plugin system for message interceptors
- Message routing rules engine
- Event priority queues
- Message transformation pipeline

---

## Implementation Checklist

- [x] MessageBroker core implementation
- [x] Event listener system
- [x] Message serialization
- [x] Terminal logging integration
- [x] Cross-component routing
- [x] Error handling & recovery
- [ ] Message persistence layer
- [ ] Advanced debugging tools
- [ ] Performance monitoring
- [ ] Comprehensive test suite

---