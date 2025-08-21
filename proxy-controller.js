// VibeReader v2.0 - Proxy Controller with Injection Guards
// Singleton pattern without unnecessary IIFE wrapper

// Prevent multiple injections with simple guard
if (window.__vibeReaderProxyController) {
    console.log('⚠️ ProxyController already exists, skipping');
} else {

    class ProxyController {
        constructor() {
            this.container = null;
            this.currentTheme = 'nightdrive';
            this.extractedContent = null;
            this.metadata = null;
            this.isActive = false;
            this.settings = {
                theme: 'nightdrive',
                mediaMode: 'emoji',
                sideScrolls: true,
                vibeRain: false,
                autoActivate: false
            };

            this.init();
        }

        init() {
            const initStart = performance.now();

            try {
                console.log('🎮 ProxyController.init() starting:', {
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                });

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
                    return { success: true, type: 'proxy' };

                case 'displayContent':
                    this.displayExtractedContent(request.content, request.metadata);
                    return { success: true };

                case 'extractionProgress':
                    this.showExtractionProgress(request.status, request.progress);
                    return { success: true };

                case 'deactivate':
                    this.deactivate();
                    return { success: true };

                case 'showError':
                    this.showError(request.error);
                    return { success: true };

                case 'hiddenTabClosed':
                    this.handleHiddenTabClosed(request.error);
                    return { success: true };

                case 'updateSettings':
                    this.updateSettings(request.settings);
                    return { success: true };

                case 'getStatus':
                    return { active: this.isActive };

                default:
                    console.warn('Unknown message action:', request.action);
                    return { success: false, error: 'Unknown action' };
            }
        }

        async loadSettings() {
            try {
                const response = await browser.runtime.sendMessage({
                    action: 'getSettings'
                });

                if (response && typeof response === 'object') {
                    this.settings = { ...this.settings, ...response };
                    this.currentTheme = this.settings.theme || 'nightdrive';
                }

                console.log('✅ Settings loaded:', this.settings);

            } catch (error) {
                console.error('❌ Failed to load settings:', error);
            }
        }

        updateSettings(newSettings) {
            this.settings = { ...this.settings, ...newSettings };
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
                action: 'saveSettings',
                settings: this.settings
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
                    action: 'updateBadge',
                    active: true
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
                            <button class="vibe-btn media-btn" title="Toggle Media Mode">🖼️</button>
                            <button class="vibe-btn theme-btn" title="Cycle Theme">🎨</button>
                            <button class="vibe-btn disconnect-btn" title="Disconnect">⚡</button>
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
                </div>
            `;
        }

        createLeftPanel() {
            return `
                <aside class="vibe-sidebar left-panel">
                    <div class="terminal-window">
                        <div class="terminal-header">
                            <span class="terminal-title">▓ SYSTEM ▓</span>
                        </div>
                        <div class="terminal-content" id="left-terminal">
                            <div class="terminal-line">> INITIALIZING...</div>
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
                            <span class="terminal-title">▓ NETWORK ▓</span>
                        </div>
                        <div class="terminal-content" id="right-terminal">
                            <div class="terminal-line">> CONNECTING...</div>
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
                    'initializing': 'Initializing extractor...',
                    'waiting_for_framework': 'Detecting framework...',
                    'extracting': 'Extracting content...',
                    'complete': 'Extraction complete!',
                    'error': 'Extraction error'
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
            images.forEach(img => this.createMediaWrapper(img));
        }

        createMediaWrapper(mediaElement) {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-wrapper';
            wrapper.setAttribute('data-mode', this.settings.mediaMode);

            wrapper._originalElement = mediaElement.cloneNode(true);
            wrapper._originalSrc = mediaElement.src || mediaElement.getAttribute('data-src');
            wrapper._isVideo = mediaElement.tagName === 'VIDEO';

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
            const label = isVideo ? 'ASCII VIDEO' : 'ASCII IMAGE';

            return `
                <div class="media-ascii-display">
                    <pre class="ascii-art">
╔════════════════╗
║  ░░░░░░░░░░░░  ║
║  ░░ ${label.padEnd(8)} ░░  ║
║  ░░░░░░░░░░░░  ║
╚════════════════╝
                    </pre>
                </div>
            `;
        }

        async convertToAscii(src, wrapper) {
            try {
                if (!window.aalib) {
                    console.warn('aalib not available');
                    return;
                }

                window.aalib.read.image.fromURL(src)
                    .map(window.aalib.aa({
                        width: 60,
                        height: 30,
                        colored: false
                    }))
                    .subscribe({
                        next: (result) => {
                            const asciiEl = wrapper.querySelector('.ascii-art');
                            if (asciiEl && result.textContent) {
                                asciiEl.textContent = result.textContent;
                            }
                        },
                        error: (err) => {
                            console.error('ASCII conversion failed:', err);
                        }
                    });

            } catch (error) {
                console.error('ASCII conversion error:', error);
            }
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
                leftTerminal.innerHTML = [
                    `> STATUS: ${status}`,
                    `> PROGRESS: ${progress}%`,
                    `> TIME: ${new Date().toLocaleTimeString()}`
                ].map(line => `<div class="terminal-line">${line}</div>`).join('');
            }

            if (rightTerminal) {
                rightTerminal.innerHTML = [
                    `> PROXY: ACTIVE`,
                    `> EXTRACTION: ${progress}%`,
                    `> MODE: ${this.currentTheme}`
                ].map(line => `<div class="terminal-line">${line}</div>`).join('');
            }
        }

        updateTerminalsWithContent(metadata) {
            const leftTerminal = this.container?.querySelector('#left-terminal');
            const rightTerminal = this.container?.querySelector('#right-terminal');

            if (leftTerminal) {
                leftTerminal.innerHTML = [
                    '> EXTRACTION: COMPLETE',
                    `> TITLE: ${(metadata?.title || 'UNTITLED').substring(0, 30)}`,
                    `> WORDS: ${metadata?.length || 0}`,
                    `> TIME: ${new Date().toLocaleTimeString()}`
                ].map(line => `<div class="terminal-line">${line}</div>`).join('');
            }

            if (rightTerminal) {
                rightTerminal.innerHTML = [
                    '> PROXY: CONNECTED',
                    `> SOURCE: ${metadata?.siteName || 'Unknown'}`,
                    `> FRAMEWORK: ${metadata?.framework || 'vanilla'}`,
                    '> STATUS: ACTIVE'
                ].map(line => `<div class="terminal-line">${line}</div>`).join('');
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
        }

        updateButtonTexts() {
            const themeBtn = this.container?.querySelector('.theme-btn');
            const mediaBtn = this.container?.querySelector('.media-btn');

            if (themeBtn) {
                const themeNames = {
                    'nightdrive': 'NIGHT',
                    'neon-surge': 'NEON',
                    'outrun-storm': 'OUTRUN',
                    'strange-days': 'STRANGE'
                };
                themeBtn.textContent = `🎨 ${themeNames[this.currentTheme]}`;
            }

            if (mediaBtn) {
                const modeEmojis = {
                    emoji: '🖼️',
                    ascii: '📟',
                    normal: '📸'
                };
                mediaBtn.textContent = modeEmojis[this.settings.mediaMode] || '🖼️';
            }
        }

        requestDeactivation() {
            browser.runtime.sendMessage({
                action: 'updateBadge',
                active: false
            }).catch(error => {
                console.error('Failed to update badge:', error);
            });

            this.deactivate();
        }

        deactivate() {
            try {
                console.log('🔌 Deactivating Vibe Mode');

                if (this.container) {
                    this.container.remove();
                    this.container = null;
                }

                if (this.originalState) {
                    document.body.style.overflow = this.originalState.bodyOverflow || '';
                    document.documentElement.style.overflow = this.originalState.htmlOverflow || '';

                    this.originalState.hiddenElements.forEach(({ element, display }) => {
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
            const content = this.container?.querySelector('.vibe-content');
            if (content) {
                content.innerHTML = `
                    <div class="error-display">
                        <div class="error-icon">⚠️</div>
                        <div class="error-title">ERROR</div>
                        <div class="error-message">${this.escapeHtml(message)}</div>
                        <button class="vibe-btn retry-btn">RETRY</button>
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
            return count > 1000 ? `${(count/1000).toFixed(1)}k` : count.toString();
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
                this.container?.querySelector('.vibe-reader-overlay')?.appendChild(rainContainer);
            }

            rainContainer.innerHTML = '';

            const chars = '▓▒░|/\\-_=+*#%@01';
            const columns = Math.floor(window.innerWidth / 20);

            for (let i = 0; i < columns; i++) {
                const drop = document.createElement('div');
                drop.className = 'matrix-drop';
                drop.style.left = `${i * 20}px`;
                drop.style.animationDuration = `${Math.random() * 3 + 1}s`;
                drop.style.animationDelay = `${Math.random() * 2}s`;

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

        updateLiveTerminals() {
            const leftTerminal = this.container?.querySelector('#left-terminal');
            const rightTerminal = this.container?.querySelector('#right-terminal');

            if (leftTerminal) {
                const status = this.extractedContent ? 'ACTIVE' : 'STANDBY';
                const memUsage = this.extractedContent ? Math.round(JSON.stringify(this.extractedContent).length / 1024) : 0;
                const elementCount = this.container ? this.container.querySelectorAll('*').length : 0;
                
                leftTerminal.innerHTML = [
                    '> VIBE READER v2.0',
                    `> STATUS: ${status}`,
                    `> CONTENT: ${memUsage}KB`,
                    `> ELEMENTS: ${elementCount}`,
                    `> TIME: ${new Date().toLocaleTimeString()}`
                ].map(line => `<div class="terminal-line">${line}</div>`).join('');
            }

            if (rightTerminal) {
                const hiddenTabStatus = this.extractedContent ? 'CONNECTED' : 'INITIALIZING';
                const wordCount = this.metadata?.length || 0;
                const readTime = Math.max(1, Math.ceil(wordCount / 200));
                const domain = new URL(window.location.href).hostname;
                
                rightTerminal.innerHTML = [
                    `> PROXY: ${hiddenTabStatus}`,
                    `> DOMAIN: ${domain.substring(0, 20)}`,
                    `> WORDS: ${wordCount}`,
                    `> READ: ${readTime}min`,
                    `> THEME: ${this.settings.theme?.toUpperCase() || 'NIGHTDRIVE'}`
                ].map(line => `<div class="terminal-line">${line}</div>`).join('');
            }
        }
    }

    // Create singleton instance
    window.__vibeReaderProxyController = new ProxyController();

    true;
}