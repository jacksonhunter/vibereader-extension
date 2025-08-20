// Matrix Reader v2.0 - Stealth Content Extractor
// Runs in hidden tab to extract clean content after full page load

class StealthExtractor {
    constructor() {
        this.extractionAttempts = 0;
        this.maxAttempts = 5;
        this.scrollProgress = 0;
        this.frameworkDetected = null;
        this.init();
    }
    
    init() {
        // Listen for extraction commands from background script
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Allow async response
        });
        
        // Detect JavaScript framework
        this.detectFramework();
        
        // Report initialization
        this.reportProgress('initialized', 0);
    }
    
    detectFramework() {
        // Detect common JS frameworks for optimal wait times
        if (window.React || document.querySelector('[data-reactroot]')) {
            this.frameworkDetected = 'react';
        } else if (window.Vue || document.querySelector('#app[data-v-]')) {
            this.frameworkDetected = 'vue';
        } else if (window.angular || document.querySelector('[ng-app]')) {
            this.frameworkDetected = 'angular';
        } else if (document.querySelector('[data-svelte]')) {
            this.frameworkDetected = 'svelte';
        } else {
            this.frameworkDetected = 'vanilla';
        }
        
        console.log(`Framework detected: ${this.frameworkDetected}`);
    }
    
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'extractContent':
                this.startExtraction(request.config, sendResponse);
                break;
                
            case 'executeProxyCommand':
                this.executeProxyCommand(request.command, request.data, sendResponse);
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }
    
    async startExtraction(config, sendResponse) {
        try {
            this.reportProgress('waiting_for_framework', 10);
            
            // Step 1: Wait for framework to fully hydrate
            if (config.waitForFramework) {
                await this.waitForFramework();
            }
            
            this.reportProgress('simulating_scroll', 30);
            
            // Step 2: Simulate human scrolling to trigger lazy loading
            if (config.simulateScroll) {
                await this.simulateHumanScroll();
            }
            
            this.reportProgress('waiting_for_content', 60);
            
            // Step 3: Wait for dynamic content to stabilize
            await this.waitForContentStability();
            
            this.reportProgress('extracting', 80);
            
            // Step 4: Extract content with Readability
            const extractedContent = this.extractContent();
            
            if (extractedContent && extractedContent.content) {
                this.reportProgress('complete', 100);
                
                // Send extracted content back to background script
                browser.runtime.sendMessage({
                    action: 'contentExtracted',
                    content: extractedContent.content,
                    metadata: {
                        title: extractedContent.title || document.title,
                        byline: extractedContent.byline,
                        excerpt: extractedContent.excerpt,
                        length: extractedContent.length,
                        siteName: extractedContent.siteName,
                        url: window.location.href,
                        extractedAt: Date.now(),
                        framework: this.frameworkDetected
                    }
                });
                
                sendResponse({ success: true });
            } else {
                throw new Error('Content extraction failed');
            }
            
        } catch (error) {
            console.error('Extraction error:', error);
            this.reportProgress('error', 0);
            
            // Retry extraction with fallback method
            if (this.extractionAttempts < this.maxAttempts) {
                this.extractionAttempts++;
                setTimeout(() => {
                    this.startExtraction(config, sendResponse);
                }, 2000);
            } else {
                sendResponse({ error: error.message });
            }
        }
    }
    
    async waitForFramework() {
        return new Promise((resolve) => {
            const waitTime = this.getFrameworkWaitTime();
            
            // Check for framework-specific ready signals
            if (this.frameworkDetected === 'react') {
                this.waitForReactReady(resolve, waitTime);
            } else if (this.frameworkDetected === 'vue') {
                this.waitForVueReady(resolve, waitTime);
            } else if (this.frameworkDetected === 'angular') {
                this.waitForAngularReady(resolve, waitTime);
            } else {
                // Generic wait for vanilla JS
                setTimeout(resolve, waitTime);
            }
        });
    }
    
    waitForReactReady(callback, maxWait) {
        const startTime = Date.now();
        const checkReact = () => {
            // Check if React has finished initial render
            const reactRoot = document.querySelector('[data-reactroot]') || 
                           document.querySelector('#root');
            const hasContent = reactRoot && reactRoot.children.length > 0;
            
            if (hasContent || Date.now() - startTime > maxWait) {
                callback();
            } else {
                requestAnimationFrame(checkReact);
            }
        };
        checkReact();
    }
    
    waitForVueReady(callback, maxWait) {
        const startTime = Date.now();
        const checkVue = () => {
            // Check if Vue has mounted
            const vueApp = document.querySelector('#app');
            const hasVueData = vueApp && vueApp.hasAttribute('data-v-');
            
            if (hasVueData || Date.now() - startTime > maxWait) {
                callback();
            } else {
                requestAnimationFrame(checkVue);
            }
        };
        checkVue();
    }
    
    waitForAngularReady(callback, maxWait) {
        const startTime = Date.now();
        const checkAngular = () => {
            // Check if Angular has bootstrapped
            const ngApp = document.querySelector('[ng-app]');
            const hasNgScope = ngApp && ngApp.classList.contains('ng-scope');
            
            if (hasNgScope || Date.now() - startTime > maxWait) {
                callback();
            } else {
                requestAnimationFrame(checkAngular);
            }
        };
        checkAngular();
    }
    
    getFrameworkWaitTime() {
        // Different wait times for different frameworks
        const waitTimes = {
            'react': 3000,
            'vue': 2500,
            'angular': 3500,
            'svelte': 2000,
            'vanilla': 1000
        };
        return waitTimes[this.frameworkDetected] || 2000;
    }
    
    async simulateHumanScroll() {
        return new Promise((resolve) => {
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollDistance = scrollHeight - viewportHeight;
            
            if (scrollDistance <= 0) {
                resolve();
                return;
            }
            
            let currentScroll = 0;
            const scrollStep = () => {
                if (currentScroll < scrollDistance) {
                    // Variable speed with human-like pauses
                    const scrollAmount = 50 + Math.random() * 150;
                    window.scrollBy(0, scrollAmount);
                    currentScroll += scrollAmount;
                    this.scrollProgress = Math.min(100, (currentScroll / scrollDistance) * 100);
                    
                    // Random pause between scrolls (human-like)
                    const pauseTime = 100 + Math.random() * 300;
                    setTimeout(scrollStep, pauseTime);
                    
                    // Occasionally pause longer (like human reading)
                    if (Math.random() < 0.1) {
                        setTimeout(scrollStep, pauseTime + 500);
                    }
                } else {
                    // Scroll back to top smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(resolve, 1000);
                }
            };
            
            scrollStep();
        });
    }
    
    async waitForContentStability() {
        return new Promise((resolve) => {
            let lastContentLength = document.body.innerHTML.length;
            let stableCount = 0;
            const requiredStableChecks = 3;
            
            const checkStability = () => {
                const currentLength = document.body.innerHTML.length;
                
                if (Math.abs(currentLength - lastContentLength) < 100) {
                    stableCount++;
                } else {
                    stableCount = 0;
                }
                
                lastContentLength = currentLength;
                
                if (stableCount >= requiredStableChecks) {
                    resolve();
                } else {
                    setTimeout(checkStability, 500);
                }
            };
            
            checkStability();
        });
    }
    
    extractContent() {
        try {
            // Clone the document for Readability
            const documentClone = document.cloneNode(true);
            
            // Pre-process to improve extraction
            this.preprocessDocument(documentClone);
            
            // Use Readability.js to extract content
            const reader = new Readability(documentClone);
            const article = reader.parse();
            
            if (article && article.content) {
                // Post-process extracted content
                article.content = this.postprocessContent(article.content);
            }
            
            return article;
            
        } catch (error) {
            console.error('Readability extraction failed:', error);
            // Fallback to basic extraction
            return this.fallbackExtraction();
        }
    }
    
    preprocessDocument(doc) {
        // Remove common problematic elements before extraction
        const selectorsToRemove = [
            'script',
            'style',
            'iframe:not([src*="youtube"]):not([src*="vimeo"])',
            '.advertisement',
            '.ads',
            '.social-share',
            '.cookie-banner',
            '.popup',
            '.modal',
            '[class*="subscribe"]',
            '[class*="newsletter"]'
        ];
        
        selectorsToRemove.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Expand collapsed content
        doc.querySelectorAll('[style*="display: none"]').forEach(el => {
            el.style.display = 'block';
        });
        
        doc.querySelectorAll('[hidden]').forEach(el => {
            el.removeAttribute('hidden');
        });
    }
    
    postprocessContent(content) {
        // Clean up extracted content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Remove empty paragraphs
        tempDiv.querySelectorAll('p').forEach(p => {
            if (!p.textContent.trim()) {
                p.remove();
            }
        });
        
        // Fix image sources
        tempDiv.querySelectorAll('img').forEach(img => {
            // Handle lazy-loaded images
            const dataSrc = img.getAttribute('data-src') || 
                          img.getAttribute('data-lazy-src') ||
                          img.getAttribute('data-original');
            if (dataSrc && !img.src) {
                img.src = dataSrc;
            }
            
            // Make URLs absolute
            if (img.src && !img.src.startsWith('http')) {
                img.src = new URL(img.src, window.location.href).href;
            }
        });
        
        return tempDiv.innerHTML;
    }
    
    fallbackExtraction() {
        // Basic extraction when Readability fails
        const content = document.querySelector('main, article, [role="main"], .content, #content');
        
        if (content) {
            return {
                title: document.title,
                content: content.innerHTML,
                excerpt: content.textContent.substring(0, 200),
                length: content.textContent.length,
                siteName: window.location.hostname
            };
        }
        
        return null;
    }
    
    executeProxyCommand(command, data, sendResponse) {
        // Handle commands from the visible tab's proxy controller
        switch (command) {
            case 'scroll':
                window.scrollTo(0, data.scrollPosition);
                sendResponse({ success: true });
                break;
                
            case 'click':
                const element = document.querySelector(data.selector);
                if (element) {
                    element.click();
                    sendResponse({ success: true });
                } else {
                    sendResponse({ error: 'Element not found' });
                }
                break;
                
            case 'fillForm':
                const input = document.querySelector(data.selector);
                if (input) {
                    input.value = data.value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    sendResponse({ success: true });
                } else {
                    sendResponse({ error: 'Input not found' });
                }
                break;
                
            case 'getState':
                sendResponse({
                    scrollPosition: window.scrollY,
                    documentHeight: document.documentElement.scrollHeight,
                    viewportHeight: window.innerHeight,
                    url: window.location.href
                });
                break;
                
            default:
                sendResponse({ error: 'Unknown command' });
        }
    }
    
    reportProgress(status, progress) {
        browser.runtime.sendMessage({
            action: 'extractionProgress',
            status: status,
            progress: progress
        });
    }
}

// Initialize the stealth extractor
new StealthExtractor();