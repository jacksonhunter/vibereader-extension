// VibeReader Popup - JavaScript Controller
// vibeReader.popup() // Manages the popup interface and settings

class VibeReaderPopup {
    constructor() {
        this.currentTab = null;
        this.settings = {
            theme: 'nightdrive',
            mediaMode: 'emoji', // 'emoji', 'ascii', 'normal'
            sideScrolls: true,
            vibeRain: false,
            autoActivate: false
        };
        
        this.init();
    }
    
    async init() {
        // Get current tab f
        this.currentTab = await this.getCurrentTab();
        
        // Load settings
        await this.loadSettings();
        
        // Update UI with current status
        await this.updateStatus();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Apply initial glitch effect
        this.initGlitchEffects();
    }
    
    setupEventListeners() {
        // Toggle button
        document.getElementById('toggle-btn').addEventListener('click', () => {
            this.toggleVibeMode();
        });
        
        // Theme cycle button
        document.getElementById('theme-btn').addEventListener('click', () => {
            this.cycleTheme();
        });
        
        // Settings toggle button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.toggleSettings();
        });
        
        // Settings controls
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.updateSetting('theme', e.target.value);
        });
        
        document.getElementById('media-mode').addEventListener('change', (e) => {
            this.updateSetting('mediaMode', e.target.value);
        });
        
        document.getElementById('side-scrolls').addEventListener('change', (e) => {
            this.updateSetting('sideScrolls', e.target.checked);
        });
        
        document.getElementById('vibe-rain').addEventListener('change', (e) => {
            this.updateSetting('vibeRain', e.target.checked);
        });
        
        document.getElementById('auto-activate').addEventListener('change', (e) => {
            this.updateSetting('autoActivate', e.target.checked);
        });
        
        // Reset settings
        document.getElementById('reset-settings').addEventListener('click', () => {
            this.resetSettings();
        });
        
        // Footer links
        document.getElementById('help-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });
        
        document.getElementById('about-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAbout();
        });
    }
    
    async getCurrentTab() {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            return tabs[0];
        } catch (error) {
            console.error('Failed to get current tab:', error);
            return null;
        }
    }
    
    async loadSettings() {
        try {
            const result = await browser.storage.sync.get('vibeReaderSettings');
            if (result.vibeReaderSettings) {
                this.settings = { ...this.settings, ...result.vibeReaderSettings };
            }
            this.updateSettingsUI();
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.updateSettingsUI();
        }
    }
    
    async saveSettings() {
        try {
            await browser.storage.sync.set({ vibeReaderSettings: this.settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    updateSettingsUI() {
        document.getElementById('theme-select').value = this.settings.theme;
        document.getElementById('media-mode').value = this.settings.mediaMode || 'emoji';
        document.getElementById('side-scrolls').checked = this.settings.sideScrolls;
        document.getElementById('vibe-rain').checked = this.settings.vibeRain;
        document.getElementById('auto-activate').checked = this.settings.autoActivate;
    }
    
    async updateSetting(key, value) {
        this.settings[key] = value;
        await this.saveSettings();
        
        // Send update to content script
        if (this.currentTab) {
            try {
                await browser.tabs.sendMessage(this.currentTab.id, {
                    action: 'updateSettings',
                    settings: this.settings
                });
            } catch (error) {
                console.log('Content script not ready for settings update');
            }
        }
        
        // Show feedback\n        this.showFeedback(`${key} updated!`);
    }
    
    async updateStatus() {
        if (!this.currentTab) return;
        
        // Check if VibeReader is active on current tab
        try {
            const response = await browser.tabs.sendMessage(this.currentTab.id, { action: 'getStatus' });
            this.setStatus(response?.active || false);
        } catch (error) {
            // Content script not loaded
            this.setStatus(false);
        }
    }
    
    setStatus(isActive) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusIcon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');
        const toggleBtn = document.getElementById('toggle-btn');
        const toggleBtnText = toggleBtn.querySelector('.btn-text');
        
        if (isActive) {
            statusIndicator.classList.add('active');
            statusIcon.textContent = '🔥';
            statusText.textContent = 'VIBES ACTIVE';
            toggleBtnText.textContent = '.kill()';
            toggleBtn.classList.add('neon-pulse');
        } else {
            statusIndicator.classList.remove('active');
            statusIcon.textContent = '⚡';
            statusText.textContent = 'STANDBY';
            toggleBtnText.textContent = '.setVibes()';
            toggleBtn.classList.remove('neon-pulse');
        }
    }
    
    async toggleVibeMode() {
        if (!this.currentTab) return;
        
        // Show loading state
        const toggleBtn = document.getElementById('toggle-btn');
        const toggleBtnText = toggleBtn.querySelector('.btn-text');
        const originalText = toggleBtnText.textContent;
        
        toggleBtnText.textContent = 'PROCESSING...';
        toggleBtn.disabled = true;
        
        try {
            // Close popup to avoid blocking the activation
            window.close();
            
            // Let the background script handle the activation
            // This will trigger the same logic as clicking the browser action
            browser.runtime.sendMessage({ action: 'toggleFromPopup', tabId: this.currentTab.id });
            
        } catch (error) {
            console.error('Toggle failed:', error);
            toggleBtnText.textContent = originalText;
            toggleBtn.disabled = false;
            this.showFeedback('❌ Activation failed!', 'error');
        }
    }
    
    cycleTheme() {
        const themes = ['nightdrive', 'neon-surge', 'outrun-storm', 'strange-days'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.updateSetting('theme', themes[nextIndex]);
        this.showFeedback(`🎨 Theme: ${themes[nextIndex]}!`);
        
        // Update theme display
        const themeNames = {
            'nightdrive': 'Nightdrive Enhanced',
            'neon-surge': 'Neon Surge',
            'outrun-storm': 'Outrun Storm',
            'strange-days': 'Strange Days'
        };
        
        const themeBtn = document.getElementById('theme-btn');
        const themeBtnText = themeBtn.querySelector('.btn-text');
        themeBtnText.textContent = themeNames[themes[nextIndex]].split(' ')[0].toUpperCase();
        
        this.addSuccessEffect(themeBtn);
    }
    
    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        const settingsBtn = document.getElementById('settings-btn');
        
        if (settingsPanel.classList.contains('open')) {
            settingsPanel.classList.remove('open');
            settingsBtn.querySelector('.btn-text').textContent = 'CONFIG';
        } else {
            settingsPanel.classList.add('open');
            settingsBtn.querySelector('.btn-text').textContent = 'CLOSE';
        }
        
        this.addSuccessEffect(settingsBtn);
    }
    
    async resetSettings() {
        this.settings = {
            theme: 'nightdrive',
            asciiImages: true,
            sideScrolls: true,
            vibeRain: true,
            autoActivate: false
        };
        
        await this.saveSettings();
        this.updateSettingsUI();
        
        // Send update to content script
        if (this.currentTab) {
            try {
                await browser.tabs.sendMessage(this.currentTab.id, {
                    action: 'updateSettings',
                    settings: this.settings
                });
            } catch (error) {
                console.log('Content script not ready for settings update');
            }
        }
        
        this.showFeedback('🔄 Settings reset!');
        
        const resetBtn = document.getElementById('reset-settings');
        this.addSuccessEffect(resetBtn);
    }
    
    showHelp() {
        const helpText = `
🔥 VIBE READER HELP 🔥

ACTIVATION:
• Click ".setVibes()" or use Ctrl+Shift+M
• vibeReader.init() // transforms any webpage into cyberpunk mode

FEATURES:
🎭 Visual Themes - 4 synthwave aesthetics
📸 ASCII Images - Converts images to text art
📜 Side Scrolls - Live metadata streams
🌧️ Vibe Rain - Background digital rain effect

CONTROLS:
🎨 THEME - Cycle through visual themes
⚙️ CONFIG - Open/close settings panel
🔄 RESET - Restore default settings

HOTKEYS:
Ctrl+Shift+M - vibeReader.setVibes()
        `.trim();
        
        alert(helpText);
    }
    
    showAbout() {
        const aboutText = `
🔥 VIBE READER v2.0.0 🔥

vibeReader.setVibes() // Transform any webpage into a cyberpunk coding aesthetic with hidden tab proxy architecture

FEATURES:
✨ 4 unique synthwave themes
✨ Real-time ASCII image conversion
✨ Live metadata side-scrollers
✨ Vibe rain background effects
✨ Glitch text animations
✨ Neon glow effects

Created with love for cyberpunk enthusiasts.

🚀 vibeReader.init() // Enter the code. Read the vibes. 🚀
        `.trim();
        
        alert(aboutText);
    }
    
    showFeedback(message, type = 'success') {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'var(--neon-pink)' : 'var(--neon-green)'};
            color: black;
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 0 20px ${type === 'error' ? 'var(--glow-primary)' : 'rgba(57, 255, 20, 0.8)'};
            animation: feedback-slide 3s ease-out forwards;
        `;
        
        document.body.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
    }
    
    addSuccessEffect(element) {
        element.classList.add('neon-pulse');
        setTimeout(() => {
            element.classList.remove('neon-pulse');
        }, 1000);
    }
    
    initGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch');
        
        glitchElements.forEach(element => {
            setInterval(() => {
                if (Math.random() < 0.15) { // 15% chance
                    element.classList.add('glitching');
                    setTimeout(() => {
                        element.classList.remove('glitching');
                    }, 300);
                }
            }, 3000);
        });
    }
}

// Add CSS for feedback animation
const style = document.createElement('style');
style.textContent = `
    @keyframes feedback-slide {
        0% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
        }
        10%, 90% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
        }
        100% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
        }
    }
`;
document.head.appendChild(style);

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new VibeReaderPopup();
    });
} else {
    new VibeReaderPopup();
}