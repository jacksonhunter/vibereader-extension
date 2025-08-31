// VibeReader v2.0 - Production StealthExtractor with Enhanced Subscriber Architecture

if (window.__vibeReaderStealthExtractor) {
    console.log('StealthExtractor already exists, skipping');
} else {
    try {
        // === CUSTOM MIDDLEWARE FOR EXTRACTION ===
        class ExtractionPipelineMiddleware extends SubscriberMiddleware {
            constructor(extractor) {
                super('ExtractionPipeline');
                this.extractor = extractor;
            }

            process(eventContext) {
                const { event, _data } = eventContext;

                // Track pipeline progress
                if (event.startsWith('pipeline-')) {
                    const step = event.replace('pipeline-', '');
                    this.extractor.emit('pipeline-step-complete', {
                        step,
                        duration: eventContext.context.performance?.duration || 0,
                        extractionId: this.extractor.extractionId
                    });
                }

                return true;
            }
        }

        class StealthExtractor extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Core messaging systems
                this.bridge = new MessageBridge();
                this.eventBus = new EventBus();
                this.progressEmitter = new ThrottledEmitter(this.bridge, 100);
                this.events = new ThrottledEmitter(this.eventBus, 50);

                // State management
                this.isActive = false;
                this.extractionInProgress = false;
                this.extractionId = null;
                this.frameworkDetected = 'unknown';

                // Pipeline configuration
                this.extractionPipeline = [];
                this.defaultSteps = [
                    'detectFramework',
                    'immediateExtraction',
                    'backgroundProcessing',
                    'contentOptimization',
                    'mediaProcessing'
                ];

                // DOM monitoring
                this.mutationObserver = null;
                this.mutationCount = 0;
                this.contentStabilityTimer = null;
                this.lastContentHash = null;

                // Scrolling and content discovery
                this.scrollingEnabled = true;
                this.proxyScrollEnabled = true;
                this.discoveryHeuristics = {
                    minImageSize: 10000,
                    minQualityThreshold: 0.3,
                    lazyLoadingPatterns: [
                        'data-src', 'data-lazy-src', 'data-original',
                        'data-srcset', 'loading="lazy"'
                    ]
                };

                // Extraction metrics
                this.extractionMetrics = {
                    attempts: 0,
                    successes: 0,
                    failures: 0,
                    averageTime: 0,
                    totalMutations: 0
                };

                // Media processing
                this.mediaStats = { images: 0, videos: 0, iframes: 0, tables: 0 };

                // Add custom middleware
                this.subscriberManager.addGlobalMiddleware(
                    new ExtractionPipelineMiddleware(this)
                );

                // Setup enhanced systems
                this.setupEnhancedSubscriptions();
                this.setupMessageHandlers();
                this.setupPipelineMiddleware();

                // Initialize immediately
                this.init();
            }

            // === ENHANCED SUBSCRIPTION MANAGEMENT ===
            setupEnhancedSubscriptions() {
                // Terminal logging subscription
                if (window.VibeLogger) {
                    this.subscribe('terminal-log', (eventType, data) => {
                        this.logExtraction(data.category, data.level, data.message);
                    }, {
                        id: 'vibe-logger-terminal',
                        eventTypes: ['terminal-log'],
                        rateLimitMs: 100,
                        transformations: [
                            (data) => ({
                                data: {
                                    category: data.category || 'system',
                                    level: data.level || 'INFO',
                                    message: data.message || 'Unknown message'
                                }
                            })
                        ]
                    });

                    const loggerUnsubscribe = window.VibeLogger.subscribeToTerminal((event) => {
                        this.emit('terminal-log', event);
                    });
                    this.subscriptions.push(loggerUnsubscribe);
                }

                // Pipeline step completion
                this.subscribe('pipeline-step-complete', (eventType, data) => {
                    this.handlePipelineStepComplete(data);
                }, {
                    id: 'pipeline-coordinator',
                    priority: 10,
                    debounceMs: 50,
                    transformations: [
                        (data, context) => ({
                            data: {
                                ...data,
                                timestamp: Date.now(),
                                extractionId: this.extractionId
                            },
                            context: { ...context, source: 'pipeline' }
                        })
                    ]
                });

                // Media discovery aggregation
                this.subscribe('media-discovered', (eventType, data) => {
                    this.handleMediaDiscovery(data);
                }, {
                    id: 'media-aggregator',
                    debounceMs: 200,
                    transformations: [
                        (data, _context, _eventContext) => {
                            const aggregated = { ...this.mediaStats };
                            if (data.images) aggregated.images += data.images;
                            if (data.videos) aggregated.videos += data.videos;
                            if (data.iframes) aggregated.iframes += data.iframes;
                            if (data.tables) aggregated.tables += data.tables;
                            return { data: aggregated };
                        }
                    ]
                });

                // Content updates with quality filtering
                this.subscribe('content-updated', (eventType, data) => {
                    this.handleContentUpdate(data);
                }, {
                    id: 'content-processor',
                    rateLimitMs: 500,
                    transformations: [
                        (data) => {
                            if (data.scoreImprovement && data.scoreImprovement < 5) {
                                return null;
                            }
                            return { data };
                        }
                    ]
                });

                // DOM mutations with heuristic analysis
                this.subscribe('dom-mutations', (eventType, data) => {
                    this.analyzeMutationImpact(data);
                }, {
                    id: 'mutation-analyzer',
                    debounceMs: 100,
                    eventTypes: ['dom-mutations'],
                    transformations: [
                        (data) => ({
                            data: {
                                ...data,
                                impact: this.calculateMutationImpact(data),
                                suggestions: this.generateMutationSuggestions(data)
                            }
                        })
                    ]
                });

                // Scroll events with proxy filtering
                this.subscribe('scroll-event', (eventType, data) => {
                    this.handleScrollEvent(data);
                }, {
                    id: 'scroll-handler',
                    rateLimitMs: 50,
                    eventTypes: ['scroll-event'],
                    transformations: [
                        (data, context) => {
                            if (!this.proxyScrollEnabled && context.source === 'proxy') {
                                return null;
                            }
                            return { data };
                        }
                    ]
                });

                console.log('Enhanced subscriptions setup complete');
            }

            setupPipelineMiddleware() {
                if (this.subscriberManager && window.ContentTransformer) {
                    this.subscriberManager.addPipelineTransform(
                        (tree, options, context) => {
                            if (context.data && typeof context.data === 'string' && context.data.includes('<')) {
                                context.messages.push('HTML content detected for processing');
                            }
                            return tree;
                        }
                    );

                    this.subscriberManager.addPipelineTransform(
                        (tree, options, context) => {
                            if (tree && tree.children) {
                                let mediaCount = 0;
                                const traverse = (node) => {
                                    if (node.type === 'element' && ['img', 'video', 'audio'].includes(node.tagName)) {
                                        mediaCount++;
                                    }
                                    if (node.children) {
                                        node.children.forEach(traverse);
                                    }
                                };
                                traverse(tree);

                                if (mediaCount > 0) {
                                    context.data = { ...context.data, mediaElementsFound: mediaCount };
                                }
                            }
                            return tree;
                        }
                    );
                }
            }

            // === SUBSCRIBER EVENT HANDLERS ===
            handlePipelineStepComplete(data) {
                const { step, duration, extractionId } = data;

                if (extractionId === this.extractionId) {
                    console.log(`Pipeline step '${step}' completed in ${duration}ms`);

                    if (!this.extractionMetrics.stepDurations) {
                        this.extractionMetrics.stepDurations = {};
                    }
                    this.extractionMetrics.stepDurations[step] = duration;

                    this.progressEmitter.emit('extractionProgress', {
                        status: `completed_${step}`,
                        progress: this.calculateProgressFromStep(step),
                        stepDuration: duration
                    }, { action: 'extractionProgress' });
                }
            }

            handleMediaDiscovery(aggregatedStats) {
                this.mediaStats = aggregatedStats;
                console.log('Media discovery update:', aggregatedStats);

                const totalMedia = Object.values(aggregatedStats).reduce((sum, count) => sum + count, 0);
                if (totalMedia > 0) {
                    this.logExtraction('media', 'INFO',
                        `Media discovered: ${aggregatedStats.images} images, ${aggregatedStats.videos} videos`);
                }
            }

            handleContentUpdate(data) {
                const { impact, scoreImprovement, suggestions } = data;

                if (impact === 'high' || scoreImprovement > 20) {
                    console.log('Significant content update detected, triggering re-extraction');
                    this.scheduleReExtraction();
                }

                if (suggestions && suggestions.length) {
                    this.applySuggestions(suggestions);
                }
            }

            analyzeMutationImpact(mutationData) {
                console.log('Mutation impact analysis:', mutationData.impact);

                if (mutationData.impact === 'high') {
                    this.emit('content-updated', {
                        ...mutationData,
                        source: 'mutation-analysis'
                    });
                }
            }

            handleScrollEvent(data) {
                const { scrollY, _scrollX, _source = 'unknown' } = data;
                const scrollProgress = scrollY / (document.documentElement.scrollHeight - window.innerHeight);

                if (scrollProgress > 0.5 && this.shouldTriggerLazyLoading()) {
                    this.triggerLazyContentDiscovery();
                }
            }

            // === PIPELINE SUBSCRIBER MANAGEMENT ===
            subscribeToPipeline(callback, options = {}) {
                return this.subscribe('pipeline-step-complete', callback, {
                    id: options.id || `pipeline-sub-${Date.now()}`,
                    priority: options.priority || 0,
                    eventTypes: ['pipeline-step-complete'],
                    ...options
                });
            }

            subscribeToScrolling(callback, options = {}) {
                return this.subscribe('scroll-event', callback, {
                    id: options.id || `scroll-sub-${Date.now()}`,
                    rateLimitMs: options.rateLimitMs || 100,
                    eventTypes: ['scroll-event'],
                    ...options
                });
            }

            subscribeToMediaDiscovery(callback, options = {}) {
                return this.subscribe('media-discovered', callback, {
                    id: options.id || `media-sub-${Date.now()}`,
                    debounceMs: options.debounceMs || 200,
                    eventTypes: ['media-discovered'],
                    ...options
                });
            }

            // === UTILITY METHODS FOR ENHANCED SUBSCRIPTIONS ===
            calculateMutationImpact(data) {
                const { newImages, newVideos, newTextContent, lazyLoadTriggers } = data;

                let impactScore = 0;
                impactScore += newImages * 2;
                impactScore += newVideos * 5;
                impactScore += Math.min(newTextContent / 100, 10);
                impactScore += lazyLoadTriggers;

                if (impactScore > 20) return 'high';
                if (impactScore > 5) return 'medium';
                return 'low';
            }

            generateMutationSuggestions(data) {
                const suggestions = [];

                if (data.lazyLoadTriggers > 5) {
                    suggestions.push({
                        type: 'lazy-loading',
                        action: 'trigger-scroll',
                        reason: 'High lazy loading activity detected'
                    });
                }

                if (data.newImages > 3) {
                    suggestions.push({
                        type: 'media-processing',
                        action: 're-extract',
                        reason: 'Significant new media content'
                    });
                }

                return suggestions;
            }

            applySuggestions(suggestions) {
                suggestions.forEach(suggestion => {
                    switch (suggestion.action) {
                        case 'trigger-scroll':
                            if (this.scrollingEnabled) {
                                this.simulateContentDiscovery();
                            }
                            break;
                        case 're-extract':
                            this.scheduleReExtraction();
                            break;
                        default:
                            console.log('Unknown suggestion action:', suggestion.action);
                    }
                });
            }

            calculateProgressFromStep(step) {
                const stepProgress = {
                    'detectFramework': 10,
                    'immediateExtraction': 30,
                    'backgroundProcessing': 60,
                    'contentOptimization': 80,
                    'mediaProcessing': 95
                };
                return stepProgress[step] || 0;
            }

            // === INITIALIZATION AND ACTIVATION ===
            init() {
                console.log('StealthExtractor.init() starting immediate activation');
                this.isActive = true;

                this.detectFramework();
                this.setupMutationObserver();
                this.startExtractionPipeline();
                this.setupScrollingDiscovery();
                this.signalReady();

                console.log('StealthExtractor activated and extracting');
            }

            activate() {
                if (this.isActive) return;
                this.init();
            }

            deactivate() {
                console.log('StealthExtractor deactivating...');

                this.isActive = false;
                this.extractionInProgress = false;

                this.teardownMutationObserver();
                this.clearAllTimers();

                if (typeof DOMPurify !== 'undefined') {
                    DOMPurify.removeAllHooks();
                }

                super.deactivate();

                if (this.progressEmitter) {
                    this.progressEmitter.destroy();
                }
                if (this.events) {
                    this.events.destroy();
                }

                console.log('StealthExtractor deactivated with enhanced cleanup');
            }

            destroy() {
                console.log('StealthExtractor destroying...');

                this.deactivate();
                super.destroy();

                this.bridge = null;
                this.eventBus = null;
                this.progressEmitter = null;
                this.events = null;
                this.extractionPipeline = [];

                delete window.__vibeReaderStealthExtractor;

                console.log('StealthExtractor destroyed');
            }

            // === ENHANCED SUBSCRIBER MANAGEMENT METHODS ===
            updateSubscriberPreferences(data) {
                const { subscriberId, eventType, preferences } = data;
                return this.subscriberManager.updateSubscriber(eventType, subscriberId, { preferences });
            }

            pauseSubscriber(eventType, subscriberId) {
                return this.subscriberManager.updateSubscriber(eventType, subscriberId, { state: 'paused' });
            }

            resumeSubscriber(eventType, subscriberId) {
                return this.subscriberManager.updateSubscriber(eventType, subscriberId, { state: 'active' });
            }

            disableSubscriber(eventType, subscriberId) {
                return this.subscriberManager.updateSubscriber(eventType, subscriberId, { state: 'disabled' });
            }

            clearAllTimers() {
                if (this.contentStabilityTimer) {
                    clearTimeout(this.contentStabilityTimer);
                    this.contentStabilityTimer = null;
                }

                if (this.extractionTimer) {
                    clearTimeout(this.extractionTimer);
                    this.extractionTimer = null;
                }
            }

            // === MESSAGE AND EVENT HANDLING ===
            setupMessageHandlers() {
                // Handle start-extraction message from background
                this.bridge.register('start-extraction', (data) => {
                    console.log('Received start-extraction command:', data);
                    dump(`Received start-extraction command for ${data.url}\n`);
                    
                    // Store tab IDs for later routing
                    this.hiddenTabId = data.hiddenTabId;
                    this.visibleTabId = data.visibleTabId;
                    
                    // Start the extraction pipeline
                    this.startExtractionPipeline();
                    return { success: true, message: 'Extraction started' };
                });
                
                this.bridge.register('extractContent', (config) => this.handleExtractionRequest(config));
                this.bridge.register('executeProxyCommand', (data) => this.executeProxyCommand(data));
                this.bridge.register('configurePipeline', (config) => this.configurePipeline(config));
                this.bridge.register('toggleScrolling', (options) => this.toggleScrolling(options));
                this.bridge.register('getMetrics', () => this.getMetrics());
                this.bridge.register('getState', () => this.getState());
                this.bridge.register('deactivate', () => this.deactivate());
                this.bridge.register('getSubscriberStats', () => this.getSubscriberStats());
                this.bridge.register('updateSubscriber', (data) => this.updateSubscriberPreferences(data));
            }

            // === FRAMEWORK DETECTION ===
            detectFramework() {
                const detectors = [
                    { name: 'react', check: () => window.React || document.querySelector('[data-reactroot], #root, #__next') },
                    { name: 'vue', check: () => window.Vue || document.querySelector('#app[data-v-], [data-server-rendered]') },
                    { name: 'angular', check: () => window.angular || document.querySelector('[ng-app], [ng-version]') },
                    { name: 'svelte', check: () => document.querySelector('[data-svelte]') },
                    { name: 'nextjs', check: () => document.querySelector('#__next') }
                ];

                for (const detector of detectors) {
                    if (detector.check()) {
                        this.frameworkDetected = detector.name;
                        break;
                    }
                }

                if (this.frameworkDetected === 'unknown') {
                    this.frameworkDetected = 'vanilla';
                }

                console.log(`Framework detected: ${this.frameworkDetected}`);
                this.logExtraction('framework', 'INFO', `Framework: ${this.frameworkDetected}`);

                this.events.emitNow('framework-detected', {
                    framework: this.frameworkDetected
                });
            }

            // === EXTRACTION PIPELINE ===
            startExtractionPipeline() {
                this.extractionInProgress = true;
                this.extractionId = `extraction-${Date.now()}`;
                this.extractionMetrics.attempts++;

                console.log('Starting immediate extraction pipeline');

                this.progressEmitter.emitNow('extractionProgress', {
                    status: 'starting',
                    progress: 0,
                    framework: this.frameworkDetected,
                    extractionId: this.extractionId
                }, { action: 'extractionProgress' });

                this.runPipelineAsync();
            }

            async runPipelineAsync() {
                try {
                    const immediateResult = await this.extractImmediate();

                    if (immediateResult.content) {
                        this.sendExtractionResult(immediateResult, 'immediate');
                    }

                    this.runBackgroundProcessing();
                    this.extractionMetrics.successes++;

                } catch (error) {
                    console.error('Extraction pipeline error:', error);
                    this.extractionMetrics.failures++;
                    this.handleExtractionError(error);
                } finally {
                    this.extractionInProgress = false;
                }
            }

            async extractImmediate() {
                const startTime = performance.now();

                try {
                    const documentClone = document.cloneNode(true);
                    this.mediaStats = { images: 0, videos: 0, iframes: 0, tables: 0 };

                    const processedDoc = await this.preprocessDocument(documentClone);
                    const content = await this.extractWithReadability(processedDoc);
                    const finalContent = await this.postProcessContent(content);

                    const duration = performance.now() - startTime;

                    return {
                        content: finalContent.content,
                        metadata: {
                            ...finalContent.metadata,
                            extractionType: 'immediate',
                            duration,
                            framework: this.frameworkDetected,
                            mediaStats: { ...this.mediaStats }
                        }
                    };

                } catch (error) {
                    console.warn('Immediate extraction failed, using fallback:', error);
                    return this.createFallbackContent();
                }
            }

            createFallbackContent() {
                const title = document.title || 'Untitled';
                const url = window.location.href;
                const framework = this.frameworkDetected;

                return {
                    content: `
                        <div class="extraction-fallback">
                            <h1>${this.escapeHtml(title)}</h1>
                            <p>Content extraction in progress...</p>
                            <div class="extraction-details">
                                <p>Framework: ${framework}</p>
                                <p>URL: ${this.escapeHtml(url)}</p>
                            </div>
                        </div>
                    `,
                    metadata: {
                        title,
                        url,
                        framework,
                        extractionType: 'fallback',
                        length: 0,
                        mediaStats: { images: 0, videos: 0, iframes: 0, tables: 0 }
                    }
                };
            }

            runBackgroundProcessing() {
                setTimeout(() => {
                    this.runEnhancedExtraction();
                }, 100);
            }

            async runEnhancedExtraction() {
                try {
                    console.log('Running enhanced extraction with DOM monitoring');

                    await this.waitForInitialStability(1000);

                    if (this.scrollingEnabled) {
                        await this.simulateContentDiscovery();
                    }

                    const enhancedResult = await this.extractImmediate();
                    enhancedResult.metadata.extractionType = 'enhanced';

                    if (this.isSignificantlyBetter(enhancedResult)) {
                        this.sendExtractionResult(enhancedResult, 'enhanced');
                    }

                } catch (error) {
                    console.warn('Enhanced extraction failed:', error);
                }
            }

            isSignificantlyBetter(newResult) {
                const _newContentLength = newResult.content?.length || 0;
                const _newMediaCount = Object.values(newResult.metadata.mediaStats || {})
                    .reduce((sum, count) => sum + count, 0);

                return newResult.metadata.extractionType === 'enhanced';
            }

            // === MUTATION OBSERVER ===
            setupMutationObserver() {
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                }

                this.mutationObserver = new MutationObserver((mutations) => {
                    this.handleMutations(mutations);
                });

                const config = {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['src', 'data-src', 'class', 'style', 'hidden'],
                    characterData: false
                };

                this.mutationObserver.observe(document.body, config);

                const domSub = () => {
                    if (this.mutationObserver) {
                        this.mutationObserver.disconnect();
                        this.mutationObserver = null;
                    }
                };
                this.subscribe('dom', domSub);

                console.log('MutationObserver setup with heuristic DOM traversal');
            }

            teardownMutationObserver() {
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                    this.mutationObserver = null;
                }
            }

            handleMutations(mutations) {
                if (!this.isActive) return;

                this.mutationCount += mutations.length;

                const meaningfulMutations = mutations.filter(this.isMeaningfulMutation);

                if (meaningfulMutations.length === 0) return;

                const analysis = this.analyzeMutationsWithHeuristics(meaningfulMutations);

                this.emit('dom-mutations', analysis, {
                    source: 'mutation-observer',
                    useUnifiedPipeline: true
                });

                this.resetStabilityTimer();

                if (analysis.highValueContent) {
                    console.log('High-value content detected via mutations');
                    this.emit('content-updated', {
                        ...analysis,
                        trigger: 'high-value-mutation'
                    });
                }
            }

            isMeaningfulMutation(mutation) {
                if (mutation.target?.tagName?.match(/^(SCRIPT|STYLE|NOSCRIPT)$/)) {
                    return false;
                }

                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    return Array.from(mutation.addedNodes).some(node =>
                        node.nodeType === 1 &&
                        !node.tagName?.match(/^(SCRIPT|STYLE)$/)
                    );
                }

                if (mutation.type === 'attributes' &&
                    ['src', 'data-src'].includes(mutation.attributeName)) {
                    return true;
                }

                return false;
            }

            analyzeMutationsWithHeuristics(mutations) {
                const analysis = {
                    newImages: 0,
                    newVideos: 0,
                    newTextContent: 0,
                    lazyLoadTriggers: 0,
                    highValueContent: false,
                    scoreImprovement: 0,
                    timestamp: Date.now()
                };

                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                analysis.newImages += node.querySelectorAll('img').length;
                                analysis.newVideos += node.querySelectorAll('video').length;

                                const textLength = node.textContent?.length || 0;
                                analysis.newTextContent += textLength;

                                this.discoveryHeuristics.lazyLoadingPatterns.forEach(pattern => {
                                    if (node.hasAttribute?.(pattern) ||
                                        node.querySelector?.(`[${pattern}]`)) {
                                        analysis.lazyLoadTriggers++;
                                    }
                                });
                            }
                        });
                    } else if (mutation.type === 'attributes') {
                        if (['src', 'data-src'].includes(mutation.attributeName)) {
                            analysis.lazyLoadTriggers++;
                        }
                    }
                });

                analysis.highValueContent = (
                    analysis.newImages >= 3 ||
                    analysis.newVideos >= 1 ||
                    analysis.newTextContent >= 1000 ||
                    analysis.lazyLoadTriggers >= 5
                );

                analysis.scoreImprovement =
                    (analysis.newImages * 2) +
                    (analysis.newVideos * 5) +
                    (analysis.newTextContent * 0.01) +
                    (analysis.lazyLoadTriggers * 1);

                return analysis;
            }

            resetStabilityTimer() {
                if (this.contentStabilityTimer) {
                    clearTimeout(this.contentStabilityTimer);
                }

                this.contentStabilityTimer = setTimeout(() => {
                    this.handleContentStability();
                }, 500);
            }

            handleContentStability() {
                console.log('Content stability detected');
                this.events.emit('content-stable', {
                    mutationCount: this.mutationCount,
                    timestamp: Date.now()
                });

                this.contentStabilityTimer = null;
            }

            scheduleReExtraction() {
                if (this.extractionTimer) {
                    clearTimeout(this.extractionTimer);
                }

                this.extractionTimer = setTimeout(() => {
                    this.runEnhancedExtraction();
                }, 1000);
            }

            // === SCROLLING AND CONTENT DISCOVERY ===
            setupScrollingDiscovery() {
                if (!this.scrollingEnabled) return;

                const scrollHandler = this.throttledScrollHandler.bind(this);
                document.addEventListener('scroll', scrollHandler, { passive: true });

                this.subscriptions.push(() => {
                    document.removeEventListener('scroll', scrollHandler);
                });
            }

            throttledScrollHandler(_event) {
                if (!this.proxyScrollEnabled) return;

                this.emit('scroll-event', {
                    type: 'scroll',
                    scrollY: window.scrollY,
                    scrollX: window.scrollX,
                    timestamp: Date.now(),
                    source: 'user'
                }, {
                    source: 'dom-listener'
                });
            }

            async simulateContentDiscovery() {
                console.log('Starting simulated content discovery');

                const scrollHeight = document.documentElement.scrollHeight;
                const viewportHeight = window.innerHeight;

                if (scrollHeight <= viewportHeight) {
                    console.log('Content fits in viewport, skipping scroll simulation');
                    return;
                }

                try {
                    await this.simulateScrollDown();
                    await this.waitForInitialStability(1000);
                    await this.simulateScrollUp();

                    console.log('Content discovery simulation complete');

                } catch (error) {
                    console.warn('Content discovery failed:', error);
                }
            }

            async simulateScrollDown() {
                return new Promise((resolve) => {
                    const scrollHeight = document.documentElement.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    let currentScroll = 0;

                    const scrollStep = () => {
                        const remaining = scrollHeight - viewportHeight - currentScroll;
                        if (remaining <= 0) {
                            resolve();
                            return;
                        }

                        const scrollAmount = Math.min(200, remaining);
                        window.scrollBy(0, scrollAmount);
                        currentScroll += scrollAmount;

                        const progress = (currentScroll / (scrollHeight - viewportHeight)) * 100;
                        this.progressEmitter.emit('extractionProgress', {
                            status: 'discovering_content',
                            progress: Math.min(progress, 90)
                        }, { action: 'extractionProgress' });

                        setTimeout(scrollStep, 50);
                    };

                    scrollStep();
                });
            }

            async simulateScrollUp() {
                return new Promise((resolve) => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(resolve, 500);
                });
            }

            toggleScrolling(options = {}) {
                if (options.scrolling !== undefined) {
                    this.scrollingEnabled = options.scrolling;
                }
                if (options.proxyScroll !== undefined) {
                    this.proxyScrollEnabled = options.proxyScroll;
                }

                console.log(`Scrolling: ${this.scrollingEnabled}, Proxy: ${this.proxyScrollEnabled}`);
                return { scrolling: this.scrollingEnabled, proxyScroll: this.proxyScrollEnabled };
            }

            // === DOMPURIFY INTEGRATION ===
            async preprocessDocument(documentClone) {
                console.log('Preprocessing document with DOMPurify');

                try {
                    this.setupPreprocessingHooks();

                    const frameworkConfig = this.getFrameworkConfig();

                    const purifyConfig = {
                        WHOLE_DOCUMENT: true,
                        RETURN_DOM: true,
                        KEEP_CONTENT: true,
                        FORBID_TAGS: [
                            'script', 'style', 'noscript',
                            'aside', 'nav', 'footer', 'header'
                        ],
                        FORBID_ATTR: [
                            'onclick', 'onload', 'onerror', 'onmouseover',
                            'onfocus', 'onblur', 'onchange', 'onsubmit',
                            'onkeydown', 'onkeyup', 'onkeypress'
                        ],
                        KEEP_CLASSES: true,
                        ...frameworkConfig
                    };

                    const cleanedDoc = DOMPurify.sanitize(documentClone, purifyConfig);

                    return cleanedDoc;

                } catch (error) {
                    DOMPurify.removeAllHooks();
                    throw error;
                } finally {
                    DOMPurify.removeAllHooks();
                }
            }

            setupPreprocessingHooks() {
                DOMPurify.addHook('uponSanitizeElement', (node, data) => {
                    if (node.nodeType !== 1) return;

                    const tagName = data.tagName;
                    const className = node.className || '';
                    const id = node.id || '';

                    const removePatterns = [
                        /\bad[\s\-_]/i, /advertisement/i, /sponsor/i,
                        /cookie[\s\-_]?banner/i, /popup/i, /modal/i,
                        /newsletter/i, /subscribe/i, /social[\s\-_]?share/i,
                        /comments?[\s\-_]?section/i, /related[\s\-_]?posts?/i,
                        /sidebar/i
                    ];

                    if (removePatterns.some(p => p.test(className) || p.test(id))) {
                        node.remove();
                        return;
                    }

                    if (tagName === 'header' || tagName === 'footer') {
                        if (!node.closest('article, main, [role="main"]')) {
                            node.remove();
                            return;
                        }
                    }

                    switch (tagName) {
                        case 'img':
                            this.mediaStats.images++;
                            this.processMediaElement(node, 'image');
                            break;
                        case 'video':
                            this.mediaStats.videos++;
                            this.processMediaElement(node, 'video');
                            break;
                        case 'iframe': {
                            const src = node.src || '';
                            if (src.match(/youtube|vimeo|dailymotion/i)) {
                                this.mediaStats.iframes++;
                            } else {
                                node.remove();
                            }
                            break;
                        }
                        case 'table':
                            this.mediaStats.tables++;
                            break;
                    }
                });

                DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
                    if (node.tagName === 'IMG') {
                        this.processLazyImage(node);
                    }

                    if ((data.attrName === 'href' || data.attrName === 'src') &&
                        data.attrValue && data.attrValue.startsWith('javascript:')) {
                        data.forceRemoveAttr = true;
                    }

                    if ((data.attrName === 'href' || data.attrName === 'src') &&
                        data.attrValue && !data.attrValue.match(/^(https?:|data:|#)/)) {
                        try {
                            data.attrValue = new URL(data.attrValue, window.location.href).href;
                        } catch (e) {
                            // Invalid URL handled by DOMPurify
                        }
                    }
                });

                DOMPurify.addHook('afterSanitizeAttributes', (node) => {
                    if (node.nodeType !== 1) return;

                    if (node.hasAttribute('hidden')) {
                        node.removeAttribute('hidden');
                    }

                    if (node.style) {
                        if (node.style.display === 'none' || node.style.visibility === 'hidden') {
                            const text = node.textContent || '';
                            if (text.length > 50 && !text.match(/cookie|advertisement|subscribe/i)) {
                                node.style.display = '';
                                node.style.visibility = '';
                            }
                        }
                    }

                    if (node.tagName === 'TABLE' && !node.querySelector('tbody')) {
                        const tbody = document.createElement('tbody');
                        node.querySelectorAll('tr').forEach(tr => tbody.appendChild(tr));
                        node.appendChild(tbody);
                    }
                });
            }

            // === MEDIA PROCESSING ===
            processMediaElement(element, type) {
                const width = parseInt(element.getAttribute('width')) || 0;
                const height = parseInt(element.getAttribute('height')) || 0;
                const area = width * height;

                if (type === 'image' && area >= this.discoveryHeuristics.minImageSize) {
                    element.setAttribute('data-vibe-display', 'ascii');
                    element.classList.add('vibe-ascii-candidate');
                } else {
                    element.setAttribute('data-vibe-display', 'passthrough');
                    element.classList.add('vibe-passthrough');
                }
            }

            processLazyImage(img) {
                const lazyAttrs = this.discoveryHeuristics.lazyLoadingPatterns;

                for (const attr of lazyAttrs) {
                    const value = img.getAttribute(attr);
                    if (value && value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
                        img.setAttribute('src', value);

                        const srcset = img.getAttribute('data-srcset') ||
                            img.getAttribute('data-lazy-srcset');
                        if (srcset) {
                            img.setAttribute('srcset', srcset);
                        }

                        img.setAttribute('loading', 'lazy');
                        break;
                    }
                }
            }

            getFrameworkConfig() {
                const configs = {
                    react: {
                        ALLOWED_ATTR: ['data-reactroot', 'data-react-*'],
                        CUSTOM_ELEMENT_HANDLING: {
                            tagNameCheck: /^[a-z]+-[a-z]+$/,
                            attributeNameCheck: /^(data-|aria-)/,
                            allowCustomizedBuiltInElements: true
                        }
                    },
                    vue: {
                        ALLOWED_ATTR: ['v-*', ':*', '@*', 'data-v-*'],
                        ADD_TAGS: ['transition', 'transition-group']
                    },
                    angular: {
                        ALLOWED_ATTR: ['ng-*', '[*]', '(*)', '*ngFor', '*ngIf'],
                        SANITIZE_DOM: false
                    },
                    nextjs: {
                        ALLOWED_ATTR: ['data-reactroot', 'data-react-*'],
                        ADD_TAGS: ['next-route-announcer']
                    }
                };

                return configs[this.frameworkDetected] || {};
            }

            async extractWithReadability(processedDocument) {
                try {
                    if (typeof Readability === 'undefined') {
                        throw new Error('Readability.js not available');
                    }

                    const reader = new Readability(processedDocument, {
                        debug: false,
                        maxElemsToParse: 0,
                        nbTopCandidates: 5,
                        charThreshold: 500,
                        classesToPreserve: ['caption', 'emoji', 'code', 'pre', 'vibe-ascii-candidate', 'vibe-passthrough'],
                        keepClasses: true
                    });

                    let article = reader.parse();

                    if (!article || !article.content) {
                        console.warn('Readability failed, trying fallback');
                        article = this.fallbackExtraction(processedDocument);
                    }

                    if (!article || !article.content) {
                        throw new Error('No readable content found');
                    }

                    return article;

                } catch (error) {
                    console.error('Readability extraction failed:', error);
                    throw error;
                }
            }

            fallbackExtraction(doc) {
                console.log('Attempting fallback extraction');

                const selectors = [
                    'main', 'article', '[role="main"]',
                    '.main-content', '#main-content',
                    '.content', '#content',
                    '.post-content', '.entry-content',
                    '.article-content', '.story-body'
                ];

                let contentEl = null;
                let maxScore = 0;

                for (const selector of selectors) {
                    const elements = doc.querySelectorAll(selector);
                    elements.forEach(el => {
                        const score = this.scoreContentElement(el);
                        if (score > maxScore) {
                            maxScore = score;
                            contentEl = el;
                        }
                    });
                }

                if (contentEl && maxScore > 100) {
                    const textContent = contentEl.textContent.trim();
                    return {
                        title: document.title || 'Untitled',
                        byline: this.extractByline(doc),
                        content: contentEl.innerHTML,
                        excerpt: textContent.substring(0, 300),
                        length: textContent.split(/\s+/).length,
                        siteName: this.extractSiteName()
                    };
                }

                return null;
            }

            scoreContentElement(el) {
                let score = 0;
                const textContent = el.textContent || '';
                const htmlContent = el.innerHTML || '';
                const textLength = textContent.length;
                const contentLength = htmlContent.length;

                if (contentLength > 0) {
                    const textDensity = textLength / contentLength;
                    score += Math.min(40, textDensity * 50);
                }

                const wordCount = Math.ceil(textLength / 5);
                if (wordCount >= 1000 && wordCount <= 3000) {
                    score += 20;
                } else if (wordCount >= 500 && wordCount < 1000) {
                    score += 15;
                } else if (wordCount >= 200 && wordCount < 500) {
                    score += 10;
                } else if (wordCount >= 100) {
                    score += 5;
                }

                const headings = (htmlContent.match(/<h[1-6]/gi) || []).length;
                const paragraphs = (htmlContent.match(/<p>/gi) || []).length;
                const lists = (htmlContent.match(/<[uo]l>/gi) || []).length;

                const structureScore = Math.min(20,
                    (headings * 3) + (paragraphs * 0.3) + (lists * 2)
                );
                score += structureScore;

                const images = (htmlContent.match(/<img/gi) || []).length;
                const videos = (htmlContent.match(/<video/gi) || []).length;
                const tables = (htmlContent.match(/<table/gi) || []).length;

                const mediaScore = Math.min(10,
                    (images * 0.5) + (videos * 3) + (tables * 1.5)
                );
                score += mediaScore;

                return Math.round(Math.min(100, score));
            }

            async postProcessContent(content) {
                console.log('Post-processing content');

                const finalContent = DOMPurify.sanitize(content.content, {
                    ALLOWED_TAGS: [
                        'p', 'div', 'span', 'a', 'img', 'video', 'audio',
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'blockquote', 'pre', 'code', 'em', 'strong', 'b', 'i', 'u',
                        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
                        'figure', 'figcaption', 'picture', 'source', 'br', 'hr',
                        'time', 'mark', 'section', 'article'
                    ],
                    ALLOWED_ATTR: [
                        'href', 'src', 'srcset', 'alt', 'title', 'width', 'height',
                        'loading', 'class', 'id', 'data-*', 'rel', 'target',
                        'type', 'media', 'sizes', 'datetime', 'cite', 'controls'
                    ],
                    ALLOW_DATA_ATTR: true,
                    KEEP_CONTENT: true
                });

                const tempDiv = document.createElement('div');
                // eslint-disable-next-line no-unsanitized/property
                tempDiv.innerHTML = finalContent;

                tempDiv.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
                    h.classList.add('cyber-heading');
                });

                tempDiv.querySelectorAll('a').forEach(link => {
                    link.classList.add('cyber-link');
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                });

                tempDiv.querySelectorAll('pre,code').forEach(code => {
                    code.classList.add('cyber-code');
                });

                tempDiv.querySelectorAll('table').forEach(table => {
                    table.classList.add('cyber-table');
                });

                return {
                    content: tempDiv.innerHTML,
                    metadata: {
                        title: content.title || document.title,
                        byline: content.byline,
                        excerpt: content.excerpt,
                        length: content.length,
                        dir: content.dir,
                        lang: content.lang,
                        siteName: content.siteName || this.extractSiteName(),
                        framework: this.frameworkDetected,
                        url: window.location.href,
                        extractedAt: Date.now()
                    }
                };
            }

            // === UTILITY METHODS ===
            waitForInitialStability(timeout) {
                return new Promise((resolve) => {
                    const timer = setTimeout(resolve, timeout);

                    const stabilityHandler = this.eventBus.on('content-stable', () => {
                        clearTimeout(timer);
                        stabilityHandler();
                        resolve();
                    });
                });
            }

            signalReady() {
                this.progressEmitter.emitNow('extractionProgress', {
                    status: 'initialized',
                    progress: 0,
                    framework: this.frameworkDetected
                }, { action: 'extractionProgress' });
            }

            sendExtractionResult(result, type) {
                console.log(`Sending ${type} extraction result`);
                dump(`Sending ${type} extraction result\n`);

                this.progressEmitter.emitNow('extractionProgress', {
                    status: 'complete',
                    progress: 100,
                    extractionType: type
                }, { action: 'extractionProgress' });

                // Send via MessageBridge to background (will be routed to visible tab)
                this.bridge.send(null, 'contentExtracted', {
                    content: result.content,
                    metadata: result.metadata
                });

                // Also emit event for HiddenTabManager subscriber
                this.emit('content-extracted', {
                    hiddenTabId: this.hiddenTabId || null,
                    content: result.content,
                    metadata: result.metadata,
                    extractionType: type
                });
            }

            handleExtractionError(error) {
                console.error('Extraction error:', error);

                this.progressEmitter.emitNow('extractionProgress', {
                    status: 'error',
                    progress: 0,
                    error: error.message
                }, { action: 'extractionProgress' });
            }

            handleExtractionRequest(config) {
                if (config.scrolling !== undefined) {
                    this.scrollingEnabled = config.scrolling;
                }
                if (config.proxyScroll !== undefined) {
                    this.proxyScrollEnabled = config.proxyScroll;
                }

                return { success: true, extractionId: this.extractionId };
            }

            executeProxyCommand(data) {
                const { command, params } = data;

                try {
                    switch (command) {
                        case 'scroll':
                            window.scrollTo(0, params.scrollPosition);
                            return { success: true };

                        case 'click': {
                            const el = document.querySelector(params.selector);
                            if (el) {
                                el.click();
                                return { success: true };
                            }
                            return { success: false, error: 'Element not found' };
                        }

                        case 'getState':
                            return {
                                success: true,
                                state: this.getState()
                            };

                        case 'reextract':
                            this.runEnhancedExtraction();
                            return { success: true };

                        default:
                            return { success: false, error: 'Unknown command' };
                    }
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            configurePipeline(config) {
                if (config.steps) {
                    this.extractionPipeline = [...config.steps];
                }
                if (config.heuristics) {
                    Object.assign(this.discoveryHeuristics, config.heuristics);
                }

                return { success: true, pipeline: this.extractionPipeline };
            }

            // === ENHANCED UTILITY METHODS ===
            shouldTriggerLazyLoading() {
                return this.mutationCount < 10 &&
                    this.mediaStats.images < 5 &&
                    !!document.querySelectorAll('[data-src], [loading="lazy"]').length;
            }

            triggerLazyContentDiscovery() {
                this.emit('lazy-loading-trigger', {
                    timestamp: Date.now(),
                    lazyElements: document.querySelectorAll('[data-src], [loading="lazy"]').length
                });

                if (this.scrollingEnabled) {
                    this.simulateContentDiscovery();
                }
            }

            getMetrics() {
                return {
                    extraction: this.extractionMetrics,
                    media: this.mediaStats,
                    framework: this.frameworkDetected,
                    mutations: this.mutationCount,
                    scrolling: {
                        enabled: this.scrollingEnabled,
                        proxyEnabled: this.proxyScrollEnabled
                    },
                    subscribers: this.getSubscriberStats(),
                    events: this.getEventStats()
                };
            }

            getState() {
                return {
                    isActive: this.isActive,
                    extractionInProgress: this.extractionInProgress,
                    extractionId: this.extractionId,
                    framework: this.frameworkDetected,
                    scrollPosition: window.scrollY,
                    documentHeight: document.documentElement.scrollHeight,
                    viewportHeight: window.innerHeight,
                    url: window.location.href,
                    metrics: this.getMetrics(),
                    subscriberHealth: this.getSubscriberHealth()
                };
            }

            getSubscriberHealth() {
                const stats = this.getSubscriberStats();
                return {
                    total: stats.totalSubscribers,
                    active: stats.byState.active || 0,
                    quarantined: stats.quarantined || 0,
                    healthScore: this.calculateHealthScore(stats)
                };
            }

            calculateHealthScore(stats) {
                if (stats.totalSubscribers === 0) return 100;

                const activeRatio = (stats.byState.active || 0) / stats.totalSubscribers;
                const quarantineRatio = (stats.quarantined || 0) / stats.totalSubscribers;

                return Math.max(0, Math.min(100,
                    (activeRatio * 100) - (quarantineRatio * 50)
                ));
            }

            // === TESTING AND DEBUGGING HELPERS ===
            emitTestEvent(eventType, data = {}) {
                this.emit(`test-${eventType}`, {
                    ...data,
                    testTimestamp: Date.now(),
                    extractionId: this.extractionId
                });
            }

            getSubscriberDiagnostics() {
                return {
                    stats: this.getSubscriberStats(),
                    eventStats: this.getEventStats(),
                    health: this.getSubscriberHealth(),
                    recentErrors: this.getRecentSubscriberErrors()
                };
            }

            getRecentSubscriberErrors() {
                // Placeholder for error tracking
                return [];
            }

            extractByline(doc) {
                const selectors = [
                    '[rel="author"]', '.author', '.byline', '.by-line',
                    '.writer', 'meta[name="author"]'
                ];

                for (const selector of selectors) {
                    const el = (doc || document).querySelector(selector);
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

            logExtraction(category, level, message) {
                console.log(`[${category}] ${level}: ${message}`);
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text || '';
                return div.innerHTML;
            }
        }

        // Create singleton instance
        window.__vibeReaderStealthExtractor = new StealthExtractor();

        true;
    } catch (error) {
        delete window.__vibeReaderStealthExtractor;
        throw error;
    }
}