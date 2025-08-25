// VibeReader v2.0 - Proxy Controller with Injection Guards
// Singleton pattern without unnecessary IIFE wrapper

// Prevent multiple injections with simple guard
if (window.__vibeReaderProxyController) {
    console.log('⚠️ ProxyController already exists, skipping');
    false;
} else {
    try {
        class ProxyController {
            constructor() {
                this.container = null;
                this.currentTheme = 'nightdrive';
                this.extractedContent = null;
                this.metadata = null;
                this.isActive = false;
                this.fontMetrics = this.measureFontMetricsFromCSS()
                this.settings = {
                    theme: 'nightdrive',
                    mediaMode: 'emoji',
                    sideScrolls: true,
                    vibeRain: false,
                    autoActivate: false
                };

                // Enhanced diagnostic system with categorization
                this.diagnosticCategories = {
                    ERRORS: {logs: [], expanded: true, icon: '🔴', color: '#ff4757'},
                    MEDIA: {logs: [], expanded: true, icon: '🎬', color: '#3742fa'},
                    SYSTEM: {logs: [], expanded: false, icon: '⚙️', color: '#2ed573'},
                    NETWORK: {logs: [], expanded: false, icon: '🌐', color: '#ff6348'},
                    ASCII: {logs: [], expanded: true, icon: '🎨', color: '#ff9ff3'}
                };

                // Legacy log buffers (keep for compatibility)
                this.sysadminLogs = [];
                this.networkLogs = [];
                this.maxLogsPerTerminal = 10;

                this.init();
            }

            // Measure font metrics from CSS computed styles
            measureFontMetricsFromCSS() {
                // Create a temporary element with CSS classes
                const tester = document.createElement('div');
                tester.className = 'ascii-art';
                tester.style.position = 'absolute';
                tester.style.visibility = 'hidden';
                tester.style.width = 'auto';
                tester.style.height = 'auto';
                tester.textContent = 'M';

                document.body.appendChild(tester);

                // Get computed styles
                const computedStyle = getComputedStyle(tester);
                const fontSize = parseFloat(computedStyle.fontSize) || 10;
                const fontFamily = computedStyle.fontFamily;

                // Create canvas for precise measurement
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `${fontSize}px ${fontFamily}`;

                // Measure character width
                const metrics = ctx.measureText('M');
                const charWidth = metrics.width;

                // Use computed line height
                tester.textContent = 'M\nM';
                const doubleHeight = tester.offsetHeight;
                const lineHeight = doubleHeight / 2;

                document.body.removeChild(tester);

                return {
                    fontSize, charWidth, lineHeight, fontFamily
                };
            }

            initConsoleCapture() {

                // Store original console methods
                this._originalConsole = {
                    log: console.log,
                    error: console.error,
                    warn: console.warn,
                    info: console.info
                };

                // Override console methods to capture output
                const self = this;

                console.log = function (...args) {
                    self._originalConsole.log.apply(console, args);
                    const message = args.join(' ');
                    if (self.shouldLogMessage(message)) {
                        self.addToSysadminLog('LOG', message);
                    }
                };

                console.error = function (...args) {
                    self._originalConsole.error.apply(console, args);
                    const message = args.join(' ');
                    self.addToSysadminLog('ERR', message); // Always log errors
                };

                console.warn = function (...args) {
                    self._originalConsole.warn.apply(console, args);
                    const message = args.join(' ');
                    if (self.shouldLogMessage(message)) {
                        self.addToSysadminLog('WARN', message);
                    }
                };

                console.info = function (...args) {
                    self._originalConsole.info.apply(console, args);
                    const message = args.join(' ');
                    if (self.shouldLogMessage(message)) {
                        self.addToSysadminLog('INFO', message);
                    }
                };

                // Capture background script messages + external logging
                browser.runtime.onMessage.addListener((message) => {
                    if (message.action === 'terminalLog') {
                        // External logging from background script or other sources
                        self.logToTerminal(message.level || 'INFO', message.message || 'Unknown message', message.category || 'SYSTEM', message.source || 'external', message.metadata || {});
                    } else if (message.action && message.action.includes('extraction')) {
                        self.addToNetworkLog('BG', `${message.action}: ${message.status || 'processing'}`);
                    }
                });
            }

            shouldLogMessage(message) {
                // Filter out noisy/irrelevant messages
                const ignorePatterns = ['Content-Security-Policy', 'Partitioned cookie', 'Navigation API not supported', 'GSI_LOGGER', 'GRECAPTCHA', 'Ignoring unsupported entryTypes', 'downloadable font: failed', '📨 Received message: ping', // Too noisy
                    'extractionProgress', // Handle separately
                    '[object Object]'];

                return !ignorePatterns.some(pattern => message.includes(pattern));
            }

            categorizeLog(level, message) {
                // Smart category detection
                if (message.includes('ERR:') || message.includes('❌') || message.includes('failed') || message.includes('error') || level === 'ERR') {
                    return 'ERRORS';
                }
                if (message.includes('MEDIA') || message.includes('🔍') || message.includes('images') || message.includes('videos') || message.includes('📦') || message.includes('Found')) {
                    return 'MEDIA';
                }
                if (message.includes('ASCII') || message.includes('🎯') || message.includes('conversion') || message.includes('aalib') || message.includes('🎨')) {
                    return 'ASCII';
                }
                if (message.includes('BG:') || message.includes('extraction') || message.includes('proxy') || message.includes('NETMON') || message.includes('framework')) {
                    return 'NETWORK';
                }
                return 'SYSTEM';
            }

            addToDiagnostics(level, message, source = 'SYSADMIN') {
                const category = this.categorizeLog(level, message);
                const cleanMessage = message.substring(0, 50); // Slightly longer for better context
                const timestamp = Date.now();

                // Find existing log entry to consolidate
                const existing = this.diagnosticCategories[category].logs.find(log => log.message.includes(cleanMessage.substring(0, 25)));

                if (existing) {
                    existing.count++;
                    existing.lastSeen = timestamp;
                } else {
                    this.diagnosticCategories[category].logs.unshift({
                        level,
                        message: cleanMessage,
                        count: 1,
                        timestamp,
                        lastSeen: timestamp,
                        source
                    });

                    // Limit logs per category
                    if (this.diagnosticCategories[category].logs.length > 8) {
                        this.diagnosticCategories[category].logs.pop();
                    }
                }
            }

            // ====== CENTRALIZED LOGGING API ======
            logToTerminal(level, message, category = 'SYSTEM', source = 'proxy', metadata = {}) {
                // Enhanced unified logging system - single entry point for all logs
                const logEntry = {
                    level,
                    message,
                    category: category.toUpperCase(),
                    source,
                    timestamp: Date.now(),
                    metadata
                };

                // Add to diagnostic categories
                this.addToDiagnostics(level, message, source);

                // Auto-dump to terminal for external visibility
                if (typeof dump !== 'undefined') {
                    const categoryIcon = this.getCategoryIcon(logEntry.category);
                    const prefix = source === 'background' ? '[BG]' : source === 'extractor' ? '[EXT]' : '[PROXY]';
                    dump(`${prefix} ${categoryIcon} ${level}: ${message}\n`);
                }

                // Legacy compatibility - still populate old logs for existing code
                this.addToLegacySysadminLog(level, message);
            }

            addToSysadminLog(level, message) {
                // Route through centralized system
                this.logToTerminal(level, message, this.categorizeMessage(message), 'proxy');
            }

            addToLegacySysadminLog(level, message) {
                // Legacy compatibility - still populate old logs
                const cleanMessage = message.substring(0, 35);
                const existing = this.sysadminLogs.find(log => log.includes(cleanMessage));

                if (existing) {
                    const countMatch = existing.match(/x(\d+)$/);
                    const count = countMatch ? parseInt(countMatch[1]) + 1 : 2;
                    const baseEntry = existing.replace(/ x\d+$/, '');
                    this.sysadminLogs[this.sysadminLogs.indexOf(existing)] = `${baseEntry} x${count}`;
                } else {
                    const logEntry = `${level}: ${cleanMessage}`;
                    this.sysadminLogs.unshift(logEntry);
                    if (this.sysadminLogs.length > this.maxLogsPerTerminal) {
                        this.sysadminLogs.pop();
                    }
                }
            }

            addToNetworkLog(source, message) {
                // Enhanced logging with categorization
                this.addToDiagnostics('INFO', message, 'NETMON');

                // Legacy compatibility
                const cleanMessage = message.substring(0, 35);
                const existing = this.networkLogs.find(log => log.includes(cleanMessage));

                if (existing) {
                    const countMatch = existing.match(/x(\d+)$/);
                    const count = countMatch ? parseInt(countMatch[1]) + 1 : 2;
                    const baseEntry = existing.replace(/ x\d+$/, '');
                    this.networkLogs[this.networkLogs.indexOf(existing)] = `${baseEntry} x${count}`;
                } else {
                    const logEntry = `${source}: ${cleanMessage}`;
                    this.networkLogs.unshift(logEntry);
                    if (this.networkLogs.length > this.maxLogsPerTerminal) {
                        this.networkLogs.pop();
                    }
                }
            }

            // Comprehensive error capture
            setupEnhancedErrorCapture() {
                const self = this;

                // Capture unhandled promise rejections
                window.addEventListener('unhandledrejection', (event) => {
                    self.addToDiagnostics('ERR', `Promise rejection: ${event.reason}`);
                });

                // Capture global errors
                window.addEventListener('error', (event) => {
                    self.addToDiagnostics('ERR', `Global error: ${event.message} at ${event.filename}:${event.lineno}`);
                });

                // Enhanced extension API error capture
                if (browser?.runtime?.onMessage) {
                    const originalAddListener = browser.runtime.onMessage.addListener;
                    browser.runtime.onMessage.addListener = function (callback) {
                        const wrappedCallback = (request, sender, sendResponse) => {
                            try {
                                return callback(request, sender, sendResponse);
                            } catch (error) {
                                self.addToDiagnostics('ERR', `Message handler error: ${error.message}`);
                                throw error;
                            }
                        };
                        return originalAddListener.call(this, wrappedCallback);
                    };
                }
            }

            init() {
                const initStart = performance.now();

                try {
                    console.log('🎮 ProxyController.init() starting:', {
                        url: window.location.href, timestamp: new Date().toISOString()
                    });

                    // Initialize console logging capture
                    this.initConsoleCapture();

                    // Setup enhanced error capture
                    this.setupEnhancedErrorCapture();

                    // Set up message listener with error handling
                    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                        this.handleMessageSafe(request, sender, sendResponse);
                        return true; // Keep channel open
                    });

                    // Load settings
                    this.loadSettings();

                    // Start activation
                    this.activate();

                    console.log(`✅ ProxyController initialized in ${(performance.now() - initStart).toFixed(1)}ms`);

                } catch (error) {
                    console.error('❌ ProxyController initialization failed:', error);
                    this.handleInitError(error);
                }
            }

            async handleMessageSafe(request, sender, sendResponse) {
                try {
                    const result = await this.handleMessage(request, sender);
                    sendResponse(this.makeSerializable(result));
                } catch (error) {
                    console.error('❌ Message handling error:', error);
                    sendResponse({
                        success: false, error: error.message || 'Unknown error'
                    });
                }
            }

            // ====== LOGGING HELPER METHODS ======
            categorizeMessage(message) {
                // Auto-categorize messages based on content
                const lowerMsg = message.toLowerCase();

                if (lowerMsg.includes('err') || lowerMsg.includes('❌') || lowerMsg.includes('failed') || lowerMsg.includes('error')) {
                    return 'ERRORS';
                } else if (lowerMsg.includes('media') || lowerMsg.includes('🔍') || lowerMsg.includes('images') || lowerMsg.includes('videos') || lowerMsg.includes('📦') || lowerMsg.includes('found')) {
                    return 'MEDIA';
                } else if (lowerMsg.includes('ascii') || lowerMsg.includes('🎯') || lowerMsg.includes('conversion') || lowerMsg.includes('aalib') || lowerMsg.includes('🎨')) {
                    return 'ASCII';
                } else if (lowerMsg.includes('bg:') || lowerMsg.includes('extraction') || lowerMsg.includes('proxy') || lowerMsg.includes('netmon') || lowerMsg.includes('framework') || lowerMsg.includes('injection')) {
                    return 'NETWORK';
                } else {
                    return 'SYSTEM';
                }
            }

            getCategoryIcon(category) {
                const icons = {
                    'ERRORS': '❌',
                    'MEDIA': '🔍',
                    'ASCII': '🎯',
                    'NETWORK': '🌐',
                    'SYSTEM': '✅'
                };
                return icons[category] || '📝';
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
                        return {success: true, type: 'proxy'};

                    case 'displayContent':
                        this.displayExtractedContent(request.content, request.metadata);
                        return {success: true};

                    case 'extractionProgress':
                        this.showExtractionProgress(request.status, request.progress);
                        return {success: true};

                    case 'deactivate':
                        this.deactivate();
                        return {success: true};

                    case 'showError':
                        this.showError(request.error);
                        return {success: true};

                    case 'hiddenTabClosed':
                        this.handleHiddenTabClosed(request.error);
                        return {success: true};

                    case 'updateSettings':
                        this.updateSettings(request.settings);
                        return {success: true};

                    case 'getStatus':
                        return {active: this.isActive};

                    default:
                        console.warn('Unknown message action:', request.action);
                        return {success: false, error: 'Unknown action'};
                }
            }

            async loadSettings() {
                try {
                    const response = await browser.runtime.sendMessage({
                        action: 'getSettings'
                    });

                    if (response && typeof response === 'object') {
                        this.settings = {...this.settings, ...response};
                        this.currentTheme = this.settings.theme || 'nightdrive';
                    }

                    console.log('✅ Settings loaded:', this.settings);

                } catch (error) {
                    console.error('❌ Failed to load settings:', error);
                }
            }

            updateSettings(newSettings) {
                this.settings = {...this.settings, ...newSettings};
                this.currentTheme = this.settings.theme || 'nightdrive';

                this.applyTheme(this.currentTheme);
                this.updateButtonTexts();

                if (this.container) {
                    const rainContainer = this.container.querySelector('.vibe-rain-container');
                    if (this.settings.vibeRain && !rainContainer) {
                        this.createMatrixRain();
                    } else if (!this.settings.vibeRain && rainContainer) {
                        rainContainer.remove();
                    }
                }

                browser.runtime.sendMessage({
                    action: 'saveSettings', settings: this.settings
                }).catch(error => {
                    console.error('Failed to save settings:', error);
                });
            }

            activate() {
                try {
                    console.log('🔥 Activating Vibe Mode UI');

                    this.isActive = true;

                    this.hideOriginalContent();
                    this.createInterface();

                    browser.runtime.sendMessage({
                        action: 'updateBadge', active: true
                    }).catch(error => {
                        console.error('Failed to update badge:', error);
                    });

                } catch (error) {
                    console.error('❌ Activation failed:', error);
                    this.handleActivationError(error);
                }
            }

            hideOriginalContent() {
                this.originalState = {
                    bodyOverflow: document.body.style.overflow,
                    htmlOverflow: document.documentElement.style.overflow,
                    hiddenElements: []
                };

                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';

                const elements = document.body.children;
                for (let el of elements) {
                    if (!el.classList.contains('vibe-reader-container')) {
                        const originalDisplay = el.style.display;
                        el.style.display = 'none';
                        this.originalState.hiddenElements.push({
                            element: el, display: originalDisplay
                        });
                    }
                }
            }

            createInterface() {
                const existing = document.querySelector('.vibe-reader-container');
                if (existing) {
                    existing.remove();
                }

                this.container = document.createElement('div');
                this.container.className = 'vibe-reader-container vibe-reader-proxy';
                this.container.setAttribute('data-theme', this.currentTheme);

                this.container.innerHTML = this.getInitialHTML();

                document.body.appendChild(this.container);

                this.setupEventHandlers();
                this.applyTheme(this.currentTheme);
                this.initializeEffects();
            }

            getInitialHTML() {
                return `
                <div class="vibe-reader-overlay">
                    <div class="vibe-header">
                        <div class="vibe-header-left">
                            <span class="vibe-brand">▓▓ VIBE READER v2.0 ▓▓</span>
                            <span class="vibe-status">[ EXTRACTING ]</span>
                        </div>
                        <div class="vibe-header-right">
                            <button class="vibe-btn media-btn" title="Toggle Media Mode">🌌</button>
                            <button class="vibe-btn theme-btn" title="Cycle Theme">🌆</button>
                            <button class="vibe-btn disconnect-btn" title="Disconnect">🌑</button>
                        </div>
                    </div>
                    
                    <div class="vibe-layout">
                        ${this.settings.sideScrolls ? this.createLeftPanel() : '<div class="vibe-sidebar-spacer"></div>'}
                        
                        <main class="vibe-content">
                            <article class="vibe-article">
                                <header class="article-header">
                                    <h1 class="article-title glitch" data-text="INITIALIZING">
                                        INITIALIZING
                                    </h1>
                                    <div class="article-meta">
                                        <span class="meta-item">🔥 VIBE MODE ENGAGED</span>
                                        <span class="meta-item">⚡ EXTRACTING CONTENT</span>
                                    </div>
                                </header>
                                
                                <div class="article-content">
                                    <div class="extraction-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: 0%"></div>
                                        </div>
                                        <p class="extraction-status">Initializing extraction...</p>
                                    </div>
                                </div>
                            </article>
                        </main>
                        
                        ${this.settings.sideScrolls ? this.createRightPanel() : '<div class="vibe-sidebar-spacer"></div>'}
                    </div>
                    
                    ${this.settings.vibeRain ? '<div class="vibe-rain-container"></div>' : ''}
                    <div class="retrofuture-bg-effects"></div>
                </div>
            `;
            }

            createLeftPanel() {
                return `
                <aside class="vibe-sidebar left-panel">
                    <div class="terminal-window">
                        <div class="terminal-header">
                            <span class="terminal-title">▓ SYSADMIN ▓</span>
                            <div class="led-indicator"></div>
                        </div>
                        <div class="terminal-content" id="left-terminal">
                            <div class="terminal-line">> SYSADMIN INIT...</div>
                        </div>
                    </div>
                </aside>
            `;
            }

            createRightPanel() {
                return `
                <aside class="vibe-sidebar right-panel">
                    <div class="terminal-window">
                        <div class="terminal-header">
                            <span class="terminal-title">▓ NETMON ▓</span>
                            <div class="led-indicator"></div>
                        </div>
                        <div class="terminal-content" id="right-terminal">
                            <div class="terminal-line">> NETWORK INIT...</div>
                        </div>
                    </div>
                </aside>
            `;
            }

            setupEventHandlers() {
                this.container.addEventListener('click', (e) => {
                    const target = e.target;

                    if (target.classList.contains('media-btn')) {
                        this.cycleMediaMode();
                    } else if (target.classList.contains('theme-btn')) {
                        this.cycleTheme();
                    } else if (target.classList.contains('disconnect-btn')) {
                        this.requestDeactivation();
                    } else if (target.closest('.media-wrapper')) {
                        this.cycleMediaItem(target.closest('.media-wrapper'));
                    }
                });
            }

            showExtractionProgress(status, progress) {
                const progressFill = this.container?.querySelector('.progress-fill');
                const statusText = this.container?.querySelector('.extraction-status');

                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }

                if (statusText) {
                    const messages = {
                        'initializing': 'Initializing content extractor...',
                        'waiting_for_framework': 'Detecting page framework...',
                        'extracting': 'Parsing content with Readability.js...',
                        'complete': 'Content extracted successfully!',
                        'error': 'Content extraction failed - see terminal for details'
                    };
                    statusText.textContent = messages[status] || 'Processing...';
                }

                this.updateTerminalStatus(status, progress);
            }

            displayExtractedContent(content, metadata) {
                try {
                    console.log('📄 Displaying content:', metadata?.title);

                    this.extractedContent = content;
                    this.metadata = metadata;

                    // Cache performance-sensitive values for terminals
                    this._contentSize = Math.round(JSON.stringify(content).length / 1024);
                    this._elementCount = 0; // Will be updated after DOM creation

                    const mainContent = this.container?.querySelector('.vibe-content');
                    if (!mainContent) {
                        console.error('Main content container not found');
                        return;
                    }

                    mainContent.innerHTML = `
                    <article class="vibe-article">
                        <header class="article-header">
                            <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata?.title || 'UNTITLED')}">
                                ${this.escapeHtml(metadata?.title || 'UNTITLED')}
                            </h1>
                            ${metadata?.byline ? `<div class="article-byline">BY: ${this.escapeHtml(metadata.byline)}</div>` : ''}
                            <div class="article-meta">
                                <span class="meta-item">📍 ${metadata?.siteName || 'Unknown'}</span>
                                <span class="meta-item">📝 ${this.formatWordCount(metadata?.length || 0)}</span>
                                <span class="meta-item">⏱️ ${this.calculateReadingTime(metadata?.length || 0)} min</span>
                            </div>
                        </header>
                        
                        <div class="article-content">
                            ${this.processContent(content)}
                        </div>
                    </article>
                `;

                    this.processImages();
                    this.processTables();

                    const statusEl = this.container?.querySelector('.vibe-status');
                    if (statusEl) {
                        statusEl.textContent = '[ ACTIVE ]';
                    }

                    this.updateTerminalsWithContent(metadata);
                    this.initializeEffects();

                    // Update element count after DOM is created
                    setTimeout(() => {
                        this._elementCount = this.container ? this.container.querySelectorAll('*').length : 0;
                    }, 100);

                } catch (error) {
                    console.error('❌ Failed to display content:', error);
                    this.showError('Failed to display content');
                }
            }

            processContent(html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                    heading.classList.add('cyber-heading');
                });

                tempDiv.querySelectorAll('a').forEach(link => {
                    link.classList.add('cyber-link');
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                });

                tempDiv.querySelectorAll('pre, code').forEach(code => {
                    code.classList.add('cyber-code');
                });

                return tempDiv.innerHTML;
            }

            processImages() {
                const images = this.container?.querySelectorAll('.article-content img') || [];
                console.log(`🔍 Media Debug: Found ${images.length} images in .article-content`);
                if (typeof dump !== 'undefined') {
                    dump(`[MEDIA] Found ${images.length} images for processing\n`);
                }
                images.forEach(img => this.createMediaWrapper(img));

                // Also process any videos
                const videos = this.container?.querySelectorAll('.article-content video') || [];
                console.log(`🔍 Media Debug: Found ${videos.length} videos in .article-content`);
                if (typeof dump !== 'undefined') {
                    dump(`[MEDIA] Found ${videos.length} videos for processing\n`);
                }
                videos.forEach(video => this.createMediaWrapper(video));
            }

            createMediaWrapper(mediaElement) {
                const wrapper = document.createElement('div');
                wrapper.className = 'media-wrapper';
                // Always use current media mode setting for consistency
                wrapper.setAttribute('data-mode', this.settings.mediaMode);

                wrapper._originalElement = mediaElement.cloneNode(true);
                wrapper._originalSrc = mediaElement.src || mediaElement.getAttribute('data-src') || mediaElement.getAttribute('data-lazy-src') || mediaElement.getAttribute('data-original');
                wrapper._isVideo = mediaElement.tagName === 'VIDEO';
                wrapper._mediaType = mediaElement.tagName.toLowerCase();

                console.log(`📦 Creating media wrapper:`, {
                    type: wrapper._mediaType,
                    src: wrapper._originalSrc,
                    mode: this.settings.mediaMode
                });
                if (typeof dump !== 'undefined') {
                    dump(`[MEDIA] Creating wrapper for ${wrapper._mediaType} in ${this.settings.mediaMode} mode\n`);
                }

                // Apply current media mode immediately
                this.updateMediaDisplay(wrapper);

                mediaElement.parentNode?.insertBefore(wrapper, mediaElement);
                mediaElement.remove();
            }

            updateMediaDisplay(wrapper) {
                const mode = wrapper.getAttribute('data-mode') || this.settings.mediaMode;
                wrapper.innerHTML = '';

                switch (mode) {
                    case 'emoji':
                        wrapper.innerHTML = this.createEmojiDisplay(wrapper._isVideo);
                        break;
                    case 'ascii':
                        wrapper.innerHTML = this.createAsciiDisplay(wrapper._isVideo);
                        if (wrapper._originalSrc && !wrapper._isVideo) {
                            this.convertToAscii(wrapper._originalSrc, wrapper);
                        }
                        break;
                    case 'normal':
                        const clone = wrapper._originalElement.cloneNode(true);
                        clone.classList.add('cyber-media');
                        wrapper.appendChild(clone);
                        break;
                }
            }

            createEmojiDisplay(isVideo) {
                // Use themed icons if available, fallback to generic
                const themedIcon = this.getThemedMediaIcon(isVideo);
                const emoji = themedIcon || (isVideo ? '🎬' : '🖼️');
                const label = isVideo ? 'VIDEO' : 'IMAGE';

                return `
                <div class="media-emoji-display">
                    <div class="emoji-icon">${emoji}</div>
                    <div class="media-label">${label}</div>
                    <div class="mode-hint">Click to cycle</div>
                </div>
            `;
            }

            getThemedMediaIcon(isVideo) {
                // Use currentThemeConfig if available, otherwise get current theme config
                let config = this.currentThemeConfig;
                if (!config) {
                    const THEME_CONFIGS = {
                        'nightdrive': {
                            mediaIcons: {image: '💽', video: '📼'}
                        }, 'neon-surge': {
                            mediaIcons: {image: '📸', video: '📀'}
                        }, 'outrun-storm': {
                            mediaIcons: {image: '🖼️', video: '🎬'}
                        }, 'strange-days': {
                            mediaIcons: {image: '🎴', video: '📹'}
                        }
                    };
                    config = THEME_CONFIGS[this.currentTheme] || THEME_CONFIGS['nightdrive'];
                }

                return isVideo ? config.mediaIcons.video : config.mediaIcons.image;
            }

            createAsciiDisplay(isVideo) {
                const theme = this.getThemedAsciiPlaceholder(this.currentTheme);
                const label = isVideo ? theme['video'] : theme['image'];

                return `
                <div class="flex items-center justify-center p-4 text-text-muted">
                    <pre class="text-xs leading-tight font-mono">${label}</pre>
                </div>
            `;
            }

            async getImageDimensions(src) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = function () {
                        resolve({
                            width: img.naturalWidth, height: img.naturalHeight
                        });
                    };

                    img.onerror = function () {
                        // Fallback to reasonable default dimensions if image fails to load
                        console.warn('Failed to load image for dimension extraction:', src);
                        resolve({
                            width: 600,  // Default landscape aspect
                            height: 400
                        });
                    };

                    img.src = src;
                });
            }

            async convertToAscii(src, wrapper) {
                try {
                    // Enhanced debug logging with dump() output
                    console.log('🎯 ASCII Conversion ENTRY POINT:', {
                        src: src, wrapperExists: !!wrapper, aalibExists: !!aalib
                    });
                    if (typeof dump !== 'undefined') {
                        dump(`[ASCII] 🎯 ASCII Conversion starting for: ${src}\n`);
                    }

                    if (!aalib) {
                        console.warn('❌ ASCII FAIL: aalib not available');
                        if (typeof dump !== 'undefined') {
                            dump(`[ASCII] ❌ FAIL: aalib not available\n`);
                        }
                        return;
                    }

                    // Set wrapper to ASCII mode and show loading
                    wrapper.setAttribute('data-mode', 'ascii');
                    wrapper.innerHTML = '<div class="flex items-center justify-center p-4 text-text-muted"><span>Converting to ASCII...</span></div>';

                    // Get current theme for styling
                    const theme = this.currentTheme || 'nightdrive';


                    // Get image dimensions
                    const imageDimensions = await this.getImageDimensions(src);
                    const {width: imgWidth, height: imgHeight} = imageDimensions;
                    const aspectRatio = imgWidth / imgHeight;

                    // Get computed font from CSS (respects theme)
                    const computedStyle = getComputedStyle(document.documentElement);
                    const fontFamily = computedStyle.fontFamily || "'Fira Code', monospace";

                    // Measure the actual font metrics
                    this.fontMetrics = this.measureFontMetricsFromCSS();

                    // Quality multiplier for better ASCII representation
                    const QUALITY_MULTIPLIER = 2.5;

                    // Calculate display size (maintain aspect ratio, reasonable limits)
                    const maxDisplayWidth = 800;
                    const maxDisplayHeight = 600;

                    let displayWidth, displayHeight;

                    if (aspectRatio > maxDisplayWidth / maxDisplayHeight) {
                        displayWidth = Math.min(imgWidth, maxDisplayWidth);
                        displayHeight = displayWidth / aspectRatio;
                    } else {
                        displayHeight = Math.min(imgHeight, maxDisplayHeight);
                        displayWidth = displayHeight * aspectRatio;
                    }

                    // Calculate high-quality render dimensions
                    const renderWidth = displayWidth * QUALITY_MULTIPLIER;
                    const renderHeight = displayHeight * QUALITY_MULTIPLIER;

                    // Calculate character grid dimensions
                    const charsWide = Math.floor(renderWidth / this.fontMetrics.charWidth);
                    const charsTall = Math.floor(renderHeight / this.fontMetrics.lineHeight);

                    console.log('📐 ASCII Canvas calculations:', {
                        image: `${imgWidth}x${imgHeight}`,
                        display: `${Math.round(displayWidth)}x${Math.round(displayHeight)}`,
                        render: `${renderWidth}x${renderHeight}`,
                        chars: `${charsWide}x${charsTall}`,
                        fontMetrics: this.fontMetrics
                    });

                    if (typeof dump !== 'undefined') {
                        dump(`[ASCII] 📐 Canvas calc: ${imgWidth}x${imgHeight} -> ${Math.round(displayWidth)}x${Math.round(displayHeight)}px (${charsWide}x${charsTall} chars)\n`);
                    }

                    // Determine appropriate data-size based on display dimensions
                    let sizeClass;
                    if (displayWidth <= 300) sizeClass = 'sm';
                    else if (displayWidth <= 500) sizeClass = 'md';
                    else if (displayWidth <= 800) sizeClass = 'lg';
                    else sizeClass = 'xl';
                    
                    wrapper.setAttribute('data-size', sizeClass);

                    // Create canvas element
                    const canvas = document.createElement('canvas');
                    canvas.width = renderWidth;
                    canvas.height = renderHeight;
                    
                    // Apply utility classes for canvas styling
                    canvas.className = 'block max-w-full h-auto';
                    canvas.style.width = `${displayWidth}px`;
                    canvas.style.height = `${displayHeight}px`;

                    // Process with aalib
                    aalib.read.image.fromURL(src)
                        .map(aalib.aa({
                            width: charsWide, height: charsTall, colored: true
                        }))
                        .map(aalib.render.canvas({
                            el: canvas,
                            fontFamily: fontFamily,
                            fontSize: this.fontMetrics.fontSize,
                            charWidth: this.fontMetrics.charWidth,
                            lineHeight: this.fontMetrics.lineHeight,
                            width: renderWidth,
                            height: renderHeight,
                            background: 'transparent',
                            charset: aalib.charset.ASCII_CHARSET
                        }))
                        .subscribe({
                            next: () => {
                                console.log('✅ Canvas ASCII conversion successful');

                                // Clear wrapper and add canvas directly
                                wrapper.innerHTML = '';
                                wrapper.appendChild(canvas);

                                console.log('✅ ASCII conversion successful for:', src);
                                if (typeof dump !== 'undefined') {
                                    dump(`[ASCII] ✅ SUCCESS: Conversion complete for ${src}\n`);
                                }
                            }, error: (err) => {
                                console.error('❌ ASCII conversion failed:', err, 'for src:', src);
                                if (typeof dump !== 'undefined') {
                                    dump(`[ASCII] ❌ ERROR: ${err.message || err} for ${src}\n`);
                                }
                                // Fallback to themed placeholder
                                wrapper.innerHTML = '';
                                const themeData = this.getThemedAsciiPlaceholder(theme);
                                const placeholder = document.createElement('div');
                                placeholder.className = 'flex items-center justify-center p-4 text-error-400';
                                placeholder.textContent = themeData['image'] || '⚠️ CONVERSION FAILED';
                                wrapper.appendChild(placeholder);
                            }
                        });

                } catch (error) {
                    console.error('ASCII conversion error:', error);
                    // Fallback to placeholder
                    wrapper.setAttribute('data-mode', 'ascii');
                    const themeData = this.getThemedAsciiPlaceholder(this.currentTheme || 'nightdrive');
                    const placeholder = document.createElement('div');
                    placeholder.className = 'flex items-center justify-center p-4 text-error-400';
                    placeholder.textContent = themeData['image'] || '⚠️ CONVERSION FAILED';
                    wrapper.innerHTML = '';
                    wrapper.appendChild(placeholder);
                }
            }

            // Simplified wrapper sizing with data attributes and CSS constraints
            sizeWrapperToCanvas(wrapper, displayWidth, displayHeight) {
                try {
                    // CSS handles sizing through data-size attributes and utility classes
                    // No manual sizing needed as our Tailwind utilities handle constraints
                    console.log('📏 ASCII wrapper using data-size attribute:', {
                        dataSize: wrapper.getAttribute('data-size'),
                        dataMode: wrapper.getAttribute('data-mode'),
                        dimensions: `${Math.round(displayWidth)}x${Math.round(displayHeight)}px`
                    });
                } catch (error) {
                    console.warn('Failed to log ASCII wrapper info:', error);
                    if (typeof dump !== 'undefined') {
                        dump('Failed to log ASCII wrapper info:', error);
                    }
                }
            }

            getThemedAsciiPlaceholder(theme) {
                const placeholders = {
                    'nightdrive': {'image': `
________/\\\\\\\\\\\\\\\\\\\\\\__/\\\\\\\\____________/\\\\\\\\_____/\\\\\\\\\\\\\\\\\\\\\\\\_        
 _______\\/////\\\\\\///__\\/\\\\\\\\\\\\________/\\\\\\\\\\\\___/\\\\\\//////////__       
  ___________\\/\\\\\\_____\\/\\\\\\//\\\\\\____/\\\\\\//\\\\\\__/\\\\\\_____________      
   ___________\\/\\\\\\_____\\/\\\\\\\\///\\\\\\/\\\\\\/_\\/\\\\\\_\\/\\\\\\____/\\\\\\\\\\\\\\_     
    ___________\\/\\\\\\_____\\/\\\\\\__\\///\\\\\\/___\\/\\\\\\_\\/\\\\\\___\\/////\\\\\\_    
     ___________\\/\\\\\\_____\\/\\\\\\____\\///_____\\/\\\\\\_\\/\\\\\\_______\\/\\\\\\_   
      ___________\\/\\\\\\_____\\/\\\\\\_____________\\/\\\\\\_\\/\\\\\\_______\\/\\\\\\_  
       __/\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\_____________\\/\\\\\\_\\//\\\\\\\\\\\\\\\\\\\\\\\\/__ 
        _\\///__\\///////////__\\///______________\\///___\\////////////____`,
                        'video':`
________/\\\\\\________/\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\\\____        
 _______\\/\\\\\\_______\\/\\\\\\_\\/////\\\\\\///__\\/\\\\\\////////\\\\\\__       
  _______\\//\\\\\\______/\\\\\\______\\/\\\\\\_____\\/\\\\\\______\\//\\\\\\_      
   ________\\//\\\\\\____/\\\\\\_______\\/\\\\\\_____\\/\\\\\\_______\\/\\\\\\_     
    _________\\//\\\\\\__/\\\\\\________\\/\\\\\\_____\\/\\\\\\_______\\/\\\\\\_    
     __________\\//\\\\\\/\\\\\\_________\\/\\\\\\_____\\/\\\\\\_______\\/\\\\\\_   
      ___________\\//\\\\\\\\\\__________\\/\\\\\\_____\\/\\\\\\_______/\\\\\\__  
       __/\\\\\\______\\//\\\\\\________/\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\\\\\\\\\\\\\\\\\\\/___ 
        _\\///________\\///________\\///////////__\\////////////_____`},

                    'neon-surge': {
                        'image': `
,e,                                     
 "  888 888 8e   ,"Y88b  e88 888  ,e e, 
888 888 888 88b "8" 888 d888 888 d88 88b
888 888 888 888 ,ee 888 Y888 888 888   ,
888 888 888 888 "88 888  "88 888  "YeeP"
                          ,  88P        
                         "8",P"         `,
                        'video':`
          ,e,      888                  
Y8b Y888P  "   e88 888  ,e e,   e88 88e 
 Y8b Y8P  888 d888 888 d88 88b d888 888b
  Y8b "   888 Y888 888 888   , Y888 888P
   Y8P    888  "88 888  "YeeP"  "88 88" `},

                    'outrun-storm': {
                        'image': `
::::::::::::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::::::::::::
:: ______                                         ::
::/\\__  _\\                                        ::
::\\/_/\\ \\/     ___ ___      __       __      __   ::
::   \\ \\ \\   /' __\` __\`\\  /'__\`\\   /'_ \`\\  /'__\`\\ ::
::    \\_\\ \\__/\\ \\/\\ \\/\\ \\/\\ \\L\\.\\_/\\ \\L\\ \\/\\  __/ ::
::    /\\_____\\ \\_\\ \\_\\ \\_\\ \\__/.\\_\\ \\____ \\ \\____\\::
::    \\/_____/\\/_/\\/_/\\/_/\\/__/\\/_/\\/___L\\ \\/____/::
::                                   /\\____/      ::
::                                   \\_/__/       ::
::                                                ::
::::::::::::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::::::::::::`,
                        'video': `
::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::
:: __  __          __                   ::
::/\\ \\/\\ \\  __    /\\ \\                  ::
::\\ \\ \\ \\ \\/\\_\\   \\_\\ \\     __    ___   ::
:: \\ \\ \\ \\ \\/\\ \\  /'_\` \\  /'__\`\\ / __\`\\ ::
::  \\ \\ \\_/ \\ \\ \\/\\ \\L\\ \\/\\  __//\\ \\L\\ \\::
::   \\ \`\\___/\\ \\_\\ \\___,_\\ \\____\\ \\____/::
::    \`\\/__/  \\/_/\\/__,_ /\\/____/\\/___/ ::
::                                      ::
::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::`},

                    'strange-days': {'image': `
 /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\ 
( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )
 > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ < 
 /\\_/\\            _         _   _         _                   _              _       /\\_/\\ 
( o.o )          /\\ \\      /\\_\\/\\_\\ _    / /\\                /\\ \\           /\\ \\    ( o.o )
 > ^ <           \\ \\ \\    / / / / //\\_\\ / /  \\              /  \\ \\         /  \\ \\    > ^ < 
 /\\_/\\           /\\ \\_\\  /\\ \\/ \\ \\/ / // / /\\ \\            / /\\ \\_\\       / /\\ \\ \\   /\\_/\\ 
( o.o )         / /\\/_/ /  \\____\\__/ // / /\\ \\ \\          / / /\\/_/      / / /\\ \\_\\ ( o.o )
 > ^ <         / / /   / /\\/________// / /  \\ \\ \\        / / / ______   / /_/_ \\/_/  > ^ < 
 /\\_/\\        / / /   / / /\\/_// / // / /___/ /\\ \\      / / / /\\_____\\ / /____/\\     /\\_/\\ 
( o.o )      / / /   / / /    / / // / /_____/ /\\ \\    / / /  \\/____ // /\\____\\/    ( o.o )
 > ^ <   ___/ / /__ / / /    / / // /_________/\\ \\ \\  / / /_____/ / // / /______     > ^ < 
 /\\_/\\  /\\__\\/_/___\\\\/_/    / / // / /_       __\\ \\_\\/ / /______\\/ // / /_______\\    /\\_/\\ 
( o.o ) \\/_________/        \\/_/ \\_\\___\\     /____/_/\\/___________/ \\/__________/   ( o.o )
 > ^ <                                                                               > ^ < 
 /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\  /\\_/\\ 
( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )( o.o )
 > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ < `, 'video':`
   _      _      _      _      _      _      _      _      _      _      _   
 _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_ 
(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)
 (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_) 
   _    _          _        _        _            _            _         _   
 _( )_ /\\ \\    _ / /\\      /\\ \\     /\\ \\         /\\ \\         /\\ \\     _( )_ 
(_ o _)\\ \\ \\  /_/ / /      \\ \\ \\   /  \\ \\____   /  \\ \\       /  \\ \\   (_ o _)
 (_,_)  \\ \\ \\ \\___\\/       /\\ \\_\\ / /\\ \\_____\\ / /\\ \\ \\     / /\\ \\ \\   (_,_) 
   _    / / /  \\ \\ \\      / /\\/_// / /\\/___  // / /\\ \\_\\   / / /\\ \\ \\    _   
 _( )_  \\ \\ \\   \\_\\ \\    / / /  / / /   / / // /_/_ \\/_/  / / /  \\ \\_\\ _( )_ 
(_ o _)  \\ \\ \\  / / /   / / /  / / /   / / // /____/\\    / / /   / / /(_ o _)
 (_,_)    \\ \\ \\/ / /   / / /  / / /   / / // /\\____\\/   / / /   / / /  (_,_) 
   _       \\ \\ \\/ /___/ / /__ \\ \\ \\__/ / // / /______  / / /___/ / /     _   
 _( )_      \\ \\  //\\__\\/_/___\\ \\ \\___\\/ // / /_______\\/ / /____\\/ /    _( )_ 
(_ o _)      \\_\\/ \\/_________/  \\/_____/ \\/__________/\\/_________/    (_ o _)
 (_,_)                                                                 (_,_) 
   _      _      _      _      _      _      _      _      _      _      _   
 _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_  _( )_ 
(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)(_ o _)
 (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_) `},
                };
                return placeholders[theme] || placeholders['nightdrive'];
            }


            cycleMediaItem(wrapper) {
                const modes = ['emoji', 'ascii', 'normal'];
                const current = wrapper.getAttribute('data-mode') || this.settings.mediaMode;
                const nextIndex = (modes.indexOf(current) + 1) % modes.length;

                wrapper.setAttribute('data-mode', modes[nextIndex]);
                this.updateMediaDisplay(wrapper);
            }

            cycleMediaMode() {
                const modes = ['emoji', 'ascii', 'normal'];
                const nextIndex = (modes.indexOf(this.settings.mediaMode) + 1) % modes.length;
                this.settings.mediaMode = modes[nextIndex];

                const wrappers = this.container?.querySelectorAll('.media-wrapper') || [];
                wrappers.forEach(wrapper => {
                    wrapper.setAttribute('data-mode', this.settings.mediaMode);
                    this.updateMediaDisplay(wrapper);
                });

                this.updateSettings(this.settings);
                this.updateButtonTexts();
            }

            processTables() {
                const tables = this.container?.querySelectorAll('.article-content table') || [];
                tables.forEach(table => {
                    table.classList.add('cyber-table');
                });
            }

            updateTerminalStatus(status, progress) {
                const leftTerminal = this.container?.querySelector('#left-terminal');
                const rightTerminal = this.container?.querySelector('#right-terminal');

                if (leftTerminal) {
                    leftTerminal.innerHTML = [`> STATUS: ${status}`, `> PROGRESS: ${progress}%`, `> TIME: ${new Date().toLocaleTimeString()}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
                }

                if (rightTerminal) {
                    rightTerminal.innerHTML = [`> PROXY: ACTIVE`, `> EXTRACTION: ${progress}%`, `> MODE: ${this.currentTheme}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
                }
            }

            updateTerminalsWithContent(metadata) {
                const leftTerminal = this.container?.querySelector('#left-terminal');
                const rightTerminal = this.container?.querySelector('#right-terminal');

                if (leftTerminal) {
                    leftTerminal.innerHTML = ['> EXTRACTION: COMPLETE', `> TITLE: ${(metadata?.title || 'UNTITLED').substring(0, 30)}`, `> WORDS: ${metadata?.length || 0}`, `> TIME: ${new Date().toLocaleTimeString()}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
                }

                if (rightTerminal) {
                    rightTerminal.innerHTML = ['> PROXY: CONNECTED', `> SOURCE: ${metadata?.siteName || 'Unknown'}`, `> FRAMEWORK: ${metadata?.framework || 'vanilla'}`, '> STATUS: ACTIVE'].map(line => `<div class="terminal-line">${line}</div>`).join('');
                }
            }

            cycleTheme() {
                const themes = ['nightdrive', 'neon-surge', 'outrun-storm', 'strange-days'];
                const nextIndex = (themes.indexOf(this.currentTheme) + 1) % themes.length;
                this.currentTheme = themes[nextIndex];

                this.applyTheme(this.currentTheme);
                this.settings.theme = this.currentTheme;
                this.updateSettings(this.settings);
                this.updateButtonTexts();
            }

            applyTheme(themeName) {
                if (this.container) {
                    this.container.setAttribute('data-theme', themeName);
                }

                const _fontMetrics = this.measureFontMetricsFromCSS();
                if (_fontMetrics != this.fontMetrics) {

                    const asciiWrappers = document.querySelectorAll('.media-wrapper[data-mode="ascii"]');
                    if (asciiWrappers) {

                        asciiWrappers.forEach(wrapper => {
                            if (wrapper._originalSrc && !wrapper._isVideo) {
                                this.convertToAscii(wrapper._originalSrc, wrapper);
                            }
                        });
                    }
                }
            }

            updateButtonTexts() {
                const themeBtn = this.container?.querySelector('.theme-btn');
                const mediaBtn = this.container?.querySelector('.media-btn');
                const disconnectBtn = this.container?.querySelector('.disconnect-btn');

                // Theme-specific button configurations
                const THEME_CONFIGS = {
                    'nightdrive': {
                        themeBtn: '🌆',
                        mediaBtns: {emoji: '🌌', ascii: 'ᴀsᴄɪɪ', normal: '⚛️'},
                        disconnectBtn: '🌑',
                        mediaIcons: {image: '💽', video: '📼'}
                    }, 'neon-surge': {
                        themeBtn: '⚡',
                        mediaBtns: {emoji: '🌩️', ascii: 'ﾑ丂ᄃﾉﾉ', normal: '💡'},
                        disconnectBtn: '🪫',
                        mediaIcons: {image: '📸', video: '📀'}
                    }, 'outrun-storm': {
                        themeBtn: '🛣️',
                        mediaBtns: {emoji: '🚘', ascii: '🅰🆂🅲🅸🅸', normal: '🏁'},
                        disconnectBtn: '📴',
                        mediaIcons: {image: '🖼️', video: '🎬'}
                    }, 'strange-days': {
                        themeBtn: '🎇',
                        mediaBtns: {emoji: '👾', ascii: 'ₐₛʗᵢᵢ', normal: '👁️'},
                        disconnectBtn: '💤',
                        mediaIcons: {image: '🎴', video: '📹'}
                    }
                };

                const currentConfig = THEME_CONFIGS[this.currentTheme] || THEME_CONFIGS['nightdrive'];

                if (themeBtn) {
                    themeBtn.textContent = currentConfig.themeBtn;
                }

                if (mediaBtn) {
                    mediaBtn.textContent = currentConfig.mediaBtns[this.settings.mediaMode] || currentConfig.mediaBtns.emoji;
                }

                if (disconnectBtn) {
                    disconnectBtn.textContent = currentConfig.disconnectBtn;
                }

                // Store current config for use in other methods
                this.currentThemeConfig = currentConfig;
            }

            requestDeactivation() {
                browser.runtime.sendMessage({
                    action: 'updateBadge', active: false
                }).catch(error => {
                    console.error('Failed to update badge:', error);
                });

                this.deactivate();
            }

            deactivate() {
                try {
                    console.log('🔌 Deactivating Vibe Mode');

                    // Restore original console methods
                    if (this._originalConsole) {
                        console.log = this._originalConsole.log;
                        console.error = this._originalConsole.error;
                        console.warn = this._originalConsole.warn;
                        console.info = this._originalConsole.info;
                    }

                    if (this.container) {
                        this.container.remove();
                        this.container = null;
                    }

                    if (this.originalState) {
                        document.body.style.overflow = this.originalState.bodyOverflow || '';
                        document.documentElement.style.overflow = this.originalState.htmlOverflow || '';

                        this.originalState.hiddenElements.forEach(({
                                                                       element, display
                                                                   }) => {
                            if (element && element.style) {
                                element.style.display = display || '';
                            }
                        });
                    }

                    this.isActive = false;

                } catch (error) {
                    console.error('❌ Deactivation error:', error);
                }
            }

            showError(message) {
                // Log specific error to console and terminal
                console.error('💥 Extraction Error:', message);
                this.addToSysadminLog('ERR', message);

                const content = this.container?.querySelector('.vibe-content');
                if (content) {
                    const detailedError = this.getDetailedErrorMessage(message);

                    content.innerHTML = `
                    <div class="error-display">
                        <div class="error-icon">⚠️</div>
                        <div class="error-title">EXTRACTION FAILED</div>
                        <div class="error-message">${this.escapeHtml(detailedError)}</div>
                        <div class="error-details">
                            <p>Check SYSADMIN terminal for details</p>
                            <p>Error: ${this.escapeHtml(message)}</p>
                        </div>
                        <button class="vibe-btn retry-btn">RETRY EXTRACTION</button>
                    </div>
                `;

                    const retryBtn = content.querySelector('.retry-btn');
                    if (retryBtn) {
                        retryBtn.addEventListener('click', () => {
                            window.location.reload();
                        });
                    }
                }
            }

            getDetailedErrorMessage(error) {
                if (error.includes('Readability.js library not available')) {
                    return 'Failed to load content parsing library. Page may have strict security policies.';
                } else if (error.includes('No readable content found')) {
                    return 'This page does not contain readable article content.';
                } else if (error.includes('Readability failed to parse')) {
                    return 'Unable to parse page content. May be a dynamic app or unsupported format.';
                } else if (error.includes('Injection failed')) {
                    return 'Failed to inject content scripts. Page may block extensions.';
                } else {
                    return 'Unknown extraction error occurred.';
                }
            }

            handleHiddenTabClosed(error) {
                this.showError(error || 'Connection lost. Please refresh.');
            }

            handleInitError(error) {
                console.error('Initialization error:', error);
                alert('VibeReader failed to initialize. Please try refreshing the page.');
            }

            handleActivationError(error) {
                console.error('Activation error:', error);
                this.showError('Failed to activate Vibe Mode');
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text || '';
                return div.innerHTML;
            }

            formatWordCount(count) {
                return count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
            }

            calculateReadingTime(wordCount) {
                return Math.max(1, Math.ceil(wordCount / 200));
            }

            initializeEffects() {
                this.startGlitchEffects();

                if (this.settings.vibeRain) {
                    this.createMatrixRain();
                }

                this.startTerminalEffects();
            }

            startGlitchEffects() {
                setInterval(() => {
                    const glitchElements = this.container?.querySelectorAll('.glitch') || [];
                    glitchElements.forEach(el => {
                        if (Math.random() < 0.1) {
                            el.classList.add('glitching');
                            setTimeout(() => {
                                el.classList.remove('glitching');
                            }, 300);
                        }
                    });
                }, 2000);
            }

            createMatrixRain() {
                let rainContainer = this.container?.querySelector('.vibe-rain-container');

                if (!rainContainer) {
                    rainContainer = document.createElement('div');
                    rainContainer.className = 'vibe-rain-container';
                    this.container?.appendChild(rainContainer);  // Append to main container
                }

                rainContainer.innerHTML = '';

                const chars = '▓▒░|/\\-_=+*#%@01';
                const columns = Math.floor(window.innerWidth / 20);

                for (let i = 0; i < columns; i++) {
                    const drop = document.createElement('div');
                    drop.className = 'matrix-drop';
                    drop.style.left = `${i * 20}px`;  // Fixed: added * operator
                    drop.style.animationDuration = `${Math.random() * 3 + 1}s`;  // Fixed
                    drop.style.animationDelay = `${Math.random() * 2}s`;  // Fixed

                    let text = '';
                    for (let j = 0; j < Math.floor(Math.random() * 10 + 5); j++) {
                        text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
                    }
                    drop.innerHTML = text;

                    rainContainer.appendChild(drop);
                }
            }

            startTerminalEffects() {
                setInterval(() => {
                    this.updateLiveTerminals();
                }, 3000);
            }

            // Generate zen console output
            getDiagnosticSummary() {
                const categories = Object.keys(this.diagnosticCategories);
                const summary = categories.map(cat => {
                    const count = this.diagnosticCategories[cat].logs.length;
                    return `${cat}:${count}`;
                }).join(' ');

                // Get latest meaningful message
                let latestMessage = '';
                for (const cat of categories) {
                    const logs = this.diagnosticCategories[cat].logs;
                    if (logs.length > 0) {
                        const latest = logs[0];
                        if (latest.count > 1) {
                            latestMessage = `${latest.message.substring(0, 30)} x${latest.count}`;
                        } else {
                            latestMessage = latest.message.substring(0, 40);
                        }
                        break;
                    }
                }

                return {summary, latestMessage};
            }

            // Create dropdown category UI
            createCategoryDropdown(categoryName, categoryData) {
                const isExpanded = categoryData.expanded;
                const count = categoryData.logs.length;
                const arrow = isExpanded ? '▼' : '▶';

                if (count === 0 && !isExpanded) return ''; // Hide empty collapsed categories

                let html = `
                    <div class="diagnostic-category" data-category="${categoryName}">
                        <div class="category-header" data-category="${categoryName}">
                            ${categoryData.icon} ${arrow} ${categoryName} (${count})
                        </div>
                `;

                if (isExpanded && count > 0) {
                    html += '<div class="category-content">';
                    categoryData.logs.slice(0, 5).forEach(log => {
                        const countDisplay = log.count > 1 ? ` x${log.count}` : '';
                        html += `<div class="terminal-line">  ${log.level}: ${log.message}${countDisplay}</div>`;
                    });
                    html += '</div>';
                } else if (isExpanded && count === 0) {
                    html += '<div class="category-content"><div class="terminal-line">  [No activity]</div></div>';
                }

                html += '</div>';
                return html;
            }

            toggleCategory(categoryName) {
                if (this.diagnosticCategories[categoryName]) {
                    this.diagnosticCategories[categoryName].expanded = !this.diagnosticCategories[categoryName].expanded;
                    this.updateLiveTerminals(); // Refresh display
                }
            }

            setupDropdownEventListeners(terminalElement) {
                // Remove existing listeners to prevent duplicates
                terminalElement.removeEventListener('click', this.handleDropdownClick);

                // Add event delegation for category header clicks
                this.handleDropdownClick = (event) => {
                    const categoryHeader = event.target.closest('.category-header');
                    if (categoryHeader) {
                        const categoryName = categoryHeader.getAttribute('data-category');
                        if (categoryName) {
                            this.toggleCategory(categoryName);
                        }
                    }
                };

                terminalElement.addEventListener('click', this.handleDropdownClick);
            }

            updateLiveTerminals() {
                const leftTerminal = this.container?.querySelector('#left-terminal');
                const rightTerminal = this.container?.querySelector('#right-terminal');

                if (leftTerminal) {
                    // SYSADMIN: Enhanced dropdown categories
                    let html = '';
                    const sysadminCategories = ['ERRORS', 'MEDIA', 'ASCII', 'SYSTEM'];

                    sysadminCategories.forEach(cat => {
                        if (this.diagnosticCategories[cat]) {
                            html += this.createCategoryDropdown(cat, this.diagnosticCategories[cat]);
                        }
                    });

                    if (!html) {
                        html = '<div class="terminal-line">> [Waiting for events...]</div>';
                    }

                    leftTerminal.innerHTML = html;

                    // Add event delegation for dropdown clicks
                    this.setupDropdownEventListeners(leftTerminal);

                    // Zen console output
                    const {summary, latestMessage} = this.getDiagnosticSummary();
                    if (typeof dump !== 'undefined' && latestMessage) {
                        dump(`[DIAG] ${summary} | Latest: ${latestMessage}\n`);
                    }
                }

                if (rightTerminal) {
                    // NETMON: Enhanced dropdown categories  
                    let html = '';
                    const netmonCategories = ['NETWORK', 'ERRORS', 'SYSTEM'];

                    netmonCategories.forEach(cat => {
                        if (this.diagnosticCategories[cat]) {
                            html += this.createCategoryDropdown(cat, this.diagnosticCategories[cat]);
                        }
                    });

                    if (!html) {
                        html = '<div class="terminal-line">> [Monitoring network...]</div>';
                    }

                    rightTerminal.innerHTML = html;

                    // Add event delegation for dropdown clicks
                    this.setupDropdownEventListeners(rightTerminal);

                    // Minimal dump for NETMON 
                    const networkCount = this.diagnosticCategories.NETWORK?.logs.length || 0;
                    if (typeof dump !== 'undefined' && networkCount > 0) {
                        const latestNetwork = this.diagnosticCategories.NETWORK.logs[0];
                        dump(`[NETMON] NETWORK:${networkCount} | ${latestNetwork.message.substring(0, 30)}\n`);
                    }
                }
            }
        }

        // Create singleton instance
        window.__vibeReaderProxyController = new ProxyController();

        true;
    } catch (error) {
        delete window.__vibeReaderProxyController; // Clean up on failure
        throw error;
    }
}