// VibeReader v2.0 - Background manager and script injector
// enhanced-background.js - Add this class extension to the background script

/**
 * MessageBroker - Extends base MessageBridge with routing and batching
 * Only works in background context where we have access to tabs API
 *
 * Features:
 * - Message batching with strategies (accumulate/replace/merge)
 * - Cross-tab routing with relationship mapping
 * - Unhandled message detection
 * - Error tracking and recovery
 */
// VibeReader v2.0 - Enhanced Message Broker with Pure Middleware Architecture
// enhanced-background.js - Refactored to use only subscriber middleware

/**
 * MessageBroker - Pure middleware-based message broker for background context
 *
 * Features:
 * - Message batching with strategies (accumulate/replace/merge)
 * - Cross-tab routing with relationship mapping
 * - Unhandled message detection
 * - Error tracking and recovery
 * - All handled through subscriber middleware pipeline
 */
class MessageBroker extends SubscriberEnabledComponent {
    constructor() {
        super();

        // Verify we're in background context
        if (typeof browser.tabs === 'undefined' || !browser.tabs.create) {
            console.error('MessageBroker requires background context with tabs API');
            throw new Error('MessageBroker requires background context');
        }

        // Message queuing with strategies
        this.messageQueues = new Map();
        this.queueTimers = new Map();
        this.flushingQueues = new Set(); // Prevent race conditions
        this.queueStrategies = new Map();

        // Callback management (fixes promise serialization issue)
        this.pendingCallbacks = new Map();
        this.callbackTimeout = 30000; // 30 seconds

        // Routing for cross-tab communication
        this.routingTable = new Map();
        this.tabRelationships = new Map(); // hidden -> visible mapping

        // Unhandled message tracking with limits
        this.unhandledMessages = new Map();
        this.maxUnhandledPerType = 50; // Prevent unbounded growth

        // Comprehensive statistics
        this.stats = {
            sent: 0,
            received: 0,
            routed: 0,
            batched: 0,
            unhandled: 0,
            errors: {
                send: 0,
                route: 0,
                timeout: 0,
                invalid: 0
            }
        };

        this.initialize();
    }

    initialize() {
        // Load default strategies
        this.loadDefaultStrategies();

        // Set up middleware pipeline
        this.setupMiddleware();

        // Set up enhanced message handling
        this.setupEnhancedListener();

        // Track tab lifecycle
        browser.tabs.onRemoved.addListener(tabId => {
            this.cleanupTab(tabId);
        });

        // Periodic cleanup every 2 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 120000);
    }

    setupMiddleware() {
        // Add routing middleware
        this.subscriberManager.addGlobalMiddleware(
            new MessageRoutingMiddleware(this)
        );

        // Add batching middleware
        this.subscriberManager.addGlobalMiddleware(
            new MessageBatchingMiddleware(this)
        );

        // Add statistics middleware
        this.subscriberManager.addGlobalMiddleware(
            new MessageStatisticsMiddleware(this)
        );

        // Add unhandled tracking middleware
        this.subscriberManager.addGlobalMiddleware(
            new UnhandledMessageMiddleware(this)
        );
    }

    loadDefaultStrategies() {
        // Content extraction - only latest matters
        this.setStrategy('contentExtracted', {
            queue: 'replace',
            priority: 10
        });

        // Progress updates - only latest
        this.setStrategy('extractionProgress', {
            queue: 'replace',
            priority: 5
        });

        // Media discovery - batch for efficiency
        this.setStrategy('media-discovered', {
            queue: 'accumulate',
            maxBatchSize: 20,
            batchDelay: 200,
            priority: 3
        });

        // Terminal logs - batch but keep all
        this.setStrategy('terminal-log', {
            queue: 'accumulate',
            maxBatchSize: 50,
            batchDelay: 100,
            priority: 1
        });

        // Errors - never batch, send immediately
        this.setStrategy('error', {
            queue: 'direct',
            priority: 10
        });
    }

    setStrategy(action, config) {
        this.queueStrategies.set(action, {
            queue: config.queue || 'direct',
            maxBatchSize: config.maxBatchSize || 10,
            batchDelay: config.batchDelay || 100,
            priority: config.priority || 5
        });
    }

    setupEnhancedListener() {
        // Add our enhanced listener using browser API directly
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Handle async properly
            this.handleEnhancedMessage(request, sender)
                .then(response => {
                    sendResponse(response);
                })
                .catch(error => {
                    this.stats.errors.invalid++;
                    console.error('Message handling error:', error);
                    sendResponse({ error: error.message });
                });

            return true; // Keep channel open for async response
        });
    }

    // === ENHANCED MESSAGE HANDLING VIA SUBSCRIBERS ===
    async handleEnhancedMessage(request, sender) {
        this.stats.received++;

        // Validate message structure
        if (!request || typeof request !== 'object') {
            this.stats.errors.invalid++;
            throw new Error('Invalid message format');
        }

        const { action, data } = request;

        if (!action) {
            this.stats.errors.invalid++;
            throw new Error('Message missing action');
        }

        // Check if we should route this message to another tab
        const targetTab = this.findTargetTab(sender, action);

        if (targetTab) {
            this.stats.routed++;
            try {
                // Route to target tab
                const response = await browser.tabs.sendMessage(targetTab, request);
                return response || { success: true, routed: true };

            } catch (error) {
                this.stats.errors.route++;
                console.error(`Failed to route ${action} to tab ${targetTab}:`, error.message);

                // Try to handle locally as fallback
                const localResult = await this.handleLocally(action, request, sender);
                if (localResult.handled) {
                    console.log(`Falling back to local handler for ${action}`);
                    return localResult.response;
                }

                throw new Error(`Failed to route and no local handler: ${action}`);
            }
        }

        // Handle locally through subscriber system
        const localResult = await this.handleLocally(action, request, sender);

        if (!localResult.handled) {
            // Track unhandled message
            this.trackUnhandled(action, sender);

            // Return error response
            return {
                error: `No handler or route for action: ${action}`,
                unhandled: true
            };
        }

        return localResult.response;
    }

    async handleLocally(action, request, sender) {
        // Emit to subscriber system
        const result = await this.emit(`message-${action}`, request.data || request, {
            sender,
            action,
            source: 'runtime-message',
            timestamp: Date.now()
        });

        if (result && result.successCount > 0) {
            return { handled: true, response: { success: true } };
        }

        return { handled: false };
    }

    // === MESSAGE REGISTRATION VIA SUBSCRIBE ===
    register(action, handler) {
        return this.subscribe(`message-${action}`, async (eventType, data, context) => {
            try {
                const result = await handler(data, context.sender);
                return { success: true, ...result };
            } catch (error) {
                console.error(`Handler error for ${action}:`, error);
                throw error;
            }
        }, {
            id: `handler-${action}`,
            maxRetries: 2,
            fallbackBehavior: 'fallback',
            fallbackCallback: (eventType, data, error) => {
                console.error(`Handler fallback for ${action}:`, error);
                return { success: false, error: error.message };
            }
        });
    }

    // === ENHANCED SEND WITH BATCHING ===
    async send(target, action, data, options = {}) {
        this.stats.sent++;

        const strategy = this.queueStrategies.get(action) || { queue: 'direct' };

        // Apply queueing strategy
        if (strategy.queue !== 'direct' && !options.immediate) {
            return this.queueMessage(target, action, data, strategy);
        }

        // Direct send
        return this.sendDirect(target, action, data);
    }

    async queueMessage(target, action, data, strategy) {
        const key = `${action}:${target || 'broadcast'}`;

        if (!this.messageQueues.has(key)) {
            this.messageQueues.set(key, []);
        }

        const queue = this.messageQueues.get(key);
        const callbackId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const message = {
            target,
            action,
            data,
            timestamp: Date.now(),
            callbackId
        };

        // Create promise BEFORE applying strategy
        const promise = new Promise((resolve, reject) => {
            this.pendingCallbacks.set(callbackId, { resolve, reject });

            // Timeout cleanup
            setTimeout(() => {
                if (this.pendingCallbacks.has(callbackId)) {
                    this.stats.errors.timeout++;
                    reject(new Error(`Message timeout: ${action}`));
                    this.pendingCallbacks.delete(callbackId);
                }
            }, this.callbackTimeout);
        });

        // Apply queue strategy
        switch (strategy.queue) {
            case 'accumulate':
                queue.push(message);
                break;

            case 'replace':
                // Cancel previous callbacks
                queue.forEach(msg => {
                    if (this.pendingCallbacks.has(msg.callbackId)) {
                        const { reject } = this.pendingCallbacks.get(msg.callbackId);
                        reject(new Error('Replaced by newer message'));
                        this.pendingCallbacks.delete(msg.callbackId);
                    }
                });
                queue.length = 0;
                queue.push(message);
                break;

            case 'merge':
                if (queue.length > 0) {
                    // Deep merge data objects
                    const last = queue[queue.length - 1];
                    last.data = this.mergeData(last.data, data);
                    // Return the original promise, not a new one
                    return this.pendingCallbacks.get(last.callbackId).promise || promise;
                } else {
                    queue.push(message);
                }
                break;

            case 'dedupe':
                // Check for duplicate
                const duplicate = queue.find(m =>
                    JSON.stringify(m.data) === JSON.stringify(data)
                );
                if (duplicate) {
                    // Return existing promise
                    return this.pendingCallbacks.get(duplicate.callbackId).promise || promise;
                }
                queue.push(message);
                break;
        }

        // Store promise reference for merge/dedupe cases
        if (this.pendingCallbacks.has(callbackId)) {
            this.pendingCallbacks.get(callbackId).promise = promise;
        }

        // Schedule flush
        this.scheduleFlush(key, strategy);

        return promise;
    }

    scheduleFlush(key, strategy) {
        // Clear existing timer
        if (this.queueTimers.has(key)) {
            clearTimeout(this.queueTimers.get(key));
        }

        // Priority affects delay (higher priority = shorter delay)
        const delay = Math.max(10, strategy.batchDelay - (strategy.priority * 5));

        this.queueTimers.set(key, setTimeout(() => {
            this.flushQueue(key, strategy).catch(error => {
                console.error(`Flush failed for ${key}:`, error);
                this.stats.errors.send++;
            });
            this.queueTimers.delete(key);
        }, delay));
    }

    async flushQueue(key, strategy) {
        // Prevent concurrent flushes
        if (this.flushingQueues.has(key)) {
            return;
        }

        this.flushingQueues.add(key);

        try {
            const queue = this.messageQueues.get(key);
            if (!queue || queue.length === 0) {
                return;
            }

            const messages = [...queue];
            queue.length = 0;

            // Batch if multiple messages and strategy supports it
            if (messages.length > 1 && strategy.maxBatchSize) {
                await this.sendBatch(messages, strategy);
            } else {
                // Send individually
                for (const message of messages) {
                    await this.sendSingle(message);
                }
            }

            this.stats.batched += messages.length;

        } finally {
            this.flushingQueues.delete(key);
        }
    }

    async sendBatch(messages, strategy) {
        // Split into chunks if needed
        const chunks = [];
        for (let i = 0; i < messages.length; i += strategy.maxBatchSize) {
            chunks.push(messages.slice(i, i + strategy.maxBatchSize));
        }

        for (const chunk of chunks) {
            const target = chunk[0].target;
            const action = `${chunk[0].action}-batch`;

            const batchData = {
                action: chunk[0].action,
                items: chunk.map(m => ({
                    data: m.data,
                    timestamp: m.timestamp
                })),
                count: chunk.length
            };

            try {
                const result = await this.sendDirect(target, action, batchData);

                // Resolve all callbacks in this chunk
                chunk.forEach(msg => {
                    if (this.pendingCallbacks.has(msg.callbackId)) {
                        const { resolve } = this.pendingCallbacks.get(msg.callbackId);
                        resolve(result);
                        this.pendingCallbacks.delete(msg.callbackId);
                    }
                });

            } catch (error) {
                this.stats.errors.send++;

                // Reject all callbacks in this chunk
                chunk.forEach(msg => {
                    if (this.pendingCallbacks.has(msg.callbackId)) {
                        const { reject } = this.pendingCallbacks.get(msg.callbackId);
                        reject(error);
                        this.pendingCallbacks.delete(msg.callbackId);
                    }
                });

                throw error; // Re-throw for error handling
            }
        }
    }

    async sendSingle(message) {
        try {
            const result = await this.sendDirect(
                message.target,
                message.action,
                message.data
            );

            if (this.pendingCallbacks.has(message.callbackId)) {
                const { resolve } = this.pendingCallbacks.get(message.callbackId);
                resolve(result);
                this.pendingCallbacks.delete(message.callbackId);
            }

            return result;

        } catch (error) {
            this.stats.errors.send++;

            if (this.pendingCallbacks.has(message.callbackId)) {
                const { reject } = this.pendingCallbacks.get(message.callbackId);
                reject(error);
                this.pendingCallbacks.delete(message.callbackId);
            }

            throw error;
        }
    }

    async sendDirect(target, action, data) {
        const message = {
            action,
            data,
            timestamp: Date.now(),
            from: 'background'
        };

        try {
            if (typeof target === 'number') {
                // Send to specific tab
                return await browser.tabs.sendMessage(target, message);

            } else if (target === 'broadcast') {
                // Broadcast to all tabs
                return await this.broadcast(message);

            } else if (!target) {
                // No target means local handling only via subscribers
                const result = await this.emit(`message-${action}`, data, {
                    action,
                    source: 'local',
                    timestamp: Date.now()
                });

                if (result && result.successCount > 0) {
                    return { success: true };
                }

                throw new Error(`No handler for local action: ${action}`);

            } else {
                throw new Error(`Invalid target: ${target}`);
            }

        } catch (error) {
            this.stats.errors.send++;
            console.error(`Failed to send ${action} to ${target}:`, error.message);
            throw error;
        }
    }

    // === ROUTING FOR CROSS-TAB COMMUNICATION ===
    registerRoute(fromTabId, toTabId, relationship = 'hidden-visible') {
        if (relationship === 'hidden-visible') {
            // Map hidden tab to visible tab
            this.tabRelationships.set(fromTabId, toTabId);
        } else if (relationship === 'visible-hidden') {
            // Reverse mapping if needed
            this.tabRelationships.set(toTabId, fromTabId);
        }

        this.routingTable.set(`tab-${fromTabId}`, toTabId);
        console.log(`Route registered: ${fromTabId} -> ${toTabId} (${relationship})`);
    }

    unregisterRoute(tabId) {
        this.routingTable.delete(`tab-${tabId}`);
        this.tabRelationships.delete(tabId);

        // Also remove reverse relationships
        for (const [key, value] of this.tabRelationships.entries()) {
            if (value === tabId) {
                this.tabRelationships.delete(key);
            }
        }
    }

    findTargetTab(sender, action) {
        const senderTabId = sender.tab?.id;
        if (!senderTabId) return null;

        // Check explicit routes first
        const explicitRoute = this.routingTable.get(`tab-${senderTabId}`);
        if (explicitRoute) {
            return explicitRoute;
        }

        // Check relationships for specific actions
        if (action === 'contentExtracted' || action === 'extractionProgress') {
            // Hidden tab -> Visible tab
            return this.tabRelationships.get(senderTabId);
        }

        if (action === 'injectScript' || action === 'startExtraction') {
            // Visible tab -> Hidden tab (reverse lookup)
            for (const [hidden, visible] of this.tabRelationships.entries()) {
                if (visible === senderTabId) {
                    return hidden;
                }
            }
        }

        return null;
    }

    trackUnhandled(action, sender) {
        if (!this.unhandledMessages.has(action)) {
            this.unhandledMessages.set(action, []);
        }

        const log = this.unhandledMessages.get(action);
        const entry = {
            timestamp: Date.now(),
            sender: sender.tab?.id || sender.id || 'unknown',
            url: sender.tab?.url || sender.url || 'unknown'
        };

        log.push(entry);

        // Limit stored entries to prevent memory leak
        if (log.length > this.maxUnhandledPerType) {
            log.shift(); // Remove oldest
        }

        this.stats.unhandled++;

        // Log warning with details
        console.warn(`Unhandled message: ${action}`, {
            from: entry.sender,
            url: entry.url,
            totalUnhandled: log.length
        });

        // Emit event for monitoring
        this.emit('unhandled-message', {
            action,
            sender: entry.sender,
            count: log.length
        });
    }

    // === BROADCAST WITH ERROR HANDLING ===
    async broadcast(message, options = {}) {
        const tabs = await browser.tabs.query(options.filter || {});

        if (tabs.length === 0) {
            return { success: true, results: [], message: 'No tabs to broadcast to' };
        }

        // Process in parallel with allSettled to handle errors gracefully
        const results = await Promise.allSettled(
            tabs.map(tab =>
                browser.tabs.sendMessage(tab.id, message)
                    .then(response => ({
                        tabId: tab.id,
                        success: true,
                        response
                    }))
                    .catch(error => ({
                        tabId: tab.id,
                        success: false,
                        error: error.message
                    }))
            )
        );

        // Process results
        const processed = results.map(r => r.value);
        const succeeded = processed.filter(r => r.success);
        const failed = processed.filter(r => !r.success);

        if (failed.length > 0 && !options.ignoreErrors) {
            this.stats.errors.send += failed.length;
            console.warn(`Broadcast failed for ${failed.length} tabs:`, failed);
        }

        return {
            success: succeeded.length > 0,
            succeeded: succeeded.length,
            failed: failed.length,
            results: options.detailed ? processed : succeeded
        };
    }

    // === TAB CLEANUP ===
    cleanupTab(tabId) {
        console.log(`Cleaning up tab ${tabId}`);

        // Remove from routing tables
        this.unregisterRoute(tabId);

        // Clear any pending messages for this tab
        const keysToDelete = [];

        for (const [key, queue] of this.messageQueues.entries()) {
            if (key.includes(`:${tabId}`)) {
                // Cancel pending callbacks
                queue.forEach(msg => {
                    if (this.pendingCallbacks.has(msg.callbackId)) {
                        const { reject } = this.pendingCallbacks.get(msg.callbackId);
                        reject(new Error('Tab closed'));
                        this.pendingCallbacks.delete(msg.callbackId);
                    }
                });

                keysToDelete.push(key);
            }
        }

        // Delete queues
        keysToDelete.forEach(key => {
            this.messageQueues.delete(key);
            if (this.queueTimers.has(key)) {
                clearTimeout(this.queueTimers.get(key));
                this.queueTimers.delete(key);
            }
        });
    }

    // === PERIODIC CLEANUP ===
    cleanup() {
        const now = Date.now();
        const fiveMinutesAgo = now - 300000;

        // Clear old unhandled messages
        for (const [action, log] of this.unhandledMessages.entries()) {
            const filtered = log.filter(entry => entry.timestamp > fiveMinutesAgo);

            if (filtered.length === 0) {
                this.unhandledMessages.delete(action);
            } else if (filtered.length < log.length) {
                this.unhandledMessages.set(action, filtered);
            }
        }

        // Clear orphaned callbacks (shouldn't happen, but safety check)
        for (const [id, callback] of this.pendingCallbacks.entries()) {
            if (callback.timestamp && callback.timestamp < fiveMinutesAgo) {
                console.warn(`Cleaning orphaned callback: ${id}`);
                this.pendingCallbacks.delete(id);
            }
        }

        console.log('Cleanup complete:', this.getStats());
    }

    // === UTILITIES ===
    mergeData(existing, newData) {
        // Handle null/undefined
        if (!existing) return newData;
        if (!newData) return existing;

        // Handle arrays
        if (Array.isArray(existing) && Array.isArray(newData)) {
            return [...existing, ...newData];
        }

        // Handle objects
        if (typeof existing === 'object' && typeof newData === 'object') {
            return { ...existing, ...newData };
        }

        // Default: replace
        return newData;
    }

    // === STATISTICS & DEBUGGING ===
    getStats() {
        return {
            messages: {
                sent: this.stats.sent,
                received: this.stats.received,
                routed: this.stats.routed,
                batched: this.stats.batched,
                unhandled: this.stats.unhandled
            },
            errors: this.stats.errors,
            queues: {
                active: this.messageQueues.size,
                pending: Array.from(this.messageQueues.values())
                    .reduce((sum, queue) => sum + queue.length, 0),
                callbacks: this.pendingCallbacks.size
            },
            routing: {
                routes: this.routingTable.size,
                relationships: this.tabRelationships.size
            },
            unhandled: {
                types: this.unhandledMessages.size,
                total: Array.from(this.unhandledMessages.values())
                    .reduce((sum, log) => sum + log.length, 0)
            },
            subscribers: this.getSubscriberStats()
        };
    }

    // === CLEANUP ON DESTROY ===
    destroy() {
        // Clear all timers
        for (const timer of this.queueTimers.values()) {
            clearTimeout(timer);
        }

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Reject all pending callbacks
        for (const [id, callback] of this.pendingCallbacks.entries()) {
            callback.reject(new Error('Broker destroyed'));
        }

        // Clear all data structures
        this.messageQueues.clear();
        this.queueTimers.clear();
        this.pendingCallbacks.clear();
        this.routingTable.clear();
        this.tabRelationships.clear();
        this.unhandledMessages.clear();

        // Clean up base class
        super.destroy();

        console.log('MessageBroker destroyed');
    }

    // === GLOBAL MESSAGE HANDLERS ===
    setupGlobalHandlers() {
        console.log('Setting up global handlers in MessageBroker');
        if (typeof dump !== 'undefined') {
            dump('Setting up global handlers in MessageBroker\n');
        }
        
        // Settings updates - broadcast to all active tabs
        this.register('updateSettings', async (request, sender) => {
            const settings = request.data || request.settings || request;
            console.log('Broadcasting settings update to all tabs:', settings);
            dump(`Broadcasting settings update to all tabs\n`);
            
            return await this.broadcast({
                action: 'updateSettings',
                settings
            }, { filter: { active: true } });
        });

        // Debug mode toggle - broadcast to all tabs
        this.register('toggleVibeDebug', async (request, sender) => {
            const enabled = request.data?.enabled ?? request.enabled;
            console.log(`Broadcasting debug mode: ${enabled ? 'enabled' : 'disabled'}`);
            dump(`Broadcasting debug mode: ${enabled ? 'enabled' : 'disabled'}\n`);
            
            return await this.broadcast({
                action: 'toggleVibeDebug',
                enabled
            });
        });

        // Start extraction - route to hidden tab
        this.register('start-extraction', async (request, sender) => {
            const { hiddenTabId, visibleTabId, url } = request.data || request;
            console.log(`Routing start-extraction to hidden tab ${hiddenTabId}`);
            
            return await this.send(hiddenTabId, 'start-extraction', {
                hiddenTabId,
                visibleTabId,
                url
            });
        });

        // Content extracted - route from hidden to visible tab
        this.register('contentExtracted', async (request, sender) => {
            const senderTabId = sender.tab?.id;
            
            // Find the visible tab this hidden tab is associated with
            const visibleTabId = this.tabRelationships.get(senderTabId);
            
            if (visibleTabId) {
                console.log(`Routing contentExtracted from hidden tab ${senderTabId} to visible tab ${visibleTabId}`);
                return await this.send(visibleTabId, 'contentExtracted', request.data || request);
            } else {
                console.warn(`No visible tab found for hidden tab ${senderTabId}`);
                return { error: 'No route found for content' };
            }
        });

        // Extraction progress - route from hidden to visible tab
        this.register('extractionProgress', async (request, sender) => {
            const senderTabId = sender.tab?.id;
            const visibleTabId = this.tabRelationships.get(senderTabId);
            
            if (visibleTabId) {
                console.log(`Routing extraction progress to visible tab ${visibleTabId}`);
                return await this.send(visibleTabId, 'extractionProgress', request.data || request);
            }
            
            return { success: true };
        });

        // Tab status check
        this.register('getStatus', async (request, sender) => {
            const tabId = request.data?.tabId || request.tabId;
            
            // This will be handled by HiddenTabManager
            // We just need to forward it
            if (window.__vibeReaderBackgroundManager) {
                const isActive = window.__vibeReaderBackgroundManager.tabs.has(tabId) && 
                                window.__vibeReaderBackgroundManager.tabs.get(tabId).state === 'active';
                return { active: isActive };
            }
            
            return { active: false };
        });
    }
}

// === MIDDLEWARE CLASSES FOR ENHANCED MESSAGE BROKER ===

class MessageRoutingMiddleware extends SubscriberMiddleware {
    constructor(broker) {
        super('MessageRouting');
        this.broker = broker;
    }

    async process(eventContext) {
        const { event, data, context } = eventContext;

        // Check if this message should be routed
        if (context.sender && context.action) {
            const targetTab = this.broker.findTargetTab(context.sender, context.action);

            if (targetTab) {
                eventContext.context.routeTarget = targetTab;
                eventContext.context.shouldRoute = true;
            }
        }

        return true;
    }
}

class MessageBatchingMiddleware extends SubscriberMiddleware {
    constructor(broker) {
        super('MessageBatching');
        this.broker = broker;
    }

    async process(eventContext) {
        const { event, data, context } = eventContext;

        // Check if this message type has a batching strategy
        if (context.action) {
            const strategy = this.broker.queueStrategies.get(context.action);

            if (strategy) {
                eventContext.context.batchingStrategy = strategy;
                eventContext.context.supportsBatching = strategy.queue !== 'direct';
            }
        }

        return true;
    }
}

class MessageStatisticsMiddleware extends SubscriberMiddleware {
    constructor(broker) {
        super('MessageStatistics');
        this.broker = broker;
    }

    async process(eventContext) {
        // Update statistics based on routing decisions made by previous middleware
        if (eventContext.context?.shouldRoute) {
            this.broker.stats.routed++;
        }

        // Optionally track processing start time for performance monitoring
        if (eventContext.context) {
            eventContext.context.processingStartTime = Date.now();
        } else {
            eventContext.context = { processingStartTime: Date.now() };
    }

        return true; // Continue the middleware chain
    }
}

class UnhandledMessageMiddleware extends SubscriberMiddleware {
    constructor(broker) {
        super('UnhandledMessage');
        this.broker = broker;
    }

    async process(eventContext) {
        const { event, context } = eventContext;

        // Track if this message type has any handlers
        const stats = this.broker.getSubscriberStats();
        const hasHandlers = stats.byEventType[event]?.count > 0;

        if (!hasHandlers && context.action) {
            // This will be an unhandled message
            eventContext.context.willBeUnhandled = true;
        }

        return true;
    }
}

// === CREATE GLOBAL SINGLETON ===
if (!window.__messageBroker) {
    console.log('🔧 Creating MessageBroker singleton');
    if (typeof dump !== 'undefined') {
        dump('🔧 Creating MessageBroker singleton\n');
    } else {
        console.warn('dump() not available for MessageBroker creation');
    }
    window.__messageBroker = new MessageBroker();
    window.__messageBroker.setupGlobalHandlers();
    console.log('✅ MessageBroker global handlers setup complete');
    if (typeof dump !== 'undefined') {
        dump('✅ MessageBroker global handlers setup complete\n');
    }
}

// Unified Script Injector - eliminates duplicate injection logic
class ScriptInjector {
  constructor(logToVisibleFn) {
    this.logToVisible = logToVisibleFn;
    this.scripts = {
      extractor: {
        dependencies: [
          { file: "src/vibe-utils.js" },
          { file: "src/unified-vibe.js" },
          {
            file: "lib/purify.min.js",
            verify: 'typeof DOMPurify !== "undefined"',
            name: "DOMPurify.js",
          },
          {
            file: "lib/readability.js",
            verify: 'typeof Readability !== "undefined"',
            name: "Readability.js",
          },
        ],
        main: { file: "src/stealth-extractor.js" },
        pingType: "extractor",
      },
      proxy: {
        dependencies: [
          { file: "src/vibe-utils.js" },
          {
            file: "lib/rxjs.min.js",
            verify: 'typeof Rx !== "undefined"',
            name: "RxJS",
          },
          {
            file: "lib/aalib.js",
            verify: 'typeof aalib !== "undefined"',
            name: "aalib.js",
          },
        ],
        main: { file: "src/proxy-controller.js" },
        css: { file: "styles/generated.css" },
        pingType: "proxy",
        needsLogTarget: true, // Proxy needs visible tab ID for logging
      },
    };
  }

  async inject(tabId, scriptType, visibleTabId = null) {
    const config = this.scripts[scriptType];
    if (!config) throw new Error(`Unknown script type: ${scriptType}`);

    const logTabId = config.needsLogTarget ? visibleTabId : tabId;

    // Check if already injected
    if (await this.isInjected(tabId, config.pingType)) {
      console.log(`⚠️ ${scriptType} already injected`);
      return true;
    }

    // Log injection start
    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        `🔧 Injecting ${scriptType} scripts`,
        "SYSTEM",
      );
    }

    // Inject dependencies in order
    for (const dep of config.dependencies) {
      await this.injectFile(tabId, dep, logTabId);

      if (dep.verify) {
        await this.verifyCode(tabId, dep.verify, dep.name, logTabId);
      }
    }

    // Inject main script
    await this.injectFile(tabId, config.main, logTabId);

    // Inject CSS if present
    if (config.css) {
      await this.injectCSS(tabId, config.css, logTabId);
    }

    // Wait for script to be ready
    return this.waitForReady(tabId, config.pingType);
  }

  async injectFile(tabId, fileConfig, logTabId = null) {
    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        `📚 Injecting ${fileConfig.file}`,
        "SYSTEM",
      );
    }

    return browser.tabs.executeScript(tabId, {
      file: fileConfig.file,
      runAt: fileConfig.runAt || "document_end",
    });
  }

  async verifyCode(tabId, verifyCode, scriptName = "script", logTabId = null) {
    const [result] = await browser.tabs.executeScript(tabId, {
      code: verifyCode,
      runAt: "document_end",
    });

    if (!result) {
      throw new Error(`${scriptName} failed to load properly`);
    }

    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        `✅ ${scriptName} loaded successfully`,
        "SYSTEM",
      );
    }

    return result;
  }

  async injectCSS(tabId, cssConfig, logTabId = null) {
    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        "🎨 Injecting generated.css",
        "CSS",
      );
    }

    await browser.tabs.insertCSS(tabId, {
      file: cssConfig.file,
      allFrames: false,
      runAt: "document_start",
    });

    // Give CSS time to apply
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (logTabId && this.logToVisible) {
      await this.verifyCSSLoadingLenient(tabId, logTabId);
    }
  }

  async verifyCSSLoadingLenient(tabId, logTabId) {
    try {
      const result = await browser.tabs.executeScript(tabId, {
        code: `
                    const sheets = document.styleSheets.length;
                    const hasExtensionCSS = Array.from(document.styleSheets).some(s => 
                        s.href && s.href.includes(chrome.runtime.id)
                    );
                    ({ sheets, hasExtensionCSS });
                `,
      });

      if (result[0].hasExtensionCSS) {
        await this.logToVisible(
          logTabId,
          "INFO",
          "✅ Extension CSS detected",
          "CSS",
        );
      } else {
        await this.logToVisible(
          logTabId,
          "WARN",
          "⚠️ CSS may not be fully loaded",
          "CSS",
        );
      }
    } catch (error) {
      await this.logToVisible(
        logTabId,
        "ERR",
        `❌ CSS verification failed: ${error.message}`,
        "CSS",
      );
    }
  }

  async isInjected(tabId, type) {
    try {
      const result = await browser.tabs.sendMessage(tabId, { action: "ping" });
      return result?.type === type;
    } catch {
      return false;
    }
  }

  async waitForReady(tabId, type, timeout = 2000) {
    const start = Date.now();
    const interval = 200;
    const maxAttempts = Math.floor(timeout / interval);

    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isInjected(tabId, type)) {
        console.log(`✅ ${type} ready after ${Date.now() - start}ms`);
        return true;
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    console.warn(`⚠️ ${type} not ready after ${timeout}ms`);
    return false;
  }
}

// VibeReader v2.0 - Refactored Background Manager with Enhanced Subscriber Architecture

// === TAB LIFECYCLE MIDDLEWARE ===
class TabLifecycleMiddleware extends SubscriberMiddleware {
    constructor(tabManager) {
        super('TabLifecycle');
        this.tabManager = tabManager;
    }

    async process(eventContext) {
        const { event, data } = eventContext;

        // Auto-cleanup on tab close events
        if (event === 'tab-closed' || event === 'tab-removed') {
            await this.tabManager.cleanupTab(data.tabId);
        }

        // Auto-register new tabs
        if (event === 'tab-created' || event === 'tab-ready') {
            this.tabManager.registerTab(data.tabId, data);
        }

        return true;
    }
}

class TabMemoryMiddleware extends SubscriberMiddleware {
    constructor(maxTabs = 10) {
        super('TabMemory');
        this.maxTabs = maxTabs;
        this.tabAccessTimes = new Map();
    }

    async process(eventContext) {
        const { data } = eventContext;

        if (data.tabId) {
            this.tabAccessTimes.set(data.tabId, Date.now());

            // Cleanup old tabs if over limit
            if (this.tabAccessTimes.size > this.maxTabs) {
                const sortedTabs = Array.from(this.tabAccessTimes.entries())
                    .sort((a, b) => a[1] - b[1]);

                const toRemove = sortedTabs.slice(0, sortedTabs.length - this.maxTabs);
                for (const [tabId] of toRemove) {
                    eventContext.subscriber.emit('cleanup-tab', { tabId });
                    this.tabAccessTimes.delete(tabId);
                }
            }
        }

        return true;
    }
}

// === SELF-REPORTING TAB CLASS ===
class VibeTab extends SubscriberEnabledComponent {
    constructor(id, config = {}) {
        super();

        this.id = id;
        this.type = config.type; // 'visible' or 'hidden'
        this.url = config.url;
        this.parentId = config.parentId;
        this.state = 'initializing';
        this.injections = new Set();
        this.createdAt = Date.now();

        // Self-reporting status
        this.statusReporter = null;
        this.reportInterval = 5000; // Report every 5 seconds

        this.setupSelfReporting();
    }

    setupSelfReporting() {
        // Report creation immediately
        this.emit('tab-created', {
            tabId: this.id,
            type: this.type,
            url: this.url,
            parentId: this.parentId,
            timestamp: Date.now()
        });

        // Setup periodic status reporting
        this.statusReporter = setInterval(() => {
            this.reportStatus();
        }, this.reportInterval);

        // Subscribe to injection confirmations
        this.subscribe(`injection-confirmed-${this.id}`, (eventType, data) => {
            this.injections.add(data.script);
            this.state = 'active';

            this.emit('tab-injection-confirmed', {
                tabId: this.id,
                script: data.script,
                injections: Array.from(this.injections)
            });
        });
    }

    reportStatus() {
        const status = {
            tabId: this.id,
            type: this.type,
            state: this.state,
            injections: Array.from(this.injections),
            parentId: this.parentId,
            uptime: Date.now() - this.createdAt,
            memoryEstimate: this.estimateMemoryUsage()
        };

        this.emit('tab-status', status);
    }

    estimateMemoryUsage() {
        // Rough estimate based on injections and uptime
        const baseMemory = 5; // MB
        const perInjection = 2; // MB
        const timeMemory = Math.min(10, this.uptime / 60000); // Up to 10MB over time

        return baseMemory + (this.injections.size * perInjection) + timeMemory;
    }

    async inject(scriptType) {
        // Request injection through event
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Injection timeout for ${scriptType}`));
            }, 5000);

            const unsubscribe = this.subscribe(`injection-result-${this.id}-${scriptType}`,
                (eventType, result) => {
                    clearTimeout(timeout);
                    unsubscribe();

                    if (result.success) {
                        this.injections.add(scriptType);
                        resolve(result);
                    } else {
                        reject(new Error(result.error));
                    }
                }
            );

            this.emit('inject-script', {
                tabId: this.id,
                scriptType,
                timestamp: Date.now()
            });
        });
    }

    destroy() {
        if (this.statusReporter) {
            clearInterval(this.statusReporter);
        }

        this.emit('tab-destroyed', {
            tabId: this.id,
            lifetime: Date.now() - this.createdAt
        });

        super.destroy();
    }
}

// === REFACTORED HIDDEN TAB MANAGER ===
class HiddenTabManager extends SubscriberEnabledComponent {
    constructor() {
        super();

        // Use global MessageBroker singleton
        this.broker = window.__messageBroker;

        // Simple state management
        this.tabs = new Map(); // tabId -> VibeTab instance

        // Shared ScriptInjector (unchanged - it works well)
        this.injector = new ScriptInjector(this.logEvent.bind(this));

        // Setup middleware pipeline
        this.setupMiddleware();

        // Setup subscriptions
        this.setupSubscriptions();

        // Initialize browser listeners (async but we don't await in constructor)
        this.init().catch(error => {
            console.error('Failed to initialize HiddenTabManager:', error);
        });
    }

    setupMiddleware() {
        // Add lifecycle management middleware
        this.subscriberManager.addGlobalMiddleware(
            new TabLifecycleMiddleware(this)
        );

        // Add memory management middleware
        this.subscriberManager.addGlobalMiddleware(
            new TabMemoryMiddleware(10) // Max 10 tabs
        );

        // Add validation middleware for tab operations
        this.subscriberManager.addGlobalMiddleware(
            new TabValidationMiddleware()
        );
    }

    setupSubscriptions() {
        // === ACTIVATION FLOW ===
        this.subscribe('activate-vibe-mode',  async (eventType, data) => {
            const { tab } = data;

            await this.activate(tab);

        }, {
            id: 'activation-handler',
            maxRetries: 2,
            fallbackBehavior: 'fallback',
            fallbackCallback: async (eventType, data, error) => {
                // Cleanup on failure
                await this.cleanupTab(data.tab.id);
                return { success: false, error: error.message };
            }
        });

        // === DEACTIVATION FLOW ===
        this.subscribe('deactivate-vibe-mode', async (eventType, data) => {
            const { tabId } = data;
            await this.cleanupTab(tabId);
            return { success: true };
        }, {
            id: 'deactivation-handler'
        });

        // === INJECTION CONFIRMATIONS ===
        this.subscribe('css-injected', (eventType, data) => {
            const tab = this.tabs.get(data.tabId);
            if (tab) {
                tab.injections.add('css');
                this.emit(`injection-confirmed-${data.tabId}`, {
                    script: 'css',
                    status: 'confirmed'
                });
            }
        }, {
            id: 'css-confirmation',
            rateLimitMs: 100
        });

        // === TAB STATUS MONITORING ===
        this.subscribe('tab-status', (eventType, status) => {
            // Process status reports from tabs
            if (status.memoryEstimate > 50) {
                this.emit('memory-warning', {
                    tabId: status.tabId,
                    memory: status.memoryEstimate
                });
            }
        }, {
            id: 'status-monitor',
            debounceMs: 1000,
            transformations: [
                // Enrich status with additional context
                (data) => ({
                    data: {
                        ...data,
                        isHidden: this.tabs.get(data.tabId)?.type === 'hidden',
                        hasParent: !!this.tabs.get(data.tabId)?.parentId
                    }
                })
            ]
        });

        // === CONTENT FLOW ===
        this.subscribe('content-extracted', async (eventType, data) => {
            const { hiddenTabId, content, metadata } = data;

            // Find parent visible tab
            const hiddenTab = this.tabs.get(hiddenTabId);
            if (!hiddenTab) return;

            const visibleTabId = hiddenTab.parentId;
            if (!visibleTabId) return;

            // Send to visible tab
            this.emit('display-content', {
                tabId: visibleTabId,
                content,
                metadata,
                source: hiddenTabId
            });
        }, {
            id: 'content-router',
            priority: 10
        });

        // === SCRIPT INJECTION REQUESTS ===
        this.subscribe('inject-script', async (eventType, data) => {
            const { tabId, scriptType } = data;

            try {
                const _result = await this.injector.inject(tabId, scriptType);

                this.emit(`injection-result-${tabId}-${scriptType}`, {
                    success: true,
                    scriptType
                });

            } catch (error) {
                this.emit(`injection-result-${tabId}-${scriptType}`, {
                    success: false,
                    error: error.message
                });
            }
        }, {
            id: 'injection-handler',
            maxRetries: 3
        });

        // === MESSAGE HANDLERS (Only popup toggle remains) ===
        this.subscribe('message-toggleFromPopup', async (eventType, data) => {
            const { tabId } = data;
            
            console.log(`🔄 Toggle request from popup for tab ${tabId}`);
            dump(`🔄 Toggle request from popup for tab ${tabId}\n`);

            try {
                const tab = await browser.tabs.get(tabId);
                const isActive = this.tabs.has(tabId) && this.tabs.get(tabId).state === 'active';

                if (isActive) {
                    this.emit('deactivate-vibe-mode', { tabId });
                } else {
                    this.emit('activate-vibe-mode', { tab });
                }
            } catch (error) {
                console.error('Toggle from popup failed:', error);
                dump(`❌ Toggle from popup failed: ${error.message}\n`);
            }
        }, {
            id: 'popup-toggle-handler'
        });

        // Settings, debug, and status handlers moved to MessageBroker

        // === AUTO-ACTIVATION ===
        this.subscribe('tab-updated', async (eventType, data) => {
            const { tabId, tab } = data;
            console.log(`Auto-activation check for tab ${tabId}`);
            if (typeof dump !== 'undefined') {
                dump(`Auto-activation check for tab ${tabId}\n`);
            }

            try {
                const settings = await browser.storage.sync.get('vibeReaderSettings');
                // Default to true if not set (matching popup.js default)
                const autoActivate = settings.vibeReaderSettings?.autoActivate ?? true;
                console.log(`Auto-activate setting: ${autoActivate}`);
                if (typeof dump !== 'undefined') {
                    dump(`Auto-activate setting: ${autoActivate}\n`);
                }

                if (autoActivate && this.isValidUrl(tab.url)) {
                    console.log(`🔥 Auto-activating on ${tab.url}`);
                    if (typeof dump !== 'undefined') {
                        dump(`🔥 Auto-activating on ${tab.url}\n`);
                    }
                    await this.activate(tab)
                }
            } catch (error) {
                console.warn('Auto-activation check failed:', error);
            }
        }, {
            id: 'auto-activation-handler'
        });
    }

    async init() {
        console.log('HiddenTabManager.init() called - setting up listeners');
        if (typeof dump !== 'undefined') {
            dump('HiddenTabManager.init() called - setting up listeners\n');
        }
        
        // Check existing tabs after a short delay to let them load
        setTimeout(async () => {
            const existingTabs = await browser.tabs.query({});
            console.log(`Found ${existingTabs.length} existing tabs at startup`);
            if (typeof dump !== 'undefined') {
                dump(`Found ${existingTabs.length} existing tabs at startup\n`);
                existingTabs.forEach(tab => {
                    dump(`  Tab ${tab.id}: ${tab.url} (status: ${tab.status})\n`);
                    
                    // If tab is already complete, trigger tab-updated event
                    if (tab.status === 'complete' && tab.url && !tab.url.startsWith('about:')) {
                        console.log(`Triggering auto-activation check for already-loaded tab ${tab.id}: ${tab.url}`);
                        if (typeof dump !== 'undefined') {
                            dump(`Triggering auto-activation check for already-loaded tab ${tab.id}: ${tab.url}\n`);
                        }
                        this.emit('tab-updated', { tabId: tab.id, tab });
                    }
                });
            }
        }, 3000); // Wait 3 seconds for tabs to load
        
        // Browser action clicks
        browser.browserAction.onClicked.addListener((tab) => {
            const visibleTab = this.tabs.get(tab.id);
            const isActive = visibleTab?.state === 'active';

            if (isActive) {
                this.emit('deactivate-vibe-mode', { tabId: tab.id });
            } else {
                this.emit('activate-vibe-mode', { tab });
            }
        });

        // Tab removal
        browser.tabs.onRemoved.addListener((tabId) => {
            this.emit('tab-removed', { tabId });
        });

        // Tab updates
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                console.log(`Tab ${tabId} loaded: ${tab.url}`);
                if (typeof dump !== 'undefined') {
                    dump(`Tab ${tabId} loaded: ${tab.url}\n`);
                }
                this.emit('tab-updated', { tabId, tab });
            }
        });

        // Message routing
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const eventType = `message-${request.action}`;
            
            // Check for unhandled messages
            if (!this.subscriberManager.subscribers.has(eventType)) {
                console.warn(`⚠️ Unhandled message: ${request.action}`, request);
                if (typeof dump !== "undefined") {
                    dump(`⚠️ Unhandled message: ${request.action}\n`);
                }
            }
            
            this.emit(eventType, {
                ...request,
                sender,
                sendResponse
            });
            return true; // Keep channel open
        });
    }

    async activate(tab ) {
        // Check if already active
        if (this.tabs.has(tab.id) && this.tabs.get(tab.id).state === 'active') {
            return {success: true, already_active: true};
        }

        try {
            // Create visible tab wrapper
            const visibleTab = new VibeTab(tab.id, {
                type: 'visible',
                url: tab.url
            });
            this.tabs.set(tab.id, visibleTab);

            // Inject proxy controller
            await this.injector.inject(tab.id, 'proxy', tab.id);
            visibleTab.injections.add('proxy');

            // Create hidden tab
            const hiddenTabId = await this.createHiddenTab(tab.url, tab.id);
            const hiddenTab = new VibeTab(hiddenTabId, {
                type: 'hidden',
                url: tab.url,
                parentId: tab.id
            });
            this.tabs.set(hiddenTabId, hiddenTab);

            // Inject extractor
            await this.injector.inject(hiddenTabId, 'extractor');
            hiddenTab.injections.add('extractor');

            // Register the relationship with the broker
            this.broker.registerRoute(hiddenTabId, tab.id, 'hidden-visible');

            // Start extraction via broker (will be routed to hidden tab)
            await this.broker.send(hiddenTabId, 'start-extraction', {
                hiddenTabId,
                visibleTabId: tab.id,
                url: tab.url
            });

            return {success: true, hiddenTabId};

        } catch (error) {
            this.emit('activation-error', {tabId: tab.id, error: error.message});
            throw error;
        }
    }
    async createHiddenTab(url, _parentId) {
        const tab = await browser.tabs.create({
            url,
            active: false,
            pinned: true,
            index: 9999
        });

        return tab.id;
    }

    registerTab(tabId, data) {
        if (!this.tabs.has(tabId)) {
            const tab = new VibeTab(tabId, data);
            this.tabs.set(tabId, tab);
        }
    }

    isValidUrl(url) {
        if (!url) return false;
        
        const restricted = [
            'chrome://', 'chrome-extension://', 'about:',
            'edge://', 'opera://', 'vivaldi://', 'brave://',
            'moz-extension://'
        ];
        
        return !restricted.some(prefix => url.startsWith(prefix));
    }

    async cleanupTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Destroy VibeTab (stops self-reporting)
        tab.destroy();

        // Remove relationships
        if (tab.type === 'visible') {
            const hiddenTabId = this.relationships.get(tabId);
            if (hiddenTabId) {
                const hiddenTab = this.tabs.get(hiddenTabId);
                if (hiddenTab) {
                    hiddenTab.destroy();
                    await browser.tabs.remove(hiddenTabId);
                    this.tabs.delete(hiddenTabId);
                }

                this.tabs.delete(tabId);
                browser.browserAction.setBadgeText({ text: '', tabId });
            }
        }

        // Remove from registry
        this.tabs.delete(tabId);

        // Update badge
        browser.browserAction.setBadgeText({ text: '', tabId });
    }

    logEvent(level, message, category) {
        this.emit('log-event', { level, message, category });
    }

    getStatus() {
        const visibleTabs = Array.from(this.tabs.values())
            .filter(t => t.type === 'visible');

        const hiddenTabs = Array.from(this.tabs.values())
            .filter(t => t.type === 'hidden');

        // Build relationships array from VibeTab data
        const relationships = hiddenTabs.map(hidden => [
            hidden.parentId,  // visible tab ID
            hidden.id         // hidden tab ID
        ]);

        return {
            totalTabs: this.tabs.size,
            visibleTabs: visibleTabs.length,
            hiddenTabs: hiddenTabs.length,
            relationships,  // Computed, not stored
            memoryUsage: Array.from(this.tabs.values())
                .reduce((sum, tab) => sum + tab.estimateMemoryUsage(), 0)
        };
    }
}

// === VALIDATION MIDDLEWARE ===
class TabValidationMiddleware extends SubscriberMiddleware {
    constructor() {
        super('TabValidation');
    }

    async process(eventContext) {
        const { event, data } = eventContext;

        // Validate URLs before tab creation
        if (event === 'activate-vibe-mode') {
            const url = data.tab?.url;
            if (!this.isValidUrl(url)) {
                console.warn('Invalid URL for activation:', url);
                return false;
            }
        }

        return true;
    }

    isValidUrl(url) {
        if (!url) return false;

        const restricted = [
            'chrome://', 'chrome-extension://', 'about:',
            'edge://', 'opera://', 'vivaldi://', 'brave://'
        ];

        return !restricted.some(prefix => url.startsWith(prefix));
    }
}

// Initialize with singleton pattern
if (!window.__vibeReaderBackgroundManager) {
    console.log('🚀 VibeReader Background Manager Starting...');
    if (typeof dump !== 'undefined') {
        dump('🚀 VibeReader Background Manager Starting...\n');
    }
    window.__vibeReaderBackgroundManager = new HiddenTabManager();
    console.log('✅ VibeReader Background Manager Initialized');
    if (typeof dump !== 'undefined') {
        dump('✅ VibeReader Background Manager Initialized\n');
    }
}
