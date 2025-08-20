// Matrix Reader v2.0 - Proxy Controller
// Manages the visible tab interface and proxy communication with hidden tab

class ProxyController {
    constructor() {
        this.container = null;
        this.currentTheme = 'nightdrive';
        this.extractedContent = null;
        this.metadata = null;
        this.isActive = false;
        this.settings = {
            theme: 'nightdrive',
            imagePreview: true,
            sideScrolls: true,
            matrixRain: false
        };
        this.init();
    }
    
    init() {
        // Listen for messages from background script
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });
        
        // Load settings
        this.loadSettings();
        
        // Start activation
        this.activate();
    }
    
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'displayContent':
                this.displayExtractedContent(request.content, request.metadata);
                sendResponse({ success: true });
                break;
                
            case 'extractionProgress':
                this.showExtractionProgress(request.status, request.progress);
                break;
                
            case 'deactivate':
                this.deactivate();
                sendResponse({ success: true });
                break;
                
            case 'showError':
                this.showError(request.error);
                break;
                
            case 'hiddenTabClosed':
                this.handleHiddenTabClosed(request.error);
                break;
                
            default:
                console.warn('Unknown message:', request);
        }
    }
    
    async loadSettings() {
        const result = await browser.storage.sync.get('matrixReaderSettings');
        if (result.matrixReaderSettings) {
            this.settings = { ...this.settings, ...result.matrixReaderSettings };
            this.currentTheme = this.settings.theme || 'nightdrive';
        }
    }
    
    activate() {
        this.isActive = true;
        
        // Hide original page content completely
        this.hideOriginalContent();
        
        // Create Matrix Reader interface
        this.createInterface();
        
        // Show loading state
        this.showExtractionProgress('initializing', 0);
        
        // Notify background script
        browser.runtime.sendMessage({ 
            action: 'updateBadge', 
            active: true 
        });
    }
    
    hideOriginalContent() {
        // Store original page state
        this.originalBodyOverflow = document.body.style.overflow;
        this.originalHtmlOverflow = document.documentElement.style.overflow;
        
        // Hide original content
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Hide all original page elements
        const allElements = document.body.children;
        for (let el of allElements) {
            if (!el.classList.contains('matrix-reader-container')) {
                el.style.display = 'none';
            }
        }
    }
    
    createInterface() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'matrix-reader-container matrix-reader-proxy';
        this.container.setAttribute('data-theme', this.currentTheme);
        
        // Create loading interface
        this.container.innerHTML = `
            <div class="matrix-reader-overlay">
                <div class="matrix-header">
                    <div class="matrix-header-left">
                        <span class="matrix-brand">▓▓ MATRIX READER v2.0 ▓▓</span>
                        <span class="matrix-status">[ HIDDEN TAB MODE ]</span>
                    </div>
                    <div class="matrix-header-right">
                        <button class="matrix-btn theme-btn" title="Cycle Theme">🎨 THEME</button>
                        <button class="matrix-btn disconnect-btn" title="Exit Matrix Mode">⚡ DISCONNECT</button>
                    </div>
                </div>
                
                <div class="matrix-layout">
                    ${this.settings.sideScrolls ? this.createSidePanels() : ''}
                    
                    <main class="matrix-content">
                        <div class="extraction-progress">
                            <div class="cyber-loader">
                                <div class="cyber-loader-bar"></div>
                            </div>
                            <div class="extraction-status">INITIALIZING STEALTH EXTRACTION...</div>
                            <div class="extraction-details">
                                <span class="progress-percent">0%</span>
                                <span class="progress-stage">Preparing hidden tab...</span>
                            </div>
                        </div>
                    </main>
                </div>
                
                ${this.settings.matrixRain ? '<div class="matrix-rain"></div>' : ''}
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Apply theme
        this.applyTheme(this.currentTheme);
    }
    
    createSidePanels() {
        return `
            <aside class="matrix-sidebar left-panel">
                <div class="terminal-window">
                    <div class="terminal-header">
                        <span class="terminal-title">▓ SYSTEM INFO ▓</span>
                        <div class="terminal-controls">
                            <span class="led-indicator active"></span>
                        </div>
                    </div>
                    <div class="terminal-content" id="left-terminal">
                        <div class="terminal-line">> MATRIX READER v2.0</div>
                        <div class="terminal-line">> HIDDEN TAB PROXY ACTIVE</div>
                        <div class="terminal-line">> EXTRACTION MODE: STEALTH</div>
                        <div class="terminal-line">> FRAMEWORK DETECTION: ON</div>
                        <div class="terminal-line">> </div>
                        <div class="terminal-line">> WAITING FOR CONTENT...</div>
                    </div>
                </div>
            </aside>
            
            <aside class="matrix-sidebar right-panel">
                <div class="terminal-window">
                    <div class="terminal-header">
                        <span class="terminal-title">▓ NETWORK STATUS ▓</span>
                        <div class="terminal-controls">
                            <span class="led-indicator active"></span>
                        </div>
                    </div>
                    <div class="terminal-content" id="right-terminal">
                        <div class="terminal-line">> PROXY CONNECTION: ACTIVE</div>
                        <div class="terminal-line">> HIDDEN TAB: LOADING</div>
                        <div class="terminal-line">> STEALTH MODE: ENGAGED</div>
                        <div class="terminal-line">> </div>
                        <div class="terminal-line">> EXTRACTING CONTENT...</div>
                    </div>
                </div>
            </aside>
        `;
    }
    
    setupEventHandlers() {
        // Theme button
        const themeBtn = this.container.querySelector('.theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.cycleTheme());
        }
        
        // Disconnect button
        const disconnectBtn = this.container.querySelector('.disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.requestDeactivation());
        }
        
        // Capture scroll events for proxy
        this.container.addEventListener('scroll', (e) => {
            if (this.extractedContent) {
                this.sendProxyCommand('scroll', {
                    scrollPosition: e.target.scrollTop
                });
            }
        });
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
            'initializing': 'INITIALIZING STEALTH EXTRACTION...',
            'waiting_for_framework': 'WAITING FOR FRAMEWORK HYDRATION...',
            'simulating_scroll': 'SIMULATING HUMAN INTERACTION...',
            'waiting_for_content': 'WAITING FOR DYNAMIC CONTENT...',
            'extracting': 'EXTRACTING CLEAN CONTENT...',
            'complete': 'EXTRACTION COMPLETE!',
            'error': 'EXTRACTION ERROR - RETRYING...'
        };
        
        const stageMessages = {
            'initializing': 'Creating hidden tab environment',
            'waiting_for_framework': 'Detecting React/Vue/Angular',
            'simulating_scroll': 'Triggering lazy-loaded content',
            'waiting_for_content': 'Ensuring content stability',
            'extracting': 'Processing with Readability.js',
            'complete': 'Ready to display',
            'error': 'Attempting fallback extraction'
        };
        
        if (statusText) {
            statusText.textContent = statusMessages[status] || 'PROCESSING...';
        }
        
        if (stageText) {
            stageText.textContent = stageMessages[status] || 'Working...';
        }
        
        // Update terminal panels
        this.updateTerminalStatus(status, progress);
    }
    
    updateTerminalStatus(status, progress) {
        const leftTerminal = this.container.querySelector('#left-terminal');
        const rightTerminal = this.container.querySelector('#right-terminal');
        
        if (leftTerminal) {
            const lines = [
                '> MATRIX READER v2.0',
                '> HIDDEN TAB PROXY ACTIVE',
                `> EXTRACTION PROGRESS: ${progress}%`,
                `> STATUS: ${status.toUpperCase()}`,
                '> ',
                `> ${new Date().toLocaleTimeString()}`
            ];
            leftTerminal.innerHTML = lines.map(line => 
                `<div class="terminal-line">${line}</div>`
            ).join('');
        }
        
        if (rightTerminal) {
            const lines = [
                '> PROXY CONNECTION: ACTIVE',
                `> HIDDEN TAB: ${status === 'complete' ? 'READY' : 'PROCESSING'}`,
                '> STEALTH MODE: ENGAGED',
                `> PROGRESS: ${'█'.repeat(Math.floor(progress/10))}${'░'.repeat(10-Math.floor(progress/10))}`,
                '> ',
                `> STAGE: ${status.replace(/_/g, ' ').toUpperCase()}`
            ];
            rightTerminal.innerHTML = lines.map(line => 
                `<div class="terminal-line">${line}</div>`
            ).join('');
        }
    }
    
    displayExtractedContent(content, metadata) {
        this.extractedContent = content;
        this.metadata = metadata;
        
        const mainContent = this.container.querySelector('.matrix-content');
        if (!mainContent) return;
        
        // Clear loading state
        mainContent.innerHTML = `
            <article class="matrix-article">
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
        this.updateTerminalsWithContent(metadata);
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
        const images = this.container.querySelectorAll('.article-content img');
        images.forEach(img => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = `
                <div class="placeholder-content">
                    <span class="placeholder-icon">📷</span>
                    <span class="placeholder-text">[ CLICK TO LOAD IMAGE ]</span>
                </div>
            `;
            
            placeholder.addEventListener('click', () => {
                wrapper.replaceChild(img, placeholder);
                img.classList.add('cyber-image', 'loaded');
            });
            
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(placeholder);
            img.remove();
        });
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
        const themes = ['nightdrive', 'neonsurge', 'outrunstorm', 'strangedays'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.currentTheme = themes[nextIndex];
        
        this.applyTheme(this.currentTheme);
        
        // Save theme preference
        this.settings.theme = this.currentTheme;
        browser.storage.sync.set({ matrixReaderSettings: this.settings });
    }
    
    applyTheme(themeName) {
        if (this.container) {
            this.container.setAttribute('data-theme', themeName);
        }
    }
    
    sendProxyCommand(command, data) {
        browser.runtime.sendMessage({
            action: 'proxyCommand',
            command: command,
            data: data
        });
    }
    
    requestDeactivation() {
        browser.runtime.sendMessage({ action: 'updateBadge', active: false });
        this.deactivate();
    }
    
    deactivate() {
        if (this.container) {
            this.container.remove();
        }
        
        // Restore original page
        document.body.style.overflow = this.originalBodyOverflow || '';
        document.documentElement.style.overflow = this.originalHtmlOverflow || '';
        
        const allElements = document.body.children;
        for (let el of allElements) {
            if (el.style.display === 'none') {
                el.style.display = '';
            }
        }
        
        this.isActive = false;
    }
    
    showError(message) {
        const mainContent = this.container.querySelector('.matrix-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-display">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">EXTRACTION ERROR</div>
                    <div class="error-message">${this.escapeHtml(message)}</div>
                    <button class="matrix-btn retry-btn">RETRY EXTRACTION</button>
                </div>
            `;
            
            const retryBtn = mainContent.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    window.location.reload();
                });
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
}

// Initialize proxy controller
new ProxyController();