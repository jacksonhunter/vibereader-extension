// VibeReader v2.0 - Proxy Controller
// vibeReader.display() // Manages the visible tab interface and proxy communication with hidden tab

class ProxyController {
    constructor() {
        this.container = null;
        this.currentTheme = 'nightdrive';
        this.extractedContent = null;
        this.metadata = null;
        this.isActive = false;
        this.settings = {
            theme: 'nightdrive',
            sideScrolls: true,
            vibeRain: false,
            mediaMode: 'emoji', // 'emoji', 'ascii', 'normal'
            autoActivate: false
        };
        this.init();
    }
    
    init() {
        const initStart = performance.now();
        try {
            console.log('🎮 ProxyController.init() // initializing proxy controller:', {
                url: window.location.href,
                startTime: new Date().toISOString(),
                userAgent: navigator.userAgent.substring(0, 50)
            });
            
            // Listen for messages from background script
            browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                this.handleMessage(request, sender, sendResponse);
                return true;
            });
            
            // Load settings
            this.loadSettings();
            
            // Start activation
            this.activate();
            
            console.log(`⏱️ ProxyController.init() // initialization complete: ${(performance.now() - initStart).toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ ProxyController.init() // initialization failed:', {
                error: error.message,
                stack: error.stack,
                url: window.location.href,
                initTime: (performance.now() - initStart).toFixed(1) + 'ms'
            });
            throw error;
        }
    }
    
    handleMessage(request, sender, sendResponse) {
        const messageStart = performance.now();
        try {
            console.log('📨 ProxyController.handleMessage() // received message:', {
                action: request.action,
                sender: sender.tab ? sender.tab.url : 'background',
                timestamp: new Date().toISOString()
            });
            
            switch (request.action) {
                case 'displayContent':
                    this.displayExtractedContent(request.content, request.metadata);
                    sendResponse({ success: true });
                    break;
                    
                case 'extractionProgress':
                    // Background extraction happening, no user interaction needed
                    console.log('📊 ProxyController.handleMessage() // extraction progress update:', {
                        status: request.status,
                        progress: request.progress
                    });
                    break;
                    
                case 'deactivate':
                    this.deactivate();
                    sendResponse({ success: true });
                    break;
                    
                case 'showError':
                    console.error('❌ ProxyController.handleMessage() // received error:', request.error);
                    this.showError(request.error);
                    break;
                    
                case 'hiddenTabClosed':
                    console.error('🔌 ProxyController.handleMessage() // hidden tab closed:', request.error);
                    this.handleHiddenTabClosed(request.error);
                    break;
                    
                case 'updateSettings':
                    this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;
                    
                case 'getStatus':
                    sendResponse({ active: this.isActive });
                    break;
                    
                default:
                    console.warn('⚠️ ProxyController.handleMessage() // unknown message action:', {
                        action: request.action,
                        fullRequest: request
                    });
            }
            
            console.log(`⏱️ ProxyController.handleMessage() // message processed: ${(performance.now() - messageStart).toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ ProxyController.handleMessage() // message handling failed:', {
                error: error.message,
                stack: error.stack,
                action: request.action,
                processingTime: (performance.now() - messageStart).toFixed(1) + 'ms'
            });
            
            // Try to send error response
            try {
                sendResponse({ error: error.message });
            } catch (responseError) {
                console.error('❌ ProxyController.handleMessage() // failed to send error response:', responseError.message);
            }
        }
    }
    
    async loadSettings() {
        const loadStart = performance.now();
        try {
            console.log('⚙️ ProxyController.loadSettings() // loading user settings...');
            
            const result = await browser.storage.sync.get('vibeReaderSettings');
            if (result.vibeReaderSettings) {
                this.settings = { ...this.settings, ...result.vibeReaderSettings };
                this.currentTheme = this.settings.theme || 'nightdrive';
                
                console.log('✅ ProxyController.loadSettings() // settings loaded:', {
                    theme: this.currentTheme,
                    mediaMode: this.settings.mediaMode,
                    sideScrolls: this.settings.sideScrolls,
                    loadTime: (performance.now() - loadStart).toFixed(1) + 'ms'
                });
            } else {
                console.log('💾 ProxyController.loadSettings() // using default settings');
            }
            
        } catch (error) {
            console.error('❌ ProxyController.loadSettings() // settings loading failed:', {
                error: error.message,
                stack: error.stack,
                loadTime: (performance.now() - loadStart).toFixed(1) + 'ms'
            });
            // Continue with default settings
        }
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.currentTheme = this.settings.theme || 'nightdrive';
        
        // Apply theme change immediately
        this.applyTheme(this.currentTheme);
        
        // Update button texts
        this.updateButtonTexts();
        
        // Update vibe rain if setting changed
        if (this.container) {
            const rainContainer = this.container.querySelector('.vibe-rain-container');
            if (this.settings.vibeRain && !rainContainer) {
                // Add rain container if enabled
                const newRain = document.createElement('div');
                newRain.className = 'vibe-rain-container';
                this.container.querySelector('.vibe-reader-overlay').appendChild(newRain);
            } else if (!this.settings.vibeRain && rainContainer) {
                // Remove rain container if disabled
                rainContainer.remove();
            }
        }
    }
    
    activate() {
        const activateStart = performance.now();
        try {
            console.log('🔥 ProxyController.activate() // activating vibe mode...', {
                url: window.location.href,
                startTime: new Date().toISOString()
            });
            
            this.isActive = true;
            
            // Hide original page content completely
            const hideStart = performance.now();
            this.hideOriginalContent();
            console.log(`⏱️ ProxyController.activate() // content hiding: ${(performance.now() - hideStart).toFixed(1)}ms`);
            
            // Create VibeReader interface
            const interfaceStart = performance.now();
            this.createInterface();
            console.log(`⏱️ ProxyController.activate() // interface creation: ${(performance.now() - interfaceStart).toFixed(1)}ms`);
            
            // Content will be updated when extraction completes
            
            // Notify background script
            browser.runtime.sendMessage({ 
                action: 'updateBadge', 
                active: true 
            }).catch(error => {
                console.error('❌ ProxyController.activate() // failed to update badge:', error.message);
            });
            
            console.log(`✅ ProxyController.activate() // activation complete: ${(performance.now() - activateStart).toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ ProxyController.activate() // activation failed:', {
                error: error.message,
                stack: error.stack,
                url: window.location.href,
                activationTime: (performance.now() - activateStart).toFixed(1) + 'ms'
            });
            
            // Try to show error to user
            try {
                this.showError(`Activation failed: ${error.message}`);
            } catch (showErrorFailure) {
                console.error('❌ ProxyController.activate() // failed to show error to user:', showErrorFailure.message);
            }
        }
    }
    
    hideOriginalContent() {
        // Ensure proper DOCTYPE to prevent quirks mode
        if (!document.doctype) {
            console.log('🔧 ProxyController.hideOriginalContent() // adding missing DOCTYPE');
            const doctype = document.implementation.createDocumentType('html', '', '');
            document.insertBefore(doctype, document.documentElement);
        }
        
        // Store original page state
        this.originalBodyOverflow = document.body.style.overflow;
        this.originalHtmlOverflow = document.documentElement.style.overflow;
        
        // Hide original content
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Hide all original page elements
        const allElements = document.body.children;
        for (let el of allElements) {
            if (!el.classList.contains('vibe-reader-container')) {
                el.style.display = 'none';
            }
        }
    }
    
    createInterface() {
        const interfaceStart = performance.now();
        try {
            console.log('🎨 ProxyController.createInterface() // creating cyberpunk interface...');
            
            // Create main container
            this.container = document.createElement('div');
            this.container.className = 'vibe-reader-container vibe-reader-proxy';
            this.container.setAttribute('data-theme', this.currentTheme);
        
        // Create loading interface
        this.container.innerHTML = `
            <div class="vibe-reader-overlay">
                <div class="vibe-header">
                    <div class="vibe-header-left">
                        <span class="vibe-brand">▓▓ VIBE READER v2.0 ▓▓</span>
                        <span class="vibe-status">[ BACKGROUND PROCESS ]</span>
                    </div>
                    <div class="vibe-header-right">
                        <button class="vibe-btn media-btn" title="Toggle Media Mode">📺</button>
                        <button class="vibe-btn theme-btn" title="Cycle Theme">🎨</button>
                        <button class="vibe-btn disconnect-btn" title="vibeReader.kill()">⚡</button>
                    </div>
                </div>
                
                <div class="vibe-layout">
                    ${this.settings.sideScrolls ? this.createLeftPanel() : '<div class="vibe-sidebar-spacer"></div>'}
                    
                    <main class="vibe-content">
                        <article class="vibe-article">
                            <header class="article-header">
                                <h1 class="article-title glitch" data-text="VIBE READER ACTIVE">
                                    VIBE READER ACTIVE
                                </h1>
                                <div class="article-meta">
                                    <span class="meta-item">🔥 VIBE MODE ENGAGED</span>
                                    <span class="meta-item">⚡ NEURAL INTERFACE ONLINE</span>
                                    <span class="meta-item">🎯 EXTRACTING CONTENT...</span>
                                </div>
                            </header>
                            
                            <div class="article-content retrofuture-content">
                                <p class="cyber-text">Initializing cyberpunk reading interface...</p>
                                <p class="cyber-text">Background extraction in progress...</p>
                                <p class="cyber-text">Content will appear seamlessly when ready.</p>
                            </div>
                        </article>
                    </main>
                    
                    ${this.settings.sideScrolls ? this.createRightPanel() : '<div class="vibe-sidebar-spacer"></div>'}
                </div>
                
                ${this.settings.vibeRain ? '<div class="vibe-rain-container"></div>' : ''}
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Setup event handlers
        const handlersStart = performance.now();
        this.setupEventHandlers();
        console.log(`⏱️ ProxyController.createInterface() // event handlers: ${(performance.now() - handlersStart).toFixed(1)}ms`);
        
        // Apply theme
        const themeStart = performance.now();
        this.applyTheme(this.currentTheme);
        console.log(`⏱️ ProxyController.createInterface() // theme application: ${(performance.now() - themeStart).toFixed(1)}ms`);
        
        // Initialize effects
        const effectsStart = performance.now();
        this.initializeEffects();
        console.log(`⏱️ ProxyController.createInterface() // effects initialization: ${(performance.now() - effectsStart).toFixed(1)}ms`);
        
        console.log(`✅ ProxyController.createInterface() // interface creation complete: ${(performance.now() - interfaceStart).toFixed(1)}ms`);
        
        } catch (error) {
            console.error('❌ ProxyController.createInterface() // interface creation failed:', {
                error: error.message,
                stack: error.stack,
                creationTime: (performance.now() - interfaceStart).toFixed(1) + 'ms'
            });
            throw error;
        }
    }
    
    createLeftPanel() {
        return `
            <aside class="vibe-sidebar left-panel">
                <div class="terminal-window">
                    <div class="terminal-header">
                        <span class="terminal-title">▓ SYSTEM INFO ▓</span>
                        <div class="terminal-controls">
                            <span class="led-indicator active"></span>
                        </div>
                    </div>
                    <div class="terminal-content" id="left-terminal">
                        <div class="terminal-line">> INITIALIZING VIBE READER...</div>
                        <div class="terminal-line">> NEURAL INTERFACE: ACTIVE</div>
                        <div class="terminal-line">> DATA STREAM: CONNECTED</div>
                        <div class="terminal-line">> PARSING DOCUMENT...</div>
                        <div class="terminal-line">> VIBE MODE: ENGAGED</div>
                        <div class="terminal-line">> EXTRACTION: IN PROGRESS</div>
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
                        <span class="terminal-title">▓ NETWORK STATUS ▓</span>
                        <div class="terminal-controls">
                            <span class="led-indicator active"></span>
                        </div>
                    </div>
                    <div class="terminal-content" id="right-terminal">
                        <div class="terminal-line">> proxyConnection.status = 'active'</div>
                        <div class="terminal-line">> backgroundTab.loading = true</div>
                        <div class="terminal-line">> stealthMode.engaged = true</div>
                        <div class="terminal-line">> </div>
                        <div class="terminal-line">> // extracting vibes...</div>
                    </div>
                </div>
            </aside>
        `;
    }
    
    setupEventHandlers() {
        const setupStart = performance.now();
        try {
            console.log('🎮 ProxyController.setupEventHandlers() // setting up UI event handlers...');
            
            // Media mode button
            const mediaBtn = this.container.querySelector('.media-btn');
            if (mediaBtn) {
                mediaBtn.addEventListener('click', () => {
                    try {
                        this.cycleMediaMode();
                    } catch (error) {
                        console.error('❌ ProxyController.setupEventHandlers() // media button click failed:', error.message);
                    }
                });
                console.log('✅ ProxyController.setupEventHandlers() // media button handler added');
            } else {
                console.warn('⚠️ ProxyController.setupEventHandlers() // media button not found');
            }
            
            // Theme button
            const themeBtn = this.container.querySelector('.theme-btn');
            if (themeBtn) {
                themeBtn.addEventListener('click', () => {
                    try {
                        this.cycleTheme();
                    } catch (error) {
                        console.error('❌ ProxyController.setupEventHandlers() // theme button click failed:', error.message);
                    }
                });
                console.log('✅ ProxyController.setupEventHandlers() // theme button handler added');
            } else {
                console.warn('⚠️ ProxyController.setupEventHandlers() // theme button not found');
            }
            
            // Disconnect button
            const disconnectBtn = this.container.querySelector('.disconnect-btn');
            if (disconnectBtn) {
                disconnectBtn.addEventListener('click', () => {
                    try {
                        this.requestDeactivation();
                    } catch (error) {
                        console.error('❌ ProxyController.setupEventHandlers() // disconnect button click failed:', error.message);
                    }
                });
                console.log('✅ ProxyController.setupEventHandlers() // disconnect button handler added');
            } else {
                console.warn('⚠️ ProxyController.setupEventHandlers() // disconnect button not found');
            }
            
            // Capture scroll events for proxy
            this.container.addEventListener('scroll', (e) => {
                try {
                    if (this.extractedContent) {
                        this.sendProxyCommand('scroll', {
                            scrollPosition: e.target.scrollTop
                        });
                    }
                } catch (error) {
                    console.error('❌ ProxyController.setupEventHandlers() // scroll handler failed:', error.message);
                }
            });
            
            console.log(`✅ ProxyController.setupEventHandlers() // event handlers setup complete: ${(performance.now() - setupStart).toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ ProxyController.setupEventHandlers() // event handler setup failed:', {
                error: error.message,
                stack: error.stack,
                setupTime: (performance.now() - setupStart).toFixed(1) + 'ms'
            });
        }
    }
    
    showExtractionProgress(status, progress) {
        const progressBar = this.container.querySelector('.cyber-loader-bar');
        const statusText = this.container.querySelector('.extraction-status');
        const percentText = this.container.querySelector('.progress-percent');
        const stageText = this.container.querySelector('.progress-stage');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (percentText) {
            percentText.textContent = `${progress}%`;
        }
        
        const statusMessages = {
            'initializing': 'vibeReader.init() // initializing...',
            'waiting_for_framework': 'frameworks.detect() // React/Vue/Angular...',
            'simulating_scroll': 'humanSimulator.scroll() // loading content...',
            'waiting_for_content': 'content.stabilize() // waiting...',
            'extracting': 'readability.extract() // parsing vibes...',
            'complete': '// vibes successfully parsed',
            'error': '// extraction error - retrying...'
        };
        
        const stageMessages = {
            'initializing': '// creating background process environment',
            'waiting_for_framework': '// detecting React/Vue/Angular',
            'simulating_scroll': '// triggering lazy-loaded content',
            'waiting_for_content': '// ensuring content stability',
            'extracting': '// processing with readability.js',
            'complete': '// ready to display vibes',
            'error': '// attempting fallback extraction'
        };
        
        if (statusText) {
            statusText.textContent = statusMessages[status] || '// processing...';
        }
        
        if (stageText) {
            stageText.textContent = stageMessages[status] || '// working...';
        }
        
        // Update terminal panels
        this.updateTerminalStatus(status, progress);
    }
    
    updateTerminalStatus(status, progress) {
        const leftTerminal = this.container.querySelector('#left-terminal');
        const rightTerminal = this.container.querySelector('#right-terminal');
        
        if (leftTerminal) {
            const lines = [
                '> vibeReader v2.0',
                '> backgroundProcess.active = true',
                `> progress = ${progress}%`,
                `> status = '${status}'`,
                '> ',
                `> timestamp = '${new Date().toLocaleTimeString()}'`
            ];
            leftTerminal.innerHTML = lines.map(line => 
                `<div class="terminal-line">${line}</div>`
            ).join('');
        }
        
        if (rightTerminal) {
            const lines = [
                '> proxyConnection = "active"',
                `> backgroundTab = "${status === 'complete' ? 'ready' : 'processing'}"`,
                '> stealthMode.enabled = true',
                `> progressBar = "${'█'.repeat(Math.floor(progress/10))}${'░'.repeat(10-Math.floor(progress/10))}"`,
                '> ',
                `> currentStage = "${status.replace(/_/g, '_')}"`
            ];
            rightTerminal.innerHTML = lines.map(line => 
                `<div class="terminal-line">${line}</div>`
            ).join('');
        }
    }
    
    displayExtractedContent(content, metadata) {
        const displayStart = performance.now();
        try {
            console.log('📄 ProxyController.displayExtractedContent() // displaying extracted content:', {
                title: metadata?.title?.substring(0, 50) || 'UNTITLED',
                contentLength: content?.length || 0,
                framework: metadata?.framework,
                extractedAt: metadata?.extractedAt
            });
            
            this.extractedContent = content;
            this.metadata = metadata;
        
        const mainContent = this.container.querySelector('.vibe-content');
        if (!mainContent) return;
        
        // Clear loading state
        mainContent.innerHTML = `
            <article class="vibe-article">
                <header class="article-header">
                    <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata.title || 'UNTITLED')}">
                        ${this.escapeHtml(metadata.title || 'UNTITLED')}
                    </h1>
                    ${metadata.byline ? `<div class="article-byline">BY: ${this.escapeHtml(metadata.byline)}</div>` : ''}
                    <div class="article-meta">
                        <span class="meta-item">📍 ${metadata.siteName || new URL(metadata.url).hostname}</span>
                        <span class="meta-item">📝 ${this.formatWordCount(metadata.length || 0)}</span>
                        <span class="meta-item">⏱️ ${this.calculateReadingTime(metadata.length || 0)} min read</span>
                        ${metadata.framework ? `<span class="meta-item">🔧 ${metadata.framework.toUpperCase()}</span>` : ''}
                    </div>
                </header>
                
                <div class="article-content retrofuture-content">
                    ${this.processContent(content)}
                </div>
                
                <footer class="article-footer">
                    <div class="footer-info">
                        <span>EXTRACTED AT: ${new Date(metadata.extractedAt).toLocaleString()}</span>
                        <span>SOURCE: <a href="${metadata.url}" target="_blank" class="cyber-link">${metadata.url}</a></span>
                    </div>
                </footer>
            </article>
        `;
        
        // Process images and tables
        this.processImages();
        this.processTables();
        
        // Update terminals with success info
        const terminalsStart = performance.now();
        this.updateTerminalsWithContent(metadata);
        console.log(`⏱️ ProxyController.displayExtractedContent() // terminals update: ${(performance.now() - terminalsStart).toFixed(1)}ms`);
        
        // Update button texts and reinitialize effects
        const effectsStart = performance.now();
        this.updateButtonTexts();
        this.initializeEffects();
        console.log(`⏱️ ProxyController.displayExtractedContent() // effects update: ${(performance.now() - effectsStart).toFixed(1)}ms`);
        
        console.log(`✅ ProxyController.displayExtractedContent() // content display complete: ${(performance.now() - displayStart).toFixed(1)}ms`);
        
        } catch (error) {
            console.error('❌ ProxyController.displayExtractedContent() // content display failed:', {
                error: error.message,
                stack: error.stack,
                contentLength: content?.length || 0,
                displayTime: (performance.now() - displayStart).toFixed(1) + 'ms'
            });
            
            // Try to show error to user
            try {
                this.showError(`Content display failed: ${error.message}`);
            } catch (showErrorFailure) {
                console.error('❌ ProxyController.displayExtractedContent() // failed to show error to user:', showErrorFailure.message);
            }
        }
    }
    
    processContent(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Process headings
        tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            heading.classList.add('retrofuture-heading');
            const level = heading.tagName.toLowerCase();
            const symbols = {
                'h1': '▓▓',
                'h2': '▓',
                'h3': '▒',
                'h4': '░',
                'h5': '·',
                'h6': '·'
            };
            heading.innerHTML = `${symbols[level]} ${heading.innerHTML} ${symbols[level]}`;
        });
        
        // Process links
        tempDiv.querySelectorAll('a').forEach(link => {
            link.classList.add('cyber-link');
            if (!link.textContent.includes('[') && !link.textContent.includes(']')) {
                link.innerHTML = `[${link.innerHTML}]`;
            }
        });
        
        // Process code blocks
        tempDiv.querySelectorAll('pre, code').forEach(codeBlock => {
            codeBlock.classList.add('cyber-code');
        });
        
        return tempDiv.innerHTML;
    }
    
    processImages() {
        const allMedia = this.container.querySelectorAll('.article-content img, .article-content video');
        allMedia.forEach(media => this.createMediaWrapper(media));
    }
    
    createMediaWrapper(mediaElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'media-wrapper';
        wrapper.setAttribute('data-mode', this.settings.mediaMode);
        
        const originalSrc = mediaElement.src || mediaElement.getAttribute('data-src');
        const isVideo = mediaElement.tagName === 'VIDEO';
        
        // Store original element for mode switching
        wrapper._originalElement = mediaElement.cloneNode(true);
        wrapper._originalSrc = originalSrc;
        wrapper._isVideo = isVideo;
        
        // Create the current mode display
        this.updateMediaDisplay(wrapper);
        
        // Replace original element
        mediaElement.parentNode.insertBefore(wrapper, mediaElement);
        mediaElement.remove();
    }
    
    updateMediaDisplay(wrapper) {
        const mode = wrapper.getAttribute('data-mode') || this.settings.mediaMode;
        const isVideo = wrapper._isVideo;
        const src = wrapper._originalSrc;
        
        // Clear existing content
        wrapper.innerHTML = '';
        
        switch (mode) {
            case 'emoji':
                wrapper.innerHTML = this.createEmojiDisplay(isVideo);
                break;
            case 'ascii':
                wrapper.innerHTML = this.createAsciiDisplay(isVideo, src);
                break;
            case 'normal':
                wrapper.innerHTML = this.createNormalDisplay(wrapper._originalElement);
                break;
        }
        
        // Add click handler for mode cycling
        wrapper.addEventListener('click', () => this.cycleMediaItem(wrapper));
    }
    
    createEmojiDisplay(isVideo) {
        const emojis = {
            image: ['🖼️', '📸', '🎨', '🖥️', '📱'],
            video: ['📹', '🎬', '🎞️', '📺', '🔴']
        };
        
        const emojiSet = isVideo ? emojis.video : emojis.image;
        const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
        
        return `
            <div class="media-emoji-display">
                <div class="emoji-icon cyber-glow">${emoji}</div>
                <div class="media-label">${isVideo ? 'VIDEO' : 'IMAGE'}</div>
                <div class="mode-hint">CLICK TO CYCLE MODES</div>
            </div>
        `;
    }
    
    createAsciiDisplay(isVideo, src) {
        const placeholder = `
            <div class="media-ascii-display">
                <div class="ascii-content">
                    <div class="ascii-art loading">
                        ╔══════════════════════════════╗
                        ║  ░░░░░░ LOADING ASCII ░░░░░░  ║
                        ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
                        ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
                        ║  ░░░░░░░░ VIBE ░░░░░░░░░░░░░░  ║
                        ║  ░░░░░░░░ MODE ░░░░░░░░░░░░░░  ║
                        ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
                        ╚══════════════════════════════╝
                    </div>
                </div>
                <div class="media-label">ASCII ${isVideo ? 'VIDEO' : 'IMAGE'}</div>
            </div>
        `;
        
        // Convert to ASCII using built-in converter
        if (src) {
            setTimeout(() => this.convertToAscii(src, isVideo), 100);
        }
        
        return placeholder;
    }
    
    async convertToAscii(src, isVideo) {
        const conversionStart = performance.now();
        try {
            console.log('🎨 ProxyController.convertToAscii() // starting ASCII conversion:', {
                src: src?.substring(0, 100) || 'no-src',
                isVideo: isVideo,
                aalibAvailable: !!window.aalib
            });
            
            if (isVideo) {
                // For videos, create a simple ASCII frame representation
                const asciiFrame = this.generateVideoAsciiFrame();
                this.updateAsciiContent(asciiFrame);
                console.log(`✅ ProxyController.convertToAscii() // video ASCII generated: ${(performance.now() - conversionStart).toFixed(1)}ms`);
            } else {
                // For images, use the badass aalib.js library
                if (window.aalib) {
                    console.log('🎨 ProxyController.convertToAscii() // using aalib.js for image conversion...');
                    
                    window.aalib.read.image.fromURL(src)
                        .map(window.aalib.aa({ 
                            width: 80, 
                            height: 40, 
                            colored: false,
                            charset: window.aalib.charset.ASCII_CHARSET
                        }))
                        .map(window.aalib.render.html({ 
                            background: 'transparent',
                            fontFamily: 'VT323, Share Tech Mono, monospace',
                            fontSize: 12,
                            color: 'var(--secondary)'
                        }))
                        .subscribe({
                            next: (asciiElement) => {
                                console.log(`✅ ProxyController.convertToAscii() // aalib.js conversion successful: ${(performance.now() - conversionStart).toFixed(1)}ms`);
                                // Extract the text content from the HTML element
                                const asciiText = asciiElement.textContent || asciiElement.innerText;
                                this.updateAsciiContent(asciiText);
                            },
                            error: (error) => {
                                console.error('❌ ProxyController.convertToAscii() // aalib.js conversion failed:', {
                                    error: error.message,
                                    src: src?.substring(0, 100),
                                    conversionTime: (performance.now() - conversionStart).toFixed(1) + 'ms'
                                });
                                this.updateAsciiContent(this.getFallbackAscii(false));
                            }
                        });
                } else {
                    console.warn('⚠️ ProxyController.convertToAscii() // aalib.js not loaded, using fallback ASCII');
                    this.updateAsciiContent(this.getFallbackAscii(false));
                }
            }
        } catch (error) {
            console.error('❌ ProxyController.convertToAscii() // ASCII conversion failed:', {
                error: error.message,
                stack: error.stack,
                src: src?.substring(0, 100),
                isVideo: isVideo,
                conversionTime: (performance.now() - conversionStart).toFixed(1) + 'ms'
            });
            this.updateAsciiContent(this.getFallbackAscii(isVideo));
        }
    }
    
    
    generateVideoAsciiFrame() {
        return `
╔════════════════════════════════════════╗
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║  ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓  ║
║  ▓░███████████████████████████████░▓  ║
║  ▓░█                             █░▓  ║
║  ▓░█        ▶ CYBER VIDEO        █░▓  ║
║  ▓░█                             █░▓  ║
║  ▓░█   ░░░░░░░░░░░░░░░░░░░░░░░░   █░▓  ║
║  ▓░█   ░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░   █░▓  ║
║  ▓░█   ░▓                  ▓░   █░▓  ║
║  ▓░█   ░▓   VIBE  READER   ▓░   █░▓  ║
║  ▓░█   ░▓                  ▓░   █░▓  ║
║  ▓░█   ░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░   █░▓  ║
║  ▓░█   ░░░░░░░░░░░░░░░░░░░░░░░░   █░▓  ║
║  ▓░█                             █░▓  ║
║  ▓░███████████████████████████████░▓  ║
║  ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓  ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
╚════════════════════════════════════════╝
        `;
    }
    
    getFallbackAscii(isVideo) {
        if (isVideo) {
            return this.generateVideoAsciiFrame();
        } else {
            return `
╔══════════════════════════╗
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║  ▓░░░░░░░░░░░░░░░░░░░░▓  ║
║  ▓░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░▓  ║
║  ▓░▒                ▒░▓  ║
║  ▓░▒   CYBER IMAGE   ▒░▓  ║
║  ▓░▒                ▒░▓  ║
║  ▓░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░▓  ║
║  ▓░░░░░░░░░░░░░░░░░░░░▓  ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
╚══════════════════════════╝
            `;
        }
    }
    
    updateAsciiContent(asciiText) {
        // Find ASCII elements in the current page
        const asciiElements = this.container.querySelectorAll('.ascii-art, .ascii-content');
        console.log('Found ASCII elements:', asciiElements.length);
        
        asciiElements.forEach(el => {
            el.textContent = asciiText;
            el.classList.remove('loading');
            el.style.whiteSpace = 'pre';
            el.style.fontFamily = 'VT323, monospace';
        });
        
        // If no elements found, try updating media wrappers directly
        if (asciiElements.length === 0) {
            const mediaWrappers = this.container.querySelectorAll('.media-wrapper[data-mode="ascii"] .ascii-art');
            mediaWrappers.forEach(el => {
                el.textContent = asciiText;
                el.classList.remove('loading');
            });
        }
    }
    
    createNormalDisplay(originalElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'media-normal-display cyber-frame';
        
        const element = originalElement.cloneNode(true);
        element.classList.add('cyber-media', 'loaded');
        
        wrapper.appendChild(element);
        
        return wrapper.outerHTML;
    }
    
    cycleMediaItem(wrapper) {
        const modes = ['emoji', 'ascii', 'normal'];
        const currentMode = wrapper.getAttribute('data-mode') || this.settings.mediaMode;
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        
        // Add glitch transition
        wrapper.classList.add('media-transition');
        
        setTimeout(() => {
            wrapper.setAttribute('data-mode', nextMode);
            this.updateMediaDisplay(wrapper);
            wrapper.classList.remove('media-transition');
        }, 150);
    }
    
    cycleMediaMode() {
        const modes = ['emoji', 'ascii', 'normal'];
        const currentIndex = modes.indexOf(this.settings.mediaMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.settings.mediaMode = modes[nextIndex];
        
        // Update all media displays
        const mediaWrappers = this.container.querySelectorAll('.media-wrapper');
        mediaWrappers.forEach(wrapper => {
            wrapper.setAttribute('data-mode', this.settings.mediaMode);
            this.updateMediaDisplay(wrapper);
        });
        
        // Save setting
        browser.storage.sync.set({ vibeReaderSettings: this.settings });
        
        // Update media button text
        const mediaBtn = this.container.querySelector('.media-btn');
        if (mediaBtn) {
            const modeNames = { emoji: 'EMOJI', ascii: 'ASCII', normal: 'NORMAL' };
            mediaBtn.textContent = `📺 ${modeNames[this.settings.mediaMode]}`;
        }
    }
    
    processTables() {
        const tables = this.container.querySelectorAll('.article-content table');
        tables.forEach(table => {
            table.classList.add('cyber-table');
            
            // Check if table is complex
            const rows = table.querySelectorAll('tr').length;
            const cols = table.querySelectorAll('tr:first-child td, tr:first-child th').length;
            
            if (rows > 8 || cols > 6) {
                // Create collapsible wrapper for complex tables
                const wrapper = document.createElement('div');
                wrapper.className = 'table-wrapper complex-table';
                
                const placeholder = document.createElement('div');
                placeholder.className = 'table-placeholder';
                placeholder.innerHTML = `
                    <div class="placeholder-content">
                        <span class="placeholder-icon">📊</span>
                        <span class="placeholder-text">[ COMPLEX TABLE: ${rows} ROWS × ${cols} COLS - CLICK TO EXPAND ]</span>
                    </div>
                `;
                
                placeholder.addEventListener('click', () => {
                    wrapper.replaceChild(table, placeholder);
                    table.style.display = 'table';
                });
                
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(placeholder);
                table.remove();
            }
        });
    }
    
    updateTerminalsWithContent(metadata) {
        const leftTerminal = this.container.querySelector('#left-terminal');
        const rightTerminal = this.container.querySelector('#right-terminal');
        
        if (leftTerminal) {
            const lines = [
                '> EXTRACTION SUCCESSFUL',
                `> TITLE: ${(metadata.title || 'UNTITLED').substring(0, 30)}...`,
                `> FRAMEWORK: ${metadata.framework || 'VANILLA'}`,
                `> WORD COUNT: ${metadata.length || 0}`,
                `> READING TIME: ${this.calculateReadingTime(metadata.length || 0)} MIN`,
                '> ',
                '> CONTENT DISPLAYED'
            ];
            leftTerminal.innerHTML = lines.map(line => 
                `<div class="terminal-line">${line}</div>`
            ).join('');
        }
        
        if (rightTerminal) {
            const lines = [
                '> PROXY STATUS: CONNECTED',
                '> HIDDEN TAB: ACTIVE',
                `> SOURCE: ${new URL(metadata.url).hostname}`,
                '> EXTRACTION: COMPLETE',
                '> RENDERING: CYBERPUNK MODE',
                '> ',
                `> ${new Date().toLocaleTimeString()}`
            ];
            rightTerminal.innerHTML = lines.map(line => 
                `<div class="terminal-line">${line}</div>`
            ).join('');
        }
    }
    
    cycleTheme() {
        const themes = ['nightdrive', 'neon-surge', 'outrun-storm', 'strange-days'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.currentTheme = themes[nextIndex];
        
        this.applyTheme(this.currentTheme);
        
        // Save theme preference
        this.settings.theme = this.currentTheme;
        browser.storage.sync.set({ vibeReaderSettings: this.settings });
        
        // Update button texts
        this.updateButtonTexts();
    }
    
    applyTheme(themeName) {
        if (this.container) {
            this.container.setAttribute('data-theme', themeName);
        }
    }
    
    updateButtonTexts() {
        if (!this.container) return;
        
        // Update theme button - show palette emoji + theme name
        const themeBtn = this.container.querySelector('.theme-btn');
        if (themeBtn) {
            const themeNames = {
                'nightdrive': 'NIGHTDRIVE',
                'neon-surge': 'NEON SURGE', 
                'outrun-storm': 'OUTRUN STORM',
                'strange-days': 'STRANGE DAYS'
            };
            themeBtn.textContent = `🎨 ${themeNames[this.currentTheme]}`;
        }
        
        // Update media button - just emoji for minimal aesthetic
        const mediaBtn = this.container.querySelector('.media-btn');
        if (mediaBtn) {
            const modeEmojis = { emoji: '🖼️', ascii: '🎨', normal: '📸' };
            mediaBtn.textContent = modeEmojis[this.settings.mediaMode] || '📺';
        }
    }
    
    sendProxyCommand(command, data) {
        const commandStart = performance.now();
        try {
            console.log('🔗 ProxyController.sendProxyCommand() // sending proxy command:', {
                command: command,
                dataKeys: data ? Object.keys(data) : [],
                timestamp: new Date().toISOString()
            });
            
            browser.runtime.sendMessage({
                action: 'proxyCommand',
                command: command,
                data: data
            }).then(() => {
                console.log(`⏱️ ProxyController.sendProxyCommand() // command sent: ${(performance.now() - commandStart).toFixed(1)}ms`);
            }).catch(error => {
                console.error('❌ ProxyController.sendProxyCommand() // command failed:', {
                    error: error.message,
                    command: command,
                    commandTime: (performance.now() - commandStart).toFixed(1) + 'ms'
                });
            });
            
        } catch (error) {
            console.error('❌ ProxyController.sendProxyCommand() // proxy command failed:', {
                error: error.message,
                stack: error.stack,
                command: command,
                commandTime: (performance.now() - commandStart).toFixed(1) + 'ms'
            });
        }
    }
    
    requestDeactivation() {
        const requestStart = performance.now();
        try {
            console.log('⚡ ProxyController.requestDeactivation() // user requested deactivation');
            
            browser.runtime.sendMessage({ action: 'updateBadge', active: false }).catch(error => {
                console.error('❌ ProxyController.requestDeactivation() // failed to update badge:', error.message);
            });
            
            this.deactivate();
            
            console.log(`✅ ProxyController.requestDeactivation() // deactivation request complete: ${(performance.now() - requestStart).toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ ProxyController.requestDeactivation() // deactivation request failed:', {
                error: error.message,
                stack: error.stack,
                requestTime: (performance.now() - requestStart).toFixed(1) + 'ms'
            });
        }
    }
    
    deactivate() {
        const deactivateStart = performance.now();
        try {
            console.log('🔌 ProxyController.deactivate() // deactivating vibe mode...');
            
            if (this.container) {
                this.container.remove();
                console.log('🗑️ ProxyController.deactivate() // container removed');
            }
            
            // Restore original page
            document.body.style.overflow = this.originalBodyOverflow || '';
            document.documentElement.style.overflow = this.originalHtmlOverflow || '';
            
            const allElements = document.body.children;
            let restoredCount = 0;
            for (let el of allElements) {
                if (el.style.display === 'none') {
                    el.style.display = '';
                    restoredCount++;
                }
            }
            
            this.isActive = false;
            
            console.log(`✅ ProxyController.deactivate() // deactivation complete: ${(performance.now() - deactivateStart).toFixed(1)}ms, restored ${restoredCount} elements`);
            
        } catch (error) {
            console.error('❌ ProxyController.deactivate() // deactivation failed:', {
                error: error.message,
                stack: error.stack,
                deactivationTime: (performance.now() - deactivateStart).toFixed(1) + 'ms'
            });
        }
    }
    
    showError(message) {
        const errorStart = performance.now();
        try {
            console.error('❌ ProxyController.showError() // displaying error to user:', {
                message: message,
                timestamp: new Date().toISOString()
            });
            
            const mainContent = this.container?.querySelector('.vibe-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-display">
                        <div class="error-icon">⚠️</div>
                        <div class="error-title">EXTRACTION ERROR</div>
                        <div class="error-message">${this.escapeHtml(message)}</div>
                        <button class="vibe-btn retry-btn">RETRY EXTRACTION</button>
                    </div>
                `;
                
                const retryBtn = mainContent.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        console.log('🔄 ProxyController.showError() // user clicked retry, reloading page');
                        window.location.reload();
                    });
                }
                
                console.log(`⏱️ ProxyController.showError() // error display created: ${(performance.now() - errorStart).toFixed(1)}ms`);
            } else {
                console.error('❌ ProxyController.showError() // no container found to display error');
                // Fallback: show alert
                alert(`Vibe Reader Error: ${message}`);
            }
            
        } catch (error) {
            console.error('❌ ProxyController.showError() // failed to show error:', {
                originalMessage: message,
                error: error.message,
                stack: error.stack,
                errorTime: (performance.now() - errorStart).toFixed(1) + 'ms'
            });
            
            // Last resort fallback
            try {
                alert(`Critical Error: Failed to display error message. Original: ${message}`);
            } catch (alertError) {
                console.error('❌ ProxyController.showError() // even alert failed:', alertError.message);
            }
        }
    }
    
    handleHiddenTabClosed(error) {
        this.showError(error || 'Hidden tab was closed unexpectedly. Please refresh to try again.');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatWordCount(count) {
        return count > 1000 ? `${(count/1000).toFixed(1)}k words` : `${count} words`;
    }
    
    calculateReadingTime(wordCount) {
        return Math.max(1, Math.ceil(wordCount / 200));
    }
    
    initializeEffects() {
        // Start glitch effects on headings
        this.startGlitchEffects();
        
        // Create matrix rain if enabled
        if (this.settings.vibeRain) {
            this.createMatrixRain();
        }
        
        // Start terminal scrolling effects
        this.startTerminalEffects();
    }
    
    startGlitchEffects() {
        // Glitch effect for titles
        setInterval(() => {
            const glitchElements = this.container.querySelectorAll('.glitch');
            glitchElements.forEach(el => {
                if (Math.random() < 0.1) { // 10% chance
                    el.classList.add('glitching');
                    setTimeout(() => {
                        el.classList.remove('glitching');
                    }, 300);
                }
            });
        }, 2000);
    }
    
    createMatrixRain() {
        const rainContainer = this.container.querySelector('.vibe-rain-container');
        if (!rainContainer) return;
        
        const chars = '▓▒░|/\\-_=+*#%@01';
        const columns = Math.floor(window.innerWidth / 20);
        
        for (let i = 0; i < columns; i++) {
            const drop = document.createElement('div');
            drop.className = 'matrix-drop';
            drop.style.left = i * 20 + 'px';
            drop.style.animationDuration = (Math.random() * 3 + 1) + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            
            // Generate random characters
            let text = '';
            for (let j = 0; j < Math.floor(Math.random() * 10 + 5); j++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
            }
            drop.innerHTML = text;
            
            rainContainer.appendChild(drop);
        }
    }
    
    startTerminalEffects() {
        // Start updating terminals with live data
        setInterval(() => {
            this.updateLiveTerminals();
        }, 2000);
    }
    
    updateLiveTerminals() {
        if (!this.container) return;
        
        const leftTerminal = this.container.querySelector('#left-terminal');
        const rightTerminal = this.container.querySelector('#right-terminal');
        
        if (leftTerminal) {
            const lines = [
                '> VIBE READER v2.0 ACTIVE',
                `> CPU: ${Math.floor(Math.random() * 100)}% USAGE`,
                `> MEM: ${Math.floor(Math.random() * 100)}% ALLOC`,
                `> NET: ${Math.floor(Math.random() * 1000)}ms LATENCY`,
                `> STATUS: ${this.extractedContent ? 'CONTENT LOADED' : 'PROCESSING'}`,
                `> TIME: ${new Date().toLocaleTimeString()}`
            ];
            
            // Animate the terminal lines
            leftTerminal.innerHTML = lines.map((line, index) => 
                `<div class="terminal-line" style="animation-delay: ${index * 0.1}s">${line}</div>`
            ).join('');
        }
        
        if (rightTerminal) {
            const lines = [
                '> PROXY STATUS: CONNECTED',
                `> BANDWIDTH: ${Math.floor(Math.random() * 1000)}KB/s`,
                `> PACKETS: ${Math.floor(Math.random() * 10000)}`,
                `> ERRORS: ${Math.floor(Math.random() * 10)}`,
                `> UPTIME: ${Math.floor(Date.now() / 1000)}s`,
                `> SYNC: ${new Date().toLocaleTimeString()}`
            ];
            
            rightTerminal.innerHTML = lines.map((line, index) => 
                `<div class="terminal-line" style="animation-delay: ${index * 0.1}s">${line}</div>`
            ).join('');
        }
    }
}

// Initialize proxy controller (prevent multiple instances)
if (!window.vibeReaderProxyController) {
    window.vibeReaderProxyController = new ProxyController();
}