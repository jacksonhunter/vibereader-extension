// VibeReader v2.5 - Enhanced Background Orchestrator
// background-enhanced.js - Smart controller with cross-context routing and lifecycle management

// firefox-polyfill.js - Add to background-enhanced.js before ScriptInjector class

/*// ===== FIREFOX COMPATIBILITY LAYER =====
(function() {
    // Detect Firefox version
    const isFirefox = typeof browser !== 'undefined' && browser.runtime?.getURL;
    const firefoxVersion = isFirefox ? parseInt(navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') : 0;

    console.log(`🦊 Firefox detected: ${isFirefox}, Version: ${firefoxVersion}`);

    // Polyfill browser.scripting for Firefox < 102
    if (isFirefox && firefoxVersion < 102 && !browser.scripting) {
        console.log('📦 Installing browser.scripting polyfill for Firefox < 102');

        browser.scripting = {
            executeScript: async function(options) {
                const { target, files, func, args } = options;

                if (!target?.tabId) {
                    throw new Error('target.tabId is required');
                }

                try {
                    if (files && files.length > 0) {
                        // Execute files sequentially
                        const results = [];
                        for (const file of files) {
                            const result = await browser.tabs.executeScript(target.tabId, {
                                file: file,
                                allFrames: target.allFrames || false,
                                frameId: target.frameId || 0,
                                runAt: options.runAt || 'document_idle'
                            });
                            results.push(result);
                        }
                        return results;
                    } else if (func) {
                        // Execute function
                        const code = args ? `(${func.toString()})(${JSON.stringify(args)})` : `(${func.toString()})()`;
                        return await browser.tabs.executeScript(target.tabId, {
                            code: code,
                            allFrames: target.allFrames || false,
                            frameId: target.frameId || 0,
                            runAt: options.runAt || 'document_idle'
                        });
                    }

                    throw new Error('Either files or func must be specified');
                } catch (error) {
                    console.error('Polyfill executeScript error:', error);
                    throw error;
                }
            },

            insertCSS: async function(options) {
                const { target, css, files } = options;

                if (!target?.tabId) {
                    throw new Error('target.tabId is required');
                }

                try {
                    if (files && files.length > 0) {
                        // Insert CSS files
                        const results = [];
                        for (const file of files) {
                            const result = await browser.tabs.insertCSS(target.tabId, {
                                file: file,
                                allFrames: target.allFrames || false,
                                frameId: target.frameId || 0,
                                runAt: options.runAt || 'document_idle'
                            });
                            results.push(result);
                        }
                        return results;
                    } else if (css) {
                        // Insert CSS string
                        return await browser.tabs.insertCSS(target.tabId, {
                            code: css,
                            allFrames: target.allFrames || false,
                            frameId: target.frameId || 0,
                            runAt: options.runAt || 'document_idle'
                        });
                    }

                    throw new Error('Either css or files must be specified');
                } catch (error) {
                    console.error('Polyfill insertCSS error:', error);
                    throw error;
                }
            },

            removeCSS: async function(options) {
                // Firefox doesn't have removeCSS in older versions
                // Workaround: inject CSS that overrides previous styles
                const { target, css, files } = options;

                console.warn('removeCSS is not supported in Firefox < 102, attempting workaround');

                if (css) {
                    // Create override CSS
                    const overrideCSS = css.replace(/([^{]+){([^}]+)}/g, '$1{ /!* removed *!/ }');
                    return await browser.scripting.insertCSS({
                        target,
                        css: overrideCSS
                    });
                }

                return { success: false, error: 'removeCSS not fully supported' };
            }
        };

        console.log('✅ browser.scripting polyfill installed');
    }

    // Additional Firefox-specific fixes
    if (isFirefox) {
        // Handle manifest v2 vs v3 differences
        if (!browser.action && browser.browserAction) {
            browser.action = browser.browserAction;
            console.log('✅ browser.action polyfilled to browser.browserAction');
        }

        // Handle storage API differences
        if (browser.storage && !browser.storage.session && firefoxVersion < 115) {
            // Polyfill session storage with local storage
            browser.storage.session = {
                get: browser.storage.local.get.bind(browser.storage.local),
                set: browser.storage.local.set.bind(browser.storage.local),
                remove: browser.storage.local.remove.bind(browser.storage.local),
                clear: browser.storage.local.clear.bind(browser.storage.local)
            };
            console.log('✅ browser.storage.session polyfilled to local storage');
        }
    }
})();

// Enhanced ScriptInjector with Firefox compatibility
class FirefoxCompatibleScriptInjector extends SubscriberEnabledComponent {
    constructor() {
        super();

        this.injectionTracking = new Map();
        this.injectionStrategies = new Map();
        this.isFirefox = typeof browser !== 'undefined' && browser.runtime?.getURL;
        this.firefoxVersion = this.detectFirefoxVersion();

        this.setupInjectionStrategies();
        console.log(`💉 Firefox-compatible ScriptInjector initialized (Firefox: ${this.isFirefox}, Version: ${this.firefoxVersion})`);
    }

    detectFirefoxVersion() {
        if (!this.isFirefox) return 0;
        return parseInt(navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || '0');
    }

    async inject(tabId, scriptType, context = {}) {
        const injectionId = `inj-${scriptType}-${tabId}-${Date.now()}`;
        const startTime = Date.now();

        try {
            const strategy = this.injectionStrategies.get(scriptType);
            if (!strategy) {
                throw new Error(`No injection strategy found for ${scriptType}`);
            }

            console.log(`💉 Injecting ${scriptType} into tab ${tabId} (Firefox: ${this.isFirefox})`);

            // Use appropriate injection method
            if (browser.scripting) {
                // Use modern API (native or polyfilled)
                await this.injectWithScriptingAPI(tabId, strategy.files);
            } else {
                // Fallback for very old browsers
                await this.injectWithLegacyAPI(tabId, strategy.files);
            }

            const injectionTime = Date.now() - startTime;

            // Track successful injection
            this.injectionTracking.set(injectionId, {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                success: true,
                method: browser.scripting ? 'scripting' : 'legacy',
                timestamp: Date.now()
            });

            this.emit('injection-completed', {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                success: true,
                firefox: this.isFirefox,
                firefoxVersion: this.firefoxVersion
            });

            console.log(`✅ Injection ${scriptType} completed in ${injectionTime}ms for tab ${tabId}`);
            return { success: true, injectionTime, injectionId };

        } catch (error) {
            const injectionTime = Date.now() - startTime;

            // Track failed injection
            this.injectionTracking.set(injectionId, {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                success: false,
                error: error.message,
                timestamp: Date.now()
            });

            this.emit('injection-failed', {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                error: error.message
            });

            console.error(`❌ Injection ${scriptType} failed for tab ${tabId}:`, error);
            throw error;
        }
    }

    async injectWithScriptingAPI(tabId, files) {
        for (const file of files) {
            await browser.scripting.executeScript({
                target: { tabId },
                files: [file]
            });
            console.log(`📄 Injected via scripting API: ${file}`);
        }
    }

    async injectWithLegacyAPI(tabId, files) {
        for (const file of files) {
            await browser.tabs.executeScript(tabId, {
                file: file,
                runAt: 'document_idle'
            });
            console.log(`📄 Injected via legacy API: ${file}`);
        }
    }

    setupInjectionStrategies() {
        // Same strategies as before
        this.injectionStrategies.set('proxy', {
            files: [
                'src/vibe-subscribe.js',
                'src/vibe-utils.js',
                'src/proxy-controller.js'
            ],
            description: 'Proxy controller for visible tab'
        });

        this.injectionStrategies.set('extractor', {
            files: [
                'src/vibe-subscribe.js',
                'src/vibe-utils.js',
                'src/unified-vibe.js',
                'src/stealth-extractor.js'
            ],
            description: 'Stealth extractor for hidden tab'
        });

        this.injectionStrategies.set('debug', {
            files: [
                'src/vibe-subscribe.js',
                'src/vibe-utils.js',
                'src/debug-tools.js'
            ],
            description: 'Debug tools'
        });
    }
}*/

// ===== SMART TAB CLASS =====
class SmartTab extends SubscriberEnabledComponent {
    constructor(tabId, config = {}) {
        super();

        this.tabId = tabId;
        this.type = config.type || 'unknown';
        this.sessionId = config.sessionId;
        this.parentTabId = config.parentTabId;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();

        // Lifecycle state
        this.state = 'initializing';
        this.injections = new Set();
        this.capabilities = new Set();
        this.errors = [];

        // Performance metrics
        this.metrics = {
            messageCount: 0,
            injectionTime: null,
            activationTime: null,
            memoryUsage: 0
        };

        this.initializeSmartTab();
    }

    initializeSmartTab() {
        // Subscribe to own lifecycle events
        this.subscribe(`tab-${this.tabId}-state-change`, (eventType, data) => {
            this.handleStateChange(data);
        });

        this.subscribe(`tab-${this.tabId}-error`, (eventType, data) => {
            this.handleError(data);
        });

        this.subscribe(`tab-${this.tabId}-message-sent`, (eventType, data) => {
            this.metrics.messageCount++;
            this.lastActivity = Date.now();
        });

        // FIX: Emit initial subscription announcement
        this.emit('smart-tab-initialized', {
            tabId: this.tabId,
            type: this.type,
            sessionId: this.sessionId,
            parentTabId: this.parentTabId,
            timestamp: Date.now()
        });

        // FIX: Subscribe to global smart tab events
        this.subscribe('smart-tab-command', (eventType, data) => {
            if (data.tabId === this.tabId || data.tabId === '*') {
                this.handleSmartTabCommand(data);
            }
        });
        // Start lifecycle monitoring
        this.startLifecycleMonitoring();

        console.log(`🌟 SmartTab ${this.tabId} (${this.type}) initialized`);
    }
    handleSmartTabCommand(data) {
        const { command, params } = data;

        switch (command) {
            case 'health-check':
                this.performHealthCheck();
                break;
            case 'get-status':
                this.emit('smart-tab-status', this.getStatus());
                break;
            case 'update-state':
                this.setState(params.state);
                break;
        }
    }
    startLifecycleMonitoring() {
        // Periodic health check
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Every 30 seconds

        // Memory usage estimation
        this.memoryCheckInterval = setInterval(() => {
            this.estimateMemoryUsage();
        }, 60000); // Every minute
    }

    async performHealthCheck() {
        try {
            // Check if tab still exists
            const tab = await browser.tabs.get(this.tabId);

            if (!tab) {
                this.setState('destroyed');
                return;
            }

            // Try to ping the tab
            try {
                await browser.tabs.sendMessage(this.tabId, {
                    action: 'ping',
                    timestamp: Date.now()
                });

                this.setState('healthy');

            } catch (error) {
                // Tab might be loading or script not injected yet
                if (this.state === 'active') {
                    this.setState('unresponsive');
                }
            }

        } catch (error) {
            // Tab was closed or destroyed
            this.setState('destroyed');
        }
    }

    estimateMemoryUsage() {
        // Simple memory estimation based on activity
        const baseMemory = 5; // Base MB
        const messageMemory = this.metrics.messageCount * 0.001; // Estimate KB per message
        const injectionMemory = this.injections.size * 2; // Estimate MB per injection

        this.metrics.memoryUsage = baseMemory + messageMemory + injectionMemory;

        // Emit memory metrics
        this.emit('tab-memory-updated', {
            tabId: this.tabId,
            estimatedMemoryMB: this.metrics.memoryUsage
        });
    }

    async inject(scriptType, context = {}) {
        const startTime = Date.now();

        try {
            this.setState('injecting');

            // Use global script injector if available
            if (window.ScriptInjector) {
                const injector = new window.ScriptInjector();
                await injector.inject(this.tabId, scriptType, {
                    ...context,
                    smartTab: this.tabId,
                    sessionId: this.sessionId
                });
            }

            this.injections.add(scriptType);
            this.capabilities.add(scriptType);
            this.metrics.injectionTime = Date.now() - startTime;

            this.setState('injected');

            this.emit('tab-injection-complete', {
                tabId: this.tabId,
                scriptType,
                injectionTime: this.metrics.injectionTime
            });

            console.log(`💉 SmartTab ${this.tabId} injected with ${scriptType} in ${this.metrics.injectionTime}ms`);

            return { success: true, injectionTime: this.metrics.injectionTime };

        } catch (error) {
            this.handleError({ type: 'injection', scriptType, error: error.message });
            throw error;
        }
    }

    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.lastActivity = Date.now();

        console.log(`📊 SmartTab ${this.tabId} state: ${oldState} → ${newState}`);

        // Emit state change
        this.emit(`tab-${this.tabId}-state-change`, {
            tabId: this.tabId,
            oldState,
            newState,
            timestamp: Date.now()
        });

        // Handle state-specific actions
        switch (newState) {
            case 'destroyed':
                this.cleanup();
                break;
            case 'error':
                this.handleErrorState();
                break;
        }
    }

    handleStateChange(data) {
        const { newState } = data;

        // Update internal state based on external events
        if (newState === 'active' && !this.metrics.activationTime) {
            this.metrics.activationTime = Date.now() - this.createdAt;
        }
    }

    handleError(error) {
        this.errors.push({
            ...error,
            timestamp: Date.now()
        });

        console.error(`❌ SmartTab ${this.tabId} error:`, error);

        // Keep error history manageable
        if (this.errors.length > 50) {
            this.errors = this.errors.slice(-25);
        }

        this.setState('error');
    }

    handleErrorState() {
        // Implement error recovery logic
        const recentErrors = this.errors.filter(
            err => Date.now() - err.timestamp < 60000 // Last minute
        ).length;

        if (recentErrors >= 3) {
            console.warn(`⚠️ SmartTab ${this.tabId} has ${recentErrors} recent errors, marking as problematic`);
            this.capabilities.clear(); // Reset capabilities
        }
    }

    async sendMessage(action, data) {
        try {
            const response = await browser.tabs.sendMessage(this.tabId, {
                action,
                data,
                timestamp: Date.now(),
                source: 'smart-tab'
            });

            this.emit(`tab-${this.tabId}-message-sent`, { action, success: true });
            return response;

        } catch (error) {
            this.emit(`tab-${this.tabId}-message-sent`, { action, success: false, error: error.message });
            throw error;
        }
    }

    cleanup() {
        // Clear intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
        }

        // Emit cleanup event
        this.emit('smart-tab-cleanup', {
            tabId: this.tabId,
            sessionId: this.sessionId,
            lifetime: Date.now() - this.createdAt,
            finalMetrics: this.metrics
        });

        console.log(`🧹 SmartTab ${this.tabId} cleaned up after ${Date.now() - this.createdAt}ms lifetime`);
    }

    getStatus() {
        return {
            tabId: this.tabId,
            type: this.type,
            state: this.state,
            sessionId: this.sessionId,
            parentTabId: this.parentTabId,
            lifetime: Date.now() - this.createdAt,
            lastActivity: this.lastActivity,
            injections: Array.from(this.injections),
            capabilities: Array.from(this.capabilities),
            metrics: { ...this.metrics },
            errorCount: this.errors.length,
            recentErrors: this.errors.filter(err => Date.now() - err.timestamp < 300000) // Last 5 minutes
        };
    }
}

// ===== SCRIPT INJECTOR =====
class ScriptInjector extends SubscriberEnabledComponent {
    constructor() {
        super();

        this.injectionTracking = new Map();     // Track all injections
        this.injectionStrategies = new Map();   // Injection strategies per script type

        this.setupInjectionStrategies();
        console.log(`💉 ScriptInjector initialized in ${this.origin} context`);
    }

    setupInjectionStrategies() {
        this.injectionStrategies.set('proxy', {
            files: [
                'src/vibe-subscribe.js',
                'src/vibe-utils.js',
                'src/proxy-controller.js'
            ],
            description: 'Proxy controller for visible tab'
        });

        this.injectionStrategies.set('extractor', {
            files: [
                'src/vibe-subscribe.js',
                'src/vibe-utils.js',
                'src/unified-vibe.js',
                'src/stealth-extractor.js'
            ],
            description: 'Stealth extractor for hidden tab'
        });

        this.injectionStrategies.set('debug', {
            files: [
                'src/vibe-subscribe.js',
                'src/vibe-utils.js',
                'src/debug-tools.js'
            ],
            description: 'Debug tools'
        });
    }

    async inject(tabId, scriptType, context = {}) {
        const injectionId = `inj-${scriptType}-${tabId}-${Date.now()}`;
        const startTime = Date.now();

        try {
            const strategy = this.injectionStrategies.get(scriptType);
            if (!strategy) {
                throw new Error(`No injection strategy found for ${scriptType}`);
            }

            console.log(`💉 Injecting ${scriptType} into tab ${tabId}`);

            // Inject files sequentially using browser.scripting API
            for (const file of strategy.files) {
                await browser.scripting.executeScript({
                    target: { tabId },
                    files: [file]
                });
                console.log(`📁 Injected: ${file}`);
            }

            const injectionTime = Date.now() - startTime;

            // Track successful injection
            this.injectionTracking.set(injectionId, {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                success: true,
                timestamp: Date.now()
            });

            this.emit('injection-completed', {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                success: true
            });

            console.log(`✅ Injection ${scriptType} completed in ${injectionTime}ms for tab ${tabId}`);

            return { success: true, injectionTime, injectionId };

        } catch (error) {
            const injectionTime = Date.now() - startTime;

            // Track failed injection
            this.injectionTracking.set(injectionId, {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                success: false,
                error: error.message,
                timestamp: Date.now()
            });

            this.emit('injection-failed', {
                injectionId,
                tabId,
                scriptType,
                injectionTime,
                error: error.message
            });

            console.error(`❌ Injection ${scriptType} failed for tab ${tabId}:`, error);
            throw error;
        }
    }

    getInjectionStats() {
        const completedInjections = Array.from(this.injectionTracking.values())
            .filter(inj => inj.success);

        const failedInjections = Array.from(this.injectionTracking.values())
            .filter(inj => !inj.success);

        return {
            totalInjections: this.injectionTracking.size,
            completed: completedInjections.length,
            failed: failedInjections.length,
            averageInjectionTime: completedInjections.length > 0 ?
                completedInjections.reduce((sum, inj) => sum + inj.injectionTime, 0) / completedInjections.length : 0,
            strategies: Array.from(this.injectionStrategies.keys()),
            recentInjections: Array.from(this.injectionTracking.values()).slice(-10)
        };
    }
}

// ===== ENHANCED BACKGROUND ORCHESTRATOR =====
class BackgroundOrchestrator extends SubscriberEnabledComponent {
    constructor() {
        super();

        // Core state management
        this.smartTabs = new Map();                    // SmartTab instances
        this.activeSessions = new Map();               // Active vibe sessions
        this.persistentStorage = new Map();            // Persistent data storage
        this.interfaceStates = new Map();              // Interface state tracking

        // Background-specific capabilities
        this.messageRouter = new Map();                // Message routing rules
        this.popupEventHandlers = new Map();           // Popup event handlers
        this.storageEventHandlers = new Map();         // Storage change handlers

        // Performance tracking
        this.orchestrationMetrics = {
            sessionsCreated: 0,
            messagesRouted: 0,
            storageOperations: 0,
            popupInteractions: 0
        };

        this.initializeOrchestrator();
    }

    initializeOrchestrator() {
        this.setupSubscriptions();
        this.setupBrowserIntegration();
        this.setupStorageManagement();
        this.initializePopupHandling();

        console.log('🎭 Background Orchestrator initialized');
    }

    setupSubscriptions() {
        // Session management
        this.subscribe('create-vibe-session', async (eventType, data) => {
            return await this.createVibeSession(data);
        });

        this.subscribe('destroy-vibe-session', async (eventType, data) => {
            return await this.destroyVibeSession(data.sessionId);
        });

        // Cross-context message routing
        this.subscribe('route-message', async (eventType, data) => {
            return await this.routeMessage(data);
        });

        // Smart tab lifecycle
        this.subscribe('smart-tab-cleanup', (eventType, data) => {
            this.handleTabCleanup(data);
        });

        // Storage operations
        this.subscribe('store-interface-state', async (eventType, data) => {
            return await this.storeInterfaceState(data);
        });

        this.subscribe('load-interface-state', async (eventType, data) => {
            return await this.loadInterfaceState(data.key);
        });

        // Popup interactions
        this.subscribe('popup-event', async (eventType, data) => {
            return await this.handlePopupEvent(data);
        });

        // Memory management
        this.subscribe('tab-memory-updated', (eventType, data) => {
            this.trackMemoryUsage(data);
        });

        // Handle pipeline step complete events from ExtractionPipelineMiddleware
        this.subscribe('pipeline-step-complete', (eventType, data) => {
            console.log(`Pipeline step completed: ${data.step} in ${data.duration}ms`);

            // Track pipeline performance
            if (!this.pipelineMetrics) {
                this.pipelineMetrics = new Map();
            }

            if (!this.pipelineMetrics.has(data.extractionId)) {
                this.pipelineMetrics.set(data.extractionId, {
                    steps: [],
                    totalDuration: 0
                });
            }

            const metrics = this.pipelineMetrics.get(data.extractionId);
            metrics.steps.push({
                step: data.step,
                duration: data.duration,
                timestamp: Date.now()
            });
            metrics.totalDuration += data.duration;

            // Emit aggregated metrics
            if (metrics.steps.length % 5 === 0) { // Every 5 steps
                this.emit('pipeline-metrics-update', {
                    extractionId: data.extractionId,
                    metrics: metrics
                });
            }
        });

        // Handle high memory usage events
        this.subscribe('high-memory-usage-detected', (eventType, data) => {
            console.warn(`⚠️ High memory usage: ${data.totalMemoryMB}MB across ${data.tabCount} tabs`);

            // Implement memory management strategy
            if (data.totalMemoryMB > 150) { // Severe threshold
                this.implementMemoryReduction();
            }
        });

        // Handle utils-loaded event
        this.subscribe('utils-loaded', (eventType, data) => {
            console.log(`Utils loaded in ${data.origin}: ${data.components.join(', ')}`);

            // Track loaded components
            if (!this.loadedComponents) {
                this.loadedComponents = new Map();
            }

            this.loadedComponents.set(data.origin, {
                components: data.components,
                timestamp: data.timestamp
            });

            // Check if all required components are loaded
            this.checkSystemReadiness();
        });

        // Handle smart tab initialization
        this.subscribe('smart-tab-initialized', (eventType, data) => {
            console.log(`SmartTab ${data.tabId} initialized as ${data.type}`);

            // Update internal tracking
            if (!this.initializedTabs) {
                this.initializedTabs = new Set();
            }
            this.initializedTabs.add(data.tabId);
        });

        // Handle cross-context routing announcements
        this.subscribe('cross-context-route-announced', (eventType, data) => {
            console.log(`Route announced: ${data.source} -> ${data.target}`);

            // Update routing table
            if (!this.routingTable) {
                this.routingTable = new Map();
            }

            if (!this.routingTable.has(data.source)) {
                this.routingTable.set(data.source, new Set());
            }

            this.routingTable.get(data.source).add(data.target);
        });
    }

    setupBrowserIntegration() {
        // Browser action click - delegate to popup system
        browser.browserAction.onClicked.addListener(async (tab) => {
            await this.emit('popup-event', {
                type: 'browser-action-click',
                tabId: tab.id,
                tab
            });
        });

        // Tab removal - cleanup smart tabs
        browser.tabs.onRemoved.addListener((tabId) => {
            this.cleanupSmartTab(tabId);
        });

        // Tab updates - update smart tab states
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            const smartTab = this.smartTabs.get(tabId);
            if (smartTab && changeInfo.status === 'complete') {
                smartTab.setState('loaded');
            }
        });

        // Runtime messages - enhanced routing
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleRuntimeMessage(request, sender, sendResponse);
            return true;
        });
    }

    setupStorageManagement() {
        // Initialize persistent storage
        this.initializeStorage();

        // Storage change listeners
        if (browser.storage && browser.storage.onChanged) {
            browser.storage.onChanged.addListener((changes, area) => {
                this.handleStorageChange(changes, area);
            });
        }
    }

    async initializeStorage() {
        try {
            if (browser.storage && browser.storage.local) {
                const stored = await browser.storage.local.get();

                // Restore interface states
                if (stored.interfaceStates) {
                    this.interfaceStates = new Map(Object.entries(stored.interfaceStates));
                    console.log(`📦 Restored ${this.interfaceStates.size} interface states from storage`);
                }

                // Restore other persistent data
                if (stored.persistentData) {
                    this.persistentStorage = new Map(Object.entries(stored.persistentData));
                }
            }
        } catch (error) {
            console.warn('Failed to initialize storage:', error);
        }
    }

    initializePopupHandling() {
        // Register popup event handlers
        this.popupEventHandlers.set('browser-action-click', this.handleBrowserActionClick.bind(this));
        this.popupEventHandlers.set('toggle-vibe-mode', this.handleToggleVibeMode.bind(this));
        this.popupEventHandlers.set('change-setting', this.handleSettingChange.bind(this));
        this.popupEventHandlers.set('export-data', this.handleDataExport.bind(this));

        console.log('🎛️ Popup event handlers registered');
    }

    // ===== SESSION MANAGEMENT =====

    async createVibeSession(data) {
        const {tab, config = {}} = data;
        const sessionId = `session-${tab.id}-${Date.now()}`;
        const startTime = Date.now();

        try {
            console.log(`🚀 Creating vibe session ${sessionId} for tab ${tab.id}`);

            // Create visible smart tab
            const visibleTab = new SmartTab(tab.id, {
                type: 'visible',
                sessionId,
                url: tab.url
            });

            this.smartTabs.set(tab.id, visibleTab);

            // Inject proxy controller
            await visibleTab.inject('proxy', {sessionId, tabType: 'visible'});

            // Create hidden tab for processing
            const hiddenBrowserTab = await browser.tabs.create({
                url: tab.url,
                active: false
            });

            // Create hidden smart tab
            const hiddenTab = new SmartTab(hiddenBrowserTab.id, {
                type: 'hidden',
                sessionId,
                parentTabId: tab.id,
                url: tab.url
            });

            this.smartTabs.set(hiddenBrowserTab.id, hiddenTab);

            // Wait for hidden tab to load and inject extractor
            await this.waitForTabLoad(hiddenBrowserTab.id);
            await hiddenTab.inject('extractor', {sessionId, tabType: 'hidden'});

            // Create session record
            const session = {
                id: sessionId,
                visibleTabId: tab.id,
                hiddenTabId: hiddenBrowserTab.id,
                status: 'active',
                createdAt: startTime,
                config,
                metrics: {
                    activationTime: Date.now() - startTime,
                    messageCount: 0,
                    extractionCount: 0
                }
            };

            this.activeSessions.set(sessionId, session);
            this.orchestrationMetrics.sessionsCreated++;

            // Store session state for persistence
            await this.storeInterfaceState({
                key: `session-${tab.id}`,
                state: {
                    sessionId,
                    status: 'active',
                    createdAt: startTime,
                    url: tab.url
                }
            });

            // Start extraction in hidden tab
            await hiddenTab.sendMessage('start-extraction', {
                sessionId,
                config: config.extraction || {scrolling: true, mediaDiscovery: true}
            });

            console.log(`✅ Vibe session ${sessionId} created in ${session.metrics.activationTime}ms`);

            return {
                success: true,
                sessionId,
                visibleTabId: tab.id,
                hiddenTabId: hiddenBrowserTab.id,
                activationTime: session.metrics.activationTime
            };

        } catch (error) {
            console.error(`❌ Failed to create vibe session:`, error);
            await this.cleanupFailedSession(sessionId);
            return {success: false, error: error.message};
        }
    }

    async destroyVibeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return {success: false, error: 'Session not found'};
        }

        try {
            console.log(`🛑 Destroying vibe session ${sessionId}`);

            // Cleanup smart tabs
            await this.cleanupSmartTab(session.visibleTabId);
            await this.cleanupSmartTab(session.hiddenTabId, true); // Close hidden tab

            // Remove session record
            this.activeSessions.delete(sessionId);

            // Update persistent storage
            await this.storeInterfaceState({
                key: `session-${session.visibleTabId}`,
                state: {status: 'destroyed', destroyedAt: Date.now()}
            });

            console.log(`✅ Vibe session ${sessionId} destroyed`);

            return {success: true, sessionId};

        } catch (error) {
            console.error(`❌ Failed to destroy session ${sessionId}:`, error);
            return {success: false, error: error.message};
        }
    }

    async cleanupFailedSession(sessionId) {
        // Cleanup any partially created session resources
        const session = this.activeSessions.get(sessionId);
        if (session) {
            try {
                if (session.hiddenTabId) {
                    await browser.tabs.remove(session.hiddenTabId);
                }
            } catch (e) {
                // Ignore cleanup errors
            }

            this.activeSessions.delete(sessionId);
        }
    }

    // ===== SMART TAB MANAGEMENT =====

    async cleanupSmartTab(tabId, closeTab = false) {
        const smartTab = this.smartTabs.get(tabId);
        if (smartTab) {
            smartTab.cleanup();
            this.smartTabs.delete(tabId);
        }

        if (closeTab) {
            try {
                await browser.tabs.remove(tabId);
            } catch (error) {
                console.warn(`Could not close tab ${tabId}:`, error);
            }
        }
    }

    handleTabCleanup(data) {
        const {tabId, sessionId} = data;

        // Update session if this tab was part of one
        if (sessionId) {
            const session = this.activeSessions.get(sessionId);
            if (session) {
                if (session.visibleTabId === tabId || session.hiddenTabId === tabId) {
                    // Mark session as partially destroyed
                    session.status = 'partial-cleanup';

                    // If both tabs are gone, fully cleanup session
                    if (!this.smartTabs.has(session.visibleTabId) &&
                        !this.smartTabs.has(session.hiddenTabId)) {
                        this.activeSessions.delete(sessionId);
                    }
                }
            }
        }
    }

    trackMemoryUsage(data) {
        const {tabId, estimatedMemoryMB} = data;

        // Track memory usage across all smart tabs
        const totalMemory = Array.from(this.smartTabs.values())
            .reduce((sum, tab) => sum + (tab.metrics.memoryUsage || 0), 0);

        if (totalMemory > 100) { // 100MB threshold
            console.warn(`⚠️ High memory usage detected: ${totalMemory.toFixed(2)}MB across ${this.smartTabs.size} tabs`);

            this.emit('high-memory-usage-detected', {
                totalMemoryMB: totalMemory,
                tabCount: this.smartTabs.size,
                threshold: 100
            });
        }
    }

    // ===== MESSAGE ROUTING =====

    async routeMessage(data) {
        const {sourceTabId, targetContext, action, payload} = data;

        this.orchestrationMetrics.messagesRouted++;

        try {
            // Find target tab based on context
            const targetTabId = this.findTargetTab(sourceTabId, targetContext);

            if (!targetTabId) {
                return {success: false, error: `No ${targetContext} tab found`};
            }

            const targetTab = this.smartTabs.get(targetTabId);
            if (!targetTab) {
                return {
                    success: false,
                    error: 'Target tab not managed by orchestrator'
                };
            }

            const response = await targetTab.sendMessage(action, payload);
            return {success: true, response};

        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    findTargetTab(sourceTabId, targetContext) {
        // Find related tab based on session relationships
        const sourceTab = this.smartTabs.get(sourceTabId);
        if (!sourceTab) return null;

        const session = this.activeSessions.get(sourceTab.sessionId);
        if (!session) return null;

        switch (targetContext) {
            case 'visible':
            case 'proxy':
                return session.visibleTabId;
            case 'hidden':
            case 'extractor':
                return session.hiddenTabId;
            default:
                return null;
        }
    }

    // ===== STORAGE MANAGEMENT =====

    async storeInterfaceState(data) {
        const {key, state} = data;

        this.interfaceStates.set(key, {
            ...state,
            timestamp: Date.now(),
            origin: 'orchestrator'
        });

        this.orchestrationMetrics.storageOperations++;

        // Persist to browser storage
        try {
            if (browser.storage && browser.storage.local) {
                const interfaceStatesObj = Object.fromEntries(this.interfaceStates);
                await browser.storage.local.set({interfaceStates: interfaceStatesObj});
            }

            console.log(`💾 Stored interface state: ${key}`);
            return {success: true};

        } catch (error) {
            console.error('Failed to store interface state:', error);
            return {success: false, error: error.message};
        }
    }

    async loadInterfaceState(key) {
        const state = this.interfaceStates.get(key);

        if (state) {
            console.log(`📖 Loaded interface state: ${key}`);
            return {success: true, state};
        } else {
            return {success: false, error: 'State not found'};
        }
    }

    handleStorageChange(changes, area) {
        console.log(`📦 Storage changed in ${area}:`, Object.keys(changes));

        // Emit storage change events for interested components
        this.emit('storage-changed', {changes, area});

        // Handle specific storage change types
        Object.keys(changes).forEach(key => {
            if (key === 'interfaceStates') {
                this.emit('interface-states-changed', changes[key]);
            }
        });
    }

    // ===== POPUP EVENT HANDLING =====

    async handlePopupEvent(data) {
        const {type, ...eventData} = data;
        this.orchestrationMetrics.popupInteractions++;

        const handler = this.popupEventHandlers.get(type);
        if (handler) {
            try {
                const result = await handler(eventData);

                // Store popup interaction in persistent storage for interface persistence
                await this.storeInterfaceState({
                    key: `popup-${type}-${Date.now()}`,
                    state: {
                        type,
                        eventData,
                        result,
                        timestamp: Date.now()
                    }
                });

                return result;
            } catch (error) {
                console.error(`Popup event handler error for ${type}:`, error);
                return {success: false, error: error.message};
            }
        } else {
            console.warn(`No handler for popup event type: ${type}`);
            return {success: false, error: 'No handler found'};
        }
    }

    async handleBrowserActionClick(data) {
        const {tabId, tab} = data;

        // Check if tab already has active session
        const existingSession = Array.from(this.activeSessions.values())
            .find(session => session.visibleTabId === tabId);

        if (existingSession) {
            // Deactivate existing session
            return await this.destroyVibeSession(existingSession.id);
        } else {
            // Create new session with enhanced smart tab management
            return await this.emit('create-vibe-session', {tab});
        }
    }

    async handleToggleVibeMode(data) {
        const {tabId, enable} = data;

        // Store the toggle state for interface persistence
        await this.storeInterfaceState({
            key: `vibe-mode-${tabId}`,
            state: {enabled: enable, timestamp: Date.now()}
        });

        if (enable) {
            const tab = await browser.tabs.get(tabId);
            return await this.emit('create-vibe-session', {tab});
        } else {
            const session = Array.from(this.activeSessions.values())
                .find(session => session.visibleTabId === tabId);

            if (session) {
                return await this.destroyVibeSession(session.id);
            }

            return {success: false, error: 'No active session found'};
        }
    }

    async handleSettingChange(data) {
        const {setting, value, context} = data;

        // Store setting change for persistence
        await this.storeInterfaceState({
            key: `setting-${setting}`,
            state: {value, context, changedAt: Date.now()}
        });

        // Route setting change to appropriate context using smart tabs
        if (context === 'extractor') {
            // Find all extractor smart tabs and update their settings
            const extractorTabs = Array.from(this.smartTabs.values())
                .filter(tab => tab.type === 'hidden');

            const results = [];
            for (const tab of extractorTabs) {
                try {
                    const result = await tab.sendMessage('update-setting', {
                        setting,
                        value
                    });
                    results.push({tabId: tab.tabId, success: true, result});
                } catch (error) {
                    console.warn(`Failed to update setting in tab ${tab.tabId}:`, error);
                    results.push({
                        tabId: tab.tabId,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {success: true, setting, value, results};
        } else if (context === 'proxy') {
            // Find all proxy smart tabs and update their settings
            const proxyTabs = Array.from(this.smartTabs.values())
                .filter(tab => tab.type === 'visible');

            const results = [];
            for (const tab of proxyTabs) {
                try {
                    const result = await tab.sendMessage('updateSettings', {
                        setting,
                        value
                    });
                    results.push({tabId: tab.tabId, success: true, result});
                } catch (error) {
                    console.warn(`Failed to update setting in tab ${tab.tabId}:`, error);
                    results.push({
                        tabId: tab.tabId,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {success: true, setting, value, results};
        }

        return {success: true, setting, value};
    }

    async handleDataExport(data) {
        const {format = 'json'} = data;

        const exportData = {
            timestamp: Date.now(),
            format,
            activeSessions: Array.from(this.activeSessions.values()).map(session => ({
                ...session,
                // Add smart tab details
                visibleTab: this.smartTabs.get(session.visibleTabId)?.getStatus(),
                hiddenTab: this.smartTabs.get(session.hiddenTabId)?.getStatus()
            })),
            interfaceStates: Object.fromEntries(this.interfaceStates),
            orchestrationMetrics: {...this.orchestrationMetrics},
            smartTabStats: Array.from(this.smartTabs.values()).map(tab => tab.getStatus()),
            memoryStats: this.getMemoryStats(),
            crossContextStats: this.getCrossContextInfo()
        };

        // Store export data for popup/interface to retrieve
        await this.storeInterfaceState({
            key: 'last-export',
            state: exportData
        });

        return {
            success: true,
            exportData,
            exportSize: JSON.stringify(exportData).length
        };
    }

    // ===== UTILITIES =====

    async waitForTabLoad(tabId, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
// FIX: Subscribe to tab load events
            const loadHandler = this.subscribe(`tab-${tabId}-loaded`, (eventType, data) => {
                if (data.tabId === tabId) {
                    clearTimeout(timeoutTimer);
                    clearInterval(checkInterval);
                    this.unsubscribe(`tab-${tabId}-loaded`, loadHandler);
                    resolve(data.tab);
                }
            });

            // Timeout handler
            const timeoutTimer = setTimeout(() => {
                clearInterval(checkInterval);
                this.unsubscribe(`tab-${tabId}-loaded`, loadHandler);
                reject(new Error('Tab load timeout'));
            }, timeout);
            // Active polling as fallback
            const checkInterval = setInterval(async () => {
                try {
                    const tab = await browser.tabs.get(tabId);
                    if (tab.status === 'complete') {
                        clearTimeout(timeoutTimer);
                        clearInterval(checkInterval);
                        this.unsubscribe(`tab-${tabId}-loaded`, loadHandler);

                        // Emit tab loaded event
                        this.emit(`tab-${tabId}-loaded`, { tabId, tab });
                        resolve(tab);
                    }
                } catch (error) {
                    clearTimeout(timeoutTimer);
                    clearInterval(checkInterval);
                    this.unsubscribe(`tab-${tabId}-loaded`, loadHandler);
                    reject(error);
                }
            }, 100);
        })
    }

    implementMemoryReduction() {
        console.log('🧹 Implementing memory reduction strategy');

        // 1. Clear old smart tabs
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        for (const [tabId, smartTab] of this.smartTabs.entries()) {
            if (smartTab.lastActivity < thirtyMinutesAgo) {
                console.log(`Cleaning up inactive tab ${tabId}`);
                this.cleanupSmartTab(tabId);
            }
        }

        // 2. Clear old sessions
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.status === 'partial-cleanup' ||
                (Date.now() - session.createdAt) > (60 * 60 * 1000)) { // 1 hour
                console.log(`Cleaning up old session ${sessionId}`);
                this.destroyVibeSession(sessionId);
            }
        }

        // 3. Clear storage caches
        this.interfaceStates.clear();
        this.persistentStorage.clear();

        // 4. Force garbage collection notification
        this.emit('memory-cleanup-complete', {
            tabsCleaned: this.smartTabs.size,
            sessionsCleaned: this.activeSessions.size,
            timestamp: Date.now()
        });
    }

    checkSystemReadiness() {
        const requiredComponents = [
            'LocalEventBus',
            'CrossContextBridge',
            'SubscriberManager'
        ];

        if (!this.loadedComponents) return false;

        const allLoaded = requiredComponents.every(component => {
            for (const [origin, data] of this.loadedComponents.entries()) {
                if (data.components.includes(component)) {
                    return true;
                }
            }
            return false;
        });

        if (allLoaded) {
            console.log('✅ System fully ready - all components loaded');
            this.emit('system-ready', {
                components: requiredComponents,
                origins: Array.from(this.loadedComponents.keys()),
                timestamp: Date.now()
            });
        }

        return allLoaded;
    }

    async handleRuntimeMessage(request, sender, sendResponse) {
        const { action, data } = request;

        try {
            // Route through cross-context system
            const result = await this.emit(`handle-${action}`, {
                data,
                sender,
                timestamp: Date.now()
            });

            if (result.responses && result.responses.length > 0) {
                sendResponse(result.responses[0]);
            } else {
                sendResponse({ error: 'No handler found', action });
            }

        } catch (error) {
            console.error(`Runtime message error for ${action}:`, error);
            sendResponse({ error: error.message });
        }
    }

    // ===== DEBUG AND MONITORING =====

    getOrchestrationStatus() {
        return {
            smartTabs: Array.from(this.smartTabs.values()).map(tab => tab.getStatus()),
            activeSessions: Array.from(this.activeSessions.values()),
            interfaceStates: this.interfaceStates.size,
            persistentStorage: this.persistentStorage.size,
            orchestrationMetrics: { ...this.orchestrationMetrics },
            crossContextStats: this.getCrossContextInfo(),
            memoryStats: this.getMemoryStats()
        };
    }

    getMemoryStats() {
        const tabMemory = Array.from(this.smartTabs.values())
            .reduce((sum, tab) => sum + (tab.metrics.memoryUsage || 0), 0);

        return {
            totalTabMemoryMB: tabMemory,
            managedTabs: this.smartTabs.size,
            activeSessions: this.activeSessions.size,
            storedStates: this.interfaceStates.size
        };
    }
}

// ===== INITIALIZATION =====
// Only create in background context
const isBackground = (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest && browser.tabs && browser.tabs.query) || 
                     typeof window === "undefined" ||
                     window.__globalSubscriberManager?.origin === "background";

if (isBackground) {
    const backgroundOrchestrator = new BackgroundOrchestrator();
    const scriptInjector = new ScriptInjector();



    if (window.__globalSubscriberManager?.debugMiddleware) {
        // Create alias for compatibility
        window.__vibeDebugMiddleware = window.__globalSubscriberManager.debugMiddleware;

        // Enhanced debug interface with proper references
        window.vibeDebug = {
            // Core functionality
            enable: (categories) => window.__globalSubscriberManager?.debugMiddleware?.enableDebug(categories),
            disable: () => window.__globalSubscriberManager?.debugMiddleware?.enableDebug(false),
            status: () => window.__globalSubscriberManager?.debugMiddleware?.getDebugStatus(),
            event: (event, data, options) => window.__globalSubscriberManager?.debugMiddleware?.debugEvent(event, data, options),

            // Quick enable presets
            enableAll: () => window.__globalSubscriberManager?.debugMiddleware?.enableDebug(true),
            enableErrors: () => window.__globalSubscriberManager?.debugMiddleware?.enableDebug(['errors']),
            enableRouting: () => window.__globalSubscriberManager?.debugMiddleware?.enableDebug(['routing', 'cross-context']),
            enablePerformance: () => window.__globalSubscriberManager?.debugMiddleware?.enableDebug(['performance', 'metrics']),

            // Real-time inspection tools
            inspect: {
                subscribers: () => {
                    const manager = window.__globalSubscriberManager;
                    return {
                        total: manager.subscribers.size,
                        byEvent: Object.fromEntries(
                            Array.from(manager.subscribers.entries()).map(([event, subs]) =>
                                [event, subs.length]
                            )
                        ),
                        stats: manager.getSubscriberStats()
                    };
                },
                middleware: () => {
                    const manager = window.__globalSubscriberManager;
                    return {
                        global: manager.globalMiddlewares.map(m => ({
                            name: m.name,
                            priority: m.priority,
                            enabled: m.enabled !== false
                        })),
                        total: manager.globalMiddlewares.length
                    };
                },
                events: () => {
                    const manager = window.__globalSubscriberManager;
                    return {
                        stats: Object.fromEntries(manager.eventStats || new Map()),
                        recent: manager.eventHistory?.slice(-20) || []
                    };
                },
                routing: () => {
                    const manager = window.__globalSubscriberManager;
                    return manager.crossContextMiddleware?.getRoutingStats() || {
                        error: 'Cross-context middleware not available'
                    };
                },
                memory: () => {
                    const manager = window.__globalSubscriberManager;
                    const componentCount = Object.keys(window).filter(k =>
                        k.includes('__vibe') || k.includes('__globalSubscriber')
                    ).length;

                    return {
                        subscriberCount: manager.subscribers.size,
                        middlewareCount: manager.globalMiddlewares.length,
                        eventHistorySize: manager.eventHistory?.length || 0,
                        globalComponents: componentCount,
                        origin: manager.origin
                    };
                }
            },

            // Advanced debugging
            trace: (eventType) => {
                const manager = window.__globalSubscriberManager;
                const subscribers = manager.subscribers.get(eventType) || [];
                return {
                    eventType,
                    subscriberCount: subscribers.length,
                    subscribers: subscribers.map(sub => ({
                        component: sub.component?.constructor.name || 'anonymous',
                        priority: sub.priority || 5
                    }))
                };
            },

            // Middleware control
            middleware: {
                list: () => window.__globalSubscriberManager?.globalMiddlewares.map(m => m.name),
                toggle: (name, enabled) => {
                    const mw = window.__globalSubscriberManager?.globalMiddlewares.find(m => m.name === name);
                    if (mw) mw.enabled = enabled;
                    return mw ? { success: true } : { error: 'Middleware not found' };
                }
            }
        };

        console.log('✅ Debug console connected to middleware');
        console.log('🐛 Access via: window.vibeDebug');
    }

    // Global export
    window.__backgroundOrchestrator = backgroundOrchestrator;
    window.__smartTabManager = backgroundOrchestrator;
    window.__scriptInjector = scriptInjector;
    window.ScriptInjector = ScriptInjector;

    console.log('🎯 Background Orchestrator v2.5 - Smart Management Active');
    console.log('🎭 Debug: window.__backgroundOrchestrator.getOrchestrationStatus()');

} else {
    console.log('⭕️ Skipping Background Orchestrator - not in background context');
}


/*
// Replace the old ScriptInjector with the Firefox-compatible version
if (typeof ScriptInjector !== 'undefined') {
    window.ScriptInjector = FirefoxCompatibleScriptInjector;
    console.log('✅ ScriptInjector replaced with Firefox-compatible version');
}*/
