// VibeReader v2.0 - Proxy Controller with Injection Guards
// Singleton pattern without unnecessary IIFE wrapper

// Prevent multiple injections with simple guard
if (window.__vibeReaderProxyController) {
    console.log('⚠️ ProxyController already exists, skipping');
    false;
} else {
    try {

        const DIAGNOSTIC_CATEGORIES = {
            ERRORS: {
                patterns: ['ERR:', '❌', 'failed', 'error', 'Error:'],
                icon: '🔴',
                priority: 1,
                color: '#ff4757',
                terminals: ['SYSADMIN', 'NETMON'],
                maxLogs: 10,
                autoExpand: true
            },
            CSS: {
                patterns: ['CSS:', '🎨', 'stylesheet', '--tw-', 'generated.css'],
                icon: '🖌️',
                priority: 2,
                color: '#3742fa',
                terminals: ['SYSADMIN'],
                maxLogs: 8,
                autoExpand: true
            },
            MEDIA: {
                patterns: ['MEDIA', '📷', 'images', 'videos', 'Found'],
                icon: '🎬',
                priority: 3,
                color: '#3742fa',
                terminals: ['SYSADMIN'],
                maxLogs: 8,
                autoExpand: true
            },
            ASCII: {
                patterns: ['ASCII', '🎯', 'conversion', 'aalib'],
                icon: '🎨',
                priority: 3,
                color: '#ff9ff3',
                terminals: ['SYSADMIN'],
                maxLogs: 8,
                autoExpand: true
            },
            NETWORK: {
                patterns: ['BG:', 'extraction', 'proxy', 'NETMON', 'framework'],
                icon: '🌐',
                priority: 2,
                color: '#ff6348',
                terminals: ['NETMON'],
                maxLogs: 10,
                autoExpand: false
            },
            SYSTEM: {
                patterns: ['LOG:', '✅', 'initialized', 'activated'],
                icon: '⚙️',
                priority: 4,
                color: '#2ed573',
                terminals: ['SYSADMIN', 'NETMON'],
                maxLogs: 10,
                autoExpand: false
            }
        };

        // TerminalLogger - Event-driven append-only terminal system
        class TerminalLogger {
            constructor(proxyController) {
                this.proxy = proxyController;
                this.leftTerminal = null;
                this.rightTerminal = null;
                this.MAX_LOG_ENTRIES = 500;
                this.isScrolledToBottom = true;
            }

            init() {
                // Wait for DOM to be ready then find terminals
                const checkTerminals = () => {
                    this.leftTerminal = document.querySelector('#left-terminal');
                    this.rightTerminal = document.querySelector('#right-terminal');

                    if (this.leftTerminal && this.rightTerminal) {
                        this.setupEventListeners();
                        this.startInitialUpdate();
                    } else {
                        setTimeout(checkTerminals, 100);
                    }
                };
                checkTerminals();
            }

            setupEventListeners() {
                // Use consistent broker reference
                // ============== EXTRACTION EVENTS ==============
                this.broker.on('extraction-start', () => {
                    console.log('🚀 Extraction starting');
                    this.addToDiagnostics('INFO', 'Content extraction initiated', 'SYSADMIN');
                    this.updateTerminalStatus('initializing', 0);
                });

                this.broker.on('extraction-progress', (data) => {
                    console.log(`📊 Extraction progress: ${data.status} - ${data.progress}%`);
                    this.showExtractionProgress(data.status, data.progress);
                    this.addToDiagnostics('INFO', `Extraction: ${data.status} (${data.progress}%)`, 'NETMON');
                });

                this.broker.on('extraction-complete', (data) => {
                    console.log('✅ Extraction complete');
                    this.displayExtractedContent(data.content, data.metadata);
                    this.addToDiagnostics('INFO', `Content extracted: ${data.metadata?.title || 'Untitled'}`, 'SYSADMIN');
                    // Emit CSS debugging event after content loads
                    this.broker.emit('content-loaded', {metadata: data.metadata});
                });

                this.broker.on('extraction-failed', (error) => {
                    console.error('❌ Extraction failed:', error);
                    this.showError(error.message || 'Extraction failed');
                    this.addToDiagnostics('ERR', `Extraction failed: ${error.message}`, 'SYSADMIN');
                });

                // ============== CSS & STYLING EVENTS ==============
                this.broker.on('css-loading', () => {
                    console.log('CSS: 🎨 Loading stylesheets...');
                    this.addToDiagnostics('INFO', 'Loading CSS resources', 'CSS');
                });

                this.broker.on('css-loaded', (data) => {
                    console.log('CSS: ✅ Stylesheets loaded successfully');
                    this.addToDiagnostics('INFO', `CSS loaded: ${data.rules || 0} rules`, 'CSS');
                    this.debugCSSVariables();
                });

                this.broker.on('css-failed', (error) => {
                    console.error('CSS: ❌ Failed to load:', error);
                    this.addToDiagnostics('ERR', `CSS load failed: ${error.message}`, 'CSS');
                    // Try fallback CSS injection
                    this.broker.emit('css-fallback-needed', {error});
                });

                this.broker.on('css-verification', (data) => {
                    if (data.attempt) {
                        console.log(`CSS: ⏳ Verification attempt ${data.attempt}/${data.maxAttempts}`);
                        this.addToDiagnostics('INFO', `CSS verification attempt ${data.attempt}`, 'CSS');
                    }
                });

                this.broker.on('theme-change', (data) => {
                    console.log(`🎨 Theme changed to: ${data.theme}`);
                    this.applyTheme(data.theme);
                    this.updateButtonTexts();
                    this.addToDiagnostics('INFO', `Theme switched to ${data.theme}`, 'SYSTEM');
                });

                // ============== MEDIA PROCESSING EVENTS ==============
                this.broker.on('media-found', (data) => {
                    console.log(`📷 Found ${data.count} media items`);
                    this.addToDiagnostics('INFO', `Found ${data.count} ${data.type} items`, 'MEDIA');
                });

                this.broker.on('media-mode-change', (data) => {
                    console.log(`🖼️ Media mode changed to: ${data.mode}`);
                    this.settings.mediaMode = data.mode;

                    // Update ALL media wrappers
                    const wrappers = this.container?.querySelectorAll('.media-wrapper') || [];
                    wrappers.forEach(wrapper => {
                        wrapper.setAttribute('data-mode', data.mode);
                        this.updateMediaDisplay(wrapper);
                    });

                    this.addToDiagnostics('INFO', `Media mode: ${data.mode}`, 'MEDIA');
                });

                this.broker.on('ascii-conversion-start', (data) => {
                    console.log('🎯 Starting ASCII conversion:', data.src);
                    this.addToDiagnostics('INFO', `Converting image to ASCII`, 'ASCII');
                });

                this.broker.on('ascii-conversion-complete', (data) => {
                    console.log('✅ ASCII conversion complete');
                    this.addToDiagnostics('INFO', `ASCII conversion successful`, 'ASCII');
                });

                this.broker.on('ascii-conversion-failed', (error) => {
                    console.error('❌ ASCII conversion failed:', error);
                    this.addToDiagnostics('ERR', `ASCII conversion failed: ${error.message}`, 'ASCII');
                });

                // ============== TERMINAL & LOGGING EVENTS ==============
                this.broker.on('terminal-log', (data) => {
                    this.logToTerminal(
                        data.level || 'INFO',
                        data.message || '',
                        data.category || 'SYSTEM',
                        data.source || 'internal',
                        data.metadata || {}
                    );
                });

                this.broker.on('terminal-category-toggle', (data) => {
                    const {category, expanded} = data;
                    if (this.diagnosticCategories[category]) {
                        this.diagnosticCategories[category].expanded = expanded;
                        this.throttleTerminalUpdate(data.side || 'left');
                    }
                });

                this.broker.on('terminal-clear', (data) => {
                    const side = data.side || 'both';
                    if (side === 'left' || side === 'both') {
                        this.sysadminLogs = [];
                        Object.keys(this.diagnosticCategories).forEach(cat => {
                            this.diagnosticCategories[cat].logs = [];
                        });
                    }
                    if (side === 'right' || side === 'both') {
                        this.networkLogs = [];
                    }
                    this.broker.emit('terminals-updated', {cleared: side});
                });

                // ============== ERROR HANDLING EVENTS ==============
                this.broker.on('error', (error) => {
                    console.error('❌ Error event:', error);
                    this.showError(error.message || 'Unknown error');
                    this.addToDiagnostics('ERR', error.message, 'ERRORS');
                });

                this.broker.on('warning', (warning) => {
                    console.warn('⚠️ Warning:', warning);
                    this.addToDiagnostics('WARN', warning.message, 'SYSTEM');
                });

                this.broker.on('console-error', (data) => {
                    // Capture console errors
                    this.addToDiagnostics('ERR', `Console: ${data.message}`, 'ERRORS');
                });

                // ============== TAB LIFECYCLE EVENTS ==============
                this.broker.on('activation-start', () => {
                    console.log('🔥 Starting Vibe Mode activation');
                    this.addToDiagnostics('INFO', 'Vibe Mode activating...', 'SYSTEM');
                });

                this.broker.on('activation-complete', () => {
                    console.log('✅ Vibe Mode activated');
                    this.isActive = true;
                    this.addToDiagnostics('INFO', 'Vibe Mode active', 'SYSTEM');
                    const statusEl = this.container?.querySelector('.vibe-status');
                    if (statusEl) statusEl.textContent = '[ ACTIVE ]';
                });

                this.broker.on('deactivation-request', () => {
                    console.log('🔌 Deactivation requested');
                    this.requestDeactivation();
                });

                this.broker.on('deactivation-complete', () => {
                    console.log('✅ Vibe Mode deactivated');
                    this.isActive = false;
                    this.deactivate();
                });

                this.broker.on('hidden-tab-created', (data) => {
                    console.log('🌐 Hidden tab created:', data.hiddenTabId);
                    this.addToDiagnostics('INFO', `Hidden tab: ${data.hiddenTabId}`, 'NETWORK');
                });

                this.broker.on('hidden-tab-closed', (data) => {
                    console.warn('⚠️ Hidden tab closed unexpectedly');
                    this.handleHiddenTabClosed(data.error);
                    this.addToDiagnostics('WARN', 'Hidden tab connection lost', 'NETWORK');
                });

                // ============== SETTINGS & CONFIG EVENTS ==============
                this.broker.on('settings-update', (settings) => {
                    console.log('⚙️ Settings updated:', settings);
                    this.updateSettings(settings);
                    this.addToDiagnostics('INFO', 'Settings updated', 'SYSTEM');
                });

                this.broker.on('settings-loaded', (settings) => {
                    console.log('⚙️ Settings loaded:', settings);
                    this.settings = {...this.settings, ...settings};
                    this.currentTheme = this.settings.theme || 'nightdrive';
                    this.applyTheme(this.currentTheme);
                });

                // ============== NETWORK & BACKGROUND EVENTS ==============
                this.broker.on('background-message', (data) => {
                    // Handle messages from background script
                    this.logToTerminal(
                        data.level || 'INFO',
                        data.message,
                        data.category || 'NETWORK',
                        'background',
                        data.metadata || {}
                    );
                });

                this.broker.on('network-request', (data) => {
                    this.addToDiagnostics('INFO', `${data.method} ${data.url}`, 'NETWORK');
                });

                this.broker.on('network-response', (data) => {
                    this.addToDiagnostics('INFO', `Response: ${data.status}`, 'NETWORK');
                });

                // ============== UI INTERACTION EVENTS ==============
                this.broker.on('button-click', (data) => {
                    switch (data.action) {
                        case 'cycle-theme':
                            this.cycleTheme();
                            break;
                        case 'cycle-media':
                            this.cycleMediaMode();
                            break;
                        case 'disconnect':
                            this.requestDeactivation();
                            break;
                    }
                });

                this.broker.on('media-item-click', (data) => {
                    if (data.wrapper) {
                        this.cycleMediaItem(data.wrapper);
                    }
                });

                // ============== PERFORMANCE & DEBUG EVENTS ==============
                this.broker.on('performance-metric', (data) => {
                    console.log(`⚡ Performance: ${data.metric} = ${data.value}ms`);
                    this.addToDiagnostics('INFO', `${data.metric}: ${data.value}ms`, 'SYSTEM');
                });

                this.broker.on('debug-info', (data) => {
                    console.log('🔍 Debug:', data);
                    if (this.settings.debug) {
                        this.addToDiagnostics('LOG', `Debug: ${JSON.stringify(data)}`, 'SYSTEM');
                    }
                });

                this.broker.on('memory-warning', (data) => {
                    console.warn('⚠️ Memory warning:', data);
                    this.addToDiagnostics('WARN', `Memory usage: ${data.usage}MB`, 'SYSTEM');
                    // Trigger cleanup if needed
                    if (data.usage > 100) {
                        this.broker.emit('cleanup-needed', {reason: 'memory'});
                    }
                });

                // ============== CLEANUP EVENTS ==============
                this.broker.on('cleanup-needed', (data) => {
                    console.log('🧹 Cleanup triggered:', data.reason);
                    // Clear old logs
                    Object.keys(this.diagnosticCategories).forEach(cat => {
                        const logs = this.diagnosticCategories[cat].logs;
                        if (logs.length > 8) {
                            this.diagnosticCategories[cat].logs = logs.slice(0, 8);
                        }
                    });
                    // Clear legacy logs
                    this.sysadminLogs = this.sysadminLogs.slice(0, this.maxLogsPerTerminal);
                    this.networkLogs = this.networkLogs.slice(0, this.maxLogsPerTerminal);
                });

                // ============== FRAMEWORK DETECTION EVENTS ==============
                this.broker.on('framework-detected', (data) => {
                    console.log(`🔍 Framework detected: ${data.framework}`);
                    this.addToDiagnostics('INFO', `Framework: ${data.framework}`, 'NETWORK');
                });

                // ============== READABILITY EVENTS ==============
                this.broker.on('readability-score', (data) => {
                    console.log(`📊 Readability score: ${data.score}`);
                    this.addToDiagnostics('INFO', `Readability: ${data.score}`, 'SYSTEM');
                });

                console.log('✅ Event listeners initialized');
            }

            log(side, category, message, level = 'INFO') {
                // Add to diagnostic categories first
                this.proxy.addToDiagnostics(level, message, side === 'left' ? 'SYSADMIN' : 'NETMON');

                // Trigger real-time update
                const terminal = side === 'left' ? this.leftTerminal : this.rightTerminal;
                if (terminal) {
                    this.updateTerminal(terminal);
                }
            }

            updateTerminal(terminal) {
                if (!terminal) return;

                const isLeft = terminal.id === 'left-terminal';
                const categories = isLeft
                    ? ['ERRORS', 'CSS', 'MEDIA', 'ASCII', 'SYSTEM']
                    : ['NETWORK', 'ERRORS', 'SYSTEM'];

                let html = '';
                categories.forEach(cat => {
                    if (this.proxy.diagnosticCategories[cat]) {
                        html += this.createCategoryDropdown(cat, this.proxy.diagnosticCategories[cat]);
                    }
                });

                if (!html) {
                    html = isLeft
                        ? '<div class="terminal-line">> [Waiting for events...]</div>'
                        : '<div class="terminal-line">> [Monitoring network...]</div>';
                }

                // Update DOM with memory management
                terminal.innerHTML = html;
                this.maintainScrollPosition(terminal);
                this.updateTerminalStatus(terminal, categories);
            }

            createCategoryDropdown(categoryName, categoryData) {
                const isExpanded = categoryData.expanded;
                const count = categoryData.logs.length;
                const arrow = isExpanded ? '▼' : '▶';

                if (count === 0 && !isExpanded) return '';

                let html = `
                    <div class="diagnostic-category" data-category="${categoryName}">
                        <div class="category-header cursor-pointer hover:text-primary-400" data-category="${categoryName}">
                            ${categoryData.icon} ${arrow} ${categoryName} (${count})
                        </div>
                `;

                if (isExpanded && count > 0) {
                    html += '<div class="category-content">';
                    categoryData.logs.slice(0, 8).forEach(log => {
                        const countDisplay = log.count > 1 ? ` x${log.count}` : '';
                        html += `<div class="terminal-line text-xs">  ${log.level}: ${log.message}${countDisplay}</div>`;
                    });
                    html += '</div>';
                } else if (isExpanded && count === 0) {
                    html += '<div class="category-content"><div class="terminal-line text-xs">  [No activity]</div></div>';
                }

                html += '</div>';
                return html;
            }

            maintainScrollPosition(terminal) {
                // Maintain scroll position if user was at bottom
                if (this.isScrolledToBottom) {
                    terminal.scrollTop = terminal.scrollHeight;
                }
            }

            updateTerminalStatus(terminal, categories) {
                const hasErrors = categories.some(cat =>
                    this.proxy.diagnosticCategories[cat]?.logs.some(log => log.level === 'ERR'));
                const hasActivity = categories.some(cat =>
                    this.proxy.diagnosticCategories[cat]?.logs.length > 0);

                const terminalWindow = terminal.closest('.terminal-window');
                if (terminalWindow) {
                    if (hasErrors) {
                        terminalWindow.setAttribute('data-error', 'true');
                        terminalWindow.removeAttribute('data-active');
                        setTimeout(() => {
                            terminalWindow.removeAttribute('data-error');
                            if (hasActivity) terminalWindow.setAttribute('data-active', 'true');
                        }, 3000);
                    } else if (hasActivity) {
                        terminalWindow.setAttribute('data-active', 'true');
                        terminalWindow.removeAttribute('data-error');
                    } else {
                        terminalWindow.removeAttribute('data-active');
                        terminalWindow.removeAttribute('data-error');
                    }
                }
            }

            startInitialUpdate() {
                // Initial update and then use event-driven updates
                this.updateTerminal(this.leftTerminal);
                this.updateTerminal(this.rightTerminal);
            }
        }

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
                this.diagnosticCategories = {};
                for (const [name, config] of Object.entries(DIAGNOSTIC_CATEGORIES)) {
                    this.diagnosticCategories[name] = {
                        logs: [],
                        expanded: config.autoExpand,
                        icon: config.icon,
                        color: config.color,
                        patterns: config.patterns,
                        priority: config.priority,
                        terminals: config.terminals,
                        maxLogs: config.maxLogs
                    };
                }

                // Legacy log buffers (keep for compatibility)
                this.sysadminLogs = [];
                this.networkLogs = [];
                this.maxLogsPerTerminal = 10;
                this.broker = new MessageBroker();
                this.centralizedLogger = new CentralizedLogger(this);
                this.setupEventListeners();
                this.setupMessageHandlers();

                // hook to vibelogger
                if (window.__VibeReaderUtils.VibeLogger) {  // or messageDebugger, whatever you call it
                    window.__VibeReaderUtils.VibeLogger.setTerminalHandler((category, level, message) => {
                        // This arrow function has access to 'this' (the ProxyController)
                        this.addToDiagnostics(level, message, category);
                    });
                }
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

            initCSSDebugging() {
                // CSS debugging following terminal-log-API patterns
                try {
                    console.log('CSS: 🎨 CSS debugging initialized');

                    // Check CSS load status with retry mechanism
                    this.waitForCSSLoad();

                } catch (error) {
                    console.error('ERR: CSS debugging initialization failed:', error);
                }
            }

            async waitForCSSLoad(maxAttempts = 10, delay = 200) {
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    const styleSheets = Array.from(document.styleSheets);
                    let generatedCSSFound = false;

                    styleSheets.forEach(sheet => {
                        try {
                            const href = sheet.href || 'inline';
                            if (href.includes('generated.css') || href.includes('styles/generated')) {
                                generatedCSSFound = true;
                            }
                        } catch (e) {
                            // Access denied to external stylesheets
                        }
                    });

                    if (generatedCSSFound) {
                        console.log(`CSS: ✅ Generated CSS detected on attempt ${attempt}`);
                        setTimeout(() => {
                            this.debugCSSLoadStatus();
                            this.debugCSSVariables();
                            this.debugCSSPerformance();
                            this.setupCSSErrorCapture();
                        }, 100);
                        return;
                    }

                    if (attempt < maxAttempts) {
                        console.log(`CSS: ⏳ CSS not yet loaded, attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        console.error('ERR: CSS failed to load after all attempts');
                        this.debugCSSLoadStatus();
                        this.debugCSSVariables();
                    }
                }
            }

            debugCSSLoadStatus() {
                try {
                    const styleSheets = Array.from(document.styleSheets);
                    console.log(`CSS: 📊 Loaded ${styleSheets.length} stylesheets`);

                    let generatedCSSFound = false;
                    let generatedCSSRules = 0;

                    styleSheets.forEach((sheet, i) => {
                        try {
                            const href = sheet.href || 'inline';
                            const ruleCount = sheet.cssRules?.length || 0;

                            if (href.includes('generated.css') || href.includes('styles/generated')) {
                                generatedCSSFound = true;
                                generatedCSSRules = ruleCount;
                                console.log(`CSS: ✅ generated.css loaded with ${ruleCount} rules`);
                            }

                            if (ruleCount === 0) {
                                console.log(`CSS: ⚠️ Sheet ${i} (${href}) has 0 rules`);
                            }
                        } catch (e) {
                            console.log(`CSS: 🔒 Sheet ${i}: Access denied - ${e.message}`);
                        }
                    });

                    if (!generatedCSSFound) {
                        console.error('ERR: generated.css not found in loaded stylesheets');
                    }

                } catch (error) {
                    console.error('ERR: CSS load status check failed:', error);
                }
            }

            debugCSSVariables() {
                try {
                    const rootStyles = getComputedStyle(document.documentElement);

                    // Check critical Tailwind variables
                    const twShadowColor = rootStyles.getPropertyValue('--tw-shadow-color').trim();
                    const twShadowColored = rootStyles.getPropertyValue('--tw-shadow-colored').trim();

                    console.log(`CSS: 🎯 --tw-shadow-color: "${twShadowColor}"`);
                    console.log(`CSS: 🎯 --tw-shadow-colored: "${twShadowColored}"`);

                    // Check theme variables
                    const primary500 = rootStyles.getPropertyValue('--primary-500').trim();
                    const glowPrimary = rootStyles.getPropertyValue('--glow-primary').trim();

                    console.log(`CSS: 🎨 --primary-500: "${primary500}"`);
                    console.log(`CSS: 🎨 --glow-primary: "${glowPrimary}"`);

                    if (!twShadowColor) {
                        console.error('ERR: --tw-shadow-color is undefined');
                    }
                    if (!primary500) {
                        console.error('ERR: --primary-500 theme variable is undefined');
                    }

                } catch (error) {
                    console.error('ERR: CSS variable check failed:', error);
                }
            }

            debugCSSPerformance() {
                try {
                    const animationCount = document.getAnimations ? document.getAnimations().length : 0;
                    const transformElements = document.querySelectorAll('[style*="transform"]').length;
                    const containerElements = document.querySelectorAll('.vibe-container').length;

                    console.log(`CSS: ⚡ Performance - ${animationCount} animations, ${transformElements} transforms, ${containerElements} vibe containers`);

                    if (animationCount > 50) {
                        console.log(`CSS: ⚠️ High animation count: ${animationCount}`);
                    }

                } catch (error) {
                    console.error('ERR: CSS performance check failed:', error);
                }
            }

            setupCSSErrorCapture() {
                // Capture CSS-related errors
                const originalError = window.addEventListener;
                window.addEventListener('error', (event) => {
                    if (event.message && (event.message.includes('CSS') || event.message.includes('style'))) {
                        console.error(`ERR: CSS error - ${event.message} at ${event.filename}:${event.lineno}`);
                    }
                });

                // Monitor for CSS parse failures (simplified detection)
                setTimeout(() => {
                    const testElement = document.querySelector('.vibe-container');
                    if (testElement) {
                        const computedStyles = getComputedStyle(testElement);
                        if (computedStyles.position !== 'fixed') {
                            console.error('ERR: vibe-container positioning styles not applied correctly');
                        }
                        if (!computedStyles.zIndex || computedStyles.zIndex !== '1000') {
                            console.error('ERR: vibe-container z-index not applied correctly');
                        }
                    }
                }, 500);
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
                for (const [category, config] of Object.entries(DIAGNOSTIC_CATEGORIES)) {
                    for (const pattern of config.patterns) {
                        if (message.includes(pattern) || lowerMsg.includes(pattern.toLowerCase())) {
                            return category;
                        }
                    }
                }
                // Backup category detection
                if (message.includes('ERR:') || message.includes('❌') || message.includes('failed') || message.includes('error') || level === 'ERR') {
                    return 'ERRORS';
                }
                return 'SYSTEM';
            }

            addToDiagnostics(level, message, source = 'SYSADMIN') {
                const category = this.categorizeLog(level, message);
                const cleanMessage = message.substring(0, 50);
                const timestamp = Date.now();

                if (!this.diagnosticCategories[category]) {
                    // Create category if it doesn't exist (shouldn't happen with DIAGNOSTIC_CATEGORIES)
                    this.diagnosticCategories[category] = {
                        logs: [],
                        expanded: true,
                        icon: '❓',
                        color: '#95a5a6',
                        maxLogs: 10
                    };
                }

                const catConfig = this.diagnosticCategories[category];

                // Check if this should go to this terminal
                if (catConfig.terminals) {
                    const terminal = source === 'SYSADMIN' ? 'SYSADMIN' : 'NETMON';
                    if (!catConfig.terminals.includes(terminal)) {
                        return; // Skip if not for this terminal
                    }
                }

                // Find existing or add new
                const existing = catConfig.logs.find(log =>
                    log.message.includes(cleanMessage.substring(0, 25))
                );

                if (existing) {
                    existing.count++;
                    existing.lastSeen = timestamp;
                } else {
                    catConfig.logs.unshift({
                        level,
                        message: cleanMessage,
                        count: 1,
                        timestamp,
                        lastSeen: timestamp,
                        source
                    });

                    // Respect maxLogs setting
                    const maxLogs = catConfig.maxLogs || 8;
                    if (catConfig.logs.length > maxLogs) {
                        catConfig.logs = catConfig.logs.slice(0, maxLogs);
                    }
                }

                // Trigger terminal update
                if (this.terminalLogger) {
                    const side = source === 'SYSADMIN' ? 'left' : 'right';
                    this.throttleTerminalUpdate(side);
                }
            }

            throttleTerminalUpdate(side) {
                if (!this.terminalUpdateTimeouts) this.terminalUpdateTimeouts = {};

                // Clear existing timeout for this side
                if (this.terminalUpdateTimeouts[side]) {
                    clearTimeout(this.terminalUpdateTimeouts[side]);
                }

                // Set new timeout
                this.terminalUpdateTimeouts[side] = setTimeout(() => {
                    if (this.terminalLogger) {
                        const terminal = side === 'left' ?
                            this.terminalLogger.leftTerminal :
                            this.terminalLogger.rightTerminal;
                        if (terminal) {
                            this.terminalLogger.updateTerminal(terminal);
                        }
                    }
                }, 100); // 100ms throttle
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
                    // Tab ID will be available through broker context
                    console.log('🎮 ProxyController.init() starting:', {
                        url: window.location.href, timestamp: new Date().toISOString()
                    });

                    // Initialize console logging capture
                    this.initConsoleCapture();

                    // Initialize CSS debugging
                    this.initCSSDebugging();

                    // Setup enhanced error capture
                    this.setupEnhancedErrorCapture();

                    // MessageBroker was already initialized in constructor

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
                } 
                    return 'SYSTEM';
                
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

            setupMessageHandlers() {
                // Register all action handlers with the broker
                this.broker.register('ping', () => ({ success: true, type: 'proxy' }));
                this.broker.register('displayContent', (request) => {
                    this.displayExtractedContent(request.content, request.metadata);
                    return { success: true };
                });
                this.broker.register('extractionProgress', (request) => {
                    this.showExtractionProgress(request.status, request.progress);
                    return { success: true };
                });
                this.broker.register('deactivate', () => {
                    this.deactivate();
                    return { success: true };
                });
                this.broker.register('showError', (request) => {
                    this.showError(request.error);
                    return { success: true };
                });
                this.broker.register('hiddenTabClosed', (request) => {
                    this.handleHiddenTabClosed(request.error);
                    return { success: true };
                });
                this.broker.register('updateSettings', (request) => {
                    this.updateSettings(request.settings);
                    return { success: true };
                });
                this.broker.register('getStatus', () => ({ active: this.isActive }));
                this.broker.register('logFromBackground', (request) => {
                    this.logToTerminal(
                        request.level || 'INFO',
                        request.message || 'Unknown message',
                        request.category || 'SYSTEM',
                        request.source || 'background',
                        request.metadata || {}
                    );
                    return { success: true };
                });
                this.broker.register('terminalLog', (request) => {
                    this.logToTerminal(
                        request.level || 'INFO',
                        request.message || 'Unknown message',
                        request.category || 'SYSTEM',
                        request.source || 'external',
                        request.metadata || {}
                    );
                    return { success: true };
                });
            }

            async loadSettings() {
                try {
                    const response = await this.broker.send(null, 'getSettings');

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

                this.broker.send(null, 'saveSettings', { settings: this.settings }).catch(error => {
                    console.error('Failed to save settings:', error);
                });
            }

            activate() {
                try {
                    console.log('🔥 Activating Vibe Mode UI');

                    this.isActive = true;

                    this.hideOriginalContent();
                    this.createInterface();

                    this.broker.send(null, 'updateBadge', { active: true }).catch(error => {
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
                for (const el of elements) {
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
                this.container.className = 'vibe-container vibe-reader-container vibe-reader-proxy';
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
                            <button class="btn-base" data-variant="accent" title="Toggle Media Mode">🌌</button>
                            <button class="btn-base" data-variant="secondary" title="Cycle Theme">🌆</button>
                            <button class="btn-base" data-variant="ghost" title="Disconnect">🌑</button>
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

                    // Check button data attributes for functionality
                    if (target.matches('[title="Toggle Media Mode"]')) {
                        this.cycleMediaMode();
                    } else if (target.matches('[title="Cycle Theme"]')) {
                        this.cycleTheme();
                    } else if (target.matches('[title="Disconnect"]')) {
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
                    config = THEME_CONFIGS[this.currentTheme] || THEME_CONFIGS.nightdrive;
                }

                return isVideo ? config.mediaIcons.video : config.mediaIcons.image;
            }

            createAsciiDisplay(isVideo) {
                const theme = this.getThemedAsciiPlaceholder(this.currentTheme);
                const label = isVideo ? theme.video : theme.image;

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
                        src, wrapperExists: !!wrapper, aalibExists: !!aalib
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
                            fontFamily,
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
                                placeholder.textContent = themeData.image || '⚠️ CONVERSION FAILED';
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
                    placeholder.textContent = themeData.image || '⚠️ CONVERSION FAILED';
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
                    'nightdrive': {
                        'image': `
________/\\\\\\\\\\\\\\\\\\\\\\__/\\\\\\\\____________/\\\\\\\\_____/\\\\\\\\\\\\\\\\\\\\\\\\_        
 _______\\/////\\\\\\///__\\/\\\\\\\\\\\\________/\\\\\\\\\\\\___/\\\\\\//////////__       
  ___________\\/\\\\\\_____\\/\\\\\\//\\\\\\____/\\\\\\//\\\\\\__/\\\\\\_____________      
   ___________\\/\\\\\\_____\\/\\\\\\\\///\\\\\\/\\\\\\/_\\/\\\\\\_\\/\\\\\\____/\\\\\\\\\\\\\\_     
    ___________\\/\\\\\\_____\\/\\\\\\__\\///\\\\\\/___\\/\\\\\\_\\/\\\\\\___\\/////\\\\\\_    
     ___________\\/\\\\\\_____\\/\\\\\\____\\///_____\\/\\\\\\_\\/\\\\\\_______\\/\\\\\\_   
      ___________\\/\\\\\\_____\\/\\\\\\_____________\\/\\\\\\_\\/\\\\\\_______\\/\\\\\\_  
       __/\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\_____________\\/\\\\\\_\\//\\\\\\\\\\\\\\\\\\\\\\\\/__ 
        _\\///__\\///////////__\\///______________\\///___\\////////////____`,
                        'video': `
________/\\\\\\________/\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\\\____        
 _______\\/\\\\\\_______\\/\\\\\\_\\/////\\\\\\///__\\/\\\\\\////////\\\\\\__       
  _______\\//\\\\\\______/\\\\\\______\\/\\\\\\_____\\/\\\\\\______\\//\\\\\\_      
   ________\\//\\\\\\____/\\\\\\_______\\/\\\\\\_____\\/\\\\\\_______\\/\\\\\\_     
    _________\\//\\\\\\__/\\\\\\________\\/\\\\\\_____\\/\\\\\\_______\\/\\\\\\_    
     __________\\//\\\\\\/\\\\\\_________\\/\\\\\\_____\\/\\\\\\_______\\/\\\\\\_   
      ___________\\//\\\\\\\\\\__________\\/\\\\\\_____\\/\\\\\\_______/\\\\\\__  
       __/\\\\\\______\\//\\\\\\________/\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\\\\\\\\\\\\\\\\\\\/___ 
        _\\///________\\///________\\///////////__\\////////////_____`
                    },

                    'neon-surge': {
                        'image': `
,e,                                     
 "  888 888 8e   ,"Y88b  e88 888  ,e e, 
888 888 888 88b "8" 888 d888 888 d88 88b
888 888 888 888 ,ee 888 Y888 888 888   ,
888 888 888 888 "88 888  "88 888  "YeeP"
                          ,  88P        
                         "8",P"         `,
                        'video': `
          ,e,      888                  
Y8b Y888P  "   e88 888  ,e e,   e88 88e 
 Y8b Y8P  888 d888 888 d88 88b d888 888b
  Y8b "   888 Y888 888 888   , Y888 888P
   Y8P    888  "88 888  "YeeP"  "88 88" `
                    },

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
::::::::::::::::::::::::::::::::::::::::::`
                    },

                    'strange-days': {
                        'image': `
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
 > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ <  > ^ < `,
                        'video': `
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
 (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_)  (_,_) `
                    },
                };
                return placeholders[theme] || placeholders.nightdrive;
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
                const themeBtn = this.container?.querySelector('[title="Cycle Theme"]');
                const mediaBtn = this.container?.querySelector('[title="Toggle Media Mode"]');
                const disconnectBtn = this.container?.querySelector('[title="Disconnect"]');

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

                const currentConfig = THEME_CONFIGS[this.currentTheme] || THEME_CONFIGS.nightdrive;

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
                this.broker.send(null, 'updateBadge', { active: false }).catch(error => {
                    console.error('Failed to update badge:', error);
                });

                this.deactivate();
            }

            deactivate() {
                try {
                    console.log('🔌 ProxyController deactivating...');

                    // Clear event listeners
                    if (this.broker) {
                        this.broker.listeners.clear();
                    }

                    // Restore console (FIX: use underscore)
                    if (this._originalConsole) {
                        Object.keys(this._originalConsole).forEach(method => {
                            console[method] = this._originalConsole[method];
                        });
                        this._originalConsole = null;
                    }

                    // Clear message queue
                    if (this.broker) {
                        this.broker.messageQueue = [];
                    }

                    // Remove DOM
                    if (this.container) {
                        this.container.remove();
                        this.container = null;
                    }

                    // MISSING: Restore original page content!
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

                    // Clear logs
                    this.diagnosticCategories = {};
                    this.sysadminLogs = [];
                    this.networkLogs = [];

                    // Mark inactive
                    this.isActive = false;

                    // Clean up singleton
                    delete window.__vibeReaderProxyController;

                    console.log('✅ ProxyController deactivated');
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
                        <button class="btn-base" data-variant="primary">RETRY EXTRACTION</button>
                    </div>
                `;

                    const retryBtn = content.querySelector('.btn-base');
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
                } 
                    return 'Unknown extraction error occurred.';
                
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
                    drop.className = 'matrix-drop animate-matrix-fall';
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
                // Initialize TerminalLogger - replaces polling with event-driven updates
                this.terminalLogger = new TerminalLogger(this);
                this.terminalLogger.init();
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
                    if (logs.length) {
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

            // Removed updateLiveTerminals() - replaced by TerminalLogger event-driven system
        }

        // Create singleton instance
        window.__vibeReaderProxyController = new ProxyController();

        true;
    } catch (error) {
        delete window.__vibeReaderProxyController; // Clean up on failure
        throw error;
    }
}