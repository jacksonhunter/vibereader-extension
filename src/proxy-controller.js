// VibeReader v2.0 - Refactored Proxy Controller with Subscriber Architecture

// Prevent multiple injections with guard
if (window.__vibeReaderProxyController) {
    console.log('⚠️ ProxyController already exists, skipping');
    false;
} else {
    try {
        // === TERMINAL MIDDLEWARE ===
        class TerminalRoutingMiddleware extends SubscriberMiddleware {
            constructor() {
                super('TerminalRouting');
                this.routes = new Map([
                    ['ERRORS', 'error-terminal'],
                    ['CSS', 'system-terminal'],
                    ['MEDIA', 'media-terminal'],
                    ['NETWORK', 'network-terminal'],
                    ['SYSTEM', 'system-terminal'],
                    ['IMAGES', 'image-terminal'],
                    ['VIDEOS', 'video-terminal'],
                    ['ASCII', 'system-terminal']
                ]);
            }

            async process(eventContext) {
                const { event, data } = eventContext;

                // Route logs to appropriate terminals
                if (event.startsWith('log-') || event === 'terminal-log') {
                    const _category = this.categorize(data.message || data.action || '');
                    const terminalId = this.routes.get(_category);

                    eventContext.data = {
                        ...data,
                        targetTerminal: terminalId,
                        category: _category,
                        icon: this.getIcon(_category)
                    };
                }

                return true;
            }

            categorize(message) {
                const lower = message.toLowerCase();
                if (lower.includes('error') || lower.includes('failed') || lower.includes('⌛')) return 'ERRORS';
                if (lower.includes('css') || lower.includes('style') || lower.includes('🎨')) return 'CSS';
                if (lower.includes('.mp4') || lower.includes('video') || lower.includes('🎬')) return 'VIDEOS';
                if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('image') || lower.includes('🖼️')) return 'IMAGES';
                if (lower.includes('ascii') || lower.includes('🎯')) return 'ASCII';
                if (lower.includes('network') || lower.includes('fetch') || lower.includes('proxy')) return 'NETWORK';
                return 'SYSTEM';
            }

            getIcon(category) {
                const icons = {
                    'ERRORS': '🔴',
                    'CSS': '🎨',
                    'MEDIA': '📦',
                    'VIDEOS': '🎬',
                    'IMAGES': '🖼️',
                    'ASCII': '🎯',
                    'NETWORK': '🌐',
                    'SYSTEM': '⚙️'
                };
                return icons[category] || '📝';
            }
        }

        class MediaAggregationMiddleware extends SubscriberMiddleware {
            constructor() {
                super('MediaAggregation');
                this.mediaCollections = {
                    images: [],
                    videos: [],
                    all: []
                };
            }

            async process(eventContext) {
                const { event, data } = eventContext;

                if (event === 'media-discovered') {
                    // Aggregate media into collections
                    if (data.type === 'image') {
                        this.mediaCollections.images.push(data);
                    } else if (data.type === 'video') {
                        this.mediaCollections.videos.push(data);
                    }
                    this.mediaCollections.all.push(data);

                    // Enrich with collection info
                    eventContext.data = {
                        ...data,
                        collections: {
                            imageCount: this.mediaCollections.images.length,
                            videoCount: this.mediaCollections.videos.length,
                            totalCount: this.mediaCollections.all.length,
                            images: this.mediaCollections.images,
                            videos: this.mediaCollections.videos
                        }
                    };
                }

                return true;
            }

            reset() {
                this.mediaCollections = {
                    images: [],
                    videos: [],
                    all: []
                };
            }
        }

        // === DRAGGABLE TERMINAL COMPONENT ===
        class DraggableTerminal extends SubscriberEnabledComponent {
            constructor(id, config = {}) {
                super();

                this.id = id;
                this.title = config.title || 'TERMINAL';
                this.type = config.type || 'log'; // log, media, grid
                this.position = config.position || { x: 0, y: 0 };
                this.size = config.size || { width: 400, height: 300 };
                this.minimized = false;
                this.maximized = false;
                this.logs = [];
                this.maxLogs = config.maxLogs || 100;
                this.element = null;
                this.isDragging = false;
                this.dragOffset = { x: 0, y: 0 };
                this.autoScroll = true;

                // WebGL CRT effect (optional)
                this.crtEffect = null;
                this.crtEnabled = config.crtEnabled || false;

                this.create();
                this.setupSubscriptions();
            }

            create() {
                this.element = document.createElement('div');
                this.element.className = 'draggable-terminal';
                this.element.id = this.id;
                this.element.style.cssText = `
                    position: fixed;
                    left: ${this.position.x}px;
                    top: ${this.position.y}px;
                    width: ${this.size.width}px;
                    height: ${this.size.height}px;
                    z-index: 1000;
                `;

                // eslint-disable-next-line no-unsanitized/property
                this.element.innerHTML = `
                    <div class="terminal-window" data-theme="current">
                        <div class="terminal-header">
                            <span class="terminal-title">▓ ${this.escapeHtml(this.title)} ▓</span>
                            <div class="terminal-controls">
                                <button class="term-btn minimize" title="Minimize">_</button>
                                <button class="term-btn maximize" title="Maximize">□</button>
                                <button class="term-btn close" title="Close">×</button>
                            </div>
                            <div class="led-indicator"></div>
                        </div>
                        <div class="terminal-content" id="${this.id}-content">
                            ${this.getInitialContent()}
                        </div>
                        ${this.type === 'media' ? this.getMediaControls() : ''}
                    </div>
                `; // Safe: HTML built from controlled templates with escaped user data

                this.setupDragHandlers();
                this.setupControlHandlers();
            }

            getInitialContent() {
                switch (this.type) {
                    case 'media':
                        return '<div class="media-grid"></div>';
                    case 'grid':
                        return '<div class="data-grid"></div>';
                    default:
                        return '<div class="terminal-line">> INITIALIZING...</div>';
                }
            }

            getMediaControls() {
                return `
                    <div class="media-controls">
                        <button class="media-btn" data-action="grid" title="Grid View">⊞</button>
                        <button class="media-btn" data-action="list" title="List View">☰</button>
                        <button class="media-btn" data-action="ascii" title="ASCII Mode">🎯</button>
                        <button class="media-btn" data-action="fullscreen" title="Fullscreen">⛶</button>
                    </div>
                `;
            }

            setupSubscriptions() {
                // Subscribe to logs targeted at this terminal
                this.subscribe(`terminal-${this.id}`, (eventType, data) => {
                    this.addLog(data);
                }, {
                    id: `${this.id}-logger`,
                    rateLimitMs: 50,
                    debounceMs: 100
                });

                // Global terminal log routing
                this.subscribe('terminal-log', (eventType, data) => {
                    if (data.targetTerminal === this.id) {
                        this.addLog(data);
                    }
                }, {
                    id: `${this.id}-global-logger`,
                    rateLimitMs: 50
                });

                // Subscribe to media if this is a media terminal
                if (this.type === 'media') {
                    this.subscribeToMedia();
                }
            }

            subscribeToMedia() {
                let mediaType = 'all';
                if (this.title.toLowerCase().includes('image')) {
                    mediaType = 'image';
                } else if (this.title.toLowerCase().includes('video')) {
                    mediaType = 'video';
                }

                this.subscribe('media-discovered', (eventType, data) => {
                    if (mediaType === 'all' || data.type === mediaType) {
                        this.addMediaItem(data);
                    }
                }, {
                    id: `${this.id}-media`,
                    debounceMs: 200,
                    transformations: [
                        // Transform media data for display
                        (data) => ({
                            data: {
                                ...data,
                                thumbnail: this.generateThumbnail(data),
                                displayMode: this.getDisplayMode()
                            }
                        })
                    ]
                });
            }

            setupDragHandlers() {
                const header = this.element.querySelector('.terminal-header');

                header.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.terminal-controls')) return;

                    this.isDragging = true;
                    this.dragOffset = {
                        x: e.clientX - this.position.x,
                        y: e.clientY - this.position.y
                    };

                    this.element.style.zIndex = '2000';
                });

                document.addEventListener('mousemove', (e) => {
                    if (!this.isDragging) return;

                    this.position = {
                        x: e.clientX - this.dragOffset.x,
                        y: e.clientY - this.dragOffset.y
                    };

                    this.element.style.left = `${this.position.x}px`;
                    this.element.style.top = `${this.position.y}px`;
                });

                document.addEventListener('mouseup', () => {
                    if (this.isDragging) {
                        this.isDragging = false;
                        this.element.style.zIndex = '1000';

                        this.emit('terminal-moved', {
                            terminalId: this.id,
                            position: this.position
                        });
                    }
                });
            }

            setupControlHandlers() {
                this.element.querySelector('.minimize').addEventListener('click', () => {
                    this.minimize();
                });

                this.element.querySelector('.maximize').addEventListener('click', () => {
                    this.maximize();
                });

                this.element.querySelector('.close').addEventListener('click', () => {
                    this.close();
                });

                // Media controls
                if (this.type === 'media') {
                    this.element.querySelectorAll('.media-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const action = e.target.dataset.action;
                            this.handleMediaAction(action);
                        });
                    });
                }

                // Auto-scroll toggle on click
                const content = this.element.querySelector('.terminal-content');
                content.addEventListener('click', () => {
                    this.autoScroll = !this.autoScroll;
                });
            }

            addLog(data) {
                const { level = 'INFO', message = '', timestamp = Date.now(), icon = '', category: _category = '' } = data;
                const time = new Date(timestamp).toLocaleTimeString();

                const logLine = document.createElement('div');
                logLine.className = `terminal-line log-${level.toLowerCase()}`;
                logLine.textContent = `[${time}] ${icon} ${level}: ${message}`;

                const content = this.element.querySelector('.terminal-content');
                content.appendChild(logLine);

                // Maintain max logs
                this.logs.push(logLine);
                if (this.logs.length > this.maxLogs) {
                    const removed = this.logs.shift();
                    removed.remove();
                }

                // Auto-scroll if enabled
                if (this.autoScroll) {
                    content.scrollTop = content.scrollHeight;
                }
            }

            addMediaItem(data) {
                const grid = this.element.querySelector('.media-grid');
                if (!grid) return;

                const item = document.createElement('div');
                item.className = 'media-item';
                item.dataset.type = data.type;
                item.dataset.src = data.src;

                if (data.type === 'image') {
                    // eslint-disable-next-line no-unsanitized/property
                    item.innerHTML = `
                        <div class="media-wrapper" data-mode="emoji">
                            <div class="media-emoji-display">
                                <div class="emoji-icon">🖼️</div>
                                <div class="media-label">IMAGE</div>
                                <div class="media-size">${data.width || 0}×${data.height || 0}</div>
                            </div>
                        </div>
                    `; // Safe: Data properties are numbers or controlled strings
                } else if (data.type === 'video') {
                    // eslint-disable-next-line no-unsanitized/property
                    item.innerHTML = `
                        <div class="media-wrapper" data-mode="emoji">
                            <div class="media-emoji-display">
                                <div class="emoji-icon">🎬</div>
                                <div class="media-label">VIDEO</div>
                                <div class="media-duration">${data.duration || '0:00'}</div>
                            </div>
                        </div>
                    `; // Safe: Controlled template with sanitized data
                }

                item.addEventListener('click', () => {
                    this.cycleMediaMode(item.querySelector('.media-wrapper'));
                });

                grid.appendChild(item);
            }

            cycleMediaMode(wrapper) {
                const modes = ['emoji', 'ascii', 'normal'];
                const current = wrapper.getAttribute('data-mode');
                const nextIndex = (modes.indexOf(current) + 1) % modes.length;
                const nextMode = modes[nextIndex];

                wrapper.setAttribute('data-mode', nextMode);

                // Update display based on mode
                const parent = wrapper.parentElement;
                const src = parent.dataset.src;
                const type = parent.dataset.type;

                if (nextMode === 'normal' && src) {
                    if (type === 'image') {
                        const img = document.createElement('img');
                        img.src = src;
                        img.loading = 'lazy';
                        img.className = 'cyber-media';
                        wrapper.innerHTML = '';
                        wrapper.appendChild(img);
                    } else if (type === 'video') {
                        const video = document.createElement('video');
                        video.src = src;
                        video.controls = true;
                        video.className = 'cyber-media';
                        wrapper.innerHTML = '';
                        wrapper.appendChild(video);
                    }
                } else if (nextMode === 'ascii') {
                     
                    wrapper.innerHTML = `
                        <div class="flex items-center justify-center p-4 text-text-muted">
                            <pre class="text-xs leading-tight font-mono">[ASCII MODE]</pre>
                        </div>
                    `; // Safe: Static template
                } else {
                    // Back to emoji mode
                    const icon = type === 'video' ? '🎬' : '🖼️';
                    const label = type === 'video' ? 'VIDEO' : 'IMAGE';
                    // eslint-disable-next-line no-unsanitized/property
                    wrapper.innerHTML = `
                        <div class="media-emoji-display">
                            <div class="emoji-icon">${icon}</div>
                            <div class="media-label">${label}</div>
                        </div>
                    `; // Safe: Controlled values
                }

                this.emit('media-mode-changed', {
                    terminalId: this.id,
                    mode: nextMode,
                    media: { src, type }
                });
            }

            handleMediaAction(action) {
                switch (action) {
                    case 'fullscreen':
                        this.toggleFullscreen();
                        break;
                    case 'grid':
                        this.setDisplayMode('grid');
                        break;
                    case 'list':
                        this.setDisplayMode('list');
                        break;
                    case 'ascii':
                        this.toggleAsciiMode();
                        break;
                }
            }

            toggleAsciiMode() {
                const wrappers = this.element.querySelectorAll('.media-wrapper');
                wrappers.forEach(wrapper => {
                    wrapper.setAttribute('data-mode', 'ascii');
                });
            }

            toggleFullscreen() {
                const content = this.element.querySelector('.terminal-content');
                if (content.requestFullscreen) {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        content.requestFullscreen();
                    }
                }
            }

            minimize() {
                this.minimized = !this.minimized;
                if (this.minimized) {
                    this.element.classList.add('minimized');
                    this.element.style.height = '30px';
                } else {
                    this.element.classList.remove('minimized');
                    this.element.style.height = `${this.size.height}px`;
                }
            }

            maximize() {
                this.maximized = !this.maximized;
                if (this.maximized) {
                    this.element.classList.add('maximized');
                    this.element.style.width = '100vw';
                    this.element.style.height = '100vh';
                    this.element.style.left = '0';
                    this.element.style.top = '0';
                } else {
                    this.element.classList.remove('maximized');
                    this.element.style.width = `${this.size.width}px`;
                    this.element.style.height = `${this.size.height}px`;
                    this.element.style.left = `${this.position.x}px`;
                    this.element.style.top = `${this.position.y}px`;
                }
            }

            close() {
                this.emit('terminal-closed', { terminalId: this.id });
                this.destroy();
            }

            destroy() {
                super.destroy();
                if (this.element) {
                    this.element.remove();
                }
                if (this.crtEffect) {
                    this.crtEffect.destroy();
                }
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text || '';
                return div.innerHTML;
            }

            generateThumbnail(data) {
                // Placeholder - would generate actual thumbnail
                return data.src;
            }

            getDisplayMode() {
                return this.element.querySelector('.media-grid') ? 'grid' : 'list';
            }

            setDisplayMode(mode) {
                const content = this.element.querySelector('.terminal-content');
                content.dataset.displayMode = mode;
            }
        }

        // === REFACTORED PROXY CONTROLLER ===
        class ProxyController extends SubscriberEnabledComponent {
            constructor() {
                super();

                this.terminals = new Map();
                this.container = null;
                this.isActive = false;
                this.extractedContent = null;
                this.metadata = null;
                this.originalState = null;

                this.settings = {
                    theme: 'nightdrive',
                    mediaMode: 'emoji',
                    crtEnabled: false,
                    terminalLayout: 'auto',
                    sideScrolls: true,
                    vibeRain: false,
                    autoActivate: false
                };

                // Initialize bridge for cross-context messaging
                this.bridge = new MessageBridge();

                // Setup middleware pipeline
                this.setupMiddleware();

                // Setup subscriptions
                this.setupSubscriptions();

                // Setup message handlers for background communication
                this.setupMessageHandlers();

                // Initialize asynchronously
                setTimeout(async () => {
                    await this.init();
                }, 0);
            }

            setupMiddleware() {
                // Add routing middleware
                this.subscriberManager.addGlobalMiddleware(
                    new TerminalRoutingMiddleware()
                );

                // Add media aggregation
                this.mediaAggregator = new MediaAggregationMiddleware();
                this.subscriberManager.addGlobalMiddleware(this.mediaAggregator);
            }

            setupSubscriptions() {
                // Content display
                this.subscribe('display-content', (eventType, data) => {
                    this.displayExtractedContent(data.content, data.metadata);
                }, {
                    id: 'content-display-handler',
                    priority: 10
                });

                // Terminal management
                this.subscribe('create-terminal', (eventType, config) => {
                    this.createTerminal(config);
                });

                this.subscribe('terminal-closed', (eventType, data) => {
                    this.terminals.delete(data.terminalId);
                });

                // Settings updates
                this.subscribe('settings-update', (eventType, settings) => {
                    this.updateSettings(settings);
                });

                // Theme cycling
                this.subscribe('cycle-theme', () => {
                    this.cycleTheme();
                });

                // Media mode cycling
                this.subscribe('cycle-media-mode', () => {
                    this.cycleMediaMode();
                });
            }

            setupMessageHandlers() {
                // Register message handlers with bridge
                this.bridge.register('ping', () => ({ success: true, type: 'proxy' }));

                // Handle content extracted from hidden tab
                this.bridge.register('contentExtracted', (request) => {
                    console.log('Received extracted content from hidden tab');
                    dump('Received extracted content from hidden tab\n');
                    
                    const data = request.data || request;
                    this.displayExtractedContent(data.content, data.metadata);
                    return { success: true };
                });

                this.bridge.register('displayContent', (request) => {
                    this.displayExtractedContent(request.content, request.metadata);
                    return { success: true };
                });

                this.bridge.register('extractionProgress', (request) => {
                    const data = request.data || request;
                    this.showExtractionProgress(data.status, data.progress);
                    return { success: true };
                });

                this.bridge.register('deactivate', () => {
                    this.deactivate();
                    return { success: true };
                });

                this.bridge.register('showError', (request) => {
                    this.showError(request.error);
                    return { success: true };
                });

                this.bridge.register('logFromBackground', (request) => {
                    this.emit('terminal-log', {
                        level: request.level || 'INFO',
                        message: request.message || '',
                        category: request.category || 'SYSTEM',
                        source: request.source || 'background'
                    });
                    return { success: true };
                });
            }

            async init() {
                console.log('🎮 ProxyController.init() starting');

                // Load settings and conditionally activate
                await this.loadSettings();

                // Only auto-activate if setting is enabled
                if (this.settings.autoActivate) {
                    this.activate();
                }

                console.log('✅ ProxyController initialized');
            }

            async loadSettings() {
                try {
                    const result = await browser.storage.sync.get('vibeReaderSettings');
                    if (result.vibeReaderSettings) {
                        Object.assign(this.settings, result.vibeReaderSettings);
                    }
                } catch (error) {
                    console.warn('Failed to load settings:', error);
                }
            }

            activate() {
                if (this.isActive) return;

                console.log('🔥 Activating Vibe Mode UI');
                this.isActive = true;

                this.hideOriginalContent();
                this.createInterface();
                this.createDefaultTerminals();
                this.applyTheme(this.settings.theme);

                if (this.settings.vibeRain) {
                    this.createMatrixRain();
                }

                this.emit('activation-complete');
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
                for (const el of elements) {
                    if (!el.classList.contains('vibe-reader-container')) {
                        const originalDisplay = el.style.display;
                        el.style.display = 'none';
                        this.originalState.hiddenElements.push({
                            element: el,
                            display: originalDisplay
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
                this.container.className = 'vibe-container vibe-reader-container vibe-reader-proxy';
                this.container.setAttribute('data-theme', this.settings.theme);

                // eslint-disable-next-line no-unsanitized/property
                this.container.innerHTML = `
                    <div class="vibe-reader-overlay">
                        <div class="vibe-header">
                            <div class="vibe-header-left">
                                <span class="vibe-brand">▓▓ VIBE READER v2.0 ▓▓</span>
                                <span class="vibe-status">[ EXTRACTING ]</span>
                            </div>
                            <div class="vibe-header-right">
                                <button class="btn-base" data-action="add-terminal" title="Add Terminal">+</button>
                                <button class="btn-base" data-action="cycle-media" title="Toggle Media Mode">🌌</button>
                                <button class="btn-base" data-action="cycle-theme" title="Cycle Theme">🌆</button>
                                <button class="btn-base" data-action="toggle-crt" title="CRT Effect">📺</button>
                                <button class="btn-base" data-action="disconnect" title="Disconnect">🌑</button>
                            </div>
                        </div>
                        
                        <div class="vibe-layout">
                            <main class="vibe-content">
                                <article class="vibe-article" id="main-content">
                                    <div class="extraction-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: 0%"></div>
                                        </div>
                                        <p class="extraction-status">Initializing extraction...</p>
                                    </div>
                                </article>
                            </main>
                        </div>
                        
                        <div class="terminals-container" id="terminals">
                            <!-- Terminals will be added here -->
                        </div>
                        
                        ${this.settings.vibeRain ? '<div class="vibe-rain-container"></div>' : ''}
                        <div class="retrofuture-bg-effects"></div>
                    </div>
                `; // Safe: Controlled HTML template

                document.body.appendChild(this.container);
                this.setupUIHandlers();
            }

            createDefaultTerminals() {
                // System terminal (left)
                if (this.settings.sideScrolls) {
                    this.createTerminal({
                        id: 'system-terminal',
                        title: 'SYSADMIN',
                        type: 'log',
                        position: { x: 20, y: 100 },
                        size: { width: 350, height: 400 }
                    });

                    // Network terminal (right)
                    this.createTerminal({
                        id: 'network-terminal',
                        title: 'NETMON',
                        type: 'log',
                        position: { x: window.innerWidth - 370, y: 100 },
                        size: { width: 350, height: 400 }
                    });
                }

                // Media terminal (bottom)
                this.createTerminal({
                    id: 'media-terminal',
                    title: 'MEDIA',
                    type: 'media',
                    position: { x: 20, y: window.innerHeight - 320 },
                    size: { width: 700, height: 300 }
                });
            }

            createTerminal(config) {
                const terminal = new DraggableTerminal(config.id || `term-${Date.now()}`, config);
                this.terminals.set(terminal.id, terminal);

                const container = document.getElementById('terminals');
                if (container) {
                    container.appendChild(terminal.element);
                }

                // Apply CRT if enabled
                if (this.settings.crtEnabled) {
                    this.applyCRTToTerminal(terminal);
                }

                return terminal;
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
                        'error': 'Content extraction failed'
                    };
                    statusText.textContent = messages[status] || 'Processing...';
                }

                // Log progress to terminals
                this.emit('terminal-log', {
                    level: 'INFO',
                    message: `Extraction: ${status} (${progress}%)`,
                    category: 'SYSTEM'
                });
            }

            displayExtractedContent(content, metadata) {
                try {
                    console.log('📄 Displaying content:', metadata?.title);

                    this.extractedContent = content;
                    this.metadata = metadata;

                    const mainContent = document.getElementById('main-content');
                    if (mainContent) {
                        // eslint-disable-next-line no-unsanitized/property
                        mainContent.innerHTML = `
                            <header class="article-header">
                                <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata?.title || 'UNTITLED')}">
                                    ${this.escapeHtml(metadata?.title || 'UNTITLED')}
                                </h1>
                                ${metadata?.byline ? `<div class="article-byline">BY: ${this.escapeHtml(metadata.byline)}</div>` : ''}
                                <div class="article-meta">
                                    <span class="meta-item">📍 ${this.escapeHtml(metadata?.siteName || 'Unknown')}</span>
                                    <span class="meta-item">📝 ${this.formatWordCount(metadata?.length || 0)}</span>
                                    <span class="meta-item">⏱️ ${this.calculateReadingTime(metadata?.length || 0)} min</span>
                                </div>
                            </header>
                            <div class="article-content">
                                ${content}
                            </div>
                        `; // Safe: Content from DOMPurify, metadata escaped

                        this.processMediaElements();

                        const statusEl = this.container?.querySelector('.vibe-status');
                        if (statusEl) {
                            statusEl.textContent = '[ ACTIVE ]';
                        }

                        this.emit('content-displayed', { metadata });
                    }
                } catch (error) {
                    console.error('Failed to display content:', error);
                    this.showError('Failed to display content');
                }
            }

            processMediaElements() {
                const images = document.querySelectorAll('.article-content img');
                const videos = document.querySelectorAll('.article-content video');

                images.forEach((img, index) => {
                    // Create wrapper for media controls
                    const wrapper = document.createElement('div');
                    wrapper.className = 'media-wrapper';
                    wrapper.setAttribute('data-mode', this.settings.mediaMode);

                    // Store original element
                    wrapper._originalElement = img.cloneNode(true);
                    wrapper._originalSrc = img.src || img.getAttribute('data-src');
                    wrapper._isVideo = false;
                    wrapper._mediaType = 'image';

                    // Replace img with wrapper
                    img.parentNode?.insertBefore(wrapper, img);
                    img.remove();

                    // Apply current media mode
                    this.updateMediaDisplay(wrapper);

                    // Emit discovery event
                    this.emit('media-discovered', {
                        type: 'image',
                        src: wrapper._originalSrc,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        index
                    });
                });

                videos.forEach((video, index) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'media-wrapper';
                    wrapper.setAttribute('data-mode', this.settings.mediaMode);

                    wrapper._originalElement = video.cloneNode(true);
                    wrapper._originalSrc = video.src;
                    wrapper._isVideo = true;
                    wrapper._mediaType = 'video';

                    video.parentNode?.insertBefore(wrapper, video);
                    video.remove();

                    this.updateMediaDisplay(wrapper);

                    this.emit('media-discovered', {
                        type: 'video',
                        src: video.src,
                        duration: video.duration,
                        index
                    });
                });

                // Set up click handlers for media cycling
                document.querySelectorAll('.media-wrapper').forEach(wrapper => {
                    wrapper.addEventListener('click', () => {
                        this.cycleMediaItem(wrapper);
                    });
                });
            }

            updateMediaDisplay(wrapper) {
                const mode = wrapper.getAttribute('data-mode') || this.settings.mediaMode;
                wrapper.innerHTML = ''; // Clear content

                switch (mode) {
                    case 'emoji':
                        // eslint-disable-next-line no-unsanitized/property
                        wrapper.innerHTML = this.createEmojiDisplay(wrapper._isVideo);
                        break;
                    case 'ascii':
                        // eslint-disable-next-line no-unsanitized/property
                        wrapper.innerHTML = this.createAsciiDisplay(wrapper._isVideo);
                        if (wrapper._originalSrc && !wrapper._isVideo && window.aalib) {
                            this.convertToAscii(wrapper._originalSrc, wrapper);
                        }
                        break;
                    case 'normal': {
                        const clone = wrapper._originalElement.cloneNode(true);
                        clone.classList.add('cyber-media');
                        wrapper.appendChild(clone);
                        break;
                    }
                }
            }

            createEmojiDisplay(isVideo) {
                const emoji = isVideo ? '🎬' : '🖼️';
                const label = isVideo ? 'VIDEO' : 'IMAGE';

                return `
                    <div class="media-emoji-display">
                        <div class="emoji-icon">${emoji}</div>
                        <div class="media-label">${label}</div>
                        <div class="mode-hint">Click to cycle</div>
                    </div>
                `;
            }

            createAsciiDisplay(isVideo) {
                const label = isVideo ? '[VIDEO]' : '[IMAGE]';
                return `
                    <div class="flex items-center justify-center p-4 text-text-muted">
                        <pre class="text-xs leading-tight font-mono">${label}</pre>
                    </div>
                `;
            }

            convertToAscii(src, _wrapper) {
                // Simplified ASCII conversion placeholder
                console.log('🎯 ASCII conversion requested for:', src);
                // This would integrate with aalib as in original
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
            }

            setupUIHandlers() {
                this.container.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    if (!action) return;

                    switch (action) {
                        case 'add-terminal':
                            this.showTerminalCreator();
                            break;
                        case 'cycle-theme':
                            this.cycleTheme();
                            break;
                        case 'cycle-media':
                            this.cycleMediaMode();
                            break;
                        case 'toggle-crt':
                            this.toggleCRT();
                            break;
                        case 'disconnect':
                            this.deactivate();
                            break;
                    }
                });
            }

            showTerminalCreator() {
                // Simple terminal creation dialog
                const types = ['log', 'media', 'grid'];
                const type = prompt(`Terminal type (${types.join('/')}):`, 'log');

                if (types.includes(type)) {
                    const title = prompt('Terminal title:', type.toUpperCase());

                    if (title) {
                        const id = `terminal-${Date.now()}`;
                        this.createTerminal({
                            id,
                            title,
                            type,
                            position: {
                                x: 100 + Math.random() * 200,
                                y: 100 + Math.random() * 200
                            }
                        });
                    }
                }
            }

            cycleTheme() {
                const themes = ['nightdrive', 'neon-surge', 'outrun-storm', 'strange-days'];
                const current = themes.indexOf(this.settings.theme);
                this.settings.theme = themes[(current + 1) % themes.length];

                this.applyTheme(this.settings.theme);
                this.updateSettings(this.settings);
            }

            applyTheme(themeName) {
                if (this.container) {
                    this.container.setAttribute('data-theme', themeName);
                }
                this.emit('theme-changed', { theme: themeName });
            }

            toggleCRT() {
                this.settings.crtEnabled = !this.settings.crtEnabled;

                // Apply CRT to terminals
                this.terminals.forEach(terminal => {
                    if (this.settings.crtEnabled) {
                        this.applyCRTToTerminal(terminal);
                    } else {
                        this.removeCRTFromTerminal(terminal);
                    }
                });

                this.updateSettings(this.settings);
            }

            applyCRTToTerminal(terminal) {
                if (window.WebGLCRT && !terminal.crtEffect) {
                    terminal.crtEffect = new WebGLCRT({
                        targetSelectors: [`#${terminal.id}`],
                        enabled: true,
                        colorDepth: 16,
                        curvature: 0.15
                    });
                    terminal.crtEffect.init();
                }
            }

            removeCRTFromTerminal(terminal) {
                if (terminal.crtEffect) {
                    terminal.crtEffect.destroy();
                    terminal.crtEffect = null;
                }
            }

            updateSettings(newSettings) {
                Object.assign(this.settings, newSettings);

                // Save to storage
                browser.storage.sync.set({
                    vibeReaderSettings: this.settings
                }).catch(error => {
                    console.error('Failed to save settings:', error);
                });

                this.emit('settings-updated', this.settings);
            }

            showError(message) {
                console.error('💥 Error:', message);

                const content = this.container?.querySelector('.vibe-content');
                if (content) {
                    // eslint-disable-next-line no-unsanitized/property
                    content.innerHTML = `
                        <div class="error-display">
                            <div class="error-icon">⚠️</div>
                            <div class="error-title">ERROR</div>
                            <div class="error-message">${this.escapeHtml(message)}</div>
                        </div>
                    `; // Safe: Error message escaped
                }

                this.emit('terminal-log', {
                    level: 'ERR',
                    message,
                    category: 'ERRORS'
                });
            }

            createMatrixRain() {
                let rainContainer = this.container?.querySelector('.vibe-rain-container');

                if (!rainContainer) {
                    rainContainer = document.createElement('div');
                    rainContainer.className = 'vibe-rain-container';
                    this.container?.appendChild(rainContainer);
                }

                rainContainer.innerHTML = ''; // Clear existing

                const chars = '▓▒░|/\\-_=+*#%@01';
                const columns = Math.floor(window.innerWidth / 20);

                for (let i = 0; i < columns; i++) {
                    const drop = document.createElement('div');
                    drop.className = 'matrix-drop animate-matrix-fall';
                    drop.style.left = `${i * 20}px`;
                    drop.style.animationDuration = `${Math.random() * 3 + 1}s`;
                    drop.style.animationDelay = `${Math.random() * 2}s`;

                    let text = '';
                    for (let j = 0; j < Math.floor(Math.random() * 10 + 5); j++) {
                        text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
                    }
                    // eslint-disable-next-line no-unsanitized/property
                    drop.innerHTML = text; // Safe: Text from controlled character set

                    rainContainer.appendChild(drop);
                }
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

            deactivate() {
                try {
                    console.log('🔌 ProxyController deactivating...');

                    this.isActive = false;

                    // Cleanup terminals
                    this.terminals.forEach(terminal => terminal.destroy());
                    this.terminals.clear();

                    // Reset media aggregator
                    if (this.mediaAggregator) {
                        this.mediaAggregator.reset();
                    }

                    // Remove interface
                    if (this.container) {
                        this.container.remove();
                        this.container = null;
                    }

                    // Restore original content
                    if (this.originalState) {
                        document.body.style.overflow = this.originalState.bodyOverflow || '';
                        document.documentElement.style.overflow = this.originalState.htmlOverflow || '';

                        this.originalState.hiddenElements?.forEach(item => {
                            if (item.element) {
                                item.element.style.display = item.display || '';
                            }
                        });
                        this.originalState = null;
                    }

                    // Clean up subscriptions
                    super.deactivate();

                    // Clean up singleton
                    delete window.__vibeReaderProxyController;

                    console.log('✅ ProxyController deactivated');

                } catch (error) {
                    console.error('Deactivation error:', error);
                }
            }
        }

        // Create singleton instance
        window.__vibeReaderProxyController = new ProxyController();

        true;
    } catch (error) {
        delete window.__vibeReaderProxyController;
        throw error;
    }
}