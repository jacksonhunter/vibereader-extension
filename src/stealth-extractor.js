// VibeReader v2.5 - Refactored StealthExtractor with Enhanced Subscriber Architecture

if (window.__vibeReaderStealthExtractor || window.__stealthExtractor) {
    console.log("⚠️ StealthExtractor already exists, skipping");
} else {
    try {
        // === CUSTOM MIDDLEWARE FOR EXTRACTION ===
        class ExtractionPipelineMiddleware extends SubscriberMiddleware {
            constructor(extractor) {
                super("ExtractionPipeline", 7);
                this.extractor = extractor;
            }

            process(eventContext) {
                const { event, data } = eventContext;

                // Track pipeline progress
                if (event.startsWith("pipeline-")) {
                    const step = event.replace("pipeline-", "");
                    this.extractor.emit("pipeline-step-complete", {
                        step,
                        duration: eventContext.context.performance?.duration || 0,
                        extractionId: this.extractor.extractionId,
                    });
                }

                return true;
            }
        }

        // ===== ENHANCED STEALTH EXTRACTOR =====
        class StealthExtractor extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Extractor state
                this.extractionState = {
                    isActive: false,
                    currentPhase: 'idle',
                    extractedContent: new Map(),
                    discoveredMedia: new Map(),
                    analysisResults: new Map()
                };

                // Extraction configuration
                this.extractionConfig = {
                    scrolling: true,
                    mediaDiscovery: true,
                    textExtraction: true,
                    structureAnalysis: true,
                    qualityFiltering: true,
                    batchSize: 10,
                    scrollDelay: 100,
                    analysisDepth: 'full'
                };

                // Performance tracking
                this.extractionMetrics = {
                    contentExtracted: 0,
                    mediaDiscovered: 0,
                    analysisPerformed: 0,
                    scrollEvents: 0,
                    processingTime: 0
                };

                // Processing queue
                this.processingQueue = new Map();
                this.analysisQueue = new Map();

                // Extraction ID for tracking
                this.extractionId = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

                // Add custom middleware
                this.pipelineMiddleware = new ExtractionPipelineMiddleware(this);

                this.initializeStealthExtractor();
            }

            initializeStealthExtractor() {
                // Add middleware to subscriber manager
                if (window.__globalSubscriberManager) {
                    window.__globalSubscriberManager.addGlobalMiddleware(this.pipelineMiddleware);
                }

                this.setupExtractionSubscriptions();
                this.setupContentObservers();
                this.setupProcessingPipeline();

                // Mark as extractor for context detection
                window.__vibeReaderStealthExtractor = this;
                window.__stealthExtractor = this;

                console.log('🕵️ Enhanced StealthExtractor initialized');
            }

            setupExtractionSubscriptions() {
                // Start extraction from background
                this.subscribe('handle-start-extraction', async (eventType, { data, sender }) => {
                    return await this.startExtraction(data.config || {});
                });

                this.subscribe('handle-extractContent', async (eventType, { data, sender }) => {
                    return await this.extractContent(data.config || {});
                });

                // Process proxy commands
                this.subscribe('handle-executeProxyCommand', async (eventType, { data, sender }) => {
                    return await this.executeProxyCommand(data);
                });

                // Settings updates
                this.subscribe('handle-update-setting', async (eventType, { data, sender }) => {
                    return await this.updateExtractionSetting(data.setting, data.value);
                });

                // Injection ready check
                this.subscribe('handle-injection-ready-check', (eventType, { data, sender }) => {
                    return { ready: true, context: this.origin, timestamp: Date.now() };
                });

                // Handle ping
                this.subscribe('handle-ping', (eventType, { data, sender }) => {
                    return { pong: true, context: this.origin, timestamp: Date.now() };
                });

                // Processing queue management
                this.subscribe('process-extraction-queue', async (eventType, data) => {
                    return await this.processExtractionQueue();
                });

                this.subscribe('process-analysis-queue', async (eventType, data) => {
                    return await this.processAnalysisQueue();
                });
            }

            setupContentObservers() {
                // DOM mutation observer for dynamic content
                this.mutationObserver = new MutationObserver((mutations) => {
                    this.handleDOMMutations(mutations);
                });

                this.mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: false, // Reduced to improve performance
                    attributeOldValue: false
                });

                // Scroll event handler for infinite scroll detection
                this.scrollHandler = this.throttle(() => {
                    this.handleScrollEvent();
                }, this.extractionConfig.scrollDelay);

                window.addEventListener('scroll', this.scrollHandler, { passive: true });

                // Page load completion
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        this.handlePageLoadComplete();
                    });
                } else {
                    this.handlePageLoadComplete();
                }

                console.log('👁️ Content observers active');
            }

            setupProcessingPipeline() {
                // Process extraction queue every 200ms
                this.extractionInterval = setInterval(() => {
                    if (this.processingQueue.size > 0) {
                        this.emit('process-extraction-queue');
                    }
                }, 200);

                // Process analysis queue every 500ms
                this.analysisInterval = setInterval(() => {
                    if (this.analysisQueue.size > 0) {
                        this.emit('process-analysis-queue');
                    }
                }, 500);

                // Clean old results every 10 minutes
                this.cleanupInterval = setInterval(() => {
                    this.cleanExtractionResults();
                }, 600000);
            }

            throttle(func, delay) {
                let lastCall = 0;
                return function(...args) {
                    const now = Date.now();
                    if (now - lastCall < delay) return;
                    lastCall = now;
                    return func.apply(this, args);
                };
            }

            // ===== EXTRACTION METHODS =====

            async startExtraction(config = {}) {
                this.extractionConfig = { ...this.extractionConfig, ...config };
                this.extractionState.isActive = true;
                this.extractionState.currentPhase = 'initializing';

                const startTime = Date.now();

                try {
                    console.log('🚀 Starting enhanced content extraction');

                    // Phase 1: Initial content extraction
                    this.extractionState.currentPhase = 'content-extraction';
                    const contentResult = await this.performContentExtraction();

                    // Phase 2: Media discovery
                    if (this.extractionConfig.mediaDiscovery) {
                        this.extractionState.currentPhase = 'media-discovery';
                        const mediaResult = await this.performMediaDiscovery();
                    }

                    // Phase 3: Structure analysis
                    if (this.extractionConfig.structureAnalysis) {
                        this.extractionState.currentPhase = 'structure-analysis';
                        const structureResult = await this.performStructureAnalysis();
                    }

                    // Phase 4: Dynamic content monitoring
                    this.extractionState.currentPhase = 'monitoring';
                    this.startDynamicMonitoring();

                    const extractionTime = Date.now() - startTime;
                    this.extractionMetrics.processingTime += extractionTime;

                    // Send results to proxy
                    await this.sendExtractionResults();

                    console.log(`✅ Extraction completed in ${extractionTime}ms`);

                    return {
                        success: true,
                        extractionTime,
                        phase: this.extractionState.currentPhase,
                        metrics: { ...this.extractionMetrics }
                    };

                } catch (error) {
                    console.error('❌ Extraction failed:', error);
                    this.extractionState.currentPhase = 'error';

                    return { success: false, error: error.message };
                }
            }

            async extractContent(config = {}) {
                // Alias for startExtraction with backwards compatibility
                return await this.startExtraction(config);
            }

            async performContentExtraction() {
                const startTime = Date.now();

                // Use unified-vibe processing if available
                if (window.__vibeUnified?.ContentTransformer) {
                    try {
                        const processor = window.__vibeUnified.ContentTransformer;

                        // Extract text content
                        const textContent = this.extractTextContent(document.body);
                        const textResult = {
                            text: textContent,
                            wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
                            characterCount: textContent.length,
                            extractionMethod: 'unified'
                        };

                        this.storeExtractionResult('text', textResult);
                        this.extractionMetrics.contentExtracted++;

                        console.log('📄 Content extraction completed using unified processor');

                    } catch (error) {
                        console.warn('Unified processor failed, using fallback extraction');
                        await this.performFallbackExtraction();
                    }
                } else {
                    await this.performFallbackExtraction();
                }

                const duration = Date.now() - startTime;
                console.log(`⏱️ Content extraction took ${duration}ms`);
            }

            extractTextContent(element) {
                // Skip script and style elements
                const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT'];
                if (skipTags.includes(element.tagName)) return '';

                // For text nodes, return the text content
                if (element.nodeType === 3) {
                    return element.textContent.trim();
                }

                // For element nodes, recursively extract text
                let text = '';
                for (const child of element.childNodes) {
                    if (child.nodeType === 1) { // Element node
                        text += this.extractTextContent(child) + ' ';
                    } else if (child.nodeType === 3) { // Text node
                        text += child.textContent.trim() + ' ';
                    }
                }

                return text.trim();
            }

            async performFallbackExtraction() {
                // Fallback text extraction
                const textContent = document.body.textContent || document.body.innerText || '';
                const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;

                this.storeExtractionResult('text', {
                    text: textContent.trim(),
                    wordCount,
                    characterCount: textContent.length,
                    extractionMethod: 'fallback'
                });

                this.extractionMetrics.contentExtracted++;
            }

            async performMediaDiscovery() {
                const startTime = Date.now();

                const images = Array.from(document.querySelectorAll('img')).slice(0, 50).map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth || img.width || 0,
                    height: img.naturalHeight || img.height || 0,
                    loading: img.loading || 'auto'
                })).filter(img => img.src && img.width > 50 && img.height > 50);

                const videos = Array.from(document.querySelectorAll('video')).slice(0, 20).map(video => ({
                    src: video.src || video.currentSrc || '',
                    poster: video.poster || '',
                    duration: video.duration || 0,
                    width: video.videoWidth || video.width || 0,
                    height: video.videoHeight || video.height || 0
                })).filter(video => video.src);

                const media = {
                    images,
                    videos,
                    imageCount: images.length,
                    videoCount: videos.length,
                    processedBy: this.origin,
                    timestamp: Date.now()
                };

                this.storeExtractionResult('media', media);
                this.extractionMetrics.mediaDiscovered++;

                // Send media to proxy immediately
                await this.sendMediaToProxy(media);

                const duration = Date.now() - startTime;
                console.log(`🎬 Media discovery took ${duration}ms (${images.length} images, ${videos.length} videos)`);
            }

            async performStructureAnalysis() {
                const startTime = Date.now();

                const structure = {
                    headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 50).map(h => ({
                        level: parseInt(h.tagName.charAt(1)),
                        text: h.textContent.trim(),
                        id: h.id || ''
                    })),
                    sections: Array.from(document.querySelectorAll('section, article, main, aside')).slice(0, 30).map(s => ({
                        type: s.tagName.toLowerCase(),
                        id: s.id || '',
                        className: s.className || '',
                        childCount: s.children.length
                    })),
                    lists: Array.from(document.querySelectorAll('ul, ol')).slice(0, 20).map(l => ({
                        type: l.tagName.toLowerCase(),
                        itemCount: l.querySelectorAll('li').length
                    })),
                    forms: Array.from(document.querySelectorAll('form')).slice(0, 10).map(f => ({
                        action: f.action || '',
                        method: f.method || 'get',
                        inputCount: f.querySelectorAll('input').length
                    })),
                    processedBy: this.origin,
                    timestamp: Date.now()
                };

                this.storeExtractionResult('structure', structure);
                this.extractionMetrics.analysisPerformed++;

                // Send structure to proxy
                await this.sendStructureToProxy(structure);

                const duration = Date.now() - startTime;
                console.log(`🏗️ Structure analysis took ${duration}ms`);
            }

            startDynamicMonitoring() {
                // Already set up in setupContentObservers
                console.log('👁️ Dynamic content monitoring started');
            }

            // ===== CONTENT OBSERVERS =====

            handleDOMMutations(mutations) {
                if (!this.extractionState.isActive) return;

                let hasSignificantChanges = false;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Check if added nodes contain significant content
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const textContent = node.textContent || '';
                                if (textContent.length > 100) { // Significant content threshold
                                    hasSignificantChanges = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (hasSignificantChanges) {
                    this.queueContentUpdate('mutation');
                }
            }

            handleScrollEvent() {
                if (!this.extractionState.isActive) return;

                this.extractionMetrics.scrollEvents++;

                // Detect if near bottom of page (infinite scroll)
                const scrollPosition = window.scrollY;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;

                const distanceFromBottom = documentHeight - (scrollPosition + windowHeight);

                if (distanceFromBottom < 1000) { // Within 1000px of bottom
                    this.queueContentUpdate('scroll-bottom');
                }

              // Throttle scroll processing
              if (this.scrollTimeout) return;

              this.scrollTimeout = setTimeout(() => {
                  this.processScrollUpdate();
                  this.scrollTimeout = null;
              }, this.extractionConfig.scrollDelay);
            }

            handlePageLoadComplete() {
                console.log('📄 Page load complete, starting initial analysis');

                // Queue initial full extraction
                setTimeout(() => {
                    if (!this.extractionState.isActive) {
                        this.emit('handle-start-extraction', { config: this.extractionConfig });
                    }
                }, 1000); // Give page time to fully render
            }

            // ===== QUEUE PROCESSING =====

            queueContentUpdate(source) {
                const updateId = `update-${source}-${Date.now()}`;

                this.processingQueue.set(updateId, {
                    source,
                    timestamp: Date.now(),
                    type: 'content-update',
                    priority: source === 'scroll-bottom' ? 'high' : 'normal'
                });
            }

            async processExtractionQueue() {
                // Process high priority first
                const items = Array.from(this.processingQueue.entries())
                    .sort(([, a], [, b]) => {
                        const priorityOrder = { high: 0, normal: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .slice(0, this.extractionConfig.batchSize);

                for (const [updateId, update] of items) {
                    try {
                        await this.processContentUpdate(update);
                        this.processingQueue.delete(updateId);
                    } catch (error) {
                        console.error(`Processing error for ${updateId}:`, error);
                        this.processingQueue.delete(updateId); // Remove failed items
                    }
                }
            }

            async processContentUpdate(update) {
                const { source, type } = update;

                switch (type) {
                    case 'content-update':
                        await this.processIncrementalExtraction(source);
                        break;
                    default:
                        console.warn(`Unknown update type: ${type}`);
                }
            }

            async processIncrementalExtraction(source) {
                // Perform lightweight incremental extraction
                try {
                    if (source === 'scroll-bottom') {
                        // Extract any new content near bottom
                        const newContent = this.extractNewContent();
                        if (newContent) {
                            await this.sendContentToProxy(newContent, 'incremental');
                        }
                    } else if (source === 'mutation') {
                        // Re-analyze modified sections
                        await this.performPartialReanalysis();
                    }
                } catch (error) {
                    console.error(`Incremental extraction failed for ${source}:`, error);
                }
            }

            async processAnalysisQueue() {
                // Process any pending analysis tasks
                const items = Array.from(this.analysisQueue.entries()).slice(0, 5);

                for (const [analysisId, task] of items) {
                    try {
                        await this.performAnalysisTask(task);
                        this.analysisQueue.delete(analysisId);
                    } catch (error) {
                        console.error(`Analysis error for ${analysisId}:`, error);
                        this.analysisQueue.delete(analysisId);
                    }
                }
            }

            async performAnalysisTask(task) {
                // Placeholder for specific analysis tasks
                console.log(`Performing analysis task: ${task.type}`);
            }

            // ===== RESULT MANAGEMENT =====

            storeExtractionResult(type, data) {
                this.extractionState.extractedContent.set(type, {
                    data,
                    timestamp: Date.now(),
                    processed: false
                });
            }

            async sendExtractionResults() {
                // Send all accumulated results to proxy
                for (const [type, result] of this.extractionState.extractedContent.entries()) {
                    if (!result.processed) {
                        await this.sendContentToProxy(result.data, type);
                        result.processed = true;
                    }
                }
            }

            async sendContentToProxy(content, type) {
                if (window.__crossContextBridge) {
                    try {
                        return await window.__crossContextBridge.sendToProxy('displayContent', {
                            content,
                            type,
                            timestamp: Date.now(),
                            source: 'extractor'
                        });
                    } catch (error) {
                        console.error(`Failed to send ${type} to proxy:`, error);
                    }
                } else {
                    // Fallback to direct emit
                    return await this.emit('send-to-proxy', {
                        action: 'displayContent',
                        content,
                        type,
                        source: 'extractor'
                    });
                }
            }

            async sendMediaToProxy(media) {
                return await this.sendContentToProxy(media, 'media');
            }

            async sendStructureToProxy(structure) {
                return await this.sendContentToProxy(structure, 'structure');
            }

            cleanExtractionResults() {
                const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

                for (const [type, result] of this.extractionState.extractedContent.entries()) {
                    if (result.timestamp < tenMinutesAgo && result.processed) {
                        this.extractionState.extractedContent.delete(type);
                    }
                }

                // Clear old entries from discovery map
                for (const [key, item] of this.extractionState.discoveredMedia.entries()) {
                    if (item.timestamp < tenMinutesAgo) {
                        this.extractionState.discoveredMedia.delete(key);
                    }
                }

                console.log('🧹 Cleaned old extraction results');
            }

            // ===== COMMAND EXECUTION =====

            async executeProxyCommand(data) {
                const { command, parameters = {} } = data;

                try {
                    switch (command) {
                        case 'pause-extraction':
                            this.extractionState.isActive = false;
                            return { success: true, message: 'Extraction paused' };

                        case 'resume-extraction':
                            this.extractionState.isActive = true;
                            return { success: true, message: 'Extraction resumed' };

                        case 'force-reextraction':
                            return await this.startExtraction(parameters);

                        case 'get-status':
                            return { success: true, status: this.getExtractorStatus() };

                        case 'update-config':
                            this.extractionConfig = { ...this.extractionConfig, ...parameters };
                            return { success: true, message: 'Configuration updated' };

                        case 'clear-results':
                            this.extractionState.extractedContent.clear();
                            this.extractionState.discoveredMedia.clear();
                            this.extractionState.analysisResults.clear();
                            return { success: true, message: 'Results cleared' };

                        default:
                            return { success: false, error: `Unknown command: ${command}` };
                    }
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            async updateExtractionSetting(setting, value) {
                if (setting in this.extractionConfig) {
                    this.extractionConfig[setting] = value;
                    console.log(`⚙️ Updated setting ${setting} to ${value}`);
                    return { success: true, setting, value };
                } else {
                    return { success: false, error: `Unknown setting: ${setting}` };
                }
            }

            getExtractorStatus() {
                return {
                    isActive: this.extractionState.isActive,
                    currentPhase: this.extractionState.currentPhase,
                    extractedContent: this.extractionState.extractedContent.size,
                    discoveredMedia: this.extractionState.discoveredMedia.size,
                    processingQueue: this.processingQueue.size,
                    analysisQueue: this.analysisQueue.size,
                    config: { ...this.extractionConfig },
                    metrics: { ...this.extractionMetrics },
                    extractionId: this.extractionId
                };
            }

            // Additional helper methods
            extractNewContent() {
                // Extract content that wasn't there before
                const currentContent = document.body.textContent;
                if (this.lastContentSnapshot && currentContent !== this.lastContentSnapshot) {
                    const newText = currentContent.replace(this.lastContentSnapshot, '').trim();
                    this.lastContentSnapshot = currentContent;

                    if (newText.length > 100) { // Significant new content
                        return {
                            text: newText,
                            timestamp: Date.now(),
                            type: 'incremental',
                            wordCount: newText.split(/\s+/).length
                        };
                    }
                } else if (!this.lastContentSnapshot) {
                    this.lastContentSnapshot = currentContent;
                }
                return null;
            }

            async performPartialReanalysis() {
                // Re-analyze sections that have changed
                const modifiedElements = document.querySelectorAll('[data-recently-modified]');
                if (modifiedElements.length > 0) {
                    const partialResults = {
                        modifiedSections: modifiedElements.length,
                        timestamp: Date.now(),
                        type: 'partial-reanalysis'
                    };

                    await this.sendContentToProxy(partialResults, 'partial-update');
                } else {
                    // Perform lightweight re-extraction
                    await this.performMediaDiscovery();
                }
            }

            // Cleanup method
            destroy() {
                // Remove observers
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                }

                // Remove event listeners
                if (this.scrollHandler) {
                    window.removeEventListener('scroll', this.scrollHandler);
                }

                // Clear intervals
                if (this.extractionInterval) {
                    clearInterval(this.extractionInterval);
                }
                if (this.analysisInterval) {
                    clearInterval(this.analysisInterval);
                }
                if (this.cleanupInterval) {
                    clearInterval(this.cleanupInterval);
                }

                // Clear queues
                this.processingQueue.clear();
                this.analysisQueue.clear();

                // Clear state
                this.extractionState.extractedContent.clear();
                this.extractionState.discoveredMedia.clear();
                this.extractionState.analysisResults.clear();

                // Call parent destroy
                super.destroy();

                console.log('🧹 StealthExtractor destroyed');
            }
        }

        // Create singleton instance
        const stealthExtractor = new StealthExtractor();
        window.__vibeReaderStealthExtractor = stealthExtractor;
        window.__stealthExtractor = stealthExtractor;

        console.log('✅ StealthExtractor v2.5 loaded');

        true;
    } catch (error) {
        delete window.__vibeReaderStealthExtractor;
        delete window.__stealthExtractor;
        console.error('Failed to initialize StealthExtractor:', error);
        throw error;
    }
}