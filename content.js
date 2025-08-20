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
        
        console.log('🔥 Activating VibeReader Mode...');
        this.activateWithContent();
    }
    
    activateWithContent() {
        if (this.isActive) return;
        
        console.log('🔥 VibeReader activating with content...');
        
        // Extract readable content using Readability
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();
        
        if (!article) {
            console.warn('Could not extract readable content');
            // Show error overlay instead of failing silently
            this.showErrorOverlay('Could not extract readable content from this page');
            return;
        }
        
        // Store article data (no need to store or31iginal DOM anymore)
        this.currentArticle = article;
        
        // Create overlay with retrofuture reader (non-destructive)
        this.createRetrofutureOverlay(article);
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
        
        console.log('🌙 Deactivating VibeReader Mode...');
        
        // Hide the overlay (non-destructive)
        if (this.matrixContainer) {
            this.matrixContainer.remove();
        }
        
        // Stop monitoring dynamic content
        this.stopDynamicContentMonitor();
        
        // Restore hidden page elements
        this.restorePageElements();
        
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
    
    createRetrofutureOverlay(article) {
        // Create fullscreen overlay container (non-destructive)
        this.matrixContainer = document.createElement('div');
        this.matrixContainer.className = 'retrofuture-reader-overlay';
        this.matrixContainer.setAttribute('data-theme', this.settings.theme);
        
        // Add overlay styles for fullscreen coverage with maximum isolation
        this.matrixContainer.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 2147483647 !important;
            background: #000 !important;
            overflow: auto !important;
            font-family: 'Courier New', monospace !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            transform: none !important;
            clip: none !important;
            isolation: isolate !important;
        `;
        
        // Hide problematic page elements that might interfere
        this.hidePageElements();
        
        // Create layout structure
        const layout = this.createRetrofutureHTML(article);
        this.matrixContainer.innerHTML = layout;
        
        // Append to body (overlay, don't replace)
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
        
        // Start monitoring for dynamic content changes
        this.initDynamicContentMonitor();
    }
    
    showErrorOverlay(message) {
        // Create error overlay for failed extraction
        this.matrixContainer = document.createElement('div');
        this.matrixContainer.className = 'retrofuture-error-overlay';
        this.matrixContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999999;
            background: #000;
            color: #ff1493;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            text-align: center;
        `;
        
        this.matrixContainer.innerHTML = `
            <div style="border: 2px solid #ff1493; padding: 40px; border-radius: 10px; background: rgba(255, 20, 147, 0.1);">
                <h1 style="color: #ff1493; margin-bottom: 20px;">⚠️ EXTRACTION FAILED</h1>
                <p style="margin-bottom: 30px;">${message}</p>
                <p style="font-size: 14px; opacity: 0.8;">This page may have dynamic content that hasn't loaded yet.</p>
                <button id="retry-extraction" style="
                    background: #ff1493;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    margin: 10px;
                    border-radius: 5px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    cursor: pointer;
                ">RETRY</button>
                <button id="close-error" style="
                    background: transparent;
                    color: #ff1493;
                    border: 2px solid #ff1493;
                    padding: 10px 20px;
                    margin: 10px;
                    border-radius: 5px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    cursor: pointer;
                ">CLOSE</button>
            </div>
        `;
        
        document.body.appendChild(this.matrixContainer);
        
        // Add event listeners
        document.getElementById('retry-extraction')?.addEventListener('click', () => {
            this.matrixContainer.remove();
            this.matrixContainer = null;
            setTimeout(() => this.activate(), 500); // Retry after short delay
        });
        
        document.getElementById('close-error')?.addEventListener('click', () => {
            this.deactivate();
        });
        
        this.isActive = true; // Mark as active so deactivate() works
    }
    
    createRetrofutureHTML(article) {
        return `
            <div class="retrofuture-bg-effects"></div>
            
            <!-- 90s Style Header -->
            <header class="retrofuture-header">
                <div class="header-bar">
                    <div class="header-left">
                        <span class="logo">◢◣ VIBE READER ◤◥</span>
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
                <button class="control-btn preview-btn" id="toggle-preview" title="Inline Load All Media">
                    <span class="btn-icon">📥</span>
                    <span class="btn-text">LOAD ALL</span>
                </button>
                <button class="control-btn save-btn" id="save-content" title="Save Content as HTML/Markdown">
                    <span class="btn-icon">💾</span>
                    <span class="btn-text">SAVE</span>
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
        
        // Process videos with preview placeholders
        const videos = tempDiv.querySelectorAll('video');
        videos.forEach(video => {
            const placeholder = document.createElement('div');
            placeholder.className = 'video-placeholder';
            placeholder.setAttribute('data-src', video.src);
            placeholder.setAttribute('data-controls', video.controls ? 'true' : 'false');
            placeholder.setAttribute('data-alt', video.title || 'Video');
            placeholder.innerHTML = `
                <div class="video-icon">🎬</div>
                <div class="video-info">
                    <div class="video-filename">${this.extractFilename(video.src)}</div>
                    <div class="video-hover-hint">CLICK TO LOAD VIDEO</div>
                </div>
            `;
            video.parentNode.replaceChild(placeholder, video);
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
        
        // Process tables with placeholder system (for complex tables)
        const tables = tempDiv.querySelectorAll('table');
        tables.forEach((table, index) => {
            if (this.shouldCreateTablePlaceholder(table)) {
                // Complex tables get placeholders (like images)
                const placeholder = this.createTablePlaceholder(table, index);
                table.parentNode.replaceChild(placeholder, table);
            } else {
                // Simple tables get basic retrofuture styling
                table.classList.add('retrofuture-table', 'simple-table');
                
                // Style headers
                const headers = table.querySelectorAll('th');
                headers.forEach(th => th.classList.add('retrofuture-th'));
                
                // Style rows and cells
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => row.classList.add('retrofuture-tr'));
                
                const cells = table.querySelectorAll('td');
                cells.forEach(td => td.classList.add('retrofuture-td'));
            }
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
        const exitBtn = document.getElementById('exit-reader');
        const themeBtn = document.getElementById('theme-cycle');
        const previewBtn = document.getElementById('toggle-preview');
        const saveBtn = document.getElementById('save-content');
        
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.deactivate();
            });
        }
        
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.cycleTheme();
            });
        }
        
        if (previewBtn) {
            // Change preview button to inline load all media instead of toggling previews
            previewBtn.addEventListener('click', () => {
                const btnText = previewBtn.querySelector('.btn-text');
                const btnIcon = previewBtn.querySelector('.btn-icon');
                
                // Show loading state
                if (btnText && btnIcon) {
                    btnText.textContent = 'LOADING...';
                    btnIcon.textContent = '⏳';
                    previewBtn.disabled = true;
                }
                
                // Load media and update button based on results
                const loadedCount = this.inlineLoadAllMedia();
                
                setTimeout(() => {
                    if (btnText && btnIcon) {
                        if (loadedCount > 0) {
                            btnText.textContent = `LOADED ${loadedCount}`;
                            btnIcon.textContent = '✅';
                        } else {
                            btnText.textContent = 'NO MEDIA';
                            btnIcon.textContent = '📭';
                        }
                        previewBtn.disabled = false;
                    }
                }, 1000); // Give time for media to load
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveContent();
            });
        }
    }

    // New method to inline load all images and videos
    inlineLoadAllMedia() {
        console.log('🖼️ Inline loading all media...');
        
        // Find all media elements in the content
        const contentArea = document.querySelector('.document-viewer');
        if (!contentArea) return 0;
        
        // Handle images
        const imageCount = this.inlineLoadImages(contentArea);
        
        // Handle videos  
        const videoCount = this.inlineLoadVideos(contentArea);
        
        const totalLoaded = imageCount + videoCount;
        console.log(`✅ Loaded ${totalLoaded} media items inline`);
        return totalLoaded;
    }

    inlineLoadImages(container) {
        console.log('🔍 Looking for images to load...');
        let loadedCount = 0;
        
        // Find Matrix Reader image placeholders
        const imagePlaceholders = container.querySelectorAll('.image-placeholder');
        console.log(`Found ${imagePlaceholders.length} image placeholders`);
        
        // Convert placeholders to actual images
        imagePlaceholders.forEach(placeholder => {
            const src = placeholder.getAttribute('data-src');
            const alt = placeholder.getAttribute('data-alt') || 'Inline loaded image';
            
            if (src) {
                console.log(`Loading image: ${src}`);
                
                // Create actual img element
                const img = document.createElement('img');
                img.src = src;
                img.alt = alt;
                
                // Create container for the image with info
                const container = document.createElement('div');
                container.className = 'inline-loaded-image';
                container.innerHTML = `
                    <div style="color: #ff1493; font-size: 12px; margin-bottom: 10px;">
                        📸 LOADED: ${this.extractFilename(src)}
                    </div>
                `;
                container.appendChild(img);
                
                // Replace placeholder with actual image
                placeholder.parentNode.replaceChild(container, placeholder);
                
                // Apply retrofuture styling
                this.enhanceInlineImage(img);
                loadedCount++;
            }
        });
        
        // Also look for regular image links that weren't processed
        const imageLinks = container.querySelectorAll('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".webp"], a[href$=".bmp"], a[href$=".svg"]');
        console.log(`Found ${imageLinks.length} image links`);
        
        imageLinks.forEach(link => {
            this.convertLinkToInlineImage(link);
            loadedCount++;
        });
        
        console.log(`Loaded ${loadedCount} images`);
        return loadedCount;
    }

    enhanceInlineImage(img) {
        // Add retrofuture styling to inline images
    img.style.cssText += `
        max-width: 100%;
        height: auto;
        border: 2px solid #ff1493;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
        margin: 20px 0;
        display: block;
        background: rgba(0, 0, 0, 0.8);
        padding: 10px;
    `;
    
    // Add loading indicator while image loads
    if (!img.complete) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'inline-image-loading';
        loadingDiv.innerHTML = `
            <div style="color: #00ffff; text-align: center; padding: 20px;">
                <div class="loading-spinner" style="width: 20px; height: 20px; border: 2px solid rgba(0,255,255,0.3); border-top: 2px solid #00ffff; border-radius: 50%; margin: 0 auto 10px; animation: spin 1s linear infinite;"></div>
                LOADING IMAGE...
            </div>
        `;
        
        img.parentNode.insertBefore(loadingDiv, img);
        
        img.onload = () => {
            loadingDiv.remove();
        };
        
        img.onerror = () => {
            loadingDiv.innerHTML = `<div style="color: #ff1493; text-align: center; padding: 20px;">⚠️ IMAGE LOAD ERROR</div>`;
        };
    }
    }

    convertLinkToInlineImage(link) {
    const img = document.createElement('img');
    img.src = link.href;
    img.alt = link.textContent || 'Inline loaded image';
    
    // Create a container for the image with info
    const container = document.createElement('div');
    container.className = 'inline-loaded-image';
    container.innerHTML = `
        <div style="color: #ff1493; font-size: 12px; margin-bottom: 10px;">
            📎 LOADED: ${link.href.split('/').pop()}
        </div>
    `;
    container.appendChild(img);
    
    // Replace the link with the image
    link.parentNode.replaceChild(container, link);
    
    // Apply styling
    this.enhanceInlineImage(img);
    }

    inlineLoadVideos(container) {
        console.log('🎬 Looking for videos to load...');
        let loadedCount = 0;
        
        // Find Matrix Reader video placeholders
        const videoPlaceholders = container.querySelectorAll('.video-placeholder');
        console.log(`Found ${videoPlaceholders.length} video placeholders`);
        
        // Convert placeholders to actual videos
        videoPlaceholders.forEach(placeholder => {
            const src = placeholder.getAttribute('data-src');
            const controls = placeholder.getAttribute('data-controls') === 'true';
            const alt = placeholder.getAttribute('data-alt') || 'Inline loaded video';
            
            if (src) {
                console.log(`Loading video: ${src}`);
                
                // Create actual video element
                const video = document.createElement('video');
                video.src = src;
                video.controls = controls;
                video.style.cssText = `
                    max-width: 100%;
                    height: auto;
                    border: 2px solid #00ffff;
                    border-radius: 8px;
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                    margin: 20px 0;
                    display: block;
                    background: rgba(0, 0, 0, 0.9);
                `;
                
                // Create container for the video with info
                const container = document.createElement('div');
                container.className = 'inline-loaded-video';
                container.innerHTML = `
                    <div style="color: #00ffff; font-size: 12px; margin-bottom: 10px;">
                        🎬 LOADED: ${this.extractFilename(src)}
                    </div>
                `;
                container.appendChild(video);
                
                // Replace placeholder with actual video
                placeholder.parentNode.replaceChild(container, placeholder);
                
                // Apply additional styling
                this.enhanceInlineVideo(video);
                loadedCount++;
            }
        });
        
        // Also look for regular video links that weren't processed
        const videoLinks = container.querySelectorAll('a[href$=".mp4"], a[href$=".webm"], a[href$=".ogg"], a[href$=".mov"], a[href$=".avi"]');
        console.log(`Found ${videoLinks.length} video links`);
        
        videoLinks.forEach(link => {
            this.convertLinkToInlineVideo(link);
            loadedCount++;
        });
        
        // Enhance existing videos
        const videos = container.querySelectorAll('video');
        videos.forEach(video => {
            this.enhanceInlineVideo(video);
        });
        
        console.log(`Loaded ${loadedCount} videos`);
        return loadedCount;
    }

    convertLinkToInlineVideo(link) {
    const video = document.createElement('video');
    video.src = link.href;
    video.controls = true;
    video.style.cssText = `
        max-width: 100%;
        height: auto;
        border: 2px solid #00ffff;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        margin: 20px 0;
        display: block;
        background: rgba(0, 0, 0, 0.9);
    `;
    
    // Create container with info
    const container = document.createElement('div');
    container.className = 'inline-loaded-video';
    container.innerHTML = `
        <div style="color: #00ffff; font-size: 12px; margin-bottom: 10px;">
            🎬 LOADED: ${link.href.split('/').pop()}
        </div>
    `;
    container.appendChild(video);
    
    // Replace link with video
    link.parentNode.replaceChild(container, link);
    }

    enhanceInlineVideo(video) {
    video.style.cssText += `
        max-width: 100%;
        height: auto;
        border: 2px solid #00ffff;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        margin: 20px 0;
        display: block;
        background: rgba(0, 0, 0, 0.9);
    `;
        video.controls = true;
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
    
    // Save content as HTML or Markdown
    saveContent() {
        if (!this.isActive) {
            console.warn('VibeReader not active - cannot save content');
            return;
        }
        
        console.log('💾 Saving content...');
        
        // Get the original article data if available
        const article = this.currentArticle || {};
        const currentUrl = window.location.href;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const domain = window.location.hostname.replace(/[^a-zA-Z0-9]/g, '-');
        
        // Create filename base
        const filenameBase = `vibereader-${domain}-${timestamp}`;
        
        // Get clean content (what Readability extracted)
        const cleanContent = article.content || '';
        const title = article.title || document.title || 'Untitled';
        
        // Get transformed content (what's currently displayed)
        const transformedContent = document.querySelector('.document-viewer')?.innerHTML || '';
        
        // Create markdown version
        const markdownContent = this.convertToMarkdown({
            title,
            url: currentUrl,
            content: cleanContent,
            byline: article.byline,
            length: article.length,
            excerpt: article.excerpt
        });
        
        // Create HTML version
        const htmlContent = this.createFullHtml({
            title,
            url: currentUrl,
            cleanContent,
            transformedContent,
            theme: this.settings.theme
        });
        
        // Download both files
        this.downloadFile(`${filenameBase}.md`, markdownContent, 'text/markdown');
        this.downloadFile(`${filenameBase}.html`, htmlContent, 'text/html');
        
        console.log('✅ Content saved successfully');
    }
    
    convertToMarkdown(data) {
        let markdown = '';
        
        // Header with metadata
        markdown += `# ${data.title}\n\n`;
        markdown += `**Source:** ${data.url}\n`;
        markdown += `**Extracted:** ${new Date().toISOString()}\n`;
        if (data.byline) markdown += `**Author:** ${data.byline}\n`;
        if (data.length) markdown += `**Length:** ${data.length} characters\n`;
        markdown += `**Theme:** ${this.settings.theme}\n`;
        markdown += `**Generated by:** VibeReader Extension\n\n`;
        
        if (data.excerpt) {
            markdown += `> ${data.excerpt}\n\n`;
        }
        
        markdown += '---\n\n';
        
        // Convert HTML content to markdown
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.content;
        
        // Simple HTML to Markdown conversion
        const htmlToMd = (element) => {
            let result = '';
            
            for (const node of element.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    result += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    const text = node.textContent;
                    
                    switch (tagName) {
                        case 'h1':
                            result += `# ${text}\n\n`;
                            break;
                        case 'h2':
                            result += `## ${text}\n\n`;
                            break;
                        case 'h3':
                            result += `### ${text}\n\n`;
                            break;
                        case 'h4':
                            result += `#### ${text}\n\n`;
                            break;
                        case 'h5':
                            result += `##### ${text}\n\n`;
                            break;
                        case 'h6':
                            result += `###### ${text}\n\n`;
                            break;
                        case 'p':
                            result += `${htmlToMd(node)}\n\n`;
                            break;
                        case 'strong':
                        case 'b':
                            result += `**${text}**`;
                            break;
                        case 'em':
                        case 'i':
                            result += `*${text}*`;
                            break;
                        case 'a':
                            const href = node.getAttribute('href');
                            result += href ? `[${text}](${href})` : text;
                            break;
                        case 'code':
                            result += `\`${text}\``;
                            break;
                        case 'pre':
                            result += `\n\`\`\`\n${text}\n\`\`\`\n\n`;
                            break;
                        case 'ul':
                        case 'ol':
                            result += '\n';
                            for (const li of node.querySelectorAll('li')) {
                                const prefix = tagName === 'ul' ? '- ' : '1. ';
                                result += `${prefix}${li.textContent}\n`;
                            }
                            result += '\n';
                            break;
                        case 'blockquote':
                            result += `> ${text}\n\n`;
                            break;
                        case 'img':
                            const src = node.getAttribute('src');
                            const alt = node.getAttribute('alt') || 'Image';
                            result += src ? `![${alt}](${src})\n\n` : '';
                            break;
                        default:
                            result += htmlToMd(node);
                    }
                }
            }
            return result;
        };
        
        markdown += htmlToMd(tempDiv);
        
        return markdown;
    }
    
    createFullHtml(data) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(data.title)} - VibeReader Export</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f5f5f5;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .metadata {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #3498db;
        }
        .content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .transformed-content {
            background: #1a1a1a;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 2px solid #ff1493;
        }
        h1, h2, h3, h4, h5, h6 { color: #2c3e50; }
        .metadata table { width: 100%; }
        .metadata th { text-align: left; padding: 5px 10px 5px 0; }
        .metadata td { padding: 5px 0; }
        code { background: #ecf0f1; padding: 2px 4px; border-radius: 3px; }
        pre { background: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 ${this.escapeHtml(data.title)}</h1>
        <p><strong>Exported from VibeReader Extension</strong></p>
    </div>
    
    <div class="metadata">
        <h3>📋 Document Information</h3>
        <table>
            <tr><th>Source URL:</th><td><a href="${data.url}" target="_blank">${this.escapeHtml(data.url)}</a></td></tr>
            <tr><th>Exported:</th><td>${new Date().toLocaleString()}</td></tr>
            <tr><th>Theme:</th><td>${this.escapeHtml(this.settings.theme)}</td></tr>
            <tr><th>Extension:</th><td>VibeReader v1.0.0</td></tr>
        </table>
    </div>
    
    <div class="content">
        <h3>📖 Clean Content (Readability Extracted)</h3>
        ${data.cleanContent}
    </div>
    
    <div class="transformed-content">
        <h3 style="color: #ff1493;">🌈 Transformed Content (VibeReader View)</h3>
        ${data.transformedContent}
    </div>
    
    <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #7f8c8d; border-top: 1px solid #ecf0f1;">
        <p>Generated by <strong>VibeReader Extension</strong> | <em>Transform any webpage into a 90s cyberpunk reading experience</em></p>
    </footer>
</body>
</html>`;
    }
    
    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    refresh() {
        if (this.isActive) {
            this.deactivate();
            setTimeout(() => this.activate(), 100);
        }
    }
    
    // DOM-based table handling for complex tables
    shouldCreateTablePlaceholder(table) {
        const rows = table.querySelectorAll('tr');
        const cells = table.querySelectorAll('td, th');
        
        // Complex table indicators:
        const rowCount = rows.length;
        const columnCount = table.rows[0]?.cells.length || 0;
        const hasComplexCells = Array.from(cells).some(cell => 
            cell.querySelector('div, span, a, img') || 
            cell.textContent.length > 100
        );
        const hasComplexStructure = table.classList.length > 2 || 
                                   table.querySelector('thead, tbody, tfoot') ||
                                   table.getAttribute('style');
        
        // Large tables or complex content should get placeholders
        return rowCount > 8 || columnCount > 6 || hasComplexCells || hasComplexStructure;
    }
    
    // Create table placeholder (similar to image placeholders)
    createTablePlaceholder(table, index) {
        const rows = table.querySelectorAll('tr').length;
        const cols = table.rows[0]?.cells.length || 0;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'table-placeholder';
        placeholder.setAttribute('data-table-index', index);
        placeholder.setAttribute('data-original-html', table.outerHTML);
        
        placeholder.innerHTML = `
            <div class="table-icon">📊</div>
            <div class="table-info">
                <div class="table-filename">TABLE ${index + 1}</div>
                <div class="table-stats">${rows} ROWS × ${cols} COLS</div>
                <div class="table-hover-hint">CLICK TO EXPAND TABLE</div>
            </div>
        `;
        
        // Add click handler
        placeholder.addEventListener('click', () => {
            this.expandTablePlaceholder(placeholder);
        });
        
        return placeholder;
    }
    
    // Expand table placeholder on click
    expandTablePlaceholder(placeholder) {
        const originalHtml = placeholder.getAttribute('data-original-html');
        if (!originalHtml) return;
        
        // Create expanded container
        const expandedContainer = document.createElement('div');
        expandedContainer.className = 'expanded-table-container';
        
        // Parse and style the original table
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHtml;
        const table = tempDiv.querySelector('table');
        
        if (table) {
            table.classList.add('retrofuture-table', 'expanded-table');
            
            // Style headers
            const headers = table.querySelectorAll('th');
            headers.forEach(th => th.classList.add('retrofuture-th'));
            
            // Style rows and cells
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => row.classList.add('retrofuture-tr'));
            
            const cells = table.querySelectorAll('td');
            cells.forEach(td => td.classList.add('retrofuture-td'));
        }
        
        expandedContainer.innerHTML = `
            <div class="table-header">
                <div class="table-title">📊 TABLE DATA</div>
                <button class="table-close-btn">✕</button>
            </div>
            <div class="table-content">
                ${tempDiv.innerHTML}
            </div>
        `;
        
        // Add close handler
        const closeBtn = expandedContainer.querySelector('.table-close-btn');
        closeBtn.addEventListener('click', () => {
            expandedContainer.parentNode.replaceChild(placeholder, expandedContainer);
        });
        
        // Replace placeholder with expanded table
        placeholder.parentNode.replaceChild(expandedContainer, placeholder);
    }
    
    // ============================================================================
    // DYNAMIC CONTENT MONITORING SYSTEM
    // ============================================================================
    
    initDynamicContentMonitor() {
        if (this.contentObserver) {
            this.contentObserver.disconnect();
        }
        
        // Create debounced handler for content changes
        this.handleContentChanges = this.debounce(() => {
            if (this.isActive && this.matrixContainer) {
                this.processContentUpdates();
            }
        }, 2000); // 2 second debounce
        
        // Watch for meaningful content changes in the original page
        this.contentObserver = new MutationObserver((mutations) => {
            const hasSignificantChange = mutations.some(mutation => {
                // Look for added nodes with substantial content
                return mutation.addedNodes.length > 0 && 
                       Array.from(mutation.addedNodes).some(node => 
                           node.nodeType === Node.ELEMENT_NODE && 
                           (node.textContent?.length > 200 || 
                            node.querySelector('p, article, div.content, div[class*="post"], div[class*="article"]'))
                       );
            });
            
            if (hasSignificantChange) {
                console.log('🔄 Dynamic content detected, scheduling update...');
                this.handleContentChanges();
            }
        });
        
        // Monitor the body for content changes (but not our overlay)
        this.contentObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        console.log('👁️ Dynamic content monitoring started');
    }
    
    async processContentUpdates() {
        try {
            console.log('🔄 Processing content updates...');
            
            // Extract fresh content in background
            const documentClone = document.cloneNode(true);
            
            // Remove our overlay from the clone to avoid interference
            const overlayInClone = documentClone.querySelector('.retrofuture-reader-overlay, .retrofuture-error-overlay');
            if (overlayInClone) {
                overlayInClone.remove();
            }
            
            const reader = new Readability(documentClone);
            const newArticle = reader.parse();
            
            if (!newArticle) {
                console.log('⚠️ New content extraction failed');
                return;
            }
            
            // Check if content has meaningfully changed
            if (this.hasSignificantContentChanges(newArticle)) {
                console.log('✨ Significant changes detected, updating content...');
                await this.smoothUpdateContent(newArticle);
            } else {
                console.log('📝 No significant changes detected');
            }
            
        } catch (error) {
            console.error('❌ Content update failed:', error);
        }
    }
    
    hasSignificantContentChanges(newArticle) {
        if (!this.currentArticle) return true;
        
        // Compare content length (significant if >20% change)
        const oldLength = this.currentArticle.textContent?.length || 0;
        const newLength = newArticle.textContent?.length || 0;
        const lengthDiff = Math.abs(newLength - oldLength);
        const significantLengthChange = lengthDiff > (oldLength * 0.2);
        
        // Compare titles
        const titleChanged = this.currentArticle.title !== newArticle.title;
        
        // Basic content comparison (simplified)
        const oldWords = this.currentArticle.textContent?.split(' ').length || 0;
        const newWords = newArticle.textContent?.split(' ').length || 0;
        const wordDiff = Math.abs(newWords - oldWords);
        const significantWordChange = wordDiff > 50; // 50+ new words
        
        const hasChanges = significantLengthChange || titleChanged || significantWordChange;
        
        if (hasChanges) {
            console.log('📊 Content changes detected:', {
                lengthDiff,
                titleChanged,
                wordDiff,
                oldWords,
                newWords
            });
        }
        
        return hasChanges;
    }
    
    async smoothUpdateContent(newArticle) {
        if (!this.matrixContainer) return;
        
        // Store scroll position
        const scrollTop = this.matrixContainer.scrollTop;
        
        // Trigger cyberpunk glitch effect
        await this.triggerContentGlitch();
        
        // Update the article data
        this.currentArticle = newArticle;
        
        // Get the content area
        const documentViewer = this.matrixContainer.querySelector('.document-viewer');
        if (!documentViewer) return;
        
        // Create new content
        const newContent = this.processRetrofutureContent(newArticle.content);
        
        // Smooth transition with fade effect
        documentViewer.style.transition = 'opacity 0.3s ease';
        documentViewer.style.opacity = '0.3';
        
        setTimeout(() => {
            documentViewer.innerHTML = newContent;
            documentViewer.style.opacity = '1';
            
            // Restore scroll position (approximately)
            this.matrixContainer.scrollTop = scrollTop;
            
            // Update side terminals with new data
            if (this.settings.sideScrolls) {
                this.updateSideScrollers(newArticle);
            }
            
            console.log('✅ Content updated smoothly');
        }, 300);
    }
    
    async triggerContentGlitch() {
        const contentArea = this.matrixContainer?.querySelector('.document-viewer');
        if (!contentArea) return;
        
        // Add glitch effect
        contentArea.style.filter = 'hue-rotate(180deg) brightness(1.5)';
        contentArea.style.transform = 'skew(1deg)';
        
        // Flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, #ff1493, #00ffff);
            opacity: 0.1;
            pointer-events: none;
            animation: flash 0.2s ease-out;
        `;
        
        this.matrixContainer.appendChild(flash);
        
        return new Promise(resolve => {
            setTimeout(() => {
                contentArea.style.filter = '';
                contentArea.style.transform = '';
                flash.remove();
                resolve();
            }, 200);
        });
    }
    
    updateSideScrollers(article) {
        // Update left terminal with new info
        const leftTerminal = document.getElementById('left-terminal-content');
        if (leftTerminal) {
            const terminalOutput = leftTerminal.querySelector('.terminal-output');
            if (terminalOutput) {
                terminalOutput.innerHTML = '';
                const updateInfo = [
                    '> CONTENT UPDATED',
                    '> NEURAL SYNC: COMPLETE',
                    `> NEW WORD COUNT: ${article.textContent.split(' ').length}`,
                    `> READING TIME: ${this.calculateReadingTime(article.textContent)} MIN`,
                    `> UPDATE TIME: ${new Date().toLocaleTimeString()}`,
                    '> SYSTEM STATUS: OPTIMAL'
                ];
                
                updateInfo.forEach((line, index) => {
                    setTimeout(() => {
                        const lineEl = document.createElement('div');
                        lineEl.textContent = line;
                        lineEl.style.color = '#00ff00'; // Green for updates
                        terminalOutput.appendChild(lineEl);
                    }, index * 100);
                });
            }
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    stopDynamicContentMonitor() {
        if (this.contentObserver) {
            this.contentObserver.disconnect();
            this.contentObserver = null;
            console.log('👁️ Dynamic content monitoring stopped');
        }
    }
    
    // ============================================================================
    // PAGE ELEMENT ISOLATION SYSTEM
    // ============================================================================
    
    hidePageElements() {
        // Store references to elements we're hiding
        this.hiddenElements = [];
        
        // Common problematic selectors that might interfere with overlay
        const problematicSelectors = [
            // Fixed/sticky positioned elements
            '[style*="position: fixed"]',
            '[style*="position:fixed"]',
            '[style*="position: sticky"]',
            '[style*="position:sticky"]',
            '.fixed',
            '.sticky',
            '.navbar-fixed',
            '.header-fixed',
            '.sidebar-fixed',
            
            // High z-index elements
            '[style*="z-index: 999"]',
            '[style*="z-index:999"]',
            '[style*="z-index: 9999"]',
            '[style*="z-index:9999"]',
            
            // Common ad containers
            '.ad',
            '.ads',
            '.advertisement',
            '.google-ads',
            '.adsbox',
            '.adsbygoogle',
            '[class*="ad-"]',
            '[id*="ad-"]',
            '[class*="ads-"]',
            '[id*="ads-"]',
            
            // Popup/modal/overlay elements
            '.modal',
            '.popup',
            '.overlay',
            '.lightbox',
            '.tooltip',
            '.dropdown-menu',
            '.popover',
            
            // Navigation and headers that might be sticky
            'nav[style*="position"]',
            'header[style*="position"]',
            '.navbar',
            '.header',
            '.topbar',
            '.menu-bar',
            
            // Chat widgets and social buttons
            '.chat-widget',
            '.social-buttons',
            '.share-buttons',
            '.floating-buttons',
            '[class*="chat"]',
            '[class*="messenger"]',
            
            // Cookie notices and banners
            '.cookie-notice',
            '.cookie-banner',
            '.gdpr-notice',
            '.privacy-notice',
            
            // Video players that might be fixed
            '.video-player[style*="position"]',
            '.media-player[style*="position"]'
        ];
        
        problematicSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // Skip our own overlay
                    if (element.classList.contains('retrofuture-reader-overlay') || 
                        element.classList.contains('retrofuture-error-overlay')) {
                        return;
                    }
                    
                    // Check if element has high z-index or problematic positioning
                    const computedStyle = window.getComputedStyle(element);
                    const zIndex = parseInt(computedStyle.zIndex) || 0;
                    const position = computedStyle.position;
                    
                    const shouldHide = 
                        zIndex > 1000 || 
                        position === 'fixed' || 
                        position === 'sticky' ||
                        element.classList.toString().toLowerCase().includes('ad') ||
                        element.id.toLowerCase().includes('ad');
                    
                    if (shouldHide && element.offsetHeight > 0) { // Only hide visible elements
                        // Store original display style
                        this.hiddenElements.push({
                            element: element,
                            originalDisplay: element.style.display,
                            originalVisibility: element.style.visibility,
                            originalOpacity: element.style.opacity
                        });
                        
                        // Hide the element using multiple methods for maximum compatibility
                        element.style.display = 'none !important';
                        element.style.visibility = 'hidden !important';
                        element.style.opacity = '0 !important';
                        element.style.pointerEvents = 'none !important';
                        element.style.zIndex = '-1 !important';
                    }
                });
            } catch (error) {
                // Ignore selector errors
                console.debug('Selector error (safe to ignore):', selector, error);
            }
        });
        
        console.log(`🫥 Hidden ${this.hiddenElements.length} potentially problematic elements`);
    }
    
    restorePageElements() {
        if (!this.hiddenElements) return;
        
        this.hiddenElements.forEach(({ element, originalDisplay, originalVisibility, originalOpacity }) => {
            try {
                // Restore original styles
                element.style.display = originalDisplay;
                element.style.visibility = originalVisibility;
                element.style.opacity = originalOpacity;
                element.style.pointerEvents = '';
                element.style.zIndex = '';
            } catch (error) {
                // Element might have been removed from DOM
                console.debug('Could not restore element (safe to ignore):', error);
            }
        });
        
        console.log(`🔄 Restored ${this.hiddenElements.length} hidden elements`);
        this.hiddenElements = [];
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