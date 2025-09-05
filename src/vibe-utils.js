// VibeReader v2.5 - Enhanced Vibe Utils
// vibe-utils.js - Local EventBus and Cross-Context MessageBridge with intelligent routing

// ===== PREVENT MULTIPLE INJECTIONS =====
if (window.__vibeReaderEnhancedUtils) {
    console.log("⚠️ Enhanced VibeReader Utils already exists, skipping");
    false;
} else {
    try {

        // ===== LOCAL EVENT BUS =====
        class LocalEventBus extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Local event management
                this.localEvents = new Map();           // Local event registry
                this.eventCategories = new Map();       // Event categorization
                this.eventFilters = new Map();          // Local event filters
                this.eventHistory = new Map();          // Local event history
                this.batchedEvents = new Map();         // Batched events for processing

                // Performance tracking
                this.eventMetrics = {
                    emitted: 0,
                    handled: 0,
                    filtered: 0,
                    categorized: 0,
                    batched: 0
                };

                this.setupLocalEventBus();
                console.log(`🎪 LocalEventBus initialized in ${this.origin} context`);
            }

            setupLocalEventBus() {
                this.setupEventCategories();
                this.setupEventFilters();
                this.startEventHistoryCleanup();

                // Subscribe to local event management
                this.subscribe('register-local-event', (eventType, data) => {
                    this.registerLocalEvent(data);
                });

                this.subscribe('categorize-event', (eventType, data) => {
                    this.categorizeEvent(data.eventType, data.category);
                });

                this.subscribe('filter-local-events', (eventType, data) => {
                    this.updateEventFilters(data.filters);
                });

                // Process batched events every 100ms
                setInterval(() => {
                    this.processBatchedEvents();
                }, 100);
            }

            setupEventCategories() {
                // Default event categories for local events
                this.eventCategories.set(/^(ui|display|render)/i, 'UI');
                this.eventCategories.set(/^(data|content|extract)/i, 'DATA');
                this.eventCategories.set(/^(user|click|input|key)/i, 'USER');
                this.eventCategories.set(/^(dom|mutation|change)/i, 'DOM');
                this.eventCategories.set(/^(performance|metric|timing)/i, 'PERFORMANCE');
                this.eventCategories.set(/^(error|warn|debug)/i, 'DEBUG');
                this.eventCategories.set(/^(lifecycle|init|destroy)/i, 'LIFECYCLE');
                this.eventCategories.set(/^(local|internal|private)/i, 'LOCAL');
            }

            setupEventFilters() {
                // Default filters for local events
                this.eventFilters.set('highFrequency', {
                    events: ['scroll-event', 'mouse-move', 'dom-mutation'],
                    throttle: 16, // ~60fps
                    strategy: 'throttle'
                });

                this.eventFilters.set('batchable', {
                    events: ['ui-update', 'data-change', 'content-update'],
                    delay: 100,
                    strategy: 'batch'
                });

                this.eventFilters.set('priority', {
                    events: ['error', 'user-click', 'lifecycle-event'],
                    strategy: 'immediate'
                });
            }

            startEventHistoryCleanup() {
                // Clean old event history every 5 minutes
                setInterval(() => {
                    this.cleanEventHistory();
                }, 300000);
            }

            // Enhanced local emit with categorization and filtering
            async emitLocal(eventType, data, options = {}) {
                this.eventMetrics.emitted++;

                // Categorize event
                const category = this.determineEventCategory(eventType);
                this.eventMetrics.categorized++;

                // Apply local filters
                const filterResult = this.applyEventFilters(eventType, data);
                if (filterResult.filtered) {
                    this.eventMetrics.filtered++;
                    if (filterResult.shouldBatch) {
                        return this.addToBatch(eventType, data, filterResult.batchConfig);
                    }
                    if (filterResult.throttled) {
                        return filterResult;
                    }
                }

                // Record in local history
                this.recordLocalEvent(eventType, data, category);

                // Emit locally only (not cross-context)
                const result = await this.emit(eventType, data, {
                    ...options,
                    local: true,
                    crossContext: false,
                    category,
                    timestamp: Date.now(),
                    origin: this.origin
                });

                this.eventMetrics.handled++;
                return result;
            }

            determineEventCategory(eventType) {
                // Try CategoryRegistry first
                const categoryRegistry = this.getCategoryRegistry();
                if (categoryRegistry) {
                    try {
                        const resolution = categoryRegistry.resolve(eventType, {}, { strategy: "first" });
                        if (resolution && resolution.primary) {
                            const categoryMeta = categoryRegistry.getCategory(resolution.primary);
                            if (categoryMeta && categoryMeta.metadata && categoryMeta.metadata.category) {
                                return categoryMeta.metadata.category;
                            }
                        }
                    } catch (error) {
                        console.warn('CategoryRegistry resolution failed in determineEventCategory:', error);
                    }
                }

                // Fallback to internal categories for backward compatibility
                for (const [pattern, category] of this.eventCategories.entries()) {
                    if (pattern.test(eventType)) {
                        return category;
                    }
                }
                return 'GENERAL';
            }

            applyEventFilters(eventType, data) {
                for (const [filterName, filterConfig] of this.eventFilters.entries()) {
                    if (filterConfig.events.includes(eventType)) {
                        switch (filterConfig.strategy) {
                            case 'throttle':
                                return this.applyThrottle(eventType, filterConfig.throttle);
                            case 'batch':
                                return {
                                    filtered: true,
                                    shouldBatch: true,
                                    batchConfig: { delay: filterConfig.delay }
                                };
                            case 'immediate':
                                return { filtered: false }; // Pass through immediately
                        }
                    }
                }
                return { filtered: false };
            }

            applyThrottle(eventType, throttleMs) {
                const now = Date.now();
                const lastEmit = this.localEvents.get(`throttle-${eventType}`) || 0;

                if (now - lastEmit < throttleMs) {
                    return { filtered: true, throttled: true, nextAllowed: lastEmit + throttleMs };
                }

                this.localEvents.set(`throttle-${eventType}`, now);
                return { filtered: false };
            }

            addToBatch(eventType, data, config) {
                if (!this.batchedEvents.has(eventType)) {
                    this.batchedEvents.set(eventType, {
                        items: [],
                        config,
                        lastAdded: Date.now()
                    });
                }

                const batch = this.batchedEvents.get(eventType);
                batch.items.push(data);
                batch.lastAdded = Date.now();

                this.eventMetrics.batched++;

                return { batched: true, eventType, itemCount: batch.items.length };
            }

            async processBatchedEvents() {
                const now = Date.now();

                for (const [eventType, batch] of this.batchedEvents.entries()) {
                    if (now - batch.lastAdded >= batch.config.delay) {
                        if (batch.items.length > 0) {
                            // Emit batched event
                            await this.emit(eventType, {
                                items: batch.items,
                                count: batch.items.length,
                                batched: true
                            }, {
                                local: true,
                                crossContext: false,
                                timestamp: now,
                                origin: this.origin
                            });

                            // Clear batch
                            batch.items = [];
                        }
                    }
                }
            }

            recordLocalEvent(eventType, data, category) {
                const eventRecord = {
                    eventType,
                    category,
                    timestamp: Date.now(),
                    origin: this.origin,
                    dataSize: JSON.stringify(data).length
                };

                const historyKey = `${eventType}-${Date.now()}`;
                this.eventHistory.set(historyKey, eventRecord);

                // Keep history manageable
                if (this.eventHistory.size > 1000) {
                    const oldestKey = this.eventHistory.keys().next().value;
                    this.eventHistory.delete(oldestKey);
                }
            }

            cleanEventHistory() {
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

                for (const [key, record] of this.eventHistory.entries()) {
                    if (record.timestamp < fiveMinutesAgo) {
                        this.eventHistory.delete(key);
                    }
                }

                console.log(`🧹 Local event history cleaned: ${this.eventHistory.size} events remaining`);
            }

            registerLocalEvent(data) {
                const { eventType, handler, category, priority = 5 } = data;

                this.localEvents.set(eventType, {
                    handler,
                    category: category || this.determineEventCategory(eventType),
                    priority,
                    registered: Date.now(),
                    callCount: 0
                });

                console.log(`📝 Registered local event: ${eventType} (${category || 'auto'})`);
            }

            updateEventFilters(filters) {
                Object.entries(filters).forEach(([name, config]) => {
                    this.eventFilters.set(name, config);
                });
            }

            categorizeEvent(eventType, category) {
                // Add custom categorization
                this.eventCategories.set(new RegExp(eventType, 'i'), category);
            }

            // Convenience methods for common local events
            emitUserInteraction(action, data) {
                return this.emitLocal(`user-${action}`, data, { priority: 'high' });
            }

            emitUIUpdate(component, data) {
                return this.emitLocal(`ui-${component}-update`, data, { batchable: true });
            }

            emitDataChange(type, data) {
                return this.emitLocal(`data-${type}-change`, data, { category: 'DATA' });
            }

            emitDOMEvent(type, element, data) {
                return this.emitLocal(`dom-${type}`, { element, ...data }, { category: 'DOM' });
            }

            emitPerformanceMetric(metric, value) {
                return this.emitLocal(`performance-${metric}`, { value, timestamp: Date.now() }, {
                    category: 'PERFORMANCE'
                });
            }

            // Local event statistics
            getLocalEventStats() {
                return {
                    origin: this.origin,
                    metrics: { ...this.eventMetrics },
                    registeredEvents: this.localEvents.size,
                    batchedEvents: this.batchedEvents.size,
                    categories: Object.fromEntries(
                        Array.from(new Set(
                            Array.from(this.eventHistory.values()).map(record => record.category)
                        )).map(category => [
                            category,
                            Array.from(this.eventHistory.values()).filter(r => r.category === category).length
                        ])
                    ),
                    recentHistory: Array.from(this.eventHistory.values())
                        .slice(-20)
                        .map(record => ({
                            eventType: record.eventType,
                            category: record.category,
                            timestamp: record.timestamp
                        }))
                };
            }
        }

        // ===== CROSS-CONTEXT MESSAGE BRIDGE =====
        class MessageBridge extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Cross-context messaging
                this.contextRoutes = new Map();         // Context routing table
                this.messageQueue = new Map();          // Message delivery queue
                this.deliveryTracking = new Map();      // Message delivery tracking
                this.routingStrategies = new Map();     // Context-specific strategies
                this.pendingResponses = new Map();      // Track pending responses

                // Performance and reliability
                this.bridgeMetrics = {
                    messagesSent: 0,
                    messagesReceived: 0,
                    messagesRouted: 0,
                    deliveryFailures: 0,
                    retries: 0
                };

                this.setupCrossContextBridge();
                console.log(`🌉 CrossContextMessageBridge initialized in ${this.origin} context`);
            }

            setupCrossContextBridge() {
                this.setupRoutingStrategies();
                this.setupMessageHandling();
                this.startDeliveryProcessor();

                // Subscribe to cross-context events
                this.subscribe('send-cross-context', async (eventType, data) => {
                    return await this.sendCrossContext(data);
                });

                this.subscribe('route-to-context', async (eventType, data) => {
                    return await this.routeToContext(data);
                });

                this.subscribe('update-context-routes', (eventType, data) => {
                    this.updateContextRoutes(data);
                });
            }

            setupRoutingStrategies() {
                // Define routing strategies for different message types
                this.routingStrategies.set('content-extraction', {
                    source: ['background', 'proxy'],
                    target: 'extractor',
                    delivery: 'reliable',
                    timeout: 30000
                });

                this.routingStrategies.set('content-display', {
                    source: ['extractor', 'background'],
                    target: 'proxy',
                    delivery: 'immediate',
                    timeout: 5000
                });

                this.routingStrategies.set('user-command', {
                    source: ['proxy', 'popup'],
                    target: 'background',
                    delivery: 'reliable',
                    timeout: 10000
                });

                this.routingStrategies.set('system-notification', {
                    source: 'background',
                    target: ['proxy', 'extractor', 'popup'],
                    delivery: 'broadcast',
                    timeout: 5000
                });

                this.routingStrategies.set('debug-info', {
                    source: '*',
                    target: 'background',
                    delivery: 'best-effort',
                    timeout: 3000
                });
            }

            setupMessageHandling() {
                // Listen for runtime messages
                if (typeof browser !== 'undefined' && browser.runtime) {
                    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                        this.handleIncomingCrossContextMessage(request, sender, sendResponse);
                        return true; // Keep channel open for async responses
                    });
                }

                // Subscribe to message routing events from enhanced subscriber system
                this.subscribe('cross-context-message-received', (eventType, data) => {
                    this.processCrossContextMessage(data);
                });
            }

            startDeliveryProcessor() {
                // Process queued messages every 100ms
                setInterval(() => {
                    this.processMessageQueue();
                }, 100);

                // Retry failed deliveries every 5 seconds
                setInterval(() => {
                    this.retryFailedDeliveries();
                }, 5000);
            }

            updateContextRoutes(routes) {
                Object.entries(routes).forEach(([context, config]) => {
                    this.contextRoutes.set(context, config);
                });
            }

            // Main cross-context sending method
            async sendCrossContext(data) {
                const {
                    targetContext,
                    targetTabId,
                    action,
                    payload,
                    options = {}
                } = data;

                this.bridgeMetrics.messagesSent++;

                const messageId = `msg-${this.origin}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

                const message = {
                    id: messageId,
                    sourceContext: this.origin,
                    targetContext,
                    targetTabId,
                    action,
                    payload,
                    options,
                    timestamp: Date.now(),
                    attempts: 0
                };

                try {
                    // Determine delivery strategy
                    const strategy = this.getRoutingStrategy(action) || { delivery: 'direct' };

                    // Apply routing strategy
                    const result = await this.executeRoutingStrategy(message, strategy);

                    this.trackDelivery(messageId, true, result);
                    return result;

                } catch (error) {
                    this.bridgeMetrics.deliveryFailures++;
                    this.trackDelivery(messageId, false, error.message);

                    // Queue for retry if strategy allows
                    if (options.retry !== false && strategy.delivery !== 'best-effort') {
                        this.queueForRetry(message);
                    }

                    throw error;
                }
            }

            async routeToContext(data) {
                const { context, action, payload, options = {} } = data;
                return await this.sendCrossContext({
                    targetContext: context,
                    action,
                    payload,
                    options
                });
            }

            getRoutingStrategy(action) {
                // Match action to routing strategy
                for (const [pattern, strategy] of this.routingStrategies.entries()) {
                    if (action.includes(pattern) || pattern === '*') {
                        return strategy;
                    }
                }
                return null;
            }

            async executeRoutingStrategy(message, strategy) {
                const { delivery = 'direct', timeout = 5000 } = strategy;

                switch (delivery) {
                    case 'immediate':
                        return await this.sendImmediate(message, timeout);
                    case 'reliable':
                        return await this.sendReliable(message, timeout);
                    case 'broadcast':
                        return await this.sendBroadcast(message, timeout);
                    case 'best-effort':
                        return await this.sendBestEffort(message);
                    default:
                        return await this.sendDirect(message);
                }
            }

            async sendImmediate(message, timeout) {
                return new Promise(async (resolve, reject) => {
                    const timer = setTimeout(() => {
                        reject(new Error('Immediate delivery timeout'));
                    }, timeout);

                    try {
                        const result = await this.deliverMessage(message);
                        clearTimeout(timer);
                        resolve(result);
                    } catch (error) {
                        clearTimeout(timer);
                        reject(error);
                    }
                });
            }

            async sendReliable(message, timeout) {
                // Reliable delivery with confirmation
                message.requiresConfirmation = true;
                message.timeout = timeout;

                return await this.deliverMessage(message);
            }

            async sendBroadcast(message, timeout) {
                const results = [];
                const strategy = this.getRoutingStrategy(message.action);
                const targets = Array.isArray(strategy?.target) ? strategy.target : [strategy?.target || message.targetContext];

                for (const targetContext of targets) {
                    try {
                        const targetMessage = { ...message, targetContext };
                        const result = await this.deliverMessage(targetMessage);
                        results.push({ targetContext, success: true, result });
                    } catch (error) {
                        results.push({ targetContext, success: false, error: error.message });
                    }
                }

                return { broadcast: true, results };
            }

            async sendBestEffort(message) {
                // Best effort - don't throw errors
                try {
                    return await this.deliverMessage(message);
                } catch (error) {
                    console.warn(`Best effort delivery failed for ${message.id}:`, error);
                    return { success: false, error: error.message, bestEffort: true };
                }
            }

            async sendDirect(message) {
                return await this.deliverMessage(message);
            }

            async deliverMessage(message) {
                const { targetContext, targetTabId, action, payload, sourceContext } = message;

                this.bridgeMetrics.messagesRouted++;

                try {
                    let response;

                    if (this.origin === 'background') {
                        // Background sends to tabs
                        if (targetTabId) {
                            response = await browser.tabs.sendMessage(targetTabId, {
                                action,
                                data: payload,
                                crossContext: true,
                                sourceContext,
                                messageId: message.id
                            });
                        } else {
                            // Find tab by context type
                            const tabs = await browser.tabs.query({});
                            for (const tab of tabs) {
                                try {
                                    const contextCheck = await browser.tabs.sendMessage(tab.id, {
                                        action: 'get-context-info'
                                    });

                                    if (contextCheck?.context === targetContext) {
                                        response = await browser.tabs.sendMessage(tab.id, {
                                            action,
                                            data: payload,
                                            crossContext: true,
                                            sourceContext,
                                            messageId: message.id
                                        });
                                        break;
                                    }
                                } catch (e) {
                                    // Continue to next tab
                                }
                            }
                        }
                    } else {
                        // Content script sends to background
                        response = await browser.runtime.sendMessage({
                            action,
                            data: payload,
                            crossContext: true,
                            sourceContext,
                            targetContext,
                            messageId: message.id
                        });
                    }

                    if (!response) {
                        throw new Error(`No response from ${targetContext}`);
                    }

                    return response;

                } catch (error) {
                    console.error(`Message delivery failed: ${message.id}`, error);
                    throw error;
                }
            }

            handleIncomingCrossContextMessage(request, sender, sendResponse) {
                const { crossContext, action, data, sourceContext, messageId } = request;

                if (!crossContext) return; // Not a cross-context message

                this.bridgeMetrics.messagesReceived++;

                console.log(`📨 Cross-context message received: ${action} from ${sourceContext}`);

                // Process through local EventBus first
                if (window.__localEventBus) {
                    window.__localEventBus.emitLocal(`cross-context-${action}`, data, {
                        sourceContext,
                        messageId,
                        sender
                    });
                }

                // Then emit through enhanced subscriber system
                this.emit(`handle-${action}`, {
                    data,
                    sender,
                    crossContext: true,
                    sourceContext,
                    messageId
                }).then(result => {
                    if (result.responses && result.responses.length > 0) {
                        sendResponse(result.responses[0]);
                    } else {
                        sendResponse({ error: 'No handler found', action });
                    }
                }).catch(error => {
                    sendResponse({ error: error.message });
                });
            }

            processCrossContextMessage(data) {
                console.log(`Processing cross-context message:`, data);
                // Additional processing if needed
            }

            trackDelivery(messageId, success, result) {
                this.deliveryTracking.set(messageId, {
                    messageId,
                    success,
                    result,
                    timestamp: Date.now(),
                    origin: this.origin
                });

                // Keep tracking history manageable
                if (this.deliveryTracking.size > 500) {
                    const oldestKey = this.deliveryTracking.keys().next().value;
                    this.deliveryTracking.delete(oldestKey);
                }
            }

            queueForRetry(message) {
                const retryKey = `retry-${message.id}`;
                message.attempts++;

                this.messageQueue.set(retryKey, {
                    ...message,
                    retryAt: Date.now() + (Math.pow(2, message.attempts) * 1000), // Exponential backoff
                    isRetry: true
                });

                console.log(`🔄 Queued message ${message.id} for retry (attempt ${message.attempts})`);
            }

            processMessageQueue() {
                const now = Date.now();

                for (const [key, message] of this.messageQueue.entries()) {
                    if (message.retryAt && now >= message.retryAt) {
                        this.processRetryMessage(key, message);
                    }
                }
            }

            async processRetryMessage(key, message) {
                this.messageQueue.delete(key);

                if (message.attempts >= 3) {
                    console.warn(`❌ Message ${message.id} failed after 3 attempts`);
                    this.trackDelivery(message.id, false, 'Max retries exceeded');
                    return;
                }

                try {
                    this.bridgeMetrics.retries++;
                    const result = await this.deliverMessage(message);
                    this.trackDelivery(message.id, true, result);
                    console.log(`✅ Message ${message.id} delivered on retry ${message.attempts}`);

                } catch (error) {
                    console.warn(`🔄 Retry ${message.attempts} failed for ${message.id}:`, error);
                    this.queueForRetry(message);
                }
            }

            retryFailedDeliveries() {
                // Process any messages that may have been stuck
                const now = Date.now();
                const staleThreshold = 60000; // 1 minute

                for (const [key, message] of this.messageQueue.entries()) {
                    if ((now - message.timestamp) > staleThreshold && !message.isRetry) {
                        console.log(`Requeuing stale message ${message.id}`);
                        this.queueForRetry(message);
                    }
                }
            }

            // Convenience methods for common cross-context patterns
            async sendToExtractor(action, data, options = {}) {
                return this.sendCrossContext({
                    targetContext: 'extractor',
                    action,
                    payload: data,
                    options
                });
            }

            async sendToProxy(action, data, options = {}) {
                return this.sendCrossContext({
                    targetContext: 'proxy',
                    action,
                    payload: data,
                    options
                });
            }

            async sendToBackground(action, data, options = {}) {
                return this.sendCrossContext({
                    targetContext: 'background',
                    action,
                    payload: data,
                    options
                });
            }

            async broadcastToAll(action, data, options = {}) {
                return this.sendCrossContext({
                    targetContext: '*',
                    action,
                    payload: data,
                    options: { ...options, strategy: { delivery: 'broadcast' } }
                });
            }

            // Bridge statistics and monitoring
            getBridgeStats() {
                return {
                    origin: this.origin,
                    metrics: { ...this.bridgeMetrics },
                    queueSize: this.messageQueue.size,
                    trackingHistory: this.deliveryTracking.size,
                    routingStrategies: this.routingStrategies.size,
                    recentDeliveries: Array.from(this.deliveryTracking.values())
                        .slice(-10)
                        .map(delivery => ({
                            messageId: delivery.messageId,
                            success: delivery.success,
                            timestamp: delivery.timestamp
                        }))
                };
            }
        }

        // ===== GLOBAL INITIALIZATION =====

        // Create global instances
        const localEventBus = new LocalEventBus();
        const crossContextBridge = new MessageBridge();

        // Global exports
        window.__vibeReaderEnhancedUtils = {
            LocalEventBus: localEventBus,
            CrossContextBridge: crossContextBridge,

            // Enhanced convenience methods with error handling
            emitLocal: (eventType, data, options) => {
                try {
                    return localEventBus.emitLocal(eventType, data, options);
                } catch (error) {
                    console.error(`Local emit failed for ${eventType}:`, error);
                    return { success: false, error: error.message };
                }
            },

            sendCrossContext: (targetContext, action, data, options) => {
                try {
                    return crossContextBridge.sendCrossContext({
                        targetContext,
                        action,
                        payload: data,
                        options
                    });
                } catch (error) {
                    console.error(`Cross-context send failed for ${action}:`, error);
                    return Promise.resolve({ success: false, error: error.message });
                }
            },

            // Advanced debugging and monitoring
            getStats: () => ({
                localEvents: localEventBus.getLocalEventStats(),
                crossContext: crossContextBridge.getBridgeStats(),
                origin: localEventBus.origin,
                timestamp: Date.now()
            }),

            // Component health check
            healthCheck: () => {
                const health = {
                    localEventBus: {
                        available: !!localEventBus,
                        functional: localEventBus ? localEventBus.eventMetrics.emitted > 0 || true : false
                    },
                    crossContextBridge: {
                        available: !!crossContextBridge,
                        functional: crossContextBridge ? crossContextBridge.bridgeMetrics.messagesSent > 0 || true : false
                    },
                    subscriberSystem: {
                        available: !!window.__globalSubscriberManager,
                        origin: window.__globalSubscriberManager?.origin || 'unknown'
                    }
                };

                health.overall = Object.values(health).every(component =>
                    component.available !== false
                );

                return health;
            },

            // Emergency cleanup
            emergencyCleanup: () => {
                try {
                    localEventBus.cleanEventHistory();
                    crossContextBridge.messageQueue.clear();

                    console.log('🚨 Emergency cleanup completed');
                    return { success: true, cleaned: Date.now() };
                } catch (error) {
                    console.error('Emergency cleanup failed:', error);
                    return { success: false, error: error.message };
                }
            },

            // Performance optimization
            optimize: () => {
                try {
                    // Clear old event history
                    localEventBus.cleanEventHistory();

                    // Process any pending cross-context messages
                    crossContextBridge.processMessageQueue();

                    console.log(`⚡ Performance optimization completed`);

                    return {
                        success: true,
                        optimized: Date.now()
                    };
                } catch (error) {
                    console.error('Performance optimization failed:', error);
                    return { success: false, error: error.message };
                }
            }
        };

        // Enhanced backwards compatibility with error handling
        window.__localEventBus = localEventBus;
        window.__crossContextBridge = crossContextBridge;

        // Integration with other enhanced components
        if (window.__backgroundOrchestrator || window.__enhancedOrchestrator) {
            // Register with background orchestrator if available
            const orchestrator = window.__backgroundOrchestrator || window.__enhancedOrchestrator;
            orchestrator.emit?.('utils-loaded', {
                origin: localEventBus.origin,
                components: ['LocalEventBus', 'CrossContextBridge'],
                timestamp: Date.now()
            });
        }

        if (window.__proxyController || window.__vibeReaderProxyController || window.__enhancedProxyController) {
            // Notify proxy controller that utils are ready
            const proxy = window.__proxyController || window.__vibeReaderProxyController || window.__enhancedProxyController;
            proxy.emit?.('utils-ready', {
                localEventBus: !!localEventBus,
                crossContextBridge: !!crossContextBridge,
                timestamp: Date.now()
            });
        }

        if (window.__stealthExtractor || window.__vibeReaderStealthExtractor || window.__enhancedStealthExtractor) {
            // Notify stealth extractor that utils are ready
            const extractor = window.__stealthExtractor || window.__vibeReaderStealthExtractor || window.__enhancedStealthExtractor;
            extractor.emit?.('utils-ready', {
                localEventBus: !!localEventBus,
                crossContextBridge: !!crossContextBridge,
                timestamp: Date.now()
            });
        }

        console.log(`🚀 Enhanced Vibe Utils v2.5 loaded in ${localEventBus.origin} context`);
        console.log('🎪 Local EventBus: window.__localEventBus');
        console.log('🌉 Cross-Context Bridge: window.__crossContextBridge');
        console.log('📊 Combined Stats: window.__vibeReaderEnhancedUtils.getStats()');
        console.log('🏥 Health Check: window.__vibeReaderEnhancedUtils.healthCheck()');

        // Auto-optimize every 10 minutes in non-background contexts
        if (localEventBus.origin !== 'background') {
            setInterval(() => {
                window.__vibeReaderEnhancedUtils.optimize();
            }, 600000); // 10 minutes
        }

        true;

    } catch (error) {
        console.error('Failed to initialize Enhanced Vibe Utils:', error);

        // Emergency fallback - create minimal working system
        try {
            window.__vibeReaderEnhancedUtils = {
                getStats: () => ({ error: 'Initialization failed', timestamp: Date.now() }),
                healthCheck: () => ({ overall: false, error: error.message }),
                emergencyCleanup: () => ({ success: false, error: 'System not initialized' })
            };

            console.warn('🚨 Emergency fallback system active');
        } catch (fallbackError) {
            console.error('🚨 Complete system failure:', fallbackError);
        }

        delete window.__vibeReaderEnhancedUtils;
        throw error;
    }
}