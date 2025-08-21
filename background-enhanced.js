// VibeReader v2.0 - Enhanced Background Script with Robust State Management
// Implements WeakMap registry for memory-safe tab tracking

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

        this.init();
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
            const safeResult = this.ensureSerializable(result);
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
            const hiddenTab = await this.createHiddenTab(tab.url);
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

            // Step 3: Inject proxy controller into visible tab
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

    async createHiddenTab(url) {
        console.log('🔧 Creating hidden tab for:', url);

        const hiddenTab = await browser.tabs.create({
            url: url,
            active: false,
            pinned: true,
            index: 9999 // Move to end
        });

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

        // Inject dependencies first
        await browser.tabs.executeScript(tabId, {
            file: 'lib/readability.js',
            runAt: 'document_end'
        });

        // Inject stealth extractor directly as file
        await browser.tabs.executeScript(tabId, {
            file: 'stealth-extractor.js',
            runAt: 'document_end'
        });
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

        // Inject dependencies
        await browser.tabs.executeScript(tabId, {
            file: 'lib/aalib.js',
            runAt: 'document_end'
        });

        // Inject proxy controller directly as file
        await browser.tabs.executeScript(tabId, {
            file: 'proxy-controller.js',
            runAt: 'document_end'
        });

        // Inject CSS
        await browser.tabs.insertCSS(tabId, {
            file: 'styles/retrofuture-theme.css'
        });
        await browser.tabs.insertCSS(tabId, {
            file: 'styles/matrix-theme.css'
        });
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

            // Schedule hidden tab cleanup - but only if extraction is complete
            const cleanupTimer = setTimeout(() => {
                this.safeExecute(() => {
                    // Double-check the tab still exists and extraction is done
                    const currentStatus = this.extractionStatus.get(sender.tab.id);
                    if (currentStatus && currentStatus.status === 'complete') {
                        browser.tabs.remove(sender.tab.id).catch(() => {
                            console.log('Hidden tab already closed');
                        });
                    }
                }, 'hiddenTabCleanup');
            }, 8000); // Increased delay to prevent premature closure

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