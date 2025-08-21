// VibeReader v2.0 - Stealth Content Extractor
// Runs in hidden tab to extract clean content after full page load

class StealthExtractor {
    constructor() {
        this.extractionAttempts = 0;
        this.maxAttempts = 5;
        this.scrollProgress = 0;
        this.frameworkDetected = null;
        this.mutationObserver = null;
        this.contentStabilityResolver = null;
        this.lastContentHash = null;
        this.init();
    }
    
    init() {
        console.log('🕵️ StealthExtractor.init() // initializing in tab:', window.location.href);
        
        // Listen for extraction commands from background script
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Allow async response
        });
        
        // Detect JavaScript framework
        this.detectFramework();
        
        // Report initialization
        this.reportProgress('initialized', 0);
        
        console.log('🕵️ StealthExtractor.init() // ready for extraction commands');
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
        const extractionStart = performance.now();
        try {
            console.log('🕵️ StealthExtractor.startExtraction() // starting extraction in hidden tab:', window.location.href, {
                config: config,
                startTime: new Date().toISOString()
            });
            this.reportProgress('waiting_for_framework', 10);
            
            // Step 1: Wait for framework to fully hydrate (keep original wait)
            if (config.waitForFramework) {
                const frameworkStart = performance.now();
                console.log('🕵️ StealthExtractor.startExtraction() // waiting for framework:', this.frameworkDetected);
                await this.waitForFramework();
                console.log(`⏱️ Framework wait completed: ${(performance.now() - frameworkStart).toFixed(1)}ms`);
            }
            
            this.reportProgress('extracting', 40);
            
            // Step 2: Extract content immediately (don't wait for scroll)
            const extractionContentStart = performance.now();
            console.log('🕵️ StealthExtractor.startExtraction() // extracting content with Readability.js');
            const content = await this.extractWithReadability();
            console.log(`⏱️ Content extraction: ${(performance.now() - extractionContentStart).toFixed(1)}ms`);
            
            this.reportProgress('complete', 90);
            
            // Step 3: Send content immediately
            console.log('🕵️ StealthExtractor.startExtraction() // sending extracted content to background');
            this.reportExtraction(content);
            
            // Step 4: Do scroll simulation in background (non-blocking)
            if (config.simulateScroll) {
                console.log('🕵️ StealthExtractor.startExtraction() // starting background scroll for lazy content');
                this.backgroundScrollAndUpdate();
            }
            
            console.log(`⏱️ Total extraction time: ${(performance.now() - extractionStart).toFixed(1)}ms`);
            return content;
        } catch (error) {
            console.error('❌ StealthExtractor.startExtraction() // extraction failed:', {
                error: error.message,
                stack: error.stack,
                url: window.location.href,
                framework: this.frameworkDetected,
                extractionTime: (performance.now() - extractionStart).toFixed(1) + 'ms'
            });
            this.reportProgress('error', 0);
            throw error;
        }
    }
    
    // New method: Non-blocking background scroll
    async backgroundScrollAndUpdate() {
        try {
            // Do scroll simulation in background
            await this.simulateHumanScroll();
            
            // Wait for any new content to stabilize
            await this.waitForContentStability();
            
            // Re-extract and update if content changed significantly
            const newContent = await this.extractWithReadability();
            const originalLength = this.lastExtractedContent?.length || 0;
            const newLength = newContent.extractedContent?.length || 0;
            
            // If content increased significantly, send update
            if (newLength > originalLength * 1.2) {
                console.log('🕵️ StealthExtractor.backgroundScrollAndUpdate() // found significant new content after scroll');
                this.reportExtraction(newContent);
            }
        } catch (error) {
            console.log('⚠️ Background scroll failed, but main content already extracted:', error);
        }
    }
    
    async extractWithReadability() {
        const extractedContent = this.extractContent();
        
        if (extractedContent && extractedContent.content) {
            console.log('🕵️ StealthExtractor.extractWithReadability() // content extracted successfully, length:', extractedContent.content.length);
            this.lastExtractedContent = extractedContent.content;
            return extractedContent;
        } else {
            throw new Error('Content extraction failed');
        }
    }
    
    reportExtraction(extractedContent) {
        console.log('🕵️ StealthExtractor.reportExtraction() // sending content to background script');
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
        // Reduced wait times for faster loading
        const waitTimes = {
            'react': 800,
            'vue': 600,
            'angular': 1000,
            'svelte': 500,
            'vanilla': 300
        };
        return waitTimes[this.frameworkDetected] || 500;
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
                    
                    // Quick pause between scrolls for lazy loading
                    const pauseTime = 50 + Math.random() * 100;
                    setTimeout(scrollStep, pauseTime);
                } else {
                    // Scroll back to top quickly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(resolve, 300);
                }
            };
            
            scrollStep();
        });
    }
    
    async waitForContentStability() {
        return new Promise((resolve) => {
            this.contentStabilityResolver = resolve;
            
            // Set up MutationObserver to detect DOM changes
            this.mutationObserver = new MutationObserver((mutations) => {
                this.handleContentMutation(mutations);
            });
            
            // Start observing DOM changes
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'data-src', 'style', 'class'],
                characterData: true
            });
            
            // Get initial content hash
            this.lastContentHash = this.getContentHash();
            
            // Start stability timer
            this.startStabilityTimer();
            
            console.log('🕵️ MutationObserver started watching for content changes');
        });
    }
    
    handleContentMutation(mutations) {
        // Check if mutations are significant
        let significantChange = false;
        
        for (const mutation of mutations) {
            // Text content changes
            if (mutation.type === 'characterData') {
                significantChange = true;
                break;
            }
            
            // New elements added
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if it's a content element (not script/style)
                        if (!['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) {
                            significantChange = true;
                            break;
                        }
                    }
                }
            }
            
            // Image src changes (lazy loading)
            if (mutation.type === 'attributes' && 
                ['src', 'data-src'].includes(mutation.attributeName)) {
                significantChange = true;
                break;
            }
        }
        
        if (significantChange) {
            console.log('🕵️ Significant content change detected, resetting stability timer');
            this.resetStabilityTimer();
        }
    }
    
    startStabilityTimer() {
        this.stabilityTimeout = setTimeout(() => {
            console.log('🕵️ Content appears stable, resolving');
            this.cleanupMutationObserver();
            if (this.contentStabilityResolver) {
                this.contentStabilityResolver();
                this.contentStabilityResolver = null;
            }
        }, 800); // Wait 800ms for stability
    }
    
    resetStabilityTimer() {
        if (this.stabilityTimeout) {
            clearTimeout(this.stabilityTimeout);
        }
        this.startStabilityTimer();
    }
    
    cleanupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        if (this.stabilityTimeout) {
            clearTimeout(this.stabilityTimeout);
            this.stabilityTimeout = null;
        }
    }
    
    getContentHash() {
        // Simple hash of content for change detection
        const content = document.body.textContent || '';
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    
    extractContent() {
        try {
            // Check if Readability is available
            if (typeof Readability === 'undefined') {
                console.error('🕵️ StealthExtractor.extractContent() // Readability.js not loaded, using fallback');
                return this.fallbackExtraction();
            }
            
            // Clone the document for Readability (deep clone required)
            const documentClone = document.cloneNode(true);
            
            // Pre-process to improve extraction
            this.preprocessDocument(documentClone);
            
            // Use the real Mozilla Readability.js with proper options
            console.log('🕵️ StealthExtractor.extractContent() // creating Readability instance');
            const reader = new Readability(documentClone, {
                debug: false,
                maxElemsToParse: 0, // No limit for stealth extraction
                nbTopCandidates: 5,
                charThreshold: 500,
                classesToPreserve: ['caption', 'emoji', 'hidden'],
                keepClasses: true
            });
            
            const article = reader.parse();
            
            if (article && article.content) {
                console.log('🕵️ StealthExtractor.extractContent() // Readability.js extraction successful');
                // Post-process extracted content
                article.content = this.postprocessContent(article.content);
                return article;
            } else {
                console.warn('🕵️ StealthExtractor.extractContent() // Readability.js returned null, trying fallback');
                return this.fallbackExtraction();
            }
            
        } catch (error) {
            console.error('🕵️ StealthExtractor.extractContent() // Readability extraction failed:', error);
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
            '[class*="newsletter"]',
            // Navigation and layout tables (common in legacy sites)
            'table[border="0"][cellpadding="0"][cellspacing="0"]',
            'table[border="0"][cellpadding="5"][cellspacing="0"]',
            'nobr', // Legacy no-break tags
            'center', // Legacy center tags
            // Common ad-related patterns (using valid CSS selectors)
            '[class*="ad"], [class*="banner"], [class*="sponsor"]',
            '[id*="ad"], [id*="banner"], [id*="sponsor"]',
            'table[width="488"][height="60"]', // Specific ad table dimensions
            // Footer and legal content
            '.footer-links',
            'font[size="-1"]'
        ];
        
        selectorsToRemove.forEach(selector => {
            try {
                doc.querySelectorAll(selector).forEach(el => el.remove());
            } catch (e) {
                // Skip invalid selectors
                console.warn('Invalid selector:', selector);
            }
        });
        
        // Remove navigation tables with image links only
        doc.querySelectorAll('table').forEach(table => {
            const cells = table.querySelectorAll('td');
            const imageLinks = table.querySelectorAll('a img');
            
            // If table is mostly image links for navigation, remove it
            if (cells.length > 3 && imageLinks.length > cells.length * 0.6) {
                console.log('🗑️ Removing navigation table with', imageLinks.length, 'image links');
                table.remove();
            }
        });
        
        // Remove tables that contain mostly empty cells or just whitespace
        doc.querySelectorAll('table').forEach(table => {
            const cells = table.querySelectorAll('td, th');
            let emptyCount = 0;
            
            cells.forEach(cell => {
                const text = cell.textContent.trim();
                if (!text || text.length < 5) {
                    emptyCount++;
                }
            });
            
            // If more than 70% of cells are empty, remove the table
            if (cells.length > 0 && emptyCount / cells.length > 0.7) {
                console.log('🗑️ Removing mostly empty table');
                table.remove();
            }
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
        console.log('🕵️ StealthExtractor.fallbackExtraction() // attempting basic content extraction');
        
        // Try multiple content selectors in order of preference
        const contentSelectors = [
            'main',
            'article', 
            '[role="main"]',
            '.main-content',
            '.content',
            '#content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.story-body',
            '.article-body'
        ];
        
        let content = null;
        for (const selector of contentSelectors) {
            content = document.querySelector(selector);
            if (content && content.textContent.trim().length > 200) {
                console.log(`🕵️ StealthExtractor.fallbackExtraction() // found content using selector: ${selector}`);
                break;
            }
        }
        
        // If still no content, try to find the largest text block
        if (!content) {
            console.log('🕵️ StealthExtractor.fallbackExtraction() // no semantic selectors worked, finding largest text block');
            const allElements = document.querySelectorAll('div, section, p');
            let largestElement = null;
            let largestTextLength = 0;
            
            allElements.forEach(el => {
                const textLength = el.textContent.trim().length;
                if (textLength > largestTextLength && textLength > 500) {
                    largestElement = el;
                    largestTextLength = textLength;
                }
            });
            
            content = largestElement;
        }
        
        if (content) {
            const textContent = content.textContent.trim();
            console.log(`🕵️ StealthExtractor.fallbackExtraction() // extracted ${textContent.length} characters`);
            
            return {
                title: document.title || 'Untitled',
                byline: this.extractByline(),
                content: content.innerHTML,
                excerpt: textContent.substring(0, 300),
                length: textContent.length,
                siteName: this.extractSiteName(),
                textContent: textContent
            };
        }
        
        console.error('🕵️ StealthExtractor.fallbackExtraction() // no content found');
        return null;
    }
    
    extractByline() {
        const bylineSelectors = [
            '[rel="author"]',
            '.author',
            '.byline', 
            '.writer',
            '.journalist',
            'meta[name="author"]'
        ];
        
        for (const selector of bylineSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent || element.getAttribute('content') || '';
            }
        }
        
        return '';
    }
    
    extractSiteName() {
        // Try meta tags first
        const siteNameMeta = document.querySelector('meta[property="og:site_name"]') ||
                           document.querySelector('meta[name="application-name"]') ||
                           document.querySelector('meta[name="apple-mobile-web-app-title"]');
        
        if (siteNameMeta) {
            return siteNameMeta.getAttribute('content');
        }
        
        // Fallback to hostname
        return window.location.hostname;
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
void new StealthExtractor();