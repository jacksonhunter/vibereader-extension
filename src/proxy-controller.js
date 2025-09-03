// VibeReader v2.5 - Refactored Proxy Controller with Subscriber Architecture

// Prevent multiple injections with guard
if (window.__vibeReaderProxyController || window.__proxyController) {
    console.log("⚠️ ProxyController already exists, skipping");
    false;
} else {
    try {
        // ===== CUSTOM MIDDLEWARE FOR PROXY =====
        class MediaAggregationMiddleware extends SubscriberMiddleware {
            constructor() {
                super("MediaAggregation", 8);
                this.mediaCollections = {
                    images: [],
                    videos: [],
                    all: [],
                };
            }

            async process(eventContext) {
                const { event, data } = eventContext;

                if (event === "media-discovered") {
                    // Aggregate media into collections
                    if (data.type === "image") {
                        this.mediaCollections.images.push(data);
                    } else if (data.type === "video") {
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
                            images: this.mediaCollections.images.slice(-10), // Keep last 10
                            videos: this.mediaCollections.videos.slice(-10),
                        },
                    };
                }

                return true;
            }

            reset() {
                this.mediaCollections = {
                    images: [],
                    videos: [],
                    all: [],
                };
            }
        }

        // ===== TERMINAL ROUTING MIDDLEWARE =====
        class TerminalRoutingMiddleware extends SubscriberMiddleware {
            constructor() {
                super("TerminalRouting", 9);
                this.routes = new Map([
                    ["ERRORS", "error-terminal"],
                    ["CSS", "system-terminal"],
                    ["MEDIA", "media-terminal"],
                    ["NETWORK", "network-terminal"],
                    ["SYSTEM", "system-terminal"],
                    ["IMAGES", "image-terminal"],
                    ["VIDEOS", "video-terminal"],
                    ["ASCII", "system-terminal"],
                ]);
            }

            async process(eventContext) {
                const { event, data } = eventContext;

                // Route logs to appropriate terminals
                if (event.startsWith("log-") || event === "terminal-log") {
                    const category = this.categorize(data.message || data.action || "");
                    const terminalId = this.routes.get(category);

                    eventContext.data = {
                        ...data,
                        targetTerminal: terminalId,
                        category,
                        icon: this.getIcon(category),
                    };
                }

                return true;
            }

            categorize(message) {
                const lower = message.toLowerCase();
                if (lower.includes("error") || lower.includes("failed") || lower.includes("❌"))
                    return "ERRORS";
                if (lower.includes("css") || lower.includes("style") || lower.includes("🎨"))
                    return "CSS";
                if (lower.includes(".mp4") || lower.includes("video") || lower.includes("🎬"))
                    return "VIDEOS";
                if (lower.includes(".jpg") || lower.includes(".png") || lower.includes("image") || lower.includes("🖼️"))
                    return "IMAGES";
                if (lower.includes("ascii") || lower.includes("🎯"))
                    return "ASCII";
                if (lower.includes("network") || lower.includes("fetch") || lower.includes("proxy"))
                    return "NETWORK";
                return "SYSTEM";
            }

            getIcon(category) {
                const icons = {
                    ERRORS: "🔴",
                    CSS: "🎨",
                    MEDIA: "📦",
                    VIDEOS: "🎬",
                    IMAGES: "🖼️",
                    ASCII: "🎯",
                    NETWORK: "🌐",
                    SYSTEM: "⚙️",
                };
                return icons[category] || "📋";
            }
        }

        // ===== SMART TERMINAL INTEGRATION =====
        class SmartTerminal extends SubscriberEnabledComponent {
            constructor(containerId = 'vibe-terminal-output') {
                super();

                this.containerId = containerId;
                this.logBuffer = new Map();
                this.categoryFilters = new Set();
                this.maxLogEntries = 500;

                this.initializeSmartTerminal();
            }

            initializeSmartTerminal() {
                // Subscribe to cross-context logs
                this.subscribe('handle-logFromBackground', async (eventType, { data }) => {
                    this.displayLog(data.level, data.message, data.category, 'background');
                    return { success: true };
                });

                // Subscribe to local debug events
                this.subscribe('debug-notification', (eventType, data) => {
                    this.displayLog('debug', data.message, 'DEBUG', 'local');
                });

                // Subscribe to terminal logs
                this.subscribe('terminal-log', (eventType, data) => {
                    this.displayLog(data.level || 'info', data.message, data.category || 'SYSTEM', data.source || 'unknown');
                });

                // Memory management
                setInterval(() => {
                    this.cleanupOldLogs();
                }, 60000); // Every minute
            }

            displayLog(level, message, category = 'SYSTEM', source = 'unknown') {
                const container = document.getElementById(this.containerId);
                if (!container) return;

                const logEntry = {
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    timestamp: Date.now(),
                    level,
                    message,
                    category,
                    source
                };

                // Apply category filters
                if (this.categoryFilters.size > 0 && !this.categoryFilters.has(category)) {
                    return;
                }

                // Store in buffer
                this.logBuffer.set(logEntry.id, logEntry);

                // Create DOM element
                const logElement = document.createElement('div');
                logElement.className = `terminal-log log-${level} category-${category.toLowerCase()}`;
                logElement.dataset.logId = logEntry.id;
                logElement.innerHTML = `
                    <span class="log-timestamp">${new Date(logEntry.timestamp).toLocaleTimeString()}</span>
                    <span class="log-category">[${category}]</span>
                    <span class="log-source">(${source})</span>
                    <span class="log-level log-${level}">${level.toUpperCase()}</span>
                    <span class="log-message">${this.escapeHtml(message)}</span>
                `;

                container.appendChild(logElement);
                container.scrollTop = container.scrollHeight;

                // Emit local log event
                if (window.__localEventBus) {
                    window.__localEventBus.emitLocal('terminal-log-added', logEntry);
                }
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            cleanupOldLogs() {
                if (this.logBuffer.size <= this.maxLogEntries) return;

                const sortedLogs = Array.from(this.logBuffer.entries())
                    .sort(([, a], [, b]) => a.timestamp - b.timestamp);

                const toRemove = sortedLogs.slice(0, sortedLogs.length - this.maxLogEntries);

                for (const [logId] of toRemove) {
                    this.logBuffer.delete(logId);

                    // Remove from DOM
                    const element = document.querySelector(`[data-log-id="${logId}"]`);
                    if (element) {
                        element.remove();
                    }
                }
            }

            setCategoryFilter(categories) {
                this.categoryFilters = new Set(categories);

                // Hide/show existing logs
                const container = document.getElementById(this.containerId);
                if (container) {
                    const allLogs = container.querySelectorAll('.terminal-log');
                    allLogs.forEach(log => {
                        const category = log.className.match(/category-(\w+)/)?.[1]?.toUpperCase();
                        const shouldShow = this.categoryFilters.size === 0 ||
                            this.categoryFilters.has(category);
                        log.style.display = shouldShow ? '' : 'none';
                    });
                }
            }

            clear() {
                const container = document.getElementById(this.containerId);
                if (container) {
                    container.innerHTML = '';
                }
                this.logBuffer.clear();
            }
        }

        // ===== ENHANCED PROXY CONTROLLER =====
        class ProxyController extends SubscriberEnabledComponent {
            constructor() {
                super();

                // Proxy-specific state
                this.displayState = {
                    isActive: false,
                    currentTheme: 'dark',
                    terminalVisible: true,
                    contentVisible: true,
                    debugMode: false
                };

                // Content management
                this.contentBuffer = new Map();         // Buffered content for display
                this.displayQueue = new Map();          // Display update queue
                this.mediaAssets = new Map();           // Discovered media assets
                this.terminalLogs = new Map();          // Terminal output buffer

                // UI components
                this.terminalContainer = null;
                this.contentContainer = null;
                this.controlPanel = null;
                this.smartTerminal = null;

                // Performance tracking
                this.displayMetrics = {
                    contentUpdates: 0,
                    terminalWrites: 0,
                    themeChanges: 0,
                    userInteractions: 0
                };

                // Add custom middleware
                this.mediaAggregationMiddleware = new MediaAggregationMiddleware();
                this.terminalRoutingMiddleware = new TerminalRoutingMiddleware();

                this.initializeProxyController();
            }

            initializeProxyController() {
                // Add middleware to subscriber manager
                if (window.__globalSubscriberManager) {
                    window.__globalSubscriberManager.addGlobalMiddleware(this.mediaAggregationMiddleware);
                    window.__globalSubscriberManager.addGlobalMiddleware(this.terminalRoutingMiddleware);
                }

                this.setupProxySubscriptions();
                this.setupUIComponents();
                this.setupUserInteractionHandlers();
                this.setupDisplayProcessing();

                // Mark as proxy controller for context detection
                window.__vibeReaderProxyController = this;
                window.__proxyController = this;

                console.log('🖼️ Enhanced ProxyController initialized');
            }

            setupProxySubscriptions() {
                // Content display from extractor
                this.subscribe('handle-displayContent', async (eventType, { data, sender }) => {
                    return await this.handleContentDisplay(data);
                });

                // Terminal logging from background
                this.subscribe('handle-logFromBackground', async (eventType, { data, sender }) => {
                    return await this.handleTerminalLog(data);
                });

                // Media discovery updates
                this.subscribe('handle-mediaDiscovered', async (eventType, { data, sender }) => {
                    return await this.handleMediaDiscovery(data);
                });

                // Theme and settings updates from popup
                this.subscribe('handle-updateTheme', async (eventType, { data, sender }) => {
                    return await this.handleThemeUpdate(data);
                });

                this.subscribe('handle-updateSettings', async (eventType, { data, sender }) => {
                    return await this.handleSettingsUpdate(data);
                });

                // User interaction forwarding
                this.subscribe('user-command', async (eventType, data) => {
                    return await this.forwardUserCommand(data);
                });

                // Display processing
                this.subscribe('process-display-queue', async (eventType, data) => {
                    return await this.processDisplayQueue();
                });

                // Injection ready check
                this.subscribe('handle-injection-ready-check', (eventType, { data, sender }) => {
                    return { ready: true, context: this.origin, timestamp: Date.now() };
                });

                // Handle ping
                this.subscribe('handle-ping', (eventType, { data, sender }) => {
                    return { pong: true, context: this.origin, timestamp: Date.now() };
                });
            }

            setupUIComponents() {
                this.createTerminalContainer();
                this.createContentContainer();
                this.createControlPanel();

                // Create smart terminal instance
                this.smartTerminal = new SmartTerminal('vibe-terminal-output');
                window.__smartTerminal = this.smartTerminal;

                // Apply initial theme
                this.applyTheme(this.displayState.currentTheme);

                console.log('🎨 UI components initialized');
            }

            createTerminalContainer() {
                this.terminalContainer = document.createElement('div');
                this.terminalContainer.id = 'vibe-terminal';
                this.terminalContainer.className = 'vibe-terminal-container';
                this.terminalContainer.innerHTML = `
                    <div class="terminal-header">
                        <span class="terminal-title">VibeReader Terminal</span>
                        <div class="terminal-controls">
                            <button class="terminal-minimize">−</button>
                            <button class="terminal-maximize">□</button>
                            <button class="terminal-close">×</button>
                        </div>
                    </div>
                    <div class="terminal-body">
                        <div class="terminal-output" id="vibe-terminal-output"></div>
                        <div class="terminal-input">
                            <span class="terminal-prompt">vibe></span>
                            <input type="text" id="vibe-terminal-input" placeholder="Enter command...">
                        </div>
                    </div>
                `;

                document.body.appendChild(this.terminalContainer);
            }

            createContentContainer() {
                this.contentContainer = document.createElement('div');
                this.contentContainer.id = 'vibe-content';
                this.contentContainer.className = 'vibe-content-container';
                this.contentContainer.innerHTML = `
                    <div class="content-header">
                        <span class="content-title">Extracted Content</span>
                        <div class="content-controls">
                            <button class="content-refresh">↻</button>
                            <button class="content-export">↗</button>
                            <button class="content-settings">⚙</button>
                        </div>
                    </div>
                    <div class="content-body">
                        <div class="content-tabs">
                            <button class="content-tab active" data-tab="text">Text</button>
                            <button class="content-tab" data-tab="media">Media</button>
                            <button class="content-tab" data-tab="structure">Structure</button>
                        </div>
                        <div class="content-panels">
                            <div class="content-panel active" id="text-panel"></div>
                            <div class="content-panel" id="media-panel"></div>
                            <div class="content-panel" id="structure-panel"></div>
                        </div>
                    </div>
                `;

                document.body.appendChild(this.contentContainer);
            }

            createControlPanel() {
                this.controlPanel = document.createElement('div');
                this.controlPanel.id = 'vibe-control-panel';
                this.controlPanel.className = 'vibe-control-panel';
                this.controlPanel.innerHTML = `
                    <div class="control-section">
                        <h3>Display</h3>
                        <label><input type="checkbox" id="terminal-visible" checked> Terminal</label>
                        <label><input type="checkbox" id="content-visible" checked> Content</label>
                        <label><input type="checkbox" id="debug-mode"> Debug Mode</label>
                    </div>
                    <div class="control-section">
                        <h3>Theme</h3>
                        <select id="theme-selector">
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="neon">Neon</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                    <div class="control-section">
                        <h3>Actions</h3>
                        <button id="clear-terminal">Clear Terminal</button>
                        <button id="export-content">Export Content</button>
                        <button id="toggle-extraction">Toggle Extraction</button>
                    </div>
                `;

                document.body.appendChild(this.controlPanel);
            }

            setupUserInteractionHandlers() {
                // Terminal input
                const terminalInput = document.getElementById('vibe-terminal-input');
                if (terminalInput) {
                    terminalInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.handleTerminalCommand(terminalInput.value.trim());
                            terminalInput.value = '';
                        }
                    });
                }

                // Control panel interactions
                document.getElementById('terminal-visible')?.addEventListener('change', (e) => {
                    this.toggleTerminalVisibility(e.target.checked);
                });

                document.getElementById('content-visible')?.addEventListener('change', (e) => {
                    this.toggleContentVisibility(e.target.checked);
                });

                document.getElementById('debug-mode')?.addEventListener('change', (e) => {
                    this.toggleDebugMode(e.target.checked);
                });

                document.getElementById('theme-selector')?.addEventListener('change', (e) => {
                    this.applyTheme(e.target.value);
                });

                // Action buttons
                document.getElementById('clear-terminal')?.addEventListener('click', () => {
                    this.clearTerminal();
                });

                document.getElementById('export-content')?.addEventListener('click', () => {
                    this.exportContent();
                });

                document.getElementById('toggle-extraction')?.addEventListener('click', () => {
                    this.toggleExtraction();
                });

                // Content tabs
                document.querySelectorAll('.content-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        this.switchContentTab(e.target.dataset.tab);
                    });
                });

                console.log('🎛️ User interaction handlers setup complete');
            }

            setupDisplayProcessing() {
                // Process display queue every 100ms
                setInterval(() => {
                    if (this.displayQueue.size > 0) {
                        this.emit('process-display-queue');
                    }
                }, 100);

                // Clean old content buffer every 5 minutes
                setInterval(() => {
                    this.cleanContentBuffer();
                }, 300000);
            }

            // ===== CONTENT HANDLING =====

            async handleContentDisplay(data) {
                const { content, type, metadata = {}, source = 'extractor' } = data;

                this.displayMetrics.contentUpdates++;

                try {
                    // Buffer content for processing
                    const contentId = `content-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

                    this.contentBuffer.set(contentId, {
                        content,
                        type,
                        metadata,
                        source,
                        timestamp: Date.now(),
                        processed: false
                    });

                    // Queue for display processing
                    this.queueDisplayUpdate(contentId, type, metadata.priority || 'normal');

                    // Log to terminal
                    this.logToTerminal('info', `Content received: ${type} (${JSON.stringify(content).length} chars)`, 'CONTENT');

                    return { success: true, contentId, queued: true };

                } catch (error) {
                    this.logToTerminal('error', `Content display error: ${error.message}`, 'ERROR');
                    return { success: false, error: error.message };
                }
            }

            queueDisplayUpdate(contentId, type, priority) {
                const queueKey = `${type}-${priority}`;

                if (!this.displayQueue.has(queueKey)) {
                    this.displayQueue.set(queueKey, {
                        type,
                        priority,
                        items: [],
                        lastProcessed: 0
                    });
                }

                this.displayQueue.get(queueKey).items.push({
                    contentId,
                    timestamp: Date.now()
                });
            }

            async processDisplayQueue() {
                // Process queues by priority: high -> normal -> low
                const priorities = ['high', 'normal', 'low'];

                for (const priority of priorities) {
                    for (const [queueKey, queue] of this.displayQueue.entries()) {
                        if (queue.priority === priority && queue.items.length > 0) {
                            await this.processDisplayQueueItems(queueKey, queue);
                            break; // Process one queue at a time
                        }
                    }
                }
            }

            async processDisplayQueueItems(queueKey, queue) {
                const items = queue.items.splice(0, 5); // Process up to 5 items at a time

                for (const item of items) {
                    try {
                        const content = this.contentBuffer.get(item.contentId);
                        if (content && !content.processed) {
                            await this.displayContent(content);
                            content.processed = true;
                        }
                    } catch (error) {
                        console.error(`Display processing error for ${item.contentId}:`, error);
                    }
                }

                queue.lastProcessed = Date.now();
            }

            async displayContent(contentData) {
                const { content, type, metadata, source } = contentData;

                switch (type) {
                    case 'text':
                        await this.displayTextContent(content, metadata);
                        break;
                    case 'html':
                        await this.displayHTMLContent(content, metadata);
                        break;
                    case 'media':
                        await this.displayMediaContent(content, metadata);
                        break;
                    case 'structure':
                        await this.displayStructureContent(content, metadata);
                        break;
                    default:
                        await this.displayGenericContent(content, type, metadata);
                }

                this.logToTerminal('info', `Displayed ${type} content from ${source}`, 'DISPLAY');
            }

            async displayTextContent(content, metadata) {
                const textPanel = document.getElementById('text-panel');
                if (!textPanel) return;

                const contentElement = document.createElement('div');
                contentElement.className = 'text-content';
                contentElement.innerHTML = `
                    <div class="content-meta">
                        <span class="content-timestamp">${new Date().toLocaleTimeString()}</span>
                        <span class="content-stats">${content.wordCount || 0} words, ${content.characterCount || 0} chars</span>
                    </div>
                    <div class="content-text">${this.escapeHtml(content.text || content)}</div>
                `;

                textPanel.appendChild(contentElement);
                textPanel.scrollTop = textPanel.scrollHeight;
            }

            async displayHTMLContent(content, metadata) {
                const textPanel = document.getElementById('text-panel');
                if (!textPanel) return;

                const contentElement = document.createElement('div');
                contentElement.className = 'html-content';
                contentElement.innerHTML = `
                    <div class="content-meta">
                        <span class="content-timestamp">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div class="content-html">${content}</div>
                `;

                textPanel.appendChild(contentElement);
            }

            async displayMediaContent(content, metadata) {
                const mediaPanel = document.getElementById('media-panel');
                if (!mediaPanel) return;

                const mediaElement = document.createElement('div');
                mediaElement.className = 'media-content';

                let mediaHTML = '<div class="media-summary">';
                mediaHTML += `<h4>Media Discovery (${new Date().toLocaleTimeString()})</h4>`;

                if (content.images && content.images.length > 0) {
                    mediaHTML += `<div class="media-section">`;
                    mediaHTML += `<h5>Images (${content.images.length})</h5>`;
                    content.images.slice(0, 10).forEach(img => {
                        mediaHTML += `<div class="media-item">
                            <img src="${img.src}" alt="${img.alt || ''}" style="max-width: 100px; max-height: 100px;">
                            <div class="media-info">${img.width || 0}x${img.height || 0}</div>
                        </div>`;
                    });
                    mediaHTML += '</div>';
                }

                if (content.videos && content.videos.length > 0) {
                    mediaHTML += `<div class="media-section">`;
                    mediaHTML += `<h5>Videos (${content.videos.length})</h5>`;
                    content.videos.slice(0, 5).forEach(video => {
                        mediaHTML += `<div class="media-item">
                            <video controls style="max-width: 200px; max-height: 150px;">
                                <source src="${video.src}">
                            </video>
                            <div class="media-info">${video.duration || 0}s</div>
                        </div>`;
                    });
                    mediaHTML += '</div>';
                }

                mediaHTML += '</div>';
                mediaElement.innerHTML = mediaHTML;

                mediaPanel.appendChild(mediaElement);
                mediaPanel.scrollTop = mediaPanel.scrollHeight;

                // Store media assets
                this.mediaAssets.set(Date.now(), content);
            }

            async displayStructureContent(content, metadata) {
                const structurePanel = document.getElementById('structure-panel');
                if (!structurePanel) return;

                const structureElement = document.createElement('div');
                structureElement.className = 'structure-content';
                structureElement.innerHTML = `
                    <div class="content-meta">
                        <span class="content-timestamp">${new Date().toLocaleTimeString()}</span>
                        <span class="content-source">Page Analysis</span>
                    </div>
                    <div class="structure-data">
                        <div class="structure-section">
                            <h5>Headings (${content.headings?.length || 0})</h5>
                            ${(content.headings || []).slice(0, 10).map(h =>
                    `<div class="heading-item">H${h.level}: ${this.escapeHtml(h.text)}</div>`
                ).join('')}
                        </div>
                        <div class="structure-section">
                            <h5>Sections (${content.sections?.length || 0})</h5>
                            ${(content.sections || []).slice(0, 10).map(s =>
                    `<div class="section-item">${s.type}: ${s.childCount} children</div>`
                ).join('')}
                        </div>
                        <div class="structure-section">
                            <h5>Lists (${content.lists?.length || 0})</h5>
                            ${(content.lists || []).slice(0, 5).map(l =>
                    `<div class="list-item">${l.type}: ${l.itemCount} items</div>`
                ).join('')}
                        </div>
                    </div>
                `;

                structurePanel.appendChild(structureElement);
                structurePanel.scrollTop = structurePanel.scrollHeight;
            }

            async displayGenericContent(content, type, metadata) {
                const textPanel = document.getElementById('text-panel');
                if (!textPanel) return;

                const contentElement = document.createElement('div');
                contentElement.className = 'generic-content';
                contentElement.innerHTML = `
                    <div class="content-meta">
                        <span class="content-timestamp">${new Date().toLocaleTimeString()}</span>
                        <span class="content-type">${type}</span>
                    </div>
                    <div class="content-body">
                        <pre>${this.escapeHtml(JSON.stringify(content, null, 2))}</pre>
                    </div>
                `;

                textPanel.appendChild(contentElement);
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // ===== TERMINAL HANDLING =====

            async handleTerminalLog(data) {
                const { level, message, category, source = 'background' } = data;

                this.displayMetrics.terminalWrites++;
                this.logToTerminal(level, message, category, source);

                return { success: true, logged: true };
            }

            logToTerminal(level, message, category = 'SYSTEM', source = 'proxy', extra = null) {
                if (this.smartTerminal) {
                    this.smartTerminal.displayLog(level, message, category, source);
                }

                // Store in terminal logs
                const logId = `log-${Date.now()}`;
                this.terminalLogs.set(logId, {
                    timestamp: Date.now(),
                    level,
                    message,
                    category,
                    source,
                    extra
                });

                // Keep log history manageable
                if (this.terminalLogs.size > 500) {
                    const oldestKey = this.terminalLogs.keys().next().value;
                    this.terminalLogs.delete(oldestKey);
                }
            }

            async handleTerminalCommand(command) {
                this.logToTerminal('user', `> ${command}`, 'COMMAND');

                try {
                    const result = await this.executeTerminalCommand(command);
                    this.logToTerminal('info', result.message || 'Command executed', 'RESULT');

                    return result;
                } catch (error) {
                    this.logToTerminal('error', error.message, 'ERROR');
                    return { success: false, error: error.message };
                }
            }

            async executeTerminalCommand(command) {
                const parts = command.split(' ');
                const cmd = parts[0].toLowerCase();
                const args = parts.slice(1);

                switch (cmd) {
                    case 'clear':
                        this.clearTerminal();
                        return { success: true, message: 'Terminal cleared' };

                    case 'status':
                        return await this.getSystemStatus();

                    case 'export':
                        return await this.exportContent(args[0]);

                    case 'theme':
                        if (args[0]) {
                            this.applyTheme(args[0]);
                            return { success: true, message: `Theme changed to ${args[0]}` };
                        }
                        return { success: false, message: 'Please specify a theme' };

                    case 'send':
                        if (args.length >= 2) {
                            const context = args[0];
                            const action = args[1];
                            const data = args.slice(2).join(' ');

                            return await this.sendCommandToContext(context, action, data);
                        }
                        return { success: false, message: 'Usage: send <context> <action> <data>' };

                    case 'help':
                        return this.getTerminalHelp();

                    default:
                        return { success: false, message: `Unknown command: ${cmd}. Type 'help' for available commands.` };
                }
            }

            async sendCommandToContext(context, action, data) {
                try {
                    const result = await this.emit(`route-to-${context}`, { action, data });
                    return { success: true, message: `Sent to ${context}: ${action}`, result };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            getTerminalHelp() {
                const helpText = `
Available commands:
  clear         - Clear terminal output
  status        - Show system status
  export [type] - Export content (json/csv)
  theme <name>  - Change theme (dark/light/neon/minimal)
  send <context> <action> <data> - Send command to context
  help          - Show this help message
                `.trim();

                return { success: true, message: helpText };
            }

            // ===== MEDIA HANDLING =====

            async handleMediaDiscovery(data) {
                // Media aggregation is handled by MediaAggregationMiddleware
                // Just display the aggregated results
                if (data.collections) {
                    await this.displayMediaContent(data.collections);
                }

                return { success: true };
            }

            // ===== USER INTERACTION HANDLERS =====

            toggleTerminalVisibility(visible) {
                this.displayState.terminalVisible = visible;
                if (this.terminalContainer) {
                    this.terminalContainer.style.display = visible ? 'block' : 'none';
                }
                this.displayMetrics.userInteractions++;

                this.emit('user-interface-change', {
                    component: 'terminal',
                    visible,
                    timestamp: Date.now()
                });
            }

            toggleContentVisibility(visible) {
                this.displayState.contentVisible = visible;
                if (this.contentContainer) {
                    this.contentContainer.style.display = visible ? 'block' : 'none';
                }
                this.displayMetrics.userInteractions++;

                this.emit('user-interface-change', {
                    component: 'content',
                    visible,
                    timestamp: Date.now()
                });
            }

            toggleDebugMode(enabled) {
                this.displayState.debugMode = enabled;
                document.body.classList.toggle('debug-mode', enabled);
                this.displayMetrics.userInteractions++;

                this.emit('user-debug-mode-change', {
                    enabled,
                    timestamp: Date.now()
                });

                // Enable debug in subscriber manager
                if (window.__globalSubscriberManager?.debugMiddleware) {
                    window.__globalSubscriberManager.debugMiddleware.enableDebug(enabled);
                }
            }

            applyTheme(themeName) {
                this.displayState.currentTheme = themeName;
                document.body.className = document.body.className.replace(/theme-\w+/, '');
                document.body.classList.add(`theme-${themeName}`);
                this.displayMetrics.themeChanges++;

                this.emit('user-theme-change', {
                    theme: themeName,
                    timestamp: Date.now()
                });
            }

            switchContentTab(tabName) {
                // Update tab buttons
                document.querySelectorAll('.content-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.tab === tabName);
                });

                // Update panels
                document.querySelectorAll('.content-panel').forEach(panel => {
                    panel.classList.toggle('active', panel.id === `${tabName}-panel`);
                });

                this.emit('user-tab-change', {
                    tab: tabName,
                    timestamp: Date.now()
                });
            }

            async toggleExtraction() {
                const result = await this.forwardUserCommand({
                    command: 'toggle-extraction',
                    timestamp: Date.now()
                });

                this.logToTerminal('info',
                    result.success ? 'Extraction toggled' : `Toggle failed: ${result.error}`,
                    'COMMAND'
                );

                return result;
            }

            async forwardUserCommand(data) {
                // Forward user commands to background for routing
                if (window.__crossContextBridge) {
                    try {
                        return await window.__crossContextBridge.sendToBackground('user-command', data);
                    } catch (error) {
                        this.logToTerminal('error', `Command forwarding failed: ${error.message}`, 'ERROR');
                        return { success: false, error: error.message };
                    }
                }

                return { success: false, error: 'Cross-context bridge not available' };
            }

            // ===== SETTINGS HANDLING =====

            async handleThemeUpdate(data) {
                const { theme } = data;
                this.applyTheme(theme);
                return { success: true, theme };
            }

            async handleSettingsUpdate(data) {
                const { setting, value } = data;

                // Apply setting based on type
                switch (setting) {
                    case 'debugMode':
                        this.toggleDebugMode(value);
                        break;
                    case 'theme':
                        this.applyTheme(value);
                        break;
                    default:
                        console.log(`Settings update: ${setting} = ${value}`);
                }

                return { success: true, setting, value };
            }

            // ===== UTILITY METHODS =====

            clearTerminal() {
                if (this.smartTerminal) {
                    this.smartTerminal.clear();
                }
                this.terminalLogs.clear();
            }

            async exportContent(format = 'json') {
                const exportData = {
                    timestamp: Date.now(),
                    contentBuffer: Object.fromEntries(this.contentBuffer),
                    mediaAssets: Object.fromEntries(this.mediaAssets),
                    terminalLogs: Object.fromEntries(this.terminalLogs),
                    displayState: { ...this.displayState },
                    metrics: { ...this.displayMetrics }
                };

                // Send to background for processing
                return await this.forwardUserCommand({
                    command: 'export-content',
                    format,
                    data: exportData
                });
            }

            cleanContentBuffer() {
                const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);

                for (const [id, content] of this.contentBuffer.entries()) {
                    if (content.timestamp < thirtyMinutesAgo) {
                        this.contentBuffer.delete(id);
                    }
                }
            }

            async getSystemStatus() {
                const stats = {
                    proxy: {
                        contentBuffer: this.contentBuffer.size,
                        displayQueue: this.displayQueue.size,
                        terminalLogs: this.terminalLogs.size,
                        mediaAssets: this.mediaAssets.size,
                        displayState: { ...this.displayState },
                        metrics: { ...this.displayMetrics }
                    }
                };

                if (window.__vibeReaderEnhancedUtils) {
                    stats.utils = window.__vibeReaderEnhancedUtils.getStats();
                }

                if (window.__globalSubscriberManager) {
                    stats.subscribers = window.__globalSubscriberManager.getStats();
                }

                return { success: true, message: JSON.stringify(stats, null, 2), stats };
            }

            getProxyStatus() {
                return {
                    isActive: this.displayState.isActive,
                    contentBuffer: this.contentBuffer.size,
                    displayQueue: this.displayQueue.size,
                    terminalLogs: this.terminalLogs.size,
                    mediaAssets: this.mediaAssets.size,
                    displayState: { ...this.displayState },
                    metrics: { ...this.displayMetrics }
                };
            }
        }

        // Create singleton instance
        const proxyController = new ProxyController();
        window.__vibeReaderProxyController = proxyController;
        window.__proxyController = proxyController;

        console.log('✅ ProxyController v2.5 loaded');

        true;
    } catch (error) {
        delete window.__vibeReaderProxyController;
        delete window.__proxyController;
        console.error('Failed to initialize ProxyController:', error);
        throw error;
    }
}