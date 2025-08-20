// Matrix Reader v2.0 - Enhanced Background Script with Hidden Tab Management
// Orchestrates hidden tab creation, content extraction, and proxy communication

class HiddenTabManager {
    constructor() {
        this.hiddenTabs = new Map(); // Map visible tab ID to hidden tab ID
        this.extractionStatus = new Map(); // Track extraction progress
        this.activeTabIds = new Set();
        this.init();
    }
    
    init() {
        // Listen for browser action clicks
        browser.browserAction.onClicked.addListener((tab) => {
            this.toggleMatrixMode(tab);
        });
        
        // Listen for messages from content scripts
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Allow async response
        });
        
        // Listen for tab updates
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.handleTabUpdate(tabId, tab);
            }
        });
        
        // Clean up when tabs are closed
        browser.tabs.onRemoved.addListener((tabId) => {
            this.cleanupTab(tabId);
        });
        
        // Listen for keyboard commands
        browser.commands.onCommand.addListener((command) => {
            if (command === 'toggle-matrix-mode') {
                browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        this.toggleMatrixMode(tabs[0]);
                    }
                });
            }
        });
    }
    
    async toggleMatrixMode(tab) {
        const isActive = this.activeTabIds.has(tab.id);
        
        if (isActive) {
            // Deactivate Matrix Reader
            await this.deactivateMatrixMode(tab.id);
        } else {
            // Activate Matrix Reader with hidden tab
            await this.activateMatrixMode(tab);
        }
    }
    
    async activateMatrixMode(tab) {
        try {
            // Step 1: Create hidden tab for content extraction
            const hiddenTab = await this.createHiddenTab(tab.url);
            this.hiddenTabs.set(tab.id, hiddenTab.id);
            this.extractionStatus.set(hiddenTab.id, { 
                status: 'initializing',
                visibleTabId: tab.id,
                originalUrl: tab.url
            });
            
            // Step 2: Inject stealth extractor into hidden tab
            await this.injectStealthExtractor(hiddenTab.id);
            
            // Step 3: Inject proxy controller into visible tab
            await this.injectProxyController(tab.id);
            
            // Step 4: Mark as active
            this.activeTabIds.add(tab.id);
            this.updateBadge(tab.id, true);
            
            // Step 5: Initiate content extraction
            browser.tabs.sendMessage(hiddenTab.id, {
                action: 'extractContent',
                config: {
                    waitForFramework: true,
                    simulateScroll: true,
                    extractDelay: 2000 // Wait 2s for React/Vue hydration
                }
            });
            
        } catch (error) {
            console.error('Failed to activate Matrix Mode:', error);
            this.sendErrorToUser(tab.id, error.message);
        }
    }
    
    async deactivateMatrixMode(tabId) {
        // Clean up hidden tab
        const hiddenTabId = this.hiddenTabs.get(tabId);
        if (hiddenTabId) {
            await browser.tabs.remove(hiddenTabId);
            this.hiddenTabs.delete(tabId);
            this.extractionStatus.delete(hiddenTabId);
        }
        
        // Notify visible tab to clean up
        browser.tabs.sendMessage(tabId, { action: 'deactivate' });
        
        // Update state
        this.activeTabIds.delete(tabId);
        this.updateBadge(tabId, false);
    }
    
    async createHiddenTab(url) {
        // Create hidden tab in background
        const hiddenTab = await browser.tabs.create({
            url: url,
            active: false, // Keep hidden
            pinned: true,  // Minimize resource usage
            windowId: browser.windows.WINDOW_ID_CURRENT
        });
        
        // Wait for tab to be ready
        return new Promise((resolve) => {
            const listener = (tabId, changeInfo) => {
                if (tabId === hiddenTab.id && changeInfo.status === 'complete') {
                    browser.tabs.onUpdated.removeListener(listener);
                    resolve(hiddenTab);
                }
            };
            browser.tabs.onUpdated.addListener(listener);
        });
    }
    
    async injectStealthExtractor(tabId) {
        // Inject Readability.js first
        await browser.tabs.executeScript(tabId, {
            file: 'lib/readability.js'
        });
        
        // Then inject our stealth extractor
        await browser.tabs.executeScript(tabId, {
            file: 'stealth-extractor.js'
        });
    }
    
    async injectProxyController(tabId) {
        // Inject content display script
        await browser.tabs.executeScript(tabId, {
            file: 'proxy-controller.js'
        });
        
        // Inject CSS for Matrix Reader interface
        await browser.tabs.insertCSS(tabId, {
            file: 'styles/retrofuture-theme.css'
        });
    }
    
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'contentExtracted':
                this.handleExtractedContent(request, sender, sendResponse);
                break;
                
            case 'proxyCommand':
                this.routeProxyCommand(request, sender, sendResponse);
                break;
                
            case 'extractionProgress':
                this.updateExtractionProgress(request, sender);
                break;
                
            case 'updateBadge':
                if (sender.tab) {
                    this.updateBadge(sender.tab.id, request.active);
                }
                break;
                
            case 'getSettings':
                browser.storage.sync.get('matrixReaderSettings', (result) => {
                    sendResponse(result.matrixReaderSettings || {});
                });
                break;
                
            case 'saveSettings':
                browser.storage.sync.set({ matrixReaderSettings: request.settings }, () => {
                    sendResponse({ success: true });
                });
                break;
                
            case 'logError':
                console.error('Matrix Reader Error:', request.error);
                break;
                
            default:
                console.warn('Unknown message action:', request.action);
        }
    }
    
    handleExtractedContent(request, sender, sendResponse) {
        // Content successfully extracted from hidden tab
        const extractionInfo = this.extractionStatus.get(sender.tab.id);
        
        if (extractionInfo) {
            // Send extracted content to visible tab
            browser.tabs.sendMessage(extractionInfo.visibleTabId, {
                action: 'displayContent',
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
            
            sendResponse({ success: true });
        }
    }
    
    routeProxyCommand(request, sender, sendResponse) {
        // Route user interactions from visible tab to hidden tab
        const hiddenTabId = this.hiddenTabs.get(sender.tab.id);
        
        if (hiddenTabId) {
            browser.tabs.sendMessage(hiddenTabId, {
                action: 'executeProxyCommand',
                command: request.command,
                data: request.data
            }, (response) => {
                sendResponse(response);
            });
        } else {
            sendResponse({ error: 'No hidden tab found' });
        }
    }
    
    updateExtractionProgress(request, sender) {
        const extractionInfo = this.extractionStatus.get(sender.tab.id);
        
        if (extractionInfo) {
            // Update progress and notify visible tab
            this.extractionStatus.set(sender.tab.id, {
                ...extractionInfo,
                status: request.status,
                progress: request.progress
            });
            
            browser.tabs.sendMessage(extractionInfo.visibleTabId, {
                action: 'extractionProgress',
                status: request.status,
                progress: request.progress
            });
        }
    }
    
    handleTabUpdate(tabId, tab) {
        // Check if this is a visible tab with active Matrix Mode
        if (this.activeTabIds.has(tabId)) {
            // Re-inject proxy controller if page was refreshed
            setTimeout(() => {
                this.injectProxyController(tabId);
            }, 1000);
        }
        
        // Check if this is a hidden tab that finished loading
        const extractionInfo = this.extractionStatus.get(tabId);
        if (extractionInfo && extractionInfo.status === 'initializing') {
            // Hidden tab is ready, start extraction
            this.extractionStatus.set(tabId, {
                ...extractionInfo,
                status: 'ready'
            });
        }
    }
    
    cleanupTab(tabId) {
        // Clean up if visible tab is closed
        if (this.activeTabIds.has(tabId)) {
            const hiddenTabId = this.hiddenTabs.get(tabId);
            if (hiddenTabId) {
                browser.tabs.remove(hiddenTabId);
                this.extractionStatus.delete(hiddenTabId);
            }
            this.hiddenTabs.delete(tabId);
            this.activeTabIds.delete(tabId);
        }
        
        // Clean up if hidden tab is closed unexpectedly
        const extractionInfo = this.extractionStatus.get(tabId);
        if (extractionInfo) {
            this.extractionStatus.delete(tabId);
            // Notify visible tab
            browser.tabs.sendMessage(extractionInfo.visibleTabId, {
                action: 'hiddenTabClosed',
                error: 'Hidden tab was closed unexpectedly'
            });
        }
    }
    
    updateBadge(tabId, isActive) {
        if (isActive) {
            browser.browserAction.setBadgeText({ text: 'ON', tabId: tabId });
            browser.browserAction.setBadgeBackgroundColor({ color: '#f92672', tabId: tabId });
            browser.browserAction.setTitle({ 
                title: 'Matrix Reader v2.0: Active (Hidden Tab Mode)', 
                tabId: tabId 
            });
        } else {
            browser.browserAction.setBadgeText({ text: '', tabId: tabId });
            browser.browserAction.setTitle({ 
                title: 'Matrix Reader v2.0: Click to activate', 
                tabId: tabId 
            });
        }
    }
    
    sendErrorToUser(tabId, errorMessage) {
        browser.tabs.sendMessage(tabId, {
            action: 'showError',
            error: errorMessage
        });
    }
}

// Initialize the enhanced background script
new HiddenTabManager();