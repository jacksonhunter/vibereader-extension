// VibeReader v2.0 - Background manager and script injector

class HiddenTabManager {
    constructor() {
        // Enhanced WeakMap for automatic memory cleanup when tabs are garbage collected
        this.tabRegistry = new WeakMap();
        this.tabDataCache = new Map(); // tab ID -> WeakMap key for reverse lookup

        // Regular Maps for ID-based lookups (necessary for message routing)
        this.hiddenTabs = new Map(); // visible tab ID -> hidden tab ID
        this.extractionStatus = new Map(); // hidden tab ID -> extraction info
        this.activeTabIds = new Set(); // Currently active visible tab IDs

        // Enhanced injection tracking with cleanup support
        this.injectionStatus = new Map(); // tab ID -> { proxy: boolean, extractor: boolean, timers: [] }
        
        // DEBUG: Tab creation monitoring (for debugging + future tab manager foundation)
        this.tabCreationLog = new Map(); // visible tab ID -> array of creation attempts
        this.debugMode = true; // Enable tab creation debugging

        // Error caching for early errors before logger is ready
        this.errorCache = [];
        this.loggerReady = new Map(); // tabId -> boolean

        // Tab creation throttling
        this.tabCreationQueue = new Map();
        this.tabCreationCooldown = 1000; // 1 second between tabs
        this.lastTabCreation = 0;

        this.init();
    }

    async createHiddenTabThrottled(url, visibleTabId) {
        // Check if we already have a pending request for this tab
        if (this.tabCreationQueue.has(visibleTabId)) {
            console.log('⚠️ Tab creation already queued for:', visibleTabId);
            return this.tabCreationQueue.get(visibleTabId);
        }

        // Check cooldown
        const now = Date.now();
        const timeSinceLastCreation = now - this.lastTabCreation;

        if (timeSinceLastCreation < this.tabCreationCooldown) {
            const waitTime = this.tabCreationCooldown - timeSinceLastCreation;
            console.log(`⏳ Throttling tab creation, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Create promise for this tab
        const promise = this.createHiddenTab(url, visibleTabId);
        this.tabCreationQueue.set(visibleTabId, promise);

        // Clean up after completion
        promise.finally(() => {
            this.tabCreationQueue.delete(visibleTabId);
            this.lastTabCreation = Date.now();
        });

        return promise;
    }

    async waitForTabReady(tab, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                browser.tabs.onUpdated.removeListener(listener);
                reject(new Error('Hidden tab creation timeout'));
            }, timeout);

            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id) {
                    this.logToVisible(tab.id, 'INFO', `Hidden tab status: ${changeInfo.status}`, 'NETWORK');

                    if (changeInfo.status === 'complete') {
                        clearTimeout(timer);
                        browser.tabs.onUpdated.removeListener(listener);
                        resolve(tab);
                    }
                }
            };

            browser.tabs.onUpdated.addListener(listener);
        });
    }

    // Helper method to get tab-specific settings
    async getTabSpecificSettings() {
        try {
            const result = await browser.storage.sync.get('vibeReaderSettings');
            return result.vibeReaderSettings || {};
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return {};
        }
    }

    init() {
        // Listen for browser action clicks
        browser.browserAction.onClicked.addListener((tab) => {
            this.safeExecute(() => this.toggleVibeMode(tab), 'browserAction.onClicked');
        });

        // Listen for messages with comprehensive error handling
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Wrap in promise for consistent async handling
            this.handleMessageSafe(request, sender, sendResponse);
            return true; // Keep channel open for async response
        });

        // Listen for tab updates
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.safeExecute(() => {
                    this.handleTabUpdate(tabId, tab);
                    this.checkAutoActivate(tabId, tab);
                }, 'tabs.onUpdated');
            }
        });

        // Clean up when tabs are closed
        browser.tabs.onRemoved.addListener((tabId) => {
            this.safeExecute(() => this.cleanupTab(tabId), 'tabs.onRemoved');
        });

        // Listen for keyboard commands
        browser.commands.onCommand.addListener((command) => {
            if (command === 'toggle-vibe-mode') {
                browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        this.safeExecute(() => this.toggleVibeMode(tabs[0]), 'commands.onCommand');
                    }
                });
            }
        });

        console.log('🔥 HiddenTabManager initialized with WeakMap registry');
    }

    // Centralized error handling wrapper
    safeExecute(fn, context = 'unknown') {
        try {
            return fn();
        } catch (error) {
            console.error(`❌ Error in ${context}:`, error);
            this.logError(error, context);
        }
    }

    // Safe message handling with serializable responses
    async handleMessageSafe(request, sender, sendResponse) {
        try {
            const result = await this.handleMessage(request, sender);
            // Ensure response is serializable
            const safeResult = MessageSerializer.serialize(result);
            sendResponse(safeResult);
        } catch (error) {
            console.error('❌ Message handling error:', error);
            sendResponse({
                success: false,
                error: error.message || 'Unknown error occurred'
            });
        }
    }

    // Ensure data is serializable for message passing
    ensureSerializable(data) {
        if (data === undefined) return { success: true };
        if (data === null) return null;

        // Handle primitives
        if (['string', 'number', 'boolean'].includes(typeof data)) {
            return data;
        }

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.ensureSerializable(item));
        }

        // Handle plain objects
        if (typeof data === 'object') {
            const safe = {};
            for (const [key, value] of Object.entries(data)) {
                // Skip functions and undefined values
                if (typeof value !== 'function' && value !== undefined) {
                    safe[key] = this.ensureSerializable(value);
                }
            }
            return safe;
        }

        return { success: true };
    }

    async logToVisible(tabId, level, message, category = 'SYSTEM') {
        // Cache errors until logger is ready
        const logEntry = {
            timestamp: Date.now(),
            tabId,
            level,
            message,
            category,
            source: 'background'
        };

        // Always log to console first
        console.log(`[BG-${category}] ${level}: ${message}`);

        // Try to send to proxy-controller for centralized logging
        try {
            await browser.tabs.sendMessage(tabId, {
                action: 'logFromBackground',
                level,
                message,
                category,
                source: 'background'
            });
            
            // Mark logger as ready on first successful send
            if (!this.loggerReady.get(tabId)) {
                this.loggerReady.set(tabId, true);
                // Flush cached errors
                await this.flushCachedErrors(tabId);
            }
        } catch (error) {
            // Cache error if logger not ready yet
            this.errorCache.push(logEntry);
            // Prevent cache from growing too large
            if (this.errorCache.length > 50) {
                this.errorCache.shift();
            }
        }
    }

    async flushCachedErrors(tabId) {
        // Send all cached errors for this tab
        const tabErrors = this.errorCache.filter(entry => entry.tabId === tabId);
        for (const entry of tabErrors) {
            try {
                await browser.tabs.sendMessage(tabId, {
                    action: 'logFromBackground',
                    level: entry.level,
                    message: `[CACHED] ${entry.message}`,
                    category: entry.category,
                    source: 'background'
                });
            } catch (e) {
                // Still not ready, keep cached
                break;
            }
        }
        // Remove flushed errors
        this.errorCache = this.errorCache.filter(entry => entry.tabId !== tabId);
    }

    async toggleVibeMode(tab) {
        const isActive = this.activeTabIds.has(tab.id);

        if (isActive) {
            await this.deactivateVibeMode(tab.id);
        } else {
            await this.activateVibeMode(tab);
        }
    }

    async activateVibeMode(tab) {
        const activationStart = performance.now();

        // Enhanced WeakMap storage for comprehensive tab data tracking
        const tabData = {
            activatedAt: Date.now(),
            url: tab.url,
            title: tab.title,
            hiddenTabId: null,
            extractionAttempts: 0,
            performanceMetrics: {
                activationStart: activationStart,
                injectionTimes: {},
                extractionTime: null
            },
            settings: await this.getTabSpecificSettings(),
            timers: new Set() // Store timer IDs for cleanup
        };
        
        this.tabRegistry.set(tab, tabData);
        this.tabDataCache.set(tab.id, tab); // For reverse lookup

        try {
            console.log('🔥 Activating Vibe Mode for tab:', tab.id);

            // Prevent activation on restricted URLs
            if (!this.isValidUrl(tab.url)) {
                throw new Error('Cannot activate on restricted URL');
            }

            // Check if already processing
            if (this.injectionStatus.has(tab.id)) {
                console.log('⚠️ Activation already in progress for tab:', tab.id);
                return;
            }

            // Mark as processing
            this.injectionStatus.set(tab.id, { proxy: false, extractor: false });

            // Step 1: Create hidden tab
            const hiddenTab = await this.createHiddenTabThrottled(tab.url, tab.id);
            this.hiddenTabs.set(tab.id, hiddenTab.id);

            // Store extraction status
            this.extractionStatus.set(hiddenTab.id, {
                status: 'initializing',
                visibleTabId: tab.id,
                originalUrl: tab.url,
                startTime: Date.now()
            });

            // Step 2: Inject stealth extractor into hidden tab
            await this.injectStealthExtractor(hiddenTab.id);
            this.injectionStatus.get(tab.id).extractor = true;
            
            // Wait for extractor to be ready
            await this.waitForScriptReady(hiddenTab.id, 'extractor');

            // Step 3: Inject proxy controller into visible tab (includes CSS)
            await this.injectProxyController(tab.id);
            this.injectionStatus.get(tab.id).proxy = true;
            
            // Wait for proxy controller to be ready
            await this.waitForScriptReady(tab.id, 'proxy');

            // Step 4: Mark as active
            this.activeTabIds.add(tab.id);
            this.updateBadge(tab.id, true);

            // Step 5: Start extraction immediately - no race condition
            this.safeExecute(async () => {
                try {
                    await browser.tabs.sendMessage(hiddenTab.id, {
                        action: 'extractContent',
                        config: {
                            waitForFramework: true,
                            simulateScroll: true,
                            extractDelay: 500
                        }
                    });
                } catch (error) {
                    console.error('❌ Failed to start extraction:', error);
                    this.handleExtractionError(tab.id, error);
                }
            }, 'startExtraction');
            
            // Update tab data
            const tabData = this.tabRegistry.get(tab);
            if (tabData) {
                tabData.hiddenTabId = hiddenTab.id;
            }

            console.log(`✅ Activation complete in ${(performance.now() - activationStart).toFixed(1)}ms`);

        } catch (error) {
            console.error('❌ Activation failed:', error);
            this.cleanupFailedActivation(tab.id);
            this.sendErrorToUser(tab.id, error.message);
        } finally {
            // Clean up injection status after attempt
            setTimeout(() => {
                this.injectionStatus.delete(tab.id);
            }, 2000);
        }
    }

    async deactivateVibeMode(tabId) {
        console.log('🔌 Deactivating Vibe Mode for tab:', tabId);

        try {
            // Clean up timers and WeakMap data
            const tabRef = this.tabDataCache.get(tabId);
            if (tabRef) {
                const tabData = this.tabRegistry.get(tabRef);
                if (tabData && tabData.timers) {
                    // Clear all active timers
                    tabData.timers.forEach(timerId => {
                        clearTimeout(timerId);
                        clearInterval(timerId);
                    });
                    tabData.timers.clear();
                }
                this.tabDataCache.delete(tabId);
            }

            // Clean up hidden tab
            const hiddenTabId = this.hiddenTabs.get(tabId);
            if (hiddenTabId) {
                await browser.tabs.remove(hiddenTabId).catch(e =>
                    console.log('Hidden tab already closed')
                );
                this.hiddenTabs.delete(tabId);
                this.extractionStatus.delete(hiddenTabId);
            }

            // Notify visible tab to clean up
            await browser.tabs.sendMessage(tabId, {
                action: 'deactivate'
            }).catch(e => console.log('Tab already closed or script not injected'));

            // Update state
            this.activeTabIds.delete(tabId);
            this.injectionStatus.delete(tabId);
            this.updateBadge(tabId, false);

            console.log('✅ Deactivation complete with timer cleanup');

        } catch (error) {
            console.error('❌ Deactivation error:', error);
        }
    }

    async createHiddenTab(url, visibleTabId = 'unknown') {
        // Get stack trace for debugging
        const stack = new Error().stack;
        const caller = stack.split('\n')[2]?.trim() || 'unknown';
        
        console.log('🔧 Creating hidden tab for:', url);
        console.log('📍 Called from:', caller);
        
        // Log tab creation attempt for debugging + future tab manager
        if (!this.tabCreationLog.has(visibleTabId)) {
            this.tabCreationLog.set(visibleTabId, []);
        }
        
        const creationAttempt = {
            timestamp: Date.now(),
            url: url,
            caller: caller,
            visibleTabId: visibleTabId
        };
        
        this.tabCreationLog.get(visibleTabId).push(creationAttempt);
        
        // DEBUG: Block additional tabs while debugging (temporary safeguard)
        if (this.debugMode && this.hiddenTabs.has(visibleTabId)) {
            const existingAttempts = this.tabCreationLog.get(visibleTabId).length;
            console.warn(`🚨 BLOCKED: Tab ${visibleTabId} trying to create ${existingAttempts} hidden tabs!`);
            console.warn('📋 Creation attempts:', this.tabCreationLog.get(visibleTabId));
            
            if (typeof dump !== 'undefined') {
                dump(`[TAB-DEBUG] BLOCKED: ${visibleTabId} -> ${url} | Attempts: ${existingAttempts} | Caller: ${caller.substring(0, 30)}\n`);
            }
            
            // Return existing hidden tab instead of creating new one
            const existingHiddenTabId = this.hiddenTabs.get(visibleTabId);
            try {
                const existingTab = await browser.tabs.get(existingHiddenTabId);
                console.log('↩️ Returning existing hidden tab:', existingHiddenTabId);
                return existingTab;
            } catch (e) {
                console.warn('Existing hidden tab not found, allowing creation');
            }
        }

        const hiddenTab = await browser.tabs.create({
            url: url,
            active: false,
            pinned: true,
            index: 9999 // Move to end
        });

        console.log('✅ Hidden tab created:', hiddenTab.id);
        
        if (typeof dump !== 'undefined') {
            dump(`[TAB-CREATE] ${visibleTabId} -> ${hiddenTab.id} | URL: ${url.substring(0, 50)} | Caller: ${caller.substring(0, 30)}\n`);
        }

        // Wait for tab to be ready
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Hidden tab creation timeout'));
            }, 10000);

            const listener = (tabId, changeInfo) => {
                if (tabId === hiddenTab.id && changeInfo.status === 'complete') {
                    clearTimeout(timeout);
                    browser.tabs.onUpdated.removeListener(listener);
                    resolve(hiddenTab);
                }
            };
            browser.tabs.onUpdated.addListener(listener);
        });
    }

    async injectStealthExtractor(tabId) {
        // Check if already injected
        try {
            const result = await browser.tabs.sendMessage(tabId, {
                action: 'ping'
            }).catch(() => null);


            if (result && result.type === 'extractor') {
                console.log('⚠️ Stealth extractor already injected');
                return;
            }
        } catch (e) {
            // Not injected yet, proceed
        }

        try {

            await browser.tabs.executeScript(tabId, {
                file: 'vibe-utils.js',
                runAt: 'document_end'
            });

            // Inject dependencies first with error checking
            console.log('📚 Injecting Readability.js into hidden tab');
            await browser.tabs.executeScript(tabId, {
                file: 'lib/readability.js',
                runAt: 'document_end'
            });

            // Wait a moment for Readability to be available
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify Readability loaded correctly
            const readabilityCheck = await browser.tabs.executeScript(tabId, {
                code: 'typeof Readability !== "undefined"',
                runAt: 'document_end'
            });

            if (!readabilityCheck || !readabilityCheck[0]) {
                throw new Error('Readability.js failed to load properly');
            }

            console.log('✅ Readability.js loaded successfully');

            // Inject stealth extractor directly as file
            await browser.tabs.executeScript(tabId, {
                file: 'stealth-extractor.js',
                runAt: 'document_end'
            });

            console.log('✅ Stealth extractor injected successfully');

        } catch (error) {
            console.error('❌ Failed to inject stealth extractor:', error);
            throw new Error(`Injection failed: ${error.message}`);
        }
    }

    async injectProxyController(tabId) {
        // Check if already injected
        try {
            const result = await browser.tabs.sendMessage(tabId, {
                action: 'ping'
            }).catch(() => null);

            if (result && result.type === 'proxy') {
                console.log('⚠️ Proxy controller already injected');
                return;
            }
        } catch (e) {
            // Not injected yet, proceed
        }

        await browser.tabs.executeScript(tabId, {
            file: 'vibe-utils.js',
            runAt: 'document_end'
        });

        // Inject dependencies in correct order with verification
        await this.logToVisible(tabId, 'INFO', '🔧 Injecting RxJS for Observable patterns', 'ASCII');
        await browser.tabs.executeScript(tabId, {
            file: 'lib/rxjs.min.js',
            runAt: 'document_end'
        });

        await this.logToVisible(tabId, 'INFO', '🔧 Injecting aalib.js library for ASCII conversion', 'ASCII');
        await browser.tabs.executeScript(tabId, {
            file: 'lib/aalib.js',
            runAt: 'document_end'
        });

        // Verify script loading with immediate check
        await this.logToVisible(tabId, 'INFO', '🔍 Verifying aalib.js loading...', 'ASCII');
        try {
            const verifyResult = await browser.tabs.executeScript(tabId, {
                code: `
                    console.log('🔍 Script verification check:', {
                        rxjs: typeof window.Rx !== 'undefined',
                        aalib: typeof window.aalib !== 'undefined',
                        aalibMethods: window.aalib ? Object.keys(window.aalib) : null
                    });
                    ({
                        aalibLoaded: typeof window.aalib !== 'undefined',
                        aalibMethods: window.aalib ? Object.keys(window.aalib).length : 0,
                        rxjsLoaded: typeof window.Rx !== 'undefined'
                    });
                `
            });

            const result = verifyResult[0];
            if (result.aalibLoaded) {
                await this.logToVisible(tabId, 'INFO', `✅ aalib.js loaded successfully - ${result.aalibMethods} methods available`, 'ASCII');
            } else {
                await this.logToVisible(tabId, 'ERR', '❌ aalib.js failed to load - window.aalib is undefined', 'ASCII');
            }
        } catch (error) {
            await this.logToVisible(tabId, 'ERR', `❌ aalib.js verification failed: ${error.message}`, 'ASCII');
        }

        // Inject proxy controller directly as file
        await this.logToVisible(tabId, 'INFO', '🔧 Injecting proxy-controller for UI management', 'SYSTEM');
        await browser.tabs.executeScript(tabId, {
            file: 'proxy-controller.js',
            runAt: 'document_end'
        });


        // Fire-and-forget CSS injection - don't block activation on CSS
        this.injectCSSAsync(tabId).catch(error => {
            console.warn('CSS injection failed, but extension will continue:', error);
        });
    }

    async injectCSSAsync(tabId) {
        try {
            await this.logToVisible(tabId, 'INFO', '🎨 Injecting CSS asynchronously...', 'CSS');
            
            // Primary: Try generated.css
            await browser.tabs.insertCSS(tabId, {
                file: 'styles/generated.css',
                allFrames: false,
                runAt: 'document_start'
            });
            
            await this.logToVisible(tabId, 'INFO', '✅ Generated CSS injected', 'CSS');
            
            // Optional verification (non-blocking)
            setTimeout(() => {
                this.verifyCSSLoadingLenient(tabId).catch(() => {
                    // If generated.css failed, try fallback
                    this.injectFallbackCSS(tabId);
                });
            }, 500);
            
        } catch (error) {
            await this.logToVisible(tabId, 'WARN', `⚠️ Generated CSS failed: ${error.message}`, 'CSS');
            // Try fallback immediately on failure
            this.injectFallbackCSS(tabId);
        }
    }

    async injectFallbackCSS(tabId) {
        try {
            await this.logToVisible(tabId, 'INFO', '🔄 Loading fallback CSS from popup...', 'CSS');
            
            // Use popup CSS as fallback
            const popupCSS = await this.getPopupCSS();
            if (popupCSS) {
                await browser.tabs.insertCSS(tabId, {
                    code: popupCSS,
                    allFrames: false
                });
                await this.logToVisible(tabId, 'INFO', '✅ Fallback CSS loaded', 'CSS');
            }
        } catch (error) {
            await this.logToVisible(tabId, 'ERR', `❌ Fallback CSS failed: ${error.message}`, 'CSS');
        }
    }

    async getPopupCSS() {
        try {
            // Get CSS from popup.html or use minimal fallback
            return `
                /* Minimal fallback CSS */
                .vibe-container { 
                    background: #1a1a1a; 
                    color: #00ff00; 
                    font-family: monospace; 
                    z-index: 2147483647; 
                }
                .vibe-header { 
                    background: #ff0066; 
                    padding: 10px; 
                    border: 2px solid #00ffff; 
                }
            `;
        } catch (error) {
            console.warn('Could not load popup CSS fallback:', error);
            return null;
        }
    }

    async verifyCSSLoadingLenient(tabId) {
        // Just check if ANY styles loaded, don't fail if variables missing
        const result = await browser.tabs.executeScript(tabId, {
            code: `
            const sheets = document.styleSheets.length;
            const hasExtensionCSS = Array.from(document.styleSheets).some(s => 
                s.href && s.href.includes(chrome.runtime.id)
            );
            ({ sheets, hasExtensionCSS });
        `
        });

        if (result[0].hasExtensionCSS) {
            await this.logToVisible(tabId, 'INFO', `✅ Extension CSS detected`, 'CSS');
        } else {
            await this.logToVisible(tabId, 'WARN', `⚠️ CSS may not be fully loaded`, 'CSS');
        }
    }
    // Wait for script to be ready and responsive
    async waitForScriptReady(tabId, scriptType) {
        const maxAttempts = 10;
        const delay = 200;
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const result = await browser.tabs.sendMessage(tabId, {
                    action: 'ping'
                });
                
                if (result && result.type === scriptType) {
                    console.log(`✅ ${scriptType} ready after ${(i + 1) * delay}ms`);
                    return true;
                }
            } catch (e) {
                // Script not ready yet
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.warn(`⚠️ ${scriptType} not ready after ${maxAttempts * delay}ms`);
        return false;
    }

    async handleMessage(request, sender) {
        switch (request.action) {
            case 'ping':
                return { success: true, type: 'background' };

            case 'getHiddenTabId':
                // Return hidden tab ID for the sender's visible tab
                const hiddenTabId = this.hiddenTabs.get(sender.tab?.id);
                return { success: true, hiddenTabId };

            case 'getTabId':
                // Return the sender's tab ID
                return { success: true, tabId: sender.tab?.id };

            case 'broadcastMessage':
                // Broadcast to all tabs
                const results = [];
                const tabs = await browser.tabs.query({});
                for (const tab of tabs) {
                    try {
                        const result = await browser.tabs.sendMessage(tab.id, request.data);
                        results.push({ tabId: tab.id, result });
                    } catch (e) {
                        results.push({ tabId: tab.id, error: e.message });
                    }
                }
                return { success: true, results };

            case 'contentExtracted':
                return await this.handleExtractedContent(request, sender);

            case 'proxyCommand':
                return await this.routeProxyCommand(request, sender);

            case 'extractionProgress':
                this.updateExtractionProgress(request, sender);
                return { success: true };

            case 'toggleFromPopup':
                const tab = await browser.tabs.get(request.tabId);
                await this.toggleVibeMode(tab);
                return { success: true };

            case 'updateBadge':
                if (sender.tab) {
                    this.updateBadge(sender.tab.id, request.active);
                }
                return { success: true };

            case 'getSettings':
                const result = await browser.storage.sync.get('vibeReaderSettings');
                return result.vibeReaderSettings || {};

            case 'saveSettings':
                await browser.storage.sync.set({
                    vibeReaderSettings: request.settings
                });
                return { success: true };

            case 'logError':
                this.logError(request.error, request.context);
                return { success: true };

            default:
                console.warn('Unknown message action:', request.action);
                return { success: false, error: 'Unknown action' };
        }
    }

    async handleExtractedContent(request, sender) {
        const extractionInfo = this.extractionStatus.get(sender.tab.id);

        if (!extractionInfo) {
            console.error('No extraction info found for tab:', sender.tab.id);
            return { success: false, error: 'No extraction info' };
        }

        try {
            // Send to visible tab with consistent action name
            await browser.tabs.sendMessage(extractionInfo.visibleTabId, {
                action: 'displayContent', // Fixed: consistent action name
                content: request.content,
                metadata: request.metadata,
                source: 'hiddenTab'
            });

            // Update extraction status
            this.extractionStatus.set(sender.tab.id, {
                ...extractionInfo,
                status: 'complete',
                extractedAt: Date.now()
            });

            // Don't automatically cleanup hidden tab - let it stay for future interactions
            // Only cleanup when user manually deactivates or tab is actually closed
            console.log('💫 Hidden tab kept alive for future interactions');

            return { success: true };

        } catch (error) {
            console.error('Failed to send content to visible tab:', error);
            return { success: false, error: error.message };
        }
    }

    async routeProxyCommand(request, sender) {
        const hiddenTabId = this.hiddenTabs.get(sender.tab.id);

        if (!hiddenTabId) {
            return { success: false, error: 'No hidden tab found' };
        }

        try {
            const response = await browser.tabs.sendMessage(hiddenTabId, {
                action: 'executeProxyCommand',
                command: request.command,
                data: request.data
            });

            return this.ensureSerializable(response);

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    updateExtractionProgress(request, sender) {
        const extractionInfo = this.extractionStatus.get(sender.tab.id);

        if (extractionInfo) {
            this.extractionStatus.set(sender.tab.id, {
                ...extractionInfo,
                status: request.status,
                progress: request.progress
            });

            // Send progress update to visible tab
            browser.tabs.sendMessage(extractionInfo.visibleTabId, {
                action: 'extractionProgress',
                status: request.status,
                progress: request.progress
            }).catch(() => {
                // Proxy controller might not be ready yet
            });
        }
    }

    handleTabUpdate(tabId, tab) {
        // Re-inject if page was refreshed
        if (this.activeTabIds.has(tabId)) {
            console.log('📄 Page refreshed, re-injecting proxy controller');
            setTimeout(() => {
                this.safeExecute(() => {
                    this.injectProxyController(tabId);
                }, 'reinjection');
            }, 1000);
        }
    }

    cleanupTab(tabId) {
        console.log('🗑️ Cleaning up tab:', tabId);
        
        // Clean up logger state
        this.loggerReady.delete(tabId);
        this.errorCache = this.errorCache.filter(entry => entry.tabId !== tabId);

        // Check if this is actually a tab close (not refresh) by verifying tab still exists
        browser.tabs.get(tabId).then(tab => {
            // Tab still exists - this might be a refresh, don't cleanup hidden tab
            console.log('Tab still exists, skipping cleanup for refresh');
        }).catch(() => {
            // Tab doesn't exist - this is a real tab close, proceed with cleanup
            console.log('Tab actually closed, proceeding with cleanup');
            this.performActualCleanup(tabId);
        });
    }

    performActualCleanup(tabId) {
        // Clean up visible tab resources including timers
        if (this.activeTabIds.has(tabId)) {
            // Clean up timers
            const tabRef = this.tabDataCache.get(tabId);
            if (tabRef) {
                const tabData = this.tabRegistry.get(tabRef);
                if (tabData && tabData.timers) {
                    tabData.timers.forEach(timerId => {
                        clearTimeout(timerId);
                        clearInterval(timerId);
                    });
                    tabData.timers.clear();
                }
                this.tabDataCache.delete(tabId);
            }

            const hiddenTabId = this.hiddenTabs.get(tabId);
            if (hiddenTabId) {
                browser.tabs.remove(hiddenTabId).catch(() => {});
                this.extractionStatus.delete(hiddenTabId);
            }
            this.hiddenTabs.delete(tabId);
            this.activeTabIds.delete(tabId);
            this.injectionStatus.delete(tabId);
        }

        // Clean up if this was a hidden tab
        const extractionInfo = this.extractionStatus.get(tabId);
        if (extractionInfo) {
            this.extractionStatus.delete(tabId);
            // Notify visible tab
            browser.tabs.sendMessage(extractionInfo.visibleTabId, {
                action: 'hiddenTabClosed',
                error: 'Hidden tab was closed unexpectedly'
            }).catch(() => {});
        }
    }

    updateBadge(tabId, isActive) {
        const text = isActive ? 'ON' : '';
        const color = isActive ? '#f92672' : '#000000';
        const title = isActive
            ? 'VibeReader Active - Click to deactivate'
            : 'VibeReader - Click to activate';

        browser.browserAction.setBadgeText({ text, tabId });
        browser.browserAction.setBadgeBackgroundColor({ color, tabId });
        browser.browserAction.setTitle({ title, tabId });
    }

    async sendErrorToUser(tabId, errorMessage) {
        try {
            await browser.tabs.sendMessage(tabId, {
                action: 'showError',
                error: errorMessage
            });
        } catch (error) {
            console.error('Could not notify user of error:', errorMessage);
        }
    }

    cleanupFailedActivation(tabId) {
        console.log('🧹 Cleaning up failed activation for tab:', tabId);
        
        // Clean up timers
        const tabRef = this.tabDataCache.get(tabId);
        if (tabRef) {
            const tabData = this.tabRegistry.get(tabRef);
            if (tabData && tabData.timers) {
                tabData.timers.forEach(timerId => {
                    clearTimeout(timerId);
                    clearInterval(timerId);
                });
                tabData.timers.clear();
            }
            this.tabDataCache.delete(tabId);
        }
        
        // Clean up hidden tab if it was created
        const hiddenTabId = this.hiddenTabs.get(tabId);
        if (hiddenTabId) {
            browser.tabs.remove(hiddenTabId).catch(() => {
                console.log('Hidden tab already closed during cleanup');
            });
            this.extractionStatus.delete(hiddenTabId);
        }
        
        this.hiddenTabs.delete(tabId);
        this.activeTabIds.delete(tabId);
        this.injectionStatus.delete(tabId);
        this.updateBadge(tabId, false);
    }

    handleExtractionError(tabId, error) {
        console.error('Extraction error for tab:', tabId, error);
        this.sendErrorToUser(tabId, 'Content extraction failed. Please try again.');
        this.deactivateVibeMode(tabId);
    }

    isValidUrl(url) {
        if (!url) return false;

        const restrictedPrefixes = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'about:',
            'file://',
            'edge://',
            'opera://',
            'vivaldi://',
            'brave://'
        ];

        return !restrictedPrefixes.some(prefix => url.startsWith(prefix));
    }

    async checkAutoActivate(tabId, tab) {
        // Add check to prevent multiple activations
        if (this.activeTabIds.has(tabId) ||
            this.injectionStatus.has(tabId) ||  // Already processing
            !this.isValidUrl(tab.url)) {
            return;
        }

        if (this.activeTabIds.has(tabId) || !this.isValidUrl(tab.url)) {
            return;
        }

        try {
            const result = await browser.storage.sync.get('vibeReaderSettings');
            const settings = result.vibeReaderSettings || {};

            if (settings.autoActivate) {
                console.log('🚀 Auto-activating for tab:', tabId);
                setTimeout(() => {
                    this.safeExecute(() => {
                        this.activateVibeMode(tab);
                    }, 'autoActivate');
                }, 1000);
            }
        } catch (error) {
            console.error('Auto-activate check failed:', error);
        }
    }

    logError(error, context) {
        // Central error logging for debugging
        const errorLog = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message || error,
            stack: error.stack,
            userAgent: navigator.userAgent
        };

        console.error('📊 Error Log:', errorLog);

        // Could send to analytics service here
    }
}

// Initialize with singleton pattern
if (!window.__vibeReaderBackgroundManager) {
    window.__vibeReaderBackgroundManager = new HiddenTabManager();
}