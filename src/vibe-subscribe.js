// Enhanced Subscription Architecture with Unified Pipeline Integration

// === BASE SUBSCRIBER CLASS ===
class VibeSubscribe {
    constructor(id, callback, options = {}) {
        this.id = id || `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.callback = callback;
        this.state = options.state || 'active'; // active, paused, disabled
        this.preferences = {
            eventTypes: options.eventTypes || [], // Empty = all events
            rateLimitMs: options.rateLimitMs || 0,
            debounceMs: options.debounceMs || 0,
            priority: options.priority || 0,
            maxRetries: options.maxRetries || 3,
            fallbackBehavior: options.fallbackBehavior || 'log', // log, ignore, fallback
            transformations: options.transformations || [],
            ...options.preferences
        };

        // Rate limiting state
        this.lastExecuted = 0;
        this.executionCount = 0;
        this.debounceTimer = null;
        this.pendingEvent = null;

        // Error recovery state
        this.failureCount = 0;
        this.isQuarantined = false;
        this.quarantineUntil = 0;

        // Middleware chain
        this.middlewares = [];
        this.setupDefaultMiddlewares();
    }

    setupDefaultMiddlewares() {
        // Built-in middleware stack
        this.middlewares = [
            new StateValidationMiddleware(),
            new RateLimitMiddleware(),
            new EventFilterMiddleware(),
            new TransformationMiddleware(),
            new ErrorRecoveryMiddleware(),
            new DeliveryMiddleware()
        ];
    }

    addMiddleware(middleware, position = -1) {
        if (position === -1) {
            this.middlewares.push(middleware);
        } else {
            this.middlewares.splice(position, 0, middleware);
        }
    }

    async process(event, data, context = {}) {
        const eventContext = {
            subscriber: this,
            event,
            data,
            context,
            timestamp: Date.now(),
            executionId: `exec-${Date.now()}-${Math.random().toString(36).slice(2)}`
        };

        // Run middleware chain
        try {
            for (const middleware of this.middlewares) {
                const result = await middleware.process(eventContext);
                if (result === false) {
                    // Middleware blocked execution
                    return { success: false, reason: `Blocked by ${middleware.constructor.name}` };
                }
                if (result && result.modified) {
                    eventContext.data = result.data;
                    eventContext.context = result.context || eventContext.context;
                }
            }

            return { success: true };

        } catch (error) {
            this.failureCount++;
            return { success: false, error: error.message };
        }
    }

    updateState(newState) {
        this.state = newState;
        if (newState === 'disabled') {
            this.clearPendingExecution();
        }
    }

    updatePreferences(newPreferences) {
        Object.assign(this.preferences, newPreferences);
    }

    clearPendingExecution() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
            this.pendingEvent = null;
        }
    }

    getStats() {
        return {
            id: this.id,
            state: this.state,
            executionCount: this.executionCount,
            failureCount: this.failureCount,
            isQuarantined: this.isQuarantined,
            preferences: { ...this.preferences }
        };
    }
}

// === SUBSCRIBER MIDDLEWARE CLASSES ===

class SubscriberMiddleware {
    constructor(name) {
        this.name = name;
    }

    process(_eventContext) {
        // Override in subclasses
        return true;
    }
}

class StateValidationMiddleware extends SubscriberMiddleware {
    constructor() {
        super('StateValidation');
    }

    process(eventContext) {
        const subscriber = eventContext.subscriber;

        if (subscriber.state === 'disabled') {
            return false;
        }

        if (subscriber.state === 'paused') {
            return false;
        }

        if (subscriber.isQuarantined && Date.now() < subscriber.quarantineUntil) {
            return false;
        }

        // Clear quarantine if expired
        if (subscriber.isQuarantined && Date.now() >= subscriber.quarantineUntil) {
            subscriber.isQuarantined = false;
            subscriber.failureCount = 0;
        }

        return true;
    }
}

class RateLimitMiddleware extends SubscriberMiddleware {
    constructor() {
        super('RateLimit');
    }

    process(eventContext) {
        const subscriber = eventContext.subscriber;
        const now = Date.now();

        // Rate limiting
        if (subscriber.preferences.rateLimitMs > 0) {
            const timeSinceLastExecution = now - subscriber.lastExecuted;
            if (timeSinceLastExecution < subscriber.preferences.rateLimitMs) {
                return false; // Rate limited
            }
        }

        // Debouncing
        if (subscriber.preferences.debounceMs > 0) {
            return new Promise((resolve) => {
                subscriber.clearPendingExecution();
                subscriber.pendingEvent = eventContext;

                subscriber.debounceTimer = setTimeout(() => {
                    subscriber.lastExecuted = Date.now();
                    subscriber.executionCount++;
                    resolve(true);
                }, subscriber.preferences.debounceMs);
            });
        }

        subscriber.lastExecuted = now;
        subscriber.executionCount++;
        return true;
    }
}

class EventFilterMiddleware extends SubscriberMiddleware {
    constructor() {
        super('EventFilter');
    }

    process(eventContext) {
        const subscriber = eventContext.subscriber;
        const eventTypes = subscriber.preferences.eventTypes;

        // If no event type filter, allow all events
        if (!eventTypes || eventTypes.length === 0) {
            return true;
        }

        // Check if event type matches filter
        if (eventTypes.includes(eventContext.event)) {
            return true;
        }

        // Check for pattern matching
        const eventMatches = eventTypes.some(pattern => {
            if (typeof pattern === 'string') {
                return eventContext.event.includes(pattern);
            }
            if (pattern instanceof RegExp) {
                return pattern.test(eventContext.event);
            }
            return false;
        });

        return eventMatches;
    }
}

class TransformationMiddleware extends SubscriberMiddleware {
    constructor() {
        super('Transformation');
    }

    async process(eventContext) {
        const subscriber = eventContext.subscriber;
        const transformations = subscriber.preferences.transformations;

        if (!transformations || transformations.length === 0) {
            return true;
        }

        let transformedData = eventContext.data;
        let transformedContext = eventContext.context;

        for (const transformation of transformations) {
            try {
                if (typeof transformation === 'function') {
                    const result = await transformation(transformedData, transformedContext, eventContext);
                    if (result && typeof result === 'object') {
                        transformedData = result.data !== undefined ? result.data : transformedData;
                        transformedContext = result.context !== undefined ? result.context : transformedContext;
                    }
                } else if (transformation.transform && typeof transformation.transform === 'function') {
                    const result = await transformation.transform(transformedData, transformedContext, eventContext);
                    if (result) {
                        transformedData = result.data !== undefined ? result.data : transformedData;
                        transformedContext = result.context !== undefined ? result.context : transformedContext;
                    }
                }
            } catch (error) {
                console.warn(`Transformation error in subscriber ${subscriber.id}:`, error);
                // Continue with other transformations
            }
        }

        return {
            modified: true,
            data: transformedData,
            context: transformedContext
        };
    }
}

class ErrorRecoveryMiddleware extends SubscriberMiddleware {
    constructor() {
        super('ErrorRecovery');
    }

    async process(eventContext) {
        const subscriber = eventContext.subscriber;

        // Execute callback with retry logic
        let lastError;
        let attempts = 0;
        const maxRetries = subscriber.preferences.maxRetries;

        while (attempts <= maxRetries) {
            try {
                await subscriber.callback(eventContext.event, eventContext.data, eventContext.context);

                // Success - reset failure count
                subscriber.failureCount = 0;
                return true;

            } catch (error) {
                lastError = error;
                attempts++;

                if (attempts <= maxRetries) {
                    // Wait before retry with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Max retries exceeded
                    subscriber.failureCount++;

                    // Quarantine subscriber if too many failures
                    if (subscriber.failureCount >= 5) {
                        subscriber.isQuarantined = true;
                        subscriber.quarantineUntil = Date.now() + (60000 * Math.pow(2, Math.min(subscriber.failureCount - 5, 6))); // Up to 64 minutes
                    }

                    // Handle fallback behavior
                    switch (subscriber.preferences.fallbackBehavior) {
                        case 'ignore':
                            return true; // Pretend success
                        case 'fallback':
                            if (subscriber.preferences.fallbackCallback) {
                                try {
                                    await subscriber.preferences.fallbackCallback(eventContext.event, eventContext.data, lastError);
                                    return true;
                                } catch (fallbackError) {
                                    console.error(`Fallback failed for subscriber ${subscriber.id}:`, fallbackError);
                                }
                            }
                            return false;
                        case 'log':
                        default:
                            console.error(`Subscriber ${subscriber.id} failed after ${maxRetries} retries:`, lastError);
                            return false;
                    }
                }
            }
        }
        
        // Should not reach here, but default return
        return false;
    }
}

class DeliveryMiddleware extends SubscriberMiddleware {
    constructor() {
        super('Delivery');
    }

    process(_eventContext) {
        // This middleware handles the actual callback execution
        // Previous middleware (ErrorRecoveryMiddleware) already handled this
        // This is a placeholder for additional delivery logic if needed
        return true;
    }
}

// === ENHANCED SUBSCRIBER MANAGER ===
class SubscriberManager {
    constructor() {
        this.subscribers = new Map();
        this.globalMiddlewares = [];
        this.eventStats = new Map();
        this.isDestroyed = false;

        // Integration with unified pipeline (optional components - commented out for now)
        // this.contentTransformer = new ContentTransformer();
        // this.pipelineProcessor = new PipelineProcessor();
    }

    subscribe(eventType, callback, options = {}) {
        if (this.isDestroyed) {
            throw new Error('SubscriberManager has been destroyed');
        }

        const subscriber = new VibeSubscribe(options.id, callback, options);

        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }

        this.subscribers.get(eventType).add(subscriber);

        // Add global middlewares
        this.globalMiddlewares.forEach(middleware => {
            subscriber.addMiddleware(middleware);
        });

        console.log(`Subscriber ${subscriber.id} registered for ${eventType}`);
        // Debug mode enabled by default for development
        if (typeof dump !== "undefined") {
            dump(`Subscriber ${subscriber.id} registered for ${eventType}\n`);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(eventType, subscriber.id);
    }

    unsubscribe(eventType, subscriberId) {
        const subscribers = this.subscribers.get(eventType);
        if (!subscribers) return false;

        for (const subscriber of subscribers) {
            if (subscriber.id === subscriberId) {
                subscriber.clearPendingExecution();
                subscribers.delete(subscriber);

                if (subscribers.size === 0) {
                    this.subscribers.delete(eventType);
                }

                console.log(`Subscriber ${subscriberId} unsubscribed from ${eventType}`);
                return true;
            }
        }

        return false;
    }

    addGlobalMiddleware(middleware) {
        this.globalMiddlewares.push(middleware);

        // Add to existing subscribers
        this.subscribers.forEach(subscriberSet => {
            subscriberSet.forEach(subscriber => {
                subscriber.addMiddleware(middleware);
            });
        });
    }

    async emit(eventType, data, context = {}) {
        if (this.isDestroyed) return { eventType, subscriberCount: 0, successCount: 0, failureCount: 0 };

        const subscribers = this.subscribers.get(eventType) || new Set();
        const globalSubscribers = this.subscribers.get('*') || new Set(); // Wildcard subscribers

        const allSubscribers = [...subscribers, ...globalSubscribers];

        if (allSubscribers.length === 0) return { eventType, subscriberCount: 0, successCount: 0, failureCount: 0 };

        // Update event stats
        if (!this.eventStats.has(eventType)) {
            this.eventStats.set(eventType, { count: 0, lastEmitted: 0 });
        }
        const stats = this.eventStats.get(eventType);
        stats.count++;
        stats.lastEmitted = Date.now();

        // Sort subscribers by priority
        const sortedSubscribers = allSubscribers.sort((a, b) =>
            (b.preferences.priority || 0) - (a.preferences.priority || 0)
        );

        // Process subscribers in parallel (but respecting individual middleware chains)
        const results = await Promise.allSettled(
            sortedSubscribers.map(subscriber =>
                this.processSubscriber(subscriber, eventType, data, context)
            )
        );

        // Log failures
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`Subscriber ${sortedSubscribers[index].id} failed:`, result.reason);
            }
        });

        return {
            eventType,
            subscriberCount: allSubscribers.length,
            successCount: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
            failureCount: results.filter(r => r.status === 'rejected' || !r.value.success).length
        };
    }

    async processSubscriber(subscriber, eventType, data, context) {
        // Unified pipeline integration for content transformation
        let processedData = data;

        if (context.useUnifiedPipeline && typeof data === 'string' && data.includes('<')) {
            // Transform HTML content through unified pipeline
            const hast = this.contentTransformer.htmlToHast(data);
            const processedHast = await this.pipelineProcessor.process(hast);
            processedData = this.contentTransformer.hastToHtml(processedHast.tree);
        }

        return await subscriber.process(eventType, processedData, context);
    }

    // Subscriber management methods
    getSubscriber(eventType, subscriberId) {
        const subscribers = this.subscribers.get(eventType);
        if (!subscribers) return null;

        for (const subscriber of subscribers) {
            if (subscriber.id === subscriberId) {
                return subscriber;
            }
        }
        return null;
    }

    updateSubscriber(eventType, subscriberId, updates) {
        const subscriber = this.getSubscriber(eventType, subscriberId);
        if (!subscriber) return false;

        if (updates.state) {
            subscriber.updateState(updates.state);
        }
        if (updates.preferences) {
            subscriber.updatePreferences(updates.preferences);
        }

        return true;
    }

    getSubscriberStats() {
        const stats = {
            totalSubscribers: 0,
            byEventType: {},
            byState: { active: 0, paused: 0, disabled: 0 },
            quarantined: 0
        };

        this.subscribers.forEach((subscriberSet, eventType) => {
            stats.byEventType[eventType] = {
                count: subscriberSet.size,
                subscribers: []
            };

            subscriberSet.forEach(subscriber => {
                stats.totalSubscribers++;
                stats.byState[subscriber.state] = (stats.byState[subscriber.state] || 0) + 1;

                if (subscriber.isQuarantined) {
                    stats.quarantined++;
                }

                stats.byEventType[eventType].subscribers.push(subscriber.getStats());
            });
        });

        return stats;
    }

    getEventStats() {
        const stats = {};
        this.eventStats.forEach((eventStat, eventType) => {
            stats[eventType] = { ...eventStat };
        });
        return stats;
    }

    // Pipeline integration methods
    addPipelineTransform(transform, options = {}) {
        this.pipelineProcessor.use(transform, options);
    }

    async processContent(htmlContent, transforms = []) {
        const hast = this.contentTransformer.htmlToHast(htmlContent);

        // Temporarily add transforms
        const originalTransforms = [...this.pipelineProcessor.transforms];
        transforms.forEach(transform => this.pipelineProcessor.use(transform));

        try {
            const result = await this.pipelineProcessor.process(hast);
            return {
                html: this.contentTransformer.hastToHtml(result.tree),
                context: result.context
            };
        } finally {
            // Restore original transforms
            this.pipelineProcessor.transforms = originalTransforms;
        }
    }

    // Cleanup and memory management
    cleanup() {
        // Clear all pending timers
        this.subscribers.forEach(subscriberSet => {
            subscriberSet.forEach(subscriber => {
                subscriber.clearPendingExecution();
            });
        });

        console.log('SubscriberManager cleanup completed');
    }

    destroy() {
        this.cleanup();
        this.subscribers.clear();
        this.globalMiddlewares = [];
        this.eventStats.clear();
        this.isDestroyed = true;

        console.log('SubscriberManager destroyed');
    }
}

// === USAGE EXAMPLE AND BASE CLASSES ===

// Base class for components that use subscribers
class SubscriberEnabledComponent {
    constructor() {
        this.subscriberManager = new SubscriberManager();
        this.subscriptions = [];
    }

    // Convenience method for subscribing with automatic cleanup tracking
    subscribe(eventType, callback, options = {}) {
        const unsubscribe = this.subscriberManager.subscribe(eventType, callback, options);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    // Enhanced subscription with built-in transformations
    subscribeWithTransforms(eventType, callback, transforms = [], options = {}) {
        const enhancedOptions = {
            ...options,
            transformations: [
                ...transforms,
                ...(options.transformations || [])
            ]
        };

        return this.subscribe(eventType, callback, enhancedOptions);
    }

    // Subscribe to content events with unified pipeline processing
    subscribeToContent(eventType, callback, pipelineTransforms = [], options = {}) {
        return this.subscribeWithTransforms(
            eventType,
            callback,
            [
                // Built-in content transformation
                async (data, context, _eventContext) => {
                    if (typeof data === 'string' && data.includes('<')) {
                        const processed = await this.subscriberManager.processContent(data, pipelineTransforms);
                        return {
                            data: processed.html,
                            context: { ...context, ...processed.context }
                        };
                    }
                    return { data, context };
                }
            ],
            options
        );
    }

    // Emit events through the subscriber manager
    emit(eventType, data, context = {}) {
        return this.subscriberManager.emit(eventType, data, context);
    }

    // Cleanup all subscriptions
    deactivate() {
        this.subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('Error during subscription cleanup:', error);
            }
        });
        this.subscriptions = [];

        if (this.subscriberManager) {
            this.subscriberManager.cleanup();
        }
    }

    destroy() {
        this.deactivate();

        if (this.subscriberManager) {
            this.subscriberManager.destroy();
            this.subscriberManager = null;
        }
    }

    // Utility methods for subscriber management
    getSubscriberStats() {
        return this.subscriberManager ? this.subscriberManager.getSubscriberStats() : {};
    }

    getEventStats() {
        return this.subscriberManager ? this.subscriberManager.getEventStats() : {};
    }
}

// Export classes for use in other modules
if (typeof window !== 'undefined') {
    window.VibeSubscriber = VibeSubscribe;
    window.SubscriberManager = SubscriberManager;
    window.SubscriberEnabledComponent = SubscriberEnabledComponent;
    window.SubscriberMiddleware = SubscriberMiddleware;
}