// VibeReader v2.0 - Stealth Content Extractor
// Simple singleton pattern without IIFE wrapper

// Prevent multiple injections with simple guard
if (window.__vibeReaderStealthExtractor) {
    console.log('⚠️ StealthExtractor already exists, skipping');
} else {
    try {
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
                if (obj === undefined) return {success: true};
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
                        return {success: true, type: 'extractor'};

                    case 'extractContent':
                        if (this.extractionInProgress) {
                            console.log('⚠️ Extraction already in progress');
                            return {success: false, error: 'Extraction in progress'};
                        }
                        return await this.startExtraction(request.config);

                    case 'executeProxyCommand':
                        return await this.executeProxyCommand(request.command, request.data);

                    default:
                        return {success: false, error: 'Unknown action'};
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
                        const error = 'Readability.js library not available';
                        console.error('❌', error);
                        throw new Error(error);
                    }

                    console.log('📖 Starting Readability extraction');
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

                    if (!article) {
                        throw new Error('Readability failed to parse document');
                    }

                    if (!article.content || article.content.trim().length === 0) {
                        throw new Error('No readable content found on page');
                    }

                    article.content = this.postprocessContent(article.content);
                    console.log('✅ Content extracted successfully:', {
                        title: article.title,
                        length: article.content.length
                    });
                    return article;

                } catch (error) {
                    console.error('❌ Content extraction failed:', error.message);
                    throw error; // Re-throw with specific error message
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

                // Gather enhanced metadata for terminal displays
                const domStats = this.gatherDOMStats();

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
                        framework: this.frameworkDetected,
                        // Enhanced metadata for terminal displays
                        readabilityScore: this.getReadabilityScore(extractedContent),
                        hiddenTabElements: domStats.totalElements,
                        mutations: domStats.mutations,
                        jsFrameworks: domStats.frameworks,
                        performanceMetrics: domStats.performance,
                        // Additional Readability.js data
                        textLength: extractedContent.textContent?.length || 0,
                        publishedTime: extractedContent.publishedTime,
                        direction: extractedContent.dir,
                        language: extractedContent.lang
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
                            window.scrollTo({top: 0, behavior: 'smooth'});
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
                            return {success: true};

                        case 'click':
                            const clickEl = document.querySelector(data.selector);
                            if (clickEl) {
                                clickEl.click();
                                return {success: true};
                            }
                            return {success: false, error: 'Element not found'};

                        case 'getState':
                            return {
                                success: true,
                                scrollPosition: window.scrollY,
                                documentHeight: document.documentElement.scrollHeight,
                                viewportHeight: window.innerHeight,
                                url: window.location.href
                            };

                        default:
                            return {success: false, error: 'Unknown command'};
                    }
                } catch (error) {
                    return {success: false, error: error.message};
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

            gatherDOMStats() {
                return {
                    totalElements: document.querySelectorAll('*').length,
                    mutations: this.mutationCount || 0,
                    frameworks: this.detectFrameworks(),
                    performance: {
                        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
                    }
                };
            }

            detectFrameworks() {
                const frameworks = [];
                if (window.React) frameworks.push('React');
                if (window.Vue) frameworks.push('Vue');
                if (window.angular) frameworks.push('Angular');
                if (window.jQuery || window.$) frameworks.push('jQuery');
                if (document.querySelector('#__next')) frameworks.push('Next.js');
                if (document.querySelector('[data-svelte]')) frameworks.push('Svelte');
                return frameworks.join(', ') || 'Vanilla';
            }

            getReadabilityScore(content) {
                if (!content) return 'N/A (0/100)';

                const numericalScore = this.calculateNumericalScore(content);
                const qualitativeScore = this.getQualitativeScore(numericalScore);
                
                return `${qualitativeScore} (${numericalScore}/100)`;
            }

            calculateNumericalScore(content) {
                if (!content) return 0;

                let score = 0;
                const textContent = content.textContent || '';
                const htmlContent = content.content || '';
                const textLength = textContent.length;
                const contentLength = htmlContent.length;

                // 1. Text Density (0-40 points) - How much readable text vs markup
                if (contentLength > 0) {
                    const textDensity = textLength / contentLength;
                    score += Math.min(40, textDensity * 50); // Boost density scoring
                }

                // 2. Content Length (0-20 points) - Optimal content volume
                const wordCount = Math.ceil(textLength / 5); // Rough word estimate
                if (wordCount >= 1000 && wordCount <= 3000) {
                    score += 20; // Sweet spot for articles
                } else if (wordCount >= 500 && wordCount < 1000) {
                    score += 15; // Good length
                } else if (wordCount >= 200 && wordCount < 500) {
                    score += 10; // Acceptable length
                } else if (wordCount >= 100) {
                    score += 5; // Short but usable
                }

                // 3. Structure Quality (0-20 points) - HTML structure indicators
                const headings = (htmlContent.match(/<h[1-6]/gi) || []).length;
                const paragraphs = (htmlContent.match(/<p>/gi) || []).length;
                const lists = (htmlContent.match(/<[uo]l>/gi) || []).length;
                
                const structureScore = Math.min(20, 
                    (headings * 3) + // Headings are important
                    (paragraphs * 0.3) + // Paragraphs show organization
                    (lists * 2) // Lists show structured content
                );
                score += structureScore;

                // 4. Enhanced Media Quality (0-10 points) - Size and quality-based scoring
                let mediaScore = 0;
                
                // Parse images from HTML and check their dimensions
                const imgRegex = /<img[^>]*>/gi;
                const imgMatches = htmlContent.match(imgRegex) || [];
                let qualityImages = 0;
                let greatImages = 0;
                
                imgMatches.forEach(imgTag => {
                    const widthMatch = imgTag.match(/width\s*=\s*["']?(\d+)/i);
                    const heightMatch = imgTag.match(/height\s*=\s*["']?(\d+)/i);
                    
                    if (widthMatch && heightMatch) {
                        const width = parseInt(widthMatch[1]);
                        const height = parseInt(heightMatch[1]);
                        const pixels = width * height;
                        
                        // Great size range: 600x400 to 1920x1080 (240K to 2M pixels)
                        if (pixels >= 240000 && pixels <= 2073600 && width >= 600 && height >= 400) {
                            greatImages++;
                        }
                        // OK size range: 300x200 to 1200x800 (60K to 960K pixels)  
                        else if (pixels >= 60000 && pixels <= 960000 && width >= 300 && height >= 200) {
                            qualityImages++;
                        }
                    }
                });
                
                // Parse videos and check dimensions
                const videoRegex = /<video[^>]*>/gi;
                const videoMatches = htmlContent.match(videoRegex) || [];
                let qualityVideos = 0;
                let greatVideos = 0;
                
                videoMatches.forEach(videoTag => {
                    const widthMatch = videoTag.match(/width\s*=\s*["']?(\d+)/i);
                    const heightMatch = videoTag.match(/height\s*=\s*["']?(\d+)/i);
                    
                    if (widthMatch && heightMatch) {
                        const width = parseInt(widthMatch[1]);
                        const height = parseInt(heightMatch[1]);
                        
                        // Great video size: 720p+ (1280x720 or larger)
                        if (width >= 1280 && height >= 720) {
                            greatVideos++;
                        }
                        // OK video size: 480p+ (854x480 or larger)
                        else if (width >= 854 && height >= 480) {
                            qualityVideos++;
                        }
                    }
                });
                
                // Tables still count as structured data
                const tables = (htmlContent.match(/<table/gi) || []).length;
                
                mediaScore = Math.min(10,
                    (greatImages * 1.5) + // High-quality images
                    (qualityImages * 0.8) + // OK quality images  
                    (greatVideos * 3) + // High-quality videos
                    (qualityVideos * 2) + // OK quality videos
                    (tables * 1.5) // Tables show structured data
                );
                
                score += mediaScore;

                // 5. Enhanced Text Quality (0-10 points) - Favor proper sentences over script leakage
                let textQualityScore = 0;
                
                // Find proper sentences: start with capital, end with punctuation, reasonable internal punctuation
                const properSentences = textContent.match(/[A-Z][^.!?]*[,.;:\-–—'']*[^.!?]*[.!?]/g) || [];
                const totalTextInSentences = properSentences.join('').length;
                const sentenceTextRatio = totalTextInSentences / Math.max(textContent.length, 1);
                
                // Score based on how much text is in proper sentences (weighted heavily)
                textQualityScore += sentenceTextRatio * 6; // Up to 6 points for sentence structure
                
                if (properSentences.length > 0) {
                    // Check sentence length distribution (20-300 characters)
                    const validLengthSentences = properSentences.filter(s => s.length >= 20 && s.length <= 300);
                    const validLengthRatio = validLengthSentences.length / properSentences.length;
                    textQualityScore += validLengthRatio * 2; // Up to 2 points for proper length
                    
                    // Check average word length in sentences (3-5 chars = English-like)
                    const wordsInSentences = properSentences.join(' ').split(/\s+/).filter(w => w.length > 0);
                    if (wordsInSentences.length > 0) {
                        const avgWordLength = wordsInSentences.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0) / wordsInSentences.length;
                        if (avgWordLength >= 3 && avgWordLength <= 5) {
                            textQualityScore += 2; // 2 points for English-like word length
                        } else if (avgWordLength >= 2.5 && avgWordLength <= 6) {
                            textQualityScore += 1; // 1 point for reasonable word length
                        }
                    }
                }
                
                score += Math.min(10, textQualityScore);

                return Math.round(Math.min(100, score));
            }

            getQualitativeScore(numericalScore) {
                if (numericalScore >= 90) return 'EXCELLENT';
                if (numericalScore >= 75) return 'GOOD';
                if (numericalScore >= 60) return 'FAIR';
                if (numericalScore >= 40) return 'POOR';
                return 'VERY_POOR';
            }

        }

        // Create singleton instance
        window.__vibeReaderStealthExtractor = new StealthExtractor();

        true;
    } catch (error) {
        delete window.__vibeReaderStealthExtractor; // Clean up on failure
        throw error;
    }
}