// VibeReader v2.0 - Stealth Content Extractor
// Simple singleton pattern without IIFE wrapper

// Prevent multiple injections with simple guard
if (window.__vibeReaderStealthExtractor) {
    console.log('⚠️ StealthExtractor already exists, skipping');
} else {

    class StealthExtractor {
        constructor() {
            this.extractionAttempts = 0;
            this.maxAttempts = 5;
            this.scrollProgress = 0;
            this.frameworkDetected = null;
            this.mutationObserver = null;
            this.contentStabilityResolver = null;
            this.lastContentHash = null;
            this.extractionInProgress = false;

            this.init();
        }

        init() {
            console.log('🕵️ StealthExtractor initializing:', {
                url: window.location.href,
                timestamp: new Date().toISOString()
            });

            // Set up message listener
            browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                this.handleMessageSafe(request, sender, sendResponse);
                return true;
            });

            this.detectFramework();
            this.reportProgress('initialized', 0);

            console.log('✅ StealthExtractor ready');
        }

        async handleMessageSafe(request, sender, sendResponse) {
            try {
                const result = await this.handleMessage(request, sender);
                sendResponse(this.makeSerializable(result));
            } catch (error) {
                console.error('❌ Message handling error:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'Unknown error'
                });
            }
        }

        makeSerializable(obj) {
            if (obj === undefined) return { success: true };
            if (obj === null || typeof obj !== 'object') return obj;

            const safe = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value !== 'function' && value !== undefined) {
                    if (typeof value === 'object' && value !== null) {
                        safe[key] = this.makeSerializable(value);
                    } else {
                        safe[key] = value;
                    }
                }
            }
            return safe;
        }

        async handleMessage(request, sender) {
            console.log('📨 Received message:', request.action);

            switch (request.action) {
                case 'ping':
                    return { success: true, type: 'extractor' };

                case 'extractContent':
                    if (this.extractionInProgress) {
                        console.log('⚠️ Extraction already in progress');
                        return { success: false, error: 'Extraction in progress' };
                    }
                    return await this.startExtraction(request.config);

                case 'executeProxyCommand':
                    return await this.executeProxyCommand(request.command, request.data);

                default:
                    return { success: false, error: 'Unknown action' };
            }
        }

        detectFramework() {
            if (window.React || document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
                this.frameworkDetected = 'react';
            } else if (window.Vue || document.querySelector('#app[data-v-]') || document.querySelector('[data-server-rendered]')) {
                this.frameworkDetected = 'vue';
            } else if (window.angular || document.querySelector('[ng-app]') || document.querySelector('[ng-version]')) {
                this.frameworkDetected = 'angular';
            } else if (document.querySelector('[data-svelte]')) {
                this.frameworkDetected = 'svelte';
            } else if (document.querySelector('#__next')) {
                this.frameworkDetected = 'nextjs';
            } else {
                this.frameworkDetected = 'vanilla';
            }

            console.log('🔍 Framework detected:', this.frameworkDetected);
        }

        async startExtraction(config) {
            const startTime = performance.now();

            try {
                this.extractionInProgress = true;
                console.log('🕵️ Starting extraction:', config);

                this.reportProgress('waiting_for_framework', 10);

                if (config.waitForFramework) {
                    await this.waitForFramework();
                }

                this.reportProgress('extracting', 40);

                const content = await this.extractWithReadability();

                if (!content || !content.content) {
                    throw new Error('No content extracted');
                }

                this.reportProgress('complete', 90);

                this.reportExtraction(content);

                if (config.simulateScroll) {
                    this.backgroundScrollAndUpdate();
                }

                console.log(`✅ Extraction complete in ${(performance.now() - startTime).toFixed(1)}ms`);

                return {
                    success: true,
                    extractionTime: performance.now() - startTime
                };

            } catch (error) {
                console.error('❌ Extraction failed:', error);
                this.reportProgress('error', 0);

                return {
                    success: false,
                    error: error.message,
                    extractionTime: performance.now() - startTime
                };

            } finally {
                this.extractionInProgress = false;
            }
        }

        async waitForFramework() {
            return new Promise((resolve) => {
                const waitTime = this.getFrameworkWaitTime();
                const startTime = Date.now();

                const checkReady = () => {
                    let isReady = false;

                    switch (this.frameworkDetected) {
                        case 'react':
                        case 'nextjs':
                            const reactRoot = document.querySelector('[data-reactroot], #root, #__next');
                            isReady = reactRoot && reactRoot.children.length > 0;
                            break;

                        case 'vue':
                            const vueApp = document.querySelector('#app');
                            isReady = vueApp && (vueApp.hasAttribute('data-v-') || vueApp.children.length > 0);
                            break;

                        case 'angular':
                            const ngApp = document.querySelector('[ng-app], [ng-version]');
                            isReady = ngApp && ngApp.children.length > 0;
                            break;

                        default:
                            isReady = document.body.children.length > 0;
                    }

                    if (isReady || Date.now() - startTime > waitTime) {
                        console.log(`✅ Framework ready after ${Date.now() - startTime}ms`);
                        resolve();
                    } else {
                        requestAnimationFrame(checkReady);
                    }
                };

                checkReady();
            });
        }

        getFrameworkWaitTime() {
            const waitTimes = {
                'react': 800,
                'nextjs': 1000,
                'vue': 600,
                'angular': 1000,
                'svelte': 500,
                'vanilla': 300
            };
            return waitTimes[this.frameworkDetected] || 500;
        }

        async extractWithReadability() {
            try {
                const extractedContent = this.extractContent();

                if (extractedContent && extractedContent.content) {
                    console.log('✅ Content extracted:', {
                        length: extractedContent.content.length,
                        title: extractedContent.title
                    });
                    return extractedContent;
                }

                return this.fallbackExtraction();

            } catch (error) {
                console.error('Extraction error:', error);
                return this.fallbackExtraction();
            }
        }

        extractContent() {
            try {
                if (typeof Readability === 'undefined') {
                    console.error('Readability.js not loaded');
                    return null;
                }

                const documentClone = document.cloneNode(true);

                this.preprocessDocument(documentClone);

                const reader = new Readability(documentClone, {
                    debug: false,
                    maxElemsToParse: 0,
                    nbTopCandidates: 5,
                    charThreshold: 500,
                    classesToPreserve: ['caption', 'emoji'],
                    keepClasses: true
                });

                const article = reader.parse();

                if (article && article.content) {
                    article.content = this.postprocessContent(article.content);
                    return article;
                }

                return null;

            } catch (error) {
                console.error('Readability parsing error:', error);
                return null;
            }
        }

        preprocessDocument(doc) {
            const selectorsToRemove = [
                'script',
                'style',
                'noscript',
                'iframe:not([src*="youtube"]):not([src*="vimeo"])',
                '.advertisement',
                '.ads',
                '[class*="ad-"]',
                '[id*="ad-"]',
                '.social-share',
                '.cookie-banner',
                '.popup',
                '.modal',
                '.overlay:not(.vibe-reader-overlay)',
                '[class*="subscribe"]',
                '[class*="newsletter"]',
                '.comments',
                '#comments',
                '.related-posts',
                'aside.sidebar',
                'nav',
                'header:not(article header)',
                'footer:not(article footer)'
            ];

            selectorsToRemove.forEach(selector => {
                try {
                    doc.querySelectorAll(selector).forEach(el => el.remove());
                } catch (e) {
                    // Invalid selector, skip
                }
            });

            doc.querySelectorAll('[style*="display: none"], [style*="display:none"]').forEach(el => {
                el.style.display = '';
            });

            doc.querySelectorAll('[hidden]').forEach(el => {
                el.removeAttribute('hidden');
            });

            doc.querySelectorAll('img[data-src], img[data-lazy-src]').forEach(img => {
                const src = img.getAttribute('data-src') ||
                    img.getAttribute('data-lazy-src') ||
                    img.getAttribute('data-original');
                if (src) {
                    img.setAttribute('src', src);
                }
            });
        }

        postprocessContent(content) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;

            tempDiv.querySelectorAll('p').forEach(p => {
                if (!p.textContent.trim()) {
                    p.remove();
                }
            });

            tempDiv.querySelectorAll('img, a').forEach(el => {
                const attr = el.tagName === 'IMG' ? 'src' : 'href';
                const url = el.getAttribute(attr);

                if (url && !url.startsWith('http') && !url.startsWith('data:')) {
                    try {
                        el.setAttribute(attr, new URL(url, window.location.href).href);
                    } catch (e) {
                        // Invalid URL
                    }
                }
            });

            return tempDiv.innerHTML;
        }

        fallbackExtraction() {
            console.log('🔍 Attempting fallback extraction');

            const selectors = [
                'main',
                'article',
                '[role="main"]',
                '.main-content',
                '#main-content',
                '.content',
                '#content',
                '.post-content',
                '.entry-content',
                '.article-content',
                '.story-body'
            ];

            let contentEl = null;

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el && el.textContent.trim().length > 200) {
                    contentEl = el;
                    break;
                }
            }

            if (!contentEl) {
                let maxLength = 0;
                document.querySelectorAll('div, section, article').forEach(el => {
                    const length = el.textContent.trim().length;
                    if (length > maxLength && length > 500) {
                        maxLength = length;
                        contentEl = el;
                    }
                });
            }

            if (contentEl) {
                const textContent = contentEl.textContent.trim();

                return {
                    title: document.title || 'Untitled',
                    byline: this.extractByline(),
                    content: contentEl.innerHTML,
                    excerpt: textContent.substring(0, 300),
                    length: textContent.split(/\s+/).length,
                    siteName: this.extractSiteName()
                };
            }

            return null;
        }

        extractByline() {
            const selectors = [
                '[rel="author"]',
                '.author',
                '.byline',
                '.by-line',
                '.writer',
                'meta[name="author"]'
            ];

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const content = el.textContent || el.getAttribute('content');
                    if (content) return content.trim();
                }
            }

            return '';
        }

        extractSiteName() {
            const metaSelectors = [
                'meta[property="og:site_name"]',
                'meta[name="application-name"]',
                'meta[name="apple-mobile-web-app-title"]'
            ];

            for (const selector of metaSelectors) {
                const meta = document.querySelector(selector);
                if (meta) {
                    const content = meta.getAttribute('content');
                    if (content) return content;
                }
            }

            return window.location.hostname;
        }

        reportExtraction(extractedContent) {
            console.log('📤 Sending extracted content to background');

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
            }).catch(error => {
                console.error('Failed to send content:', error);
            });
        }

        async backgroundScrollAndUpdate() {
            try {
                console.log('📜 Starting background scroll for lazy content');

                await this.simulateHumanScroll();
                await this.waitForContentStability();

                const newContent = await this.extractWithReadability();

                if (newContent && newContent.content) {
                    const newLength = newContent.content.length;
                    const oldLength = this.lastContentLength || 0;

                    if (newLength > oldLength * 1.2) {
                        console.log('📤 Sending updated content after scroll');
                        this.reportExtraction(newContent);
                    }

                    this.lastContentLength = newLength;
                }

            } catch (error) {
                console.log('Background scroll update failed:', error);
            }
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
                        const scrollAmount = 50 + Math.random() * 150;
                        window.scrollBy(0, scrollAmount);
                        currentScroll += scrollAmount;
                        this.scrollProgress = Math.min(100, (currentScroll / scrollDistance) * 100);

                        this.reportProgress('simulating_scroll', Math.floor(this.scrollProgress));

                        setTimeout(scrollStep, 50 + Math.random() * 100);
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setTimeout(resolve, 300);
                    }
                };

                scrollStep();
            });
        }

        async waitForContentStability() {
            return new Promise((resolve) => {
                let stabilityTimer = null;
                let lastHash = this.getContentHash();

                const checkStability = () => {
                    const currentHash = this.getContentHash();

                    if (currentHash === lastHash) {
                        resolve();
                    } else {
                        lastHash = currentHash;
                        clearTimeout(stabilityTimer);
                        stabilityTimer = setTimeout(checkStability, 500);
                    }
                };

                stabilityTimer = setTimeout(checkStability, 500);
                setTimeout(resolve, 3000);
            });
        }

        getContentHash() {
            const content = document.body.textContent || '';
            let hash = 0;

            for (let i = 0; i < Math.min(content.length, 1000); i++) {
                const char = content.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }

            return hash;
        }

        async executeProxyCommand(command, data) {
            try {
                switch (command) {
                    case 'scroll':
                        window.scrollTo(0, data.scrollPosition);
                        return { success: true };

                    case 'click':
                        const clickEl = document.querySelector(data.selector);
                        if (clickEl) {
                            clickEl.click();
                            return { success: true };
                        }
                        return { success: false, error: 'Element not found' };

                    case 'getState':
                        return {
                            success: true,
                            scrollPosition: window.scrollY,
                            documentHeight: document.documentElement.scrollHeight,
                            viewportHeight: window.innerHeight,
                            url: window.location.href
                        };

                    default:
                        return { success: false, error: 'Unknown command' };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        reportProgress(status, progress) {
            browser.runtime.sendMessage({
                action: 'extractionProgress',
                status: status,
                progress: progress
            }).catch(error => {
                console.log('Could not send progress:', error);
            });
        }
    }

    // Create singleton instance
    window.__vibeReaderStealthExtractor = new StealthExtractor();

    true;
}