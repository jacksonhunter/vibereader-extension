// VibeReader v2.0 - Enhanced Utilities with Subscriber Architecture

// Prevent multiple injections with simple guard
if (window.__vibeReaderUtils) {
    console.log("VibeReaderUtils already exists, skipping");
    false;
} else {
    try {
        // VibeReader Message Debugging System
        function detectVibeContext() {
            if (typeof window === "undefined") return "background";
            if (window.__vibeReaderProxyController) return "proxy";
            if (window.__vibeReaderStealthExtractor) return "extractor";
            if (window.location?.href?.includes("popup.html")) return "popup";
            return "unknown";
        }

        const BYPASS_LOGGING = `__vibe_bypass_${Math.random().toString(36).slice(2, 11)}`;

        // === ENHANCED EVENT BUS WITH SUBSCRIBER ARCHITECTURE ===
        class EventBus extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Enhanced event routing with categorization
                this.eventCategories = new Map();
                this.setupEventCategories();

                console.log('Enhanced EventBus initialized');
            }

            setupEventCategories() {
                // Map event patterns to terminal categories
                this.eventCategories.set(/^(error|failed|exception)/i, 'ERRORS');
                this.eventCategories.set(/^(css|style|theme)/i, 'CSS');
                this.eventCategories.set(/^(media|image|video|ascii)/i, 'MEDIA');
                this.eventCategories.set(/^(network|proxy|extraction|framework)/i, 'NETWORK');
                this.eventCategories.set(/^(system|init|ready|complete)/i, 'SYSTEM');
            }

            categorizeEvent(eventType) {
                for (const [pattern, category] of this.eventCategories) {
                    if (pattern.test(eventType)) {
                        return category;
                    }
                }
                return 'SYSTEM';
            }

            // Enhanced subscription with automatic categorization
            subscribe(eventType, callback, options = {}) {
                const category = options.category || this.categorizeEvent(eventType);

                const enhancedOptions = {
                    id: options.id || `eventbus-${eventType}-${Date.now()}`,
                    category,
                    ...options,
                    transformations: [
                        // Auto-categorize transform
                        (data, context) => ({
                            data: {
                                ...data,
                                category,
                                eventType,
                                timestamp: Date.now()
                            },
                            context: { ...context, category, eventType }
                        }),
                        ...(options.transformations || [])
                    ]
                };

                return super.subscribe(eventType, callback, enhancedOptions);
            }

            // Wildcard subscription for debugging and logging
            subscribeToAll(callback, options = {}) {
                return this.subscribe('*', callback, {
                    id: options.id || `wildcard-${Date.now()}`,
                    priority: options.priority || -10, // Low priority for wildcards
                    eventTypes: ['*'],
                    ...options
                });
            }

            // Enhanced emit with automatic routing
            emit(eventType, data, context = {}) {
                const category = this.categorizeEvent(eventType);

                return super.emit(eventType, data, {
                    ...context,
                    category,
                    source: context.source || detectVibeContext(),
                    timestamp: Date.now()
                });
            }
        }

        // Simplified, tab-aware MessageBridge for content scripts
        class MessageBridge extends SubscriberEnabledComponent {
            constructor() {
                super();

                this.context = detectVibeContext();
                this.tabId = null; // Will be set by first message from background

                // Setup middleware pipeline
                this.setupMiddleware();

                // Single listener for messages FROM background
                this.setupBackgroundListener();

                console.log(`MessageBridge initialized in ${this.context} context`);
            }

            setupMiddleware() {
                // Only middleware that makes sense in content scripts
                this.subscriberManager.addGlobalMiddleware(
                    new MessageValidationMiddleware()
                );

                this.subscriberManager.addGlobalMiddleware(
                    new MessageSerializationMiddleware()
                );

                // Tab context middleware
                this.subscriberManager.addGlobalMiddleware(
                    new TabContextMiddleware(this)
                );
            }

            setupBackgroundListener() {
                // Only listen for messages FROM background/tabs
                browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    // Store our tab ID if we don't have it
                    if (sender.tab && !this.tabId) {
                        this.tabId = sender.tab.id;
                    }

                    this.handleFromBackground(request, sender)
                        .then(response => sendResponse(response))
                        .catch(error => sendResponse({ error: error.message }));

                    return true;
                });
            }

            async handleFromBackground(request, sender) {
                const { action, data } = request;

                // Emit to local subscribers
                const result = await this.emit(`message-${action}`, data || request, {
                    sender,
                    action,
                    source: 'background',
                    tabId: this.tabId
                });

                if (result && result.successCount > 0) {
                    return { success: true, handled: true };
                }

                return { success: false, error: 'No local handler' };
            }

            // Simplified registration - only for local handling
            register(action, handler, options = {}) {
                return this.subscribe(`message-${action}`, async (eventType, data, context) => {
                    return await handler(data, context.sender);
                }, {
                    id: options.id || `handler-${action}`,
                    ...options
                });
            }

            // Clear about what this does - sends TO background
            async sendToBackground(action, data, options = {}) {
                const message = {
                    action,
                    data,
                    from: this.context,
                    tabId: this.tabId, // Include our tab ID
                    timestamp: Date.now()
                };

                try {
                    return await browser.runtime.sendMessage(message);
                } catch (error) {
                    console.error(`Failed to send ${action} to background:`, error);
                    throw error;
                }
            }

            // Convenience method that makes intent clear
            async requestFromBackground(action, data, options = {}) {
                // For request-response patterns
                return this.sendToBackground(action, data, {
                    ...options,
                    expectResponse: true
                });
            }

            // Tab-aware event emission
            emitTabEvent(event, data) {
                return this.emit(event, data, {
                    tabId: this.tabId,
                    context: this.context,
                    source: 'tab-event'
                });
            }
        }

        // === ENHANCED THROTTLED EMITTER WITH SUBSCRIBER AWARENESS ===
        class ThrottledEmitter extends SubscriberEnabledComponent {
            constructor(target, delay = 100) {
                super();

                this.target = target;
                this.delay = delay;
                this.queues = new Map();
                this.timers = new Map();

                // Detect target capabilities
                this.hasEnhancedTarget = target instanceof SubscriberEnabledComponent;
                this.isEventBus = target instanceof EventBus;
                this.isBridge = target instanceof MessageBridge;

                // Setup target-specific middleware
                this.setupTargetMiddleware();

                console.log(`ThrottledEmitter initialized with ${this.getTargetType()} target`);
            }

            getTargetType() {
                if (this.isEventBus) return 'EventBus';
                if (this.isBridge) return 'MessageBridge';
                if (this.hasEnhancedTarget) return 'Enhanced';
                return 'Unknown';
            }

            setupTargetMiddleware() {
                if (this.hasEnhancedTarget) {
                    // Add throttling-specific middleware to target
                    this.target.subscriberManager.addGlobalMiddleware(
                        new ThrottlingAwareMiddleware(this)
                    );
                }
            }

            emit(event, data, options = {}) {
                const strategy = options.strategy || 'replace';
                const priority = options.priority || 0;
                const key = this.buildQueueKey(event, options);

                if (!this.queues.has(key)) {
                    this.queues.set(key, []);
                }

                const queue = this.queues.get(key);

                // Apply queueing strategy
                switch (strategy) {
                    case 'accumulate':
                        queue.push({ event, data, options, timestamp: Date.now() });
                        break;
                    case 'merge':
                        if (queue.length) {
                            const last = queue[queue.length - 1];
                            last.data = { ...last.data, ...data };
                            last.timestamp = Date.now();
                        } else {
                            queue.push({ event, data, options, timestamp: Date.now() });
                        }
                        break;
                    case 'replace':
                    default:
                        queue.length = 0;
                        queue.push({ event, data, options, timestamp: Date.now() });
                }

                this.scheduleFlush(key, priority);
            }

            buildQueueKey(event, options) {
                const target = options.target || 'runtime';
                const action = options.action || event;
                const priority = options.priority || 0;

                return `${event}:${target}:${action}:${priority}`;
            }

            scheduleFlush(key, priority = 0) {
                if (this.timers.has(key)) {
                    clearTimeout(this.timers.get(key));
                }

                // Priority-based delay adjustment
                const adjustedDelay = Math.max(10, this.delay - (priority * 10));

                this.timers.set(key, setTimeout(() => {
                    this.flush(key);
                    this.timers.delete(key);
                }, adjustedDelay));
            }

            flush(key) {
                const queue = this.queues.get(key);
                if (!queue || queue.length === 0) return;

                const items = [...queue];
                queue.length = 0;

                // Process items based on target type
                if (this.hasEnhancedTarget) {
                    this.flushToEnhancedTarget(items);
                } else {
                    console.warn('ThrottledEmitter: Target does not support enhanced features');
                }
            }

            async flushToEnhancedTarget(items) {
                for (const item of items) {
                    const { event, data, options } = item;

                    if (this.isEventBus) {
                        await this.target.emit(event, data, options);
                    } else if (this.isBridge) {
                        const target = options.target || null;
                        const action = options.action || event;
                        await this.target.send(target, action, data, options);
                    } else if (this.hasEnhancedTarget) {
                        await this.target.emit(event, data, options);
                }
            }
            }

            // Immediate emission (bypass throttling)
            emitNow(event, data, options = {}) {
                if (this.isEventBus) {
                    return this.target.emit(event, data, options);
                }
                if (this.isBridge) {
                    const target = options.target || null;
                    const action = options.action || event;
                    return this.target.send(target, action, data, options);
                }
                if (this.hasEnhancedTarget) {
                    return this.target.emit(event, data, options);
                }

                console.warn('ThrottledEmitter: Target does not support immediate emission');
                return null;
            }

            // Enhanced destroy with proper cleanup
            destroy() {
                this.timers.forEach(timer => clearTimeout(timer));
                this.timers.clear();
                this.queues.clear();

                super.destroy();
            }
        }

        // === ENHANCED VIBE LOGGER WITH SUBSCRIBER ARCHITECTURE ===
        class VibeLogger extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Core logging state
                this.messageLog = [];
                this.maxLogSize = 500;
                this.debugMode = false;
                this.wrapped = false;

                // Context and API wrapping
                this.context = detectVibeContext();
                this.nativeSendMessage = null;
                this.nativeTabsSendMessage = null;

                // Enhanced categorization
                this.setupCategorization();

                // Filtering and routing
                this.filters = {
                    actions: [],
                    exclude: ["ping"],
                    sources: [],
                };

                // Performance monitoring
                this.performanceThresholds = {
                    slow: 1000,      // ms
                    critical: 5000   // ms
                };

                this.init();
            }

            setupCategorization() {
                // Enhanced terminal categorization with patterns
                this.terminalCategories = {
                    ERRORS: {
                        patterns: [/error/i, /failed/i, /exception/i, /\berr\b/i],
                        priority: 10,
                        rateLimitMs: 50,
                        icon: '❌'
                    },
                    CSS: {
                        patterns: [/css/i, /style/i, /theme/i, /generated\.css/i],
                        priority: 5,
                        rateLimitMs: 200,
                        icon: '🎨'
                    },
                    MEDIA: {
                        patterns: [/media/i, /image/i, /video/i, /ascii/i, /found/i],
                        priority: 3,
                        rateLimitMs: 300,
                        icon: '🎬'
                    },
                    NETWORK: {
                        patterns: [/network/i, /proxy/i, /extraction/i, /framework/i],
                        priority: 4,
                        rateLimitMs: 100,
                        icon: '🌐'
                    },
                    SYSTEM: {
                        patterns: [/system/i, /init/i, /ready/i, /complete/i],
                        priority: 2,
                        rateLimitMs: 500,
                        icon: '⚙️'
                    }
                };
            }

            async init() {
                // Store native functions globally to prevent re-wrapping
                if (typeof browser !== "undefined" && browser.runtime) {
                    if (!browser.runtime.__vibeNatives) {
                        browser.runtime.__vibeNatives = {
                            sendMessage: browser.runtime.sendMessage.bind(browser.runtime),
                            tabsSendMessage: browser.tabs?.sendMessage?.bind(browser.tabs),
                        };
                    }

                    this.nativeSendMessage = browser.runtime.__vibeNatives.sendMessage;
                    this.nativeTabsSendMessage = browser.runtime.__vibeNatives.tabsSendMessage;
                }

                // Listen for debug toggle
                if (typeof browser !== "undefined") {
                    browser.runtime.onMessage.addListener((message) => {
                        if (message.action === "toggleVibeDebug") {
                            this.debugMode = message.enabled;
                            console.log(`VibeLogger debug mode: ${this.debugMode ? "ON" : "OFF"}`);
                            return Promise.resolve({ success: true });
                        }
                        return undefined;
                    });
                }

                await this.loadDebugState();

                // Setup enhanced terminal subscription management
                this.setupEnhancedTerminalSubscriptions();

                if (typeof window !== "undefined") {
                    window.vibeDebug = this;
                }
            }

            setupEnhancedTerminalSubscriptions() {
                // Create category-specific subscription endpoints
                Object.entries(this.terminalCategories).forEach(([category, config]) => {
                    // Subscribe to category-specific events
                    this.subscribe(`terminal-${category}`, (eventType, data) => {
                        this.handleCategorizedLog(category, data);
                    }, {
                        id: `terminal-${category.toLowerCase()}`,
                        priority: config.priority,
                        rateLimitMs: config.rateLimitMs,
                        transformations: [
                            // Add category metadata
                            (data) => ({
                                data: {
                                    ...data,
                                    category,
                                    icon: config.icon,
                                    timestamp: Date.now()
                                }
                            })
                        ]
                    });
                });

                // Global terminal subscription with smart categorization
                this.subscribe('terminal-log', (eventType, data) => {
                    const category = this.categorizeMessage(data.message || data.action || 'unknown');
                    this.emit(`terminal-${category}`, data);
                }, {
                    id: 'terminal-router',
                    priority: 1,
                    rateLimitMs: 10 // Very fast routing
                });
            }

            // Enhanced terminal subscription with middleware
            subscribeToTerminal(callback, options = {}) {
                const categories = options.categories || Object.keys(this.terminalCategories);
                const subscriptions = [];

                categories.forEach(category => {
                    const categoryConfig = this.terminalCategories[category] || {
                        rateLimitMs: 100,
                        priority: 5
                    };

                    const subscription = this.subscribe(`terminal-${category}`, callback, {
                        id: options.id ? `${options.id}-${category}` : undefined,
                        priority: options.priority || categoryConfig.priority,
                        rateLimitMs: options.rateLimitMs || categoryConfig.rateLimitMs,
                        debounceMs: options.debounceMs,
                        maxRetries: options.maxRetries || 2,
                        fallbackBehavior: options.fallbackBehavior || 'log',
                        transformations: [
                            // Filter by category if specified
                            (data) => {
                                if (options.categories && !options.categories.includes(data.category)) {
                                    return null;
                                }
                                return { data };
                            },
                            ...(options.transformations || [])
                        ],
                        ...options
                    });

                    subscriptions.push(subscription);
                });

                // Return combined unsubscribe function
                return () => {
                    subscriptions.forEach(unsubscribe => unsubscribe());
                };
            }

            // Category-specific subscriptions
            subscribeToErrors(callback, options = {}) {
                return this.subscribeToTerminal(callback, {
                    ...options,
                    categories: ['ERRORS'],
                    priority: 10
                });
            }

            subscribeToMedia(callback, options = {}) {
                return this.subscribeToTerminal(callback, {
                    ...options,
                    categories: ['MEDIA'],
                    debounceMs: 200
                });
            }

            subscribeToNetwork(callback, options = {}) {
                return this.subscribeToTerminal(callback, {
                    ...options,
                    categories: ['NETWORK'],
                    rateLimitMs: 100
                });
            }

            handleCategorizedLog(category, data) {
                // Process categorized log data
                const logEntry = {
                    category,
                    level: data.level || 'INFO',
                    message: data.message || '',
                    timestamp: Date.now(),
                    context: data.context || {},
                    metadata: data.metadata || {}
                };

                // Add to message log
                this.addToMessageLog(logEntry);

                // Output based on debug mode
                if (this.debugMode) {
                    this.debugOutput(logEntry);
                }
            }

            // Enhanced message wrapping with subscriber awareness
            activate() {
                if (!this.wrapped && this.nativeSendMessage) {
                    this.wrapMessagingAPIs();
                    this.wrapped = true;
                    console.log('VibeLogger message wrapping activated');
                }
            }

            deactivate() {
                if (this.wrapped) {
                    this.unwrapMessagingAPIs();
                    this.wrapped = false;
                }

                // Clear message log and reset state
                this.messageLog = [];
                console.log('VibeLogger deactivated');
            }

            wrapMessagingAPIs() {
                const self = this;

                // Enhanced runtime message wrapper
                browser.runtime.sendMessage = function (message) {
                    // Check for bypass before processing
                    if (message?.action === "terminalLog" || message?.[BYPASS_LOGGING]) {
                        delete message[BYPASS_LOGGING];
                        return self.nativeSendMessage(message);
                    }

                    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    const startTime = performance.now();

                    // Enhanced logging with subscriber emission
                    self.emit('terminal-log', {
                        action: message?.action || 'unknown',
                        message: `Sending: ${message?.action || 'unknown'}`,
                        level: 'INFO',
                        metadata: {
                            messageId,
                            direction: 'send',
                            target: 'background',
                            size: JSON.stringify(message).length
                        }
                    });

                    return self.nativeSendMessage(message)
                        .then((response) => {
                            const duration = performance.now() - startTime;

                            self.emit('terminal-log', {
                                action: message?.action || 'unknown',
                                message: `Response: ${message?.action || 'unknown'} (${duration.toFixed(1)}ms)`,
                                level: duration > self.performanceThresholds.slow ? 'WARN' : 'INFO',
                                metadata: {
                                    messageId,
                                    direction: 'response',
                                    duration,
                                    success: true
                                }
                            });

                            return response;
                        })
                        .catch((error) => {
                            const duration = performance.now() - startTime;

                            self.emit('terminal-log', {
                                action: message?.action || 'unknown',
                                message: `Error: ${error.message}`,
                                level: 'ERR',
                                metadata: {
                                    messageId,
                                    direction: 'error',
                                    duration,
                                    error: error.message
                                }
                            });

                            throw error;
                        });
                };

                // Enhanced tabs message wrapper
                if (browser.tabs?.sendMessage && this.nativeTabsSendMessage) {
                    browser.tabs.sendMessage = function (tabId, message) {
                        if (message?.action === "terminalLog" || message?.[BYPASS_LOGGING]) {
                            delete message[BYPASS_LOGGING];
                            return self.nativeTabsSendMessage(tabId, message);
                        }

                        const messageId = `tab-${tabId}-${Date.now()}`;
                        const startTime = performance.now();

                        self.emit('terminal-log', {
                            action: message?.action || 'unknown',
                            message: `Tab ${tabId}: ${message?.action || 'unknown'}`,
                            level: 'INFO',
                            metadata: {
                                messageId,
                                direction: 'send',
                                target: `tab-${tabId}`,
                                tabId
                            }
                        });

                        return self.nativeTabsSendMessage(tabId, message)
                            .then((response) => {
                                const duration = performance.now() - startTime;

                                self.emit('terminal-log', {
                                    action: message?.action || 'unknown',
                                    message: `Tab ${tabId} response (${duration.toFixed(1)}ms)`,
                                    level: 'INFO',
                                    metadata: {
                                        messageId,
                                        direction: 'response',
                                        tabId,
                                        duration
                                    }
                                });

                                return response;
                            })
                            .catch((error) => {
                                self.emit('terminal-log', {
                                    action: message?.action || 'unknown',
                                    message: `Tab ${tabId} error: ${error.message}`,
                                    level: 'ERR',
                                    metadata: {
                                        messageId,
                                        direction: 'error',
                                        tabId,
                                        error: error.message
                                    }
                                });

                                throw error;
                            });
                    };
                }
            }

            unwrapMessagingAPIs() {
                if (browser.runtime.__vibeNatives) {
                    browser.runtime.sendMessage = browser.runtime.__vibeNatives.sendMessage;
                    if (browser.tabs?.sendMessage) {
                        browser.tabs.sendMessage = browser.runtime.__vibeNatives.tabsSendMessage;
                    }
                }
            }

            // Enhanced message categorization
            categorizeMessage(message) {
                const lowerMsg = message.toLowerCase();

                for (const [category, config] of Object.entries(this.terminalCategories)) {
                    if (config.patterns.some(pattern => pattern.test(lowerMsg))) {
                        return category;
                    }
                }

                return 'SYSTEM';
            }

            // Enhanced logging utilities
            addToMessageLog(entry) {
                this.messageLog.push(entry);
                if (this.messageLog.length > this.maxLogSize) {
                    this.messageLog.shift();
                }

                // Store in browser storage if available
                this.storeLogEntry(entry);
            }

            async storeLogEntry(entry) {
                try {
                    const stored = await browser.storage.local.get("vibeMessageLog");
                    const log = stored.vibeMessageLog || [];

                    log.push(entry);
                    if (log.length > this.maxLogSize) {
                        log.shift();
                    }

                    await browser.storage.local.set({ vibeMessageLog: log });
                } catch (e) {
                    // Storage might not be available
                }
            }

            async loadDebugState() {
                try {
                    const state = await browser.storage.local.get("vibeDebugEnabled");
                    this.debugMode = state.vibeDebugEnabled || false;
                } catch (e) {
                    // Storage might not be available
                }
            }

            debugOutput(entry) {
                const { category, level, message, timestamp } = entry;
                const time = new Date(timestamp).toLocaleTimeString();
                const icon = this.terminalCategories[category]?.icon || '📝';

                if (typeof dump !== "undefined") {
                    dump(`${time} ${icon} [${category}] ${level}: ${message}\n`);
                } else {
                    console.log(`${time} ${icon} [${category}] ${level}: ${message}`);
                }
            }

            // Enhanced analysis and debugging methods
            dumpLog() {
                if (!this.debugMode) {
                    console.log("Enable debug mode first");
                    return;
                }

                console.log("VibeLogger Enhanced Log Dump");
                console.table(this.messageLog.slice(-50)); // Last 50 entries

                this.analyzeFlow();
                this.analyzePerformance();
            }

            analyzeFlow() {
                const categoryCounts = {};
                const actionCounts = {};

                this.messageLog.forEach(entry => {
                    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
                    actionCounts[entry.metadata?.action || 'unknown'] = (actionCounts[entry.metadata?.action || 'unknown'] || 0) + 1;
                });

                console.log("Log Distribution by Category:", categoryCounts);
                console.log("Most Frequent Actions:", actionCounts);
            }

            analyzePerformance() {
                const performanceEntries = this.messageLog.filter(entry =>
                    entry.metadata?.duration !== undefined
                );

                if (performanceEntries.length === 0) {
                    console.log("No performance data available");
                    return;
                }

                const durations = performanceEntries.map(entry => entry.metadata.duration);
                const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
                const maxDuration = Math.max(...durations);
                const slowMessages = performanceEntries.filter(entry =>
                    entry.metadata.duration > this.performanceThresholds.slow
                );

                console.log("Performance Analysis:");
                console.log(`Average message duration: ${avgDuration.toFixed(2)}ms`);
                console.log(`Maximum duration: ${maxDuration.toFixed(2)}ms`);
                console.log(`Slow messages (>${this.performanceThresholds.slow}ms):`, slowMessages.length);

                if (slowMessages.length) {
                    console.table(slowMessages.map(entry => ({
                        Action: entry.metadata.action,
                        Duration: `${entry.metadata.duration.toFixed(2)}ms`,
                        Message: entry.message.substring(0, 50)
                    })));
                }
            }

            // Enhanced export functionality
            exportLog() {
                const exportData = {
                    version: "2.0.0",
                    context: this.context,
                    timestamp: Date.now(),
                    debugMode: this.debugMode,
                    messages: this.messageLog,
                    stats: {
                        total: this.messageLog.length,
                        byCategory: this.getCategoryCounts(),
                        performance: this.getPerformanceStats()
                    },
                    subscriberStats: this.getSubscriberStats(),
                    eventStats: this.getEventStats()
                };

                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `vibe-messages-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);

                console.log("Enhanced message log exported");
            }

            getCategoryCounts() {
                return this.messageLog.reduce((counts, entry) => {
                    counts[entry.category] = (counts[entry.category] || 0) + 1;
                    return counts;
                }, {});
            }

            getPerformanceStats() {
                const performanceEntries = this.messageLog.filter(entry =>
                    entry.metadata?.duration !== undefined
                );

                if (performanceEntries.length === 0) return null;

                const durations = performanceEntries.map(entry => entry.metadata.duration);
                return {
                    count: performanceEntries.length,
                    average: durations.reduce((a, b) => a + b, 0) / durations.length,
                    max: Math.max(...durations),
                    min: Math.min(...durations),
                    slow: performanceEntries.filter(e => e.metadata.duration > this.performanceThresholds.slow).length
                };
            }
        }

        // === MIDDLEWARE CLASSES FOR MESSAGE AND EVENT PROCESSING ===

        class MessageValidationMiddleware extends SubscriberMiddleware {
            constructor() {
                super('MessageValidation');
            }

            async process(eventContext) {
                const { data } = eventContext;

                // Basic message validation
                if (!data || typeof data !== 'object') {
                    console.warn('Invalid message data:', data);
                    return false;
                }

                // Check for required fields based on message type
                if (eventContext.context?.action) {
                    const action = eventContext.context.action;

                    // Add action-specific validation
                    switch (action) {
                        case 'contentExtracted':
                            if (!data.content && !data.metadata) {
                                console.warn('contentExtracted message missing required fields');
                                return false;
                            }
                            break;
                        case 'extractionProgress':
                            if (typeof data.progress !== 'number' || !data.status) {
                                console.warn('extractionProgress message invalid format');
                                return false;
                            }
                            break;
                    }
                }

                return true;
            }
        }

        class MessageSerializationMiddleware extends SubscriberMiddleware {
            constructor() {
                super('MessageSerialization');
            }

            async process(eventContext) {
                try {
                    // Serialize complex data structures
                    const serialized = MessageSerializer.serialize(eventContext.data);

                    return {
                        modified: true,
                        data: serialized,
                        context: {
                            ...eventContext.context,
                            serialized: true
                        }
                    };
                } catch (error) {
                    console.error('Message serialization failed:', error);
                    return false;
                }
            }
        }

        class TabContextMiddleware extends SubscriberMiddleware {
            constructor(bridge) {
                super('TabContext');
                this.bridge = bridge;
            }

            async process(eventContext) {
                // Enrich all events with tab context
                eventContext.context.tabId = this.bridge.tabId;
                eventContext.context.tabContext = this.bridge.context;

                // Add tab relationship info if available
                if (this.bridge.tabId && eventContext.data) {
                    eventContext.data._tabId = this.bridge.tabId;
                }

                return true;
            }
        }

        // === MESSAGE SERIALIZER (ENHANCED) ===
        class MessageSerializer {
            static serialize(obj, seen = new WeakSet(), depth = 0) {
                // Prevent infinite recursion
                if (depth > 10) return { __depth_exceeded: true };

                if (obj === undefined) return { __undefined: true };
                if (obj === null) return null;
                if (typeof obj !== "object") return obj;

                if (seen.has(obj)) return { __circular: true };
                seen.add(obj);

                // Enhanced type handling
                if (obj instanceof Error) {
                    return {
                        __type: "Error",
                        name: obj.name,
                        message: obj.message,
                        stack: obj.stack,
                        cause: obj.cause
                    };
                }

                if (obj instanceof Element) {
                    return {
                        __type: "Element",
                        tagName: obj.tagName,
                        id: obj.id,
                        className: obj.className,
                        textContent: obj.textContent?.substring(0, 100),
                        attributes: this.serializeAttributes(obj)
                    };
                }

                if (obj instanceof Date) {
                    return { __type: "Date", value: obj.toISOString() };
                }

                if (obj instanceof RegExp) {
                    return { __type: "RegExp", source: obj.source, flags: obj.flags };
                }

                if (obj instanceof Map) {
                    return {
                        __type: "Map",
                        entries: Array.from(obj.entries()).map(([k, v]) => [
                            this.serialize(k, seen, depth + 1),
                            this.serialize(v, seen, depth + 1)
                        ])
                    };
                }

                if (obj instanceof Set) {
                    return {
                        __type: "Set",
                        values: Array.from(obj.values()).map(v => this.serialize(v, seen, depth + 1))
                    };
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => this.serialize(item, seen, depth + 1));
                }

                // Handle functions by converting to string representation
                if (typeof obj === 'function') {
                    return {
                        __type: "Function",
                        name: obj.name,
                        length: obj.length,
                        string: obj.toString().substring(0, 200)
                    };
                }

                const serialized = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value !== "function" || key === 'constructor') {
                        serialized[key] = this.serialize(value, seen, depth + 1);
                    }
                }
                return serialized;
            }

            static serializeAttributes(element) {
                const attrs = {};
                for (const attr of element.attributes) {
                    attrs[attr.name] = attr.value;
                }
                return attrs;
            }

            static deserialize(obj, depth = 0) {
                // Prevent infinite recursion
                if (depth > 10) return '[Max Depth Exceeded]';

                if (!obj || typeof obj !== "object") return obj;

                if (obj.__undefined) return undefined;
                if (obj.__circular) return "[Circular Reference]";
                if (obj.__depth_exceeded) return "[Max Depth Exceeded]";

                if (obj.__type) {
                    switch (obj.__type) {
                        case "Error": {
                            const error = new Error(obj.message);
                            error.name = obj.name;
                            error.stack = obj.stack;
                            if (obj.cause) error.cause = obj.cause;
                            return error;
                        }
                        case "Date":
                            return new Date(obj.value);
                        case "RegExp":
                            return new RegExp(obj.source, obj.flags);
                        case "Map":
                            return new Map(obj.entries.map(([k, v]) => [
                                this.deserialize(k, depth + 1),
                                this.deserialize(v, depth + 1)
                            ]));
                        case "Set":
                            return new Set(obj.values.map(v => this.deserialize(v, depth + 1)));
                        case "Function":
                            return obj; // Return serialized representation
                        case "Element":
                            return obj; // Return serialized representation
                    }
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => this.deserialize(item, depth + 1));
                }

                const deserialized = {};
                for (const [key, value] of Object.entries(obj)) {
                    deserialized[key] = this.deserialize(value, depth + 1);
                }
                return deserialized;
            }
        }

        // === EXPORTS AND INITIALIZATION ===

        // Create singleton instances
        const vibeLogger = new VibeLogger();
        const eventBus = new EventBus();

        // Global exports
        window.__vibeReaderUtils = {
            VibeLogger: vibeLogger,
            EventBus: eventBus,
            MessageBridge: MessageBridge,
            MessageSerializer,
            ThrottledEmitter,
            detectVibeContext,
            BYPASS_LOGGING,

            // Enhanced subscriber components
            SubscriberEnabledComponent,
            SubscriberManager,
            VibeSubscriber,
            SubscriberMiddleware,

            // Middleware classes
            MessageValidationMiddleware,
            MessageSerializationMiddleware,
            MessageTimingMiddleware,
            BypassLoggingMiddleware,
            ThrottlingAwareMiddleware
        };

        // Global convenience exports
        window.VibeLogger = vibeLogger;
        window.EventBus = eventBus;
        window.MessageBridge = MessageBridge;
        window.MessageSerializer = MessageSerializer;
        window.ThrottledEmitter = ThrottledEmitter;
        window.detectVibeContext = detectVibeContext;

        // Enhanced subscriber architecture exports
        window.SubscriberEnabledComponent = SubscriberEnabledComponent;
        window.SubscriberManager = SubscriberManager;
        window.VibeSubscriber = VibeSubscriber;
        window.SubscriberMiddleware = SubscriberMiddleware;

        console.log("VibeReader Enhanced Utilities v2.0 loaded with subscriber architecture");

        // Debug banner when loaded (only in debug mode)
        if (vibeLogger.debugMode) {
            console.log(
                "🛠️ VibeReader Enhanced Debug Tools\n" +
                "Enhanced subscriber architecture with middleware\n" +
                "Use window.vibeDebug for analysis"
            );
        }

        true;
    } catch (error) {
        delete window.__vibeReaderUtils;
        throw error;
    }
}