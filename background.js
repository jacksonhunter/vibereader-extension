// Matrix Reader - Background Script
// Handles extension lifecycle and browser action

class MatrixReaderBackground {
    constructor() {
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
        });
        
        // Listen for tab updates
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.activeTabIds.has(tabId)) {
                // Re-inject if the page was refreshed
                setTimeout(() => {
                    this.injectMatrixMode(tabId);
                }, 1000);
            }
        });
        
        // Clean up when tabs are closed
        browser.tabs.onRemoved.addListener((tabId) => {
            this.activeTabIds.delete(tabId);
        });
    }
    
    toggleMatrixMode(tab) {
        browser.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
            if (browser.runtime.lastError) {
                console.log('Content script not ready, injecting...');
                this.injectMatrixMode(tab.id);
            } else if (response) {
                this.updateBadge(tab.id, response.status);
            }
        });
    }
    
    injectMatrixMode(tabId) {
        // Inject content script if not already present
        browser.tabs.executeScript(tabId, {
            file: 'content.js'
        }, () => {
            if (browser.runtime.lastError) {
                console.error('Failed to inject content script:', browser.runtime.lastError);
                return;
            }
            
            // Activate matrix mode after injection
            setTimeout(() => {
                browser.tabs.sendMessage(tabId, { action: 'toggle' }, (response) => {
                    if (response) {
                        this.updateBadge(tabId, response.status);
                    }
                });
            }, 500);
        });
    }
    
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'updateBadge':
                if (sender.tab) {
                    this.updateBadge(sender.tab.id, request.active);
                }
                break;
                
            case 'getSettings':
                browser.storage.sync.get('matrixReaderSettings', (result) => {
                    sendResponse(result.matrixReaderSettings || {});
                });
                return true; // Will respond asynchronously
                
            case 'saveSettings':
                browser.storage.sync.set({ matrixReaderSettings: request.settings }, () => {
                    sendResponse({ success: true });
                });
                return true; // Will respond asynchronously
                
            case 'logError':
                console.error('Matrix Reader Error:', request.error);
                break;
                
            default:
                console.warn('Unknown message action:', request.action);
        }
    }
    
    updateBadge(tabId, isActive) {
        if (isActive) {
            this.activeTabIds.add(tabId);
            browser.browserAction.setBadgeText({ text: 'ON', tabId: tabId });
            browser.browserAction.setBadgeBackgroundColor({ color: '#f92672', tabId: tabId });
            browser.browserAction.setTitle({ 
                title: 'Matrix Reader: Active (Click to exit)', 
                tabId: tabId 
            });
        } else {
            this.activeTabIds.delete(tabId);
            browser.browserAction.setBadgeText({ text: '', tabId: tabId });
            browser.browserAction.setTitle({ 
                title: 'Matrix Reader: Inactive (Click to activate)', 
                tabId: tabId 
            });
        }
    }
}

// Initialize background script
new MatrixReaderBackground();