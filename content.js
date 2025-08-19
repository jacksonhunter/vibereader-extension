// Matrix Reader - Main Content Script
// Transforms web pages into 90s retrofuture cyberpunk reader experiences

class MatrixReader {
    constructor() {
        this.isActive = false;
        this.originalContent = null;
        this.matrixContainer = null;
        this.sideScrollers = { left: null, right: null };
        this.imagePreview = null;
        
        // Settings
        this.settings = {
            theme: 'nightdrive',
            imagePreview: true,
            sideScrolls: true,
            matrixRain: false,
            autoActivate: false,
            retrofuture: true
        };
        
        this.init();
    }
    
    init() {
        // Load settings from storage
        this.loadSettings();
        
        // Listen for activation messages
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                this.toggle();
                sendResponse({ status: this.isActive });
            } else if (request.action === 'updateSettings') {
                this.settings = { ...this.settings, ...request.settings };
                this.saveSettings();
                if (this.isActive) {
                    this.refresh();
                }
            } else if (request.action === 'getStatus') {
                sendResponse({ active: this.isActive });
            }
        });
        
        // Auto-activate if enabled
        if (this.settings.autoActivate) {
            setTimeout(() => this.activate(), 1000);
        }
        
        // Keyboard shortcut (Ctrl+Shift+M)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
    
    activate() {
        if (this.isActive) return;
        
        console.log('🔥 Activating Matrix Reader Mode...');
        
        // Extract readable content using Readability
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();
        
        if (!article) {
            console.warn('Could not extract readable content');
            return;
        }
        
        // Store original content
        this.originalContent = {
            html: document.documentElement.innerHTML,
            title: document.title
        };
        
        // Transform the page into 90s retrofuture reader
        this.createRetrofutureLayout(article);
        this.isActive = true;
        
        // Initialize image preview system
        if (this.settings.imagePreview) {
            this.imagePreview = new ImagePreview();
        }
        
        // Update browser action badge
        browser.runtime.sendMessage({ action: 'updateBadge', active: true }).catch(() => {});
    }
    
    deactivate() {
        if (!this.isActive) return;
        
        console.log('🌙 Deactivating Matrix Reader Mode...');
        
        // Restore original content
        if (this.originalContent) {
            document.documentElement.innerHTML = this.originalContent.html;
            document.title = this.originalContent.title;
        }
        
        this.isActive = false;
        this.matrixContainer = null;
        this.sideScrollers = { left: null, right: null };
        
        // Destroy image preview
        if (this.imagePreview) {
            this.imagePreview.destroy();
            this.imagePreview = null;
        }
        
        // Update browser action badge
        browser.runtime.sendMessage({ action: 'updateBadge', active: false }).catch(() => {});
    }
    
    createRetrofutureLayout(article) {
        // Clear the page
        document.body.innerHTML = '';
        document.head.innerHTML = `
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Matrix Reader: ${article.title}</title>
        `;
        
        // Create main container
        this.matrixContainer = document.createElement('div');
        this.matrixContainer.className = 'retrofuture-reader-container';
        this.matrixContainer.setAttribute('data-theme', this.settings.theme);
        
        // Create layout structure
        const layout = this.createRetrofutureHTML(article);
        this.matrixContainer.innerHTML = layout;
        
        document.body.appendChild(this.matrixContainer);
        
        // Start side scrollers with 90s style data
        if (this.settings.sideScrolls) {
            this.initRetrofutureSideScrollers(article);
        }
        
        // Start matrix rain effect (optional)
        if (this.settings.matrixRain) {
            this.initMatrixRain();
        }
        
        // Add subtle glitch effects
        this.initRetrofutureEffects();
        
        // Initialize control panel buttons
        this.initRetrofutureControlPanel();
    }
    
    createRetrofutureHTML(article) {
        return `
            <div class="retrofuture-bg-effects"></div>
            
            <!-- 90s Style Header -->
            <header class="retrofuture-header">
                <div class="header-bar">
                    <div class="header-left">
                        <span class="logo">◢◣ CYBER READER ◤◥</span>
                        <span class="separator">|</span>
                        <span class="protocol">NEURO-LINK://</span>
                    </div>
                    <div class="header-right">
                        <span class="timestamp">${new Date().toISOString().replace('T', ' ').slice(0, 19)}</span>
                        <span class="status">ONLINE</span>
                    </div>
                </div>
                
                <div class="title-bar">
                    <h1 class="retrofuture-title">${this.escapeHtml(article.title)}</h1>
                    <div class="title-underline"></div>
                </div>
                
                <div class="meta-bar">
                    <span class="domain">[${window.location.hostname.toUpperCase()}]</span>
                    <span class="reading-stats">${this.calculateReadingTime(article.textContent)} MIN READ • ${article.textContent.split(' ').length} WORDS</span>
                    <span class="date">${new Date().toDateString().toUpperCase()}</span>
                </div>
            </header>
            
            <div class="retrofuture-layout">
                <!-- Left Terminal -->
                <aside class="terminal left-terminal">
                    <div class="terminal-header">
                        <span class="terminal-title">◢ SYSTEM INFO ◣</span>
                        <div class="terminal-controls">
                            <span class="led green"></span>
                            <span class="led yellow"></span>
                            <span class="led red"></span>
                        </div>
                    </div>
                    <div class="terminal-content" id="left-terminal-content">
                        <div class="terminal-output">
                            > INITIALIZING CYBER READER...
                            > NEURAL INTERFACE: ACTIVE
                            > DATA STREAM: CONNECTED
                            > PARSING DOCUMENT...
                        </div>
                    </div>
                </aside>
                
                <!-- Main Content -->
                <main class="retrofuture-main">
                    <article class="document-viewer">
                        ${this.processRetrofutureContent(article.content)}
                    </article>
                </main>
                
                <!-- Right Terminal -->
                <aside class="terminal right-terminal">
                    <div class="terminal-header">
                        <span class="terminal-title">◢ NET STATUS ◣</span>
                        <div class="terminal-controls">
                            <span class="led green"></span>
                            <span class="led yellow"></span>
                            <span class="led red"></span>
                        </div>
                    </div>
                    <div class="terminal-content" id="right-terminal-content">
                        <div class="terminal-output">
                            > BANDWIDTH: UNLIMITED
                            > ENCRYPTION: QUANTUM
                            > FIREWALL: IMPENETRABLE
                            > AI ASSIST: MONITORING
                        </div>
                    </div>
                </aside>
            </div>
            
            <!-- Control Panel -->
            <div class="retrofuture-controls">
                <button class="control-btn exit-btn" id="exit-reader" title="Exit Reader (Ctrl+Shift+M)">
                    <span class="btn-icon">⚡</span>
                    <span class="btn-text">DISCONNECT</span>
                </button>
                <button class="control-btn theme-btn" id="theme-cycle" title="Cycle Theme">
                    <span class="btn-icon">🎨</span>
                    <span class="btn-text">THEME</span>
                </button>
                <button class="control-btn preview-btn" id="toggle-preview" title="Toggle Image Preview">
                    <span class="btn-icon">👁️</span>
                    <span class="btn-text">PREVIEW</span>
                </button>
            </div>
        `;
    }
    
    processRetrofutureContent(htmlContent) {
        // Convert HTML to 90s retrofuture format
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Process headings with 90s style
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.classList.add('retrofuture-heading');
            const level = parseInt(heading.tagName.substring(1));
            heading.setAttribute('data-level', level);
            
            // Add decorative elements
            const decorator = document.createElement('span');
            decorator.className = 'heading-decorator';
            decorator.textContent = '◢◣'.repeat(Math.max(1, 4 - level));
            heading.prepend(decorator);
        });
        
        // Process paragraphs
        const paragraphs = tempDiv.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.classList.add('retrofuture-paragraph');
        });
        
        // Process links with cyberpunk style
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            link.classList.add('retrofuture-link');
            if (link.href) {
                link.setAttribute('data-original-href', link.href);
                link.innerHTML = `<span class="link-bracket">[</span>${link.textContent}<span class="link-bracket">]</span>`;
            }
        });
        
        // Process images with preview placeholders
        const images = tempDiv.querySelectorAll('img');
        images.forEach(img => {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.setAttribute('data-src', img.src);
            placeholder.setAttribute('data-alt', img.alt || 'Image');
            placeholder.innerHTML = `
                <div class="image-icon">📸</div>
                <div class="image-info">
                    <div class="image-filename">${this.extractFilename(img.src)}</div>
                    <div class="image-hover-hint">HOVER TO PREVIEW</div>
                </div>
            `;
            img.parentNode.replaceChild(placeholder, img);
        });
        
        // Process lists
        const lists = tempDiv.querySelectorAll('ul, ol');
        lists.forEach(list => {
            list.classList.add('retrofuture-list');
        });
        
        // Process code blocks
        const codeBlocks = tempDiv.querySelectorAll('pre, code');
        codeBlocks.forEach(code => {
            code.classList.add('retrofuture-code');
        });
        
        return tempDiv.innerHTML;
    }
    
    processContent(htmlContent) {
        // Convert HTML to a more matrix-friendly format
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Process headings
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.classList.add('matrix-heading', 'glitch');
            heading.setAttribute('data-text', heading.textContent);
        });
        
        // Process paragraphs
        const paragraphs = tempDiv.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.classList.add('matrix-paragraph');
        });
        
        // Process links
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            link.classList.add('matrix-link');
            if (link.href) {
                link.setAttribute('data-original-href', link.href);
                link.innerHTML = `🔗 ${link.textContent} <span class="link-preview">[${this.getDomain(link.href)}]</span>`;
            }
        });
        
        // Process lists
        const lists = tempDiv.querySelectorAll('ul, ol');
        lists.forEach(list => {
            list.classList.add('matrix-list');
        });
        
        // Process code blocks
        const codeBlocks = tempDiv.querySelectorAll('pre, code');
        codeBlocks.forEach(code => {
            code.classList.add('matrix-code');
        });
        
        // Process images (placeholder for ASCII conversion)
        const images = tempDiv.querySelectorAll('img');
        images.forEach(img => {
            const placeholder = document.createElement('div');
            placeholder.className = 'ascii-image-placeholder';
            placeholder.setAttribute('data-original-src', img.src);
            placeholder.setAttribute('data-alt', img.alt || 'Image');
            placeholder.innerHTML = `
                <div class="ascii-converting">
                    🎭 CONVERTING TO ASCII ART...
                    <div class="loading-bar"><div class="loading-progress"></div></div>
                </div>
            `;
            img.parentNode.replaceChild(placeholder, img);
        });
        
        return tempDiv.innerHTML;
    }
    
    convertImagesToASCII() {
        const placeholders = document.querySelectorAll('.ascii-image-placeholder');
        
        placeholders.forEach(async (placeholder, index) => {
            const src = placeholder.getAttribute('data-original-src');
            const alt = placeholder.getAttribute('data-alt');
            
            if (!src) return;
            
            try {
                // Simulate ASCII conversion process
                setTimeout(() => {
                    const asciiArt = this.generatePlaceholderASCII(alt);
                    placeholder.innerHTML = `
                        <div class="ascii-image">
                            <div class="ascii-art">${asciiArt}</div>
                            <div class="ascii-caption">📸 ${alt}</div>
                            <div class="ascii-source">Source: ${this.getDomain(src)}</div>
                        </div>
                    `;
                }, (index + 1) * 500);
            } catch (error) {
                console.error('ASCII conversion failed:', error);
                placeholder.innerHTML = `
                    <div class="ascii-error">
                        🚫 ASCII CONVERSION FAILED
                        <div class="error-details">📸 ${alt}</div>
                    </div>
                `;
            }
        });
    }
    
    generatePlaceholderASCII(text) {
        // Generate simple ASCII art placeholder
        const emoji = this.getRandomEmoji();
        const size = Math.random() > 0.5 ? 'large' : 'medium';
        
        return `
            <div class="emoji-ascii ${size}">
                ${emoji}
            </div>
            <div class="ascii-text">
                ${text.toUpperCase().slice(0, 20)}
            </div>
        `;
    }
    
    getRandomEmoji() {
        const emojis = [
            '🚀', '⚡', '🔥', '💾', '🎮', '👾', '🤖', '🛸', 
            '🌟', '💎', '🔮', '⚔️', '🏆', '🎯', '🎪', '🎭',
            '🎨', '🎸', '🎺', '🎹', '🎤', '📱', '💻', '⌨️',
            '🖥️', '📡', '🔊', '📺', '📷', '🎬', '🎞️', '💿'
        ];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    initSideScrollers(article) {
        this.populateLeftScroller(article);
        this.populateRightScroller(article);
        this.startScrollAnimation();
    }
    
    populateLeftScroller(article) {
        const leftContent = document.getElementById('left-scroll-content');
        const metadataStream = leftContent.querySelector('.metadata-stream');
        
        const metadata = [
            `URL: ${window.location.href}`,
            `DOMAIN: ${window.location.hostname}`,
            `PROTOCOL: ${window.location.protocol}`,
            `TITLE: ${article.title}`,
            `AUTHOR: ${article.byline || 'UNKNOWN'}`,
            `LENGTH: ${article.length} chars`,
            `WORDS: ${article.textContent.split(' ').length}`,
            `PARAGRAPHS: ${article.content.split('</p>').length}`,
            `EXTRACTION_TIME: ${new Date().toISOString()}`,
            `USER_AGENT: ${navigator.userAgent}`,
            `VIEWPORT: ${window.innerWidth}x${window.innerHeight}`,
            `TIMESTAMP: ${Date.now()}`,
            '--- SCANNING ELEMENTS ---',
            ...this.extractPageElements()
        ];
        
        metadata.forEach((item, index) => {
            const line = document.createElement('div');
            line.className = 'metadata-line';
            line.style.animationDelay = `${index * 0.1}s`;
            line.textContent = item;
            metadataStream.appendChild(line);
        });
    }
    
    populateRightScroller(article) {
        const rightContent = document.getElementById('right-scroll-content');
        const extractionLog = rightContent.querySelector('.extraction-log');
        
        const logEntries = [
            'INITIALIZING MATRIX READER...',
            'CONNECTING TO CYBERNET...',
            'SCANNING DOCUMENT STRUCTURE...',
            'EXTRACTING READABLE CONTENT...',
            'PROCESSING TEXT NODES...',
            'ANALYZING SEMANTIC MARKUP...',
            'CONVERTING IMAGES TO ASCII...',
            'APPLYING SYNTHWAVE FILTERS...',
            'GENERATING MATRIX LAYOUT...',
            'ACTIVATING NEON EFFECTS...',
            'STARTING SIDE SCROLLERS...',
            'INITIALIZING GLITCH SYSTEM...',
            'SYSTEM STATUS: FULLY OPERATIONAL',
            '--- LIVE FEED ---',
            ...this.generateLiveFeed()
        ];
        
        logEntries.forEach((entry, index) => {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.style.animationDelay = `${index * 0.2}s`;
            line.innerHTML = `<span class="log-prefix">&gt;</span> ${entry}`;
            extractionLog.appendChild(line);
        });
    }
    
    extractPageElements() {
        const elements = [];
        const tags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'img', 'a', 'button'];
        
        tags.forEach(tag => {
            const count = document.querySelectorAll(tag).length;
            if (count > 0) {
                elements.push(`${tag.toUpperCase()}: ${count} elements`);
            }
        });
        
        return elements;
    }
    
    generateLiveFeed() {
        const feeds = [
            'NEURAL NETWORK: ACTIVE',
            'DATA STREAMS: FLOWING',
            'SECURITY PROTOCOLS: ENGAGED',
            'QUANTUM ENCRYPTION: ONLINE',
            'MATRIX INTEGRITY: 99.7%',
            'CYBERDECK CONNECTION: STABLE',
            'FIREWALL STATUS: IMPENETRABLE',
            'AI ASSIST: MONITORING',
            'PACKET LOSS: 0.01%',
            'BANDWIDTH: UNLIMITED'
        ];
        
        return feeds;
    }
    
    startScrollAnimation() {
        // Auto-scroll side panels
        setInterval(() => {
            const leftScroller = document.querySelector('.left-scroller .scroller-content');
            const rightScroller = document.querySelector('.right-scroller .scroller-content');
            
            if (leftScroller) {
                leftScroller.scrollTop += 1;
                if (leftScroller.scrollTop >= leftScroller.scrollHeight - leftScroller.clientHeight) {
                    leftScroller.scrollTop = 0;
                }
            }
            
            if (rightScroller) {
                rightScroller.scrollTop += 1.5;
                if (rightScroller.scrollTop >= rightScroller.scrollHeight - rightScroller.clientHeight) {
                    rightScroller.scrollTop = 0;
                }
            }
        }, 50);
    }
    
    initMatrixRain() {
        const container = document.querySelector('.matrix-rain-container');
        if (!container) return;
        
        // Create matrix rain effect
        for (let i = 0; i < 20; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-rain-column';
            column.style.left = `${(i / 20) * 100}%`;
            column.style.animationDelay = `${Math.random() * 5}s`;
            column.style.animationDuration = `${3 + Math.random() * 4}s`;
            
            const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            for (let j = 0; j < 20; j++) {
                const char = document.createElement('span');
                char.textContent = characters[Math.floor(Math.random() * characters.length)];
                char.style.opacity = Math.random();
                column.appendChild(char);
            }
            
            container.appendChild(column);
        }
    }
    
    initRetrofutureSideScrollers(article) {
        // Populate left terminal with system info
        const leftTerminal = document.getElementById('left-terminal-content');
        if (leftTerminal) {
            const terminalOutput = leftTerminal.querySelector('.terminal-output');
            const systemInfo = [
                '> NEURAL INTERFACE: ACTIVE',
                '> DATA STREAM: CONNECTED', 
                '> PARSING DOCUMENT...',
                `> TITLE: ${article.title.slice(0, 30)}...`,
                `> DOMAIN: ${window.location.hostname}`,
                `> WORDS: ${article.textContent.split(' ').length}`,
                `> READING TIME: ${this.calculateReadingTime(article.textContent)} MIN`,
                '> SYSTEM STATUS: OPERATIONAL'
            ];
            
            systemInfo.forEach((line, index) => {
                setTimeout(() => {
                    const lineEl = document.createElement('div');
                    lineEl.textContent = line;
                    terminalOutput.appendChild(lineEl);
                }, index * 200);
            });
        }
        
        // Populate right terminal with net status
        const rightTerminal = document.getElementById('right-terminal-content');
        if (rightTerminal) {
            const terminalOutput = rightTerminal.querySelector('.terminal-output');
            const netStatus = [
                '> BANDWIDTH: UNLIMITED',
                '> ENCRYPTION: QUANTUM',
                '> FIREWALL: IMPENETRABLE',
                '> AI ASSIST: MONITORING',
                '> PACKET LOSS: 0.01%',
                '> CONNECTION: STABLE',
                '> SECURITY: MAXIMUM',
                '> STATUS: ONLINE'
            ];
            
            netStatus.forEach((line, index) => {
                setTimeout(() => {
                    const lineEl = document.createElement('div');
                    lineEl.textContent = line;
                    terminalOutput.appendChild(lineEl);
                }, index * 250);
            });
        }
    }

    initRetrofutureEffects() {
        // Add subtle scan lines and glow effects
        const container = this.matrixContainer;
        if (container) {
            container.classList.add('active-effects');
        }
        
        // Random glitch effects on headings
        const headings = document.querySelectorAll('.retrofuture-heading');
        headings.forEach(heading => {
            setInterval(() => {
                if (Math.random() < 0.05) { // 5% chance
                    heading.style.textShadow = '2px 0 #f92672, -2px 0 #66d9ef';
                    setTimeout(() => {
                        heading.style.textShadow = '';
                    }, 100);
                }
            }, 3000);
        });
    }

    initRetrofutureControlPanel() {
        // Exit button
        const exitBtn = document.getElementById('exit-reader');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.deactivate();
            });
        }
        
        // Theme cycle button
        const themeBtn = document.getElementById('theme-cycle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.cycleTheme();
            });
        }
        
        // Preview toggle button
        const previewBtn = document.getElementById('toggle-preview');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.settings.imagePreview = !this.settings.imagePreview;
                this.saveSettings();
                
                const btnText = previewBtn.querySelector('.btn-text');
                if (btnText) {
                    btnText.textContent = this.settings.imagePreview ? 'PREVIEW ON' : 'PREVIEW OFF';
                }
                
                // Toggle image preview system
                if (this.settings.imagePreview && !this.imagePreview) {
                    this.imagePreview = new ImagePreview();
                } else if (!this.settings.imagePreview && this.imagePreview) {
                    this.imagePreview.destroy();
                    this.imagePreview = null;
                }
            });
        }
    }

    initGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch');
        
        glitchElements.forEach(element => {
            setInterval(() => {
                if (Math.random() < 0.1) { // 10% chance
                    element.classList.add('glitching');
                    setTimeout(() => {
                        element.classList.remove('glitching');
                    }, 200 + Math.random() * 300);
                }
            }, 2000 + Math.random() * 3000);
        });
    }
    
    initControlPanel() {
        document.getElementById('exit-matrix')?.addEventListener('click', () => {
            this.deactivate();
        });
        
        document.getElementById('theme-cycle')?.addEventListener('click', () => {
            this.cycleTheme();
        });
        
        document.getElementById('toggle-rain')?.addEventListener('click', () => {
            this.toggleMatrixRain();
        });
    }
    
    cycleTheme() {
        const themes = ['nightdrive', 'neon-surge', 'outrun-storm', 'strange-days'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.settings.theme = themes[nextIndex];
        
        if (this.matrixContainer) {
            this.matrixContainer.setAttribute('data-theme', this.settings.theme);
        }
        
        this.saveSettings();
    }
    
    toggleMatrixRain() {
        this.settings.matrixRain = !this.settings.matrixRain;
        const rainContainer = document.querySelector('.matrix-rain-container');
        
        if (rainContainer) {
            rainContainer.style.display = this.settings.matrixRain ? 'block' : 'none';
        }
        
        this.saveSettings();
    }
    
    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    extractFilename(url) {
        try {
            return url.split('/').pop().split('?')[0] || 'image';
        } catch {
            return 'image';
        }
    }
    
    getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }
    
    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const words = text.split(' ').length;
        return Math.ceil(words / wordsPerMinute);
    }
    
    async loadSettings() {
        try {
            const result = await browser.storage.sync.get('matrixReaderSettings');
            if (result.matrixReaderSettings) {
                this.settings = { ...this.settings, ...result.matrixReaderSettings };
            }
        } catch (error) {
            console.log('Settings load failed, using defaults:', error);
        }
    }
    
    async saveSettings() {
        try {
            await browser.storage.sync.set({ matrixReaderSettings: this.settings });
        } catch (error) {
            console.log('Settings save failed:', error);
        }
    }
    
    refresh() {
        if (this.isActive) {
            this.deactivate();
            setTimeout(() => this.activate(), 100);
        }
    }
}

// ASCII Converter Class (placeholder for now)
class ASCIIConverter {
    constructor() {
        this.characters = '@%#*+=-:. ';
    }
    
    convert(imageElement) {
        // This will be implemented with actual image-to-ASCII conversion
        return this.generatePlaceholder();
    }
    
    generatePlaceholder() {
        return `
            ░░░░░░░░░░░░░░░░░░░░
            ░░██████████████░░░░
            ░░██░░░░░░░░░░██░░░░
            ░░██░░████░░░░██░░░░
            ░░██░░████░░░░██░░░░
            ░░██░░░░░░░░░░██░░░░
            ░░██████████████░░░░
            ░░░░░░░░░░░░░░░░░░░░
        `;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MatrixReader();
    });
} else {
    new MatrixReader();
}