// VibeReader Popup - Enhanced JavaScript Controller with Persistence
// vibeReader.popup() // Manages the popup interface and settings

class VibeReaderPopup {
  constructor() {
    this.currentTab = null;
    this.isActive = false;
    this.settings = {
      // Core settings (saved to extension)
      theme: "nightdrive",
      mediaMode: "emoji", // 'emoji', 'ascii', 'normal'
      sideScrolls: true,
      vibeRain: false,
      autoActivate: false,
    };

    // Popup-specific settings (saved separately)
    this.popupState = {
      lastCheckedTab: null,
      settingsPanelOpen: false,
      compactView: false,
      closeOnActivate: false,
      showAdvanced: false,
    };

    // Tracking
    this.settingsChanged = false;
    this.saveTimeout = null;
    this.autoSaveInterval = null;

    this.init();
  }

  async init() {
    // Load all settings first
    await this.loadAllSettings();

    // Get current tab
    this.currentTab = await this.getCurrentTab();

    // Update UI with current status
    await this.updateStatus();

    // Setup event listeners
    this.setupEventListeners();

    // Apply initial glitch effect
    this.initGlitchEffects();

    // Enable auto-save
    this.enableAutoSave();

    // Restore UI state
    this.restoreUIState();

    // Check if we should auto-close from last activation
    this.checkAutoClose();
  }

  async loadAllSettings() {
    try {
      const stored = await browser.storage.sync.get({
        vibeReaderSettings: {},
        vibeReaderPopupState: {},
      });

      // Load extension settings
      if (stored.vibeReaderSettings) {
        this.settings = { ...this.settings, ...stored.vibeReaderSettings };
      }

      // Load popup state
      if (stored.vibeReaderPopupState) {
        this.popupState = {
          ...this.popupState,
          ...stored.vibeReaderPopupState,
        };
      }
      // Load debug mode state
      const debugState = await browser.storage.local.get("vibeDebugEnabled");
      const debugCheckbox = document.getElementById("vibe-debug");
      if (debugCheckbox && debugState.vibeDebugEnabled) {
        debugCheckbox.checked = true;
      }

      this.updateSettingsUI();

      console.log("📦 Settings loaded:", {
        settings: this.settings,
        popupState: this.popupState,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      this.updateSettingsUI();
    }
  }

  async saveAllSettings(immediate = false) {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    const doSave = async () => {
      try {
        // Save both extension settings and popup state
        await browser.storage.sync.set({
          vibeReaderSettings: this.settings,
          vibeReaderPopupState: this.popupState,
        });

        console.log("💾 Settings saved:", {
          settings: this.settings,
          popupState: this.popupState,
        });

        // Show save indicator
        this.showSaveIndicator();

        // Mark as saved
        this.settingsChanged = false;
      } catch (error) {
        console.error("Failed to save settings:", error);
        this.showFeedback("❌ Save failed!", "error");
      }
    };

    if (immediate) {
      await doSave();
    } else {
      // Debounce saves to prevent excessive writes
      this.saveTimeout = setTimeout(doSave, 500);
    }
  }

  enableAutoSave() {
    // Save immediately when popup closes
    window.addEventListener("beforeunload", () => {
      if (this.settingsChanged) {
        this.saveAllSettings(true); // Force immediate save
      }
    });

    // Also save periodically while open
    this.autoSaveInterval = setInterval(() => {
      if (this.settingsChanged) {
        this.saveAllSettings();
      }
    }, 5000); // Every 5 seconds

    // Save on visibility change (popup loses focus)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.settingsChanged) {
        this.saveAllSettings(true);
      }
    });
  }

  restoreUIState() {
    // Restore settings panel state
    if (this.popupState.settingsPanelOpen) {
      const settingsPanel = document.getElementById("settings-panel");
      const settingsBtn = document.getElementById("settings-btn");
      if (settingsPanel && settingsBtn) {
        settingsPanel.classList.add("open");
        settingsBtn.querySelector(".btn-text").textContent = "CLOSE";
      }
    }

    // Apply compact view if saved
    if (this.popupState.compactView) {
      document.body.classList.add("compact-view");
    }

    // Show advanced settings if previously shown
    if (this.popupState.showAdvanced) {
      this.showAdvancedSettings();
    }
  }

  checkAutoClose() {
    // If popup was set to close on activate and tab is now active, close
    if (this.popupState.closeOnActivate && this.isActive) {
      setTimeout(() => {
        window.close();
      }, 1000); // Give user a moment to see the status
    }
  }

  setupEventListeners() {
    // Original event listeners
    document.getElementById("toggle-btn").addEventListener("click", () => {
      this.toggleVibeMode();
    });

    document.getElementById("theme-btn").addEventListener("click", () => {
      this.cycleTheme();
    });

    document.getElementById("settings-btn").addEventListener("click", () => {
      this.toggleSettings();
    });

    // Enhanced settings controls with auto-save
    document.getElementById("theme-select").addEventListener("change", (e) => {
      this.updateSetting("theme", e.target.value);
    });

    document.getElementById("media-mode").addEventListener("change", (e) => {
      this.updateSetting("mediaMode", e.target.value);
    });

    document.getElementById("side-scrolls").addEventListener("change", (e) => {
      this.updateSetting("sideScrolls", e.target.checked);
    });

    document.getElementById("vibe-rain").addEventListener("change", (e) => {
      this.updateSetting("vibeRain", e.target.checked);
    });

    document.getElementById("auto-activate").addEventListener("change", (e) => {
      this.updateSetting("autoActivate", e.target.checked);
    });

    document.getElementById("auto-activate").addEventListener("change", (e) => {
      this.updateSetting("autoActivate", e.target.checked);
    });

    document
      .getElementById("vibe-debug")
      .addEventListener("change", async (e) => {
        const enabled = e.target.checked;

        // Send to all tabs to toggle debug mode
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
          browser.tabs
            .sendMessage(tab.id, {
              action: "toggleVibeDebug",
              enabled,
            })
            .catch(() => {}); // Ignore tabs without content scripts
        }

        // Save state
        await browser.storage.local.set({
          vibeDebugEnabled: enabled,
        });

        this.showFeedback(`Debug mode ${enabled ? "enabled" : "disabled"}`);
      });
    // Add new persistence controls
    this.addPersistenceControls();

    // Reset settings
    document.getElementById("reset-settings").addEventListener("click", () => {
      this.resetSettings();
    });

    // Footer links
    document.getElementById("help-link").addEventListener("click", (e) => {
      e.preventDefault();
      this.showHelp();
    });

    document.getElementById("about-link").addEventListener("click", (e) => {
      e.preventDefault();
      this.showAbout();
    });

    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  addPersistenceControls() {
    // Add advanced settings section if not exists
    const settingsPanel = document.getElementById("settings-panel");
    if (settingsPanel && !document.getElementById("advanced-settings")) {
      const advancedSection = document.createElement("div");
      advancedSection.id = "advanced-settings";
      advancedSection.className = "settings-section advanced-section";
      // eslint-disable-next-line no-unsanitized/property
      advancedSection.innerHTML = `
                <div class="section-header">
                    <span class="section-title">💾 PERSISTENCE</span>
                </div>
                
                <div class="setting-item">
                    <input type="checkbox" id="close-on-activate" ${
                      this.popupState.closeOnActivate ? "checked" : ""
                    }>
                    <label for="close-on-activate">Auto-close on activation</label>
                </div>
                
                <div class="setting-item">
                    <input type="checkbox" id="compact-view" ${
                      this.popupState.compactView ? "checked" : ""
                    }>
                    <label for="compact-view">Compact view</label>
                </div>
                
                <div class="button-group">
                    <button id="export-settings" class="cyber-btn btn-small">
                        <span class="btn-text">EXPORT</span>
                    </button>
                    <button id="import-settings" class="cyber-btn btn-small">
                        <span class="btn-text">IMPORT</span>
                    </button>
                    <button id="clear-data" class="cyber-btn btn-small btn-danger">
                        <span class="btn-text">CLEAR</span>
                    </button>
                </div>
                
                <div id="save-indicator" class="save-indicator" style="opacity: 0;">
                    ✓ Settings saved
                </div>
            `;

      settingsPanel.appendChild(advancedSection);

      // Add event listeners for new controls
      document
        .getElementById("close-on-activate")
        .addEventListener("change", (e) => {
          this.popupState.closeOnActivate = e.target.checked;
          this.settingsChanged = true;
          this.saveAllSettings();
        });

      document
        .getElementById("compact-view")
        .addEventListener("change", (e) => {
          this.popupState.compactView = e.target.checked;
          document.body.classList.toggle("compact-view", e.target.checked);
          this.settingsChanged = true;
          this.saveAllSettings();
        });

      document
        .getElementById("export-settings")
        .addEventListener("click", () => {
          this.exportSettings();
        });

      document
        .getElementById("import-settings")
        .addEventListener("click", () => {
          this.importSettings();
        });

      document.getElementById("clear-data").addEventListener("click", () => {
        this.clearAllData();
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.saveAllSettings(true);
        this.showFeedback("💾 Settings saved!");
      }

      // Ctrl/Cmd + D for debug mode toggle
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const debugToggle = document.getElementById("vibe-debug");
        if (debugToggle) {
          debugToggle.checked = !debugToggle.checked;
          debugToggle.dispatchEvent(new Event("change"));
        }
      }

      // Escape to close settings
      if (e.key === "Escape") {
        const settingsPanel = document.getElementById("settings-panel");
        if (settingsPanel.classList.contains("open")) {
          this.toggleSettings();
        }
      }

      // Ctrl/Cmd + E to export
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        this.exportSettings();
      }
    });
  }

  async getCurrentTab() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];

      // Store last checked tab
      if (tab) {
        this.popupState.lastCheckedTab = {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          timestamp: Date.now(),
        };
        this.settingsChanged = true;
      }

      return tab;
    } catch (error) {
      console.error("Failed to get current tab:", error);
      return null;
    }
  }

  async updateSetting(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    this.settingsChanged = true;

    // Save settings with debouncing
    await this.saveAllSettings();

    // Send update to content script
    if (this.currentTab) {
      try {
        await browser.tabs.sendMessage(this.currentTab.id, {
          action: "updateSettings",
          settings: this.settings,
        });
      } catch (error) {
        console.log("Content script not ready for settings update");
      }
    }

    // Show feedback with old vs new value
    this.showFeedback(`${key}: ${oldValue} → ${value}`);
  }

  async updateStatus() {
    if (!this.currentTab) return;

    // Check if VibeReader is active on current tab
    try {
      const response = await browser.tabs.sendMessage(this.currentTab.id, {
        action: "getStatus",
      });
      this.isActive = response?.active || false;
      this.setStatus(this.isActive);
    } catch (error) {
      // Content script not loaded
      this.isActive = false;
      this.setStatus(false);
    }
  }

  setStatus(isActive) {
    const statusIndicator = document.getElementById("status-indicator");
    const statusIcon = document.getElementById("status-icon");
    const statusText = document.getElementById("status-text");
    const toggleBtn = document.getElementById("toggle-btn");
    const toggleBtnText = toggleBtn.querySelector(".btn-text");

    if (isActive) {
      statusIndicator.classList.add("active");
      statusIcon.textContent = "🔥";
      statusText.textContent = "VIBES ACTIVE";
      toggleBtnText.textContent = ".kill()";
      toggleBtn.classList.add("neon-pulse");
    } else {
      statusIndicator.classList.remove("active");
      statusIcon.textContent = "⚡";
      statusText.textContent = "STANDBY";
      toggleBtnText.textContent = "Set Vibes";
      toggleBtn.classList.remove("neon-pulse");
    }

    // Update last status timestamp
    this.popupState.lastStatusCheck = Date.now();
  }

  async toggleVibeMode() {
    if (!this.currentTab) return;

    // Show loading state
    const toggleBtn = document.getElementById("toggle-btn");
    const toggleBtnText = toggleBtn.querySelector(".btn-text");
    const originalText = toggleBtnText.textContent;

    toggleBtnText.textContent = "PROCESSING...";
    toggleBtn.disabled = true;

    try {
      // Save current state before closing
      await this.saveAllSettings(true);

      // Check if we should close popup
      if (this.popupState.closeOnActivate && !this.isActive) {
        window.close();
      }

      // Let the background script handle the activation
      browser.runtime.sendMessage({
        action: "toggleFromPopup",
        tabId: this.currentTab.id,
      });

      // If not closing, update status after a delay
      if (!this.popupState.closeOnActivate || this.isActive) {
        setTimeout(async () => {
          await this.updateStatus();
          toggleBtn.disabled = false;
        }, 1000);
      }
    } catch (error) {
      console.error("Toggle failed:", error);
      toggleBtnText.textContent = originalText;
      toggleBtn.disabled = false;
      this.showFeedback("❌ Activation failed!", "error");
    }
  }

  cycleTheme() {
    const themes = ["nightdrive", "neon-surge", "outrun-storm", "strange-days"];
    const currentIndex = themes.indexOf(this.settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;

    this.updateSetting("theme", themes[nextIndex]);
    this.showFeedback(`🎨 Theme: ${themes[nextIndex]}!`);

    // Update theme display
    const themeNames = {
      nightdrive: "Nightdrive Enhanced",
      "neon-surge": "Neon Surge",
      "outrun-storm": "Outrun Storm",
      "strange-days": "Strange Days",
    };

    const themeBtn = document.getElementById("theme-btn");
    const themeBtnText = themeBtn.querySelector(".btn-text");
    themeBtnText.textContent = themeNames[themes[nextIndex]]
      .split(" ")[0]
      .toUpperCase();

    this.addSuccessEffect(themeBtn);
  }

  toggleSettings() {
    const settingsPanel = document.getElementById("settings-panel");
    const settingsBtn = document.getElementById("settings-btn");

    if (settingsPanel.classList.contains("open")) {
      settingsPanel.classList.remove("open");
      settingsBtn.querySelector(".btn-text").textContent = "CONFIG";
      this.popupState.settingsPanelOpen = false;
    } else {
      settingsPanel.classList.add("open");
      settingsBtn.querySelector(".btn-text").textContent = "CLOSE";
      this.popupState.settingsPanelOpen = true;
    }

    this.settingsChanged = true;
    this.saveAllSettings();
    this.addSuccessEffect(settingsBtn);
  }

  async resetSettings() {
    if (!confirm("Reset all settings to defaults?")) return;

    this.settings = {
      theme: "nightdrive",
      mediaMode: "emoji",
      sideScrolls: true,
      vibeRain: false,
      autoActivate: false,
    };

    // Keep popup state but reset some values
    this.popupState.closeOnActivate = false;
    this.popupState.compactView = false;

    this.settingsChanged = true;
    await this.saveAllSettings(true);
    this.updateSettingsUI();

    // Send update to content script
    if (this.currentTab) {
      try {
        await browser.tabs.sendMessage(this.currentTab.id, {
          action: "updateSettings",
          settings: this.settings,
        });
      } catch (error) {
        console.log("Content script not ready for settings update");
      }
    }

    this.showFeedback("🔄 Settings reset!");

    const resetBtn = document.getElementById("reset-settings");
    this.addSuccessEffect(resetBtn);
  }

  exportSettings() {
    const exportData = {
      version: "2.0.0",
      timestamp: Date.now(),
      settings: this.settings,
      popupState: this.popupState,
      lastCheckedTab: this.popupState.lastCheckedTab,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `vibereader-settings-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.showFeedback("📦 Settings exported!");
    this.addSuccessEffect(document.getElementById("export-settings"));
  }

  importSettings() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = JSON.parse(text);

          // Validate version compatibility
          if (imported.version && imported.version.startsWith("2.")) {
            this.settings = { ...this.settings, ...imported.settings };
            this.popupState = { ...this.popupState, ...imported.popupState };

            this.settingsChanged = true;
            await this.saveAllSettings(true);
            this.updateSettingsUI();
            this.restoreUIState();

            this.showFeedback("📥 Settings imported!");
            this.addSuccessEffect(document.getElementById("import-settings"));
          } else {
            this.showFeedback("❌ Incompatible version!", "error");
          }
        } catch (error) {
          console.error("Import failed:", error);
          this.showFeedback("❌ Invalid settings file!", "error");
        }
      }
    });

    input.click();
  }

  async clearAllData() {
    if (!confirm("Clear all stored data? This cannot be undone!")) return;

    try {
      await browser.storage.sync.clear();
      await browser.storage.local.clear();

      this.showFeedback("🗑️ All data cleared!");

      // Reset to defaults
      setTimeout(() => {
        this.resetSettings();
      }, 1000);
    } catch (error) {
      console.error("Failed to clear data:", error);
      this.showFeedback("❌ Clear failed!", "error");
    }
  }

  updateSettingsUI() {
    document.getElementById("theme-select").value = this.settings.theme;
    document.getElementById("media-mode").value =
      this.settings.mediaMode || "emoji";
    document.getElementById("side-scrolls").checked = this.settings.sideScrolls;
    document.getElementById("vibe-rain").checked = this.settings.vibeRain;
    document.getElementById("auto-activate").checked =
      this.settings.autoActivate;

    // Update advanced settings if they exist
    const closeOnActivate = document.getElementById("close-on-activate");
    if (closeOnActivate) {
      closeOnActivate.checked = this.popupState.closeOnActivate;
    }

    const compactView = document.getElementById("compact-view");
    if (compactView) {
      compactView.checked = this.popupState.compactView;
    }
  }

  showSaveIndicator() {
    const indicator = document.getElementById("save-indicator");
    if (indicator) {
      indicator.style.opacity = "1";
      indicator.textContent = "✓ Settings saved";

      setTimeout(() => {
        indicator.style.opacity = "0";
      }, 2000);
    }
  }

  showHelp() {
    const helpText = `
🔥 VIBE READER HELP 🔥

ACTIVATION:
• Click "Set Vibes" or use Ctrl+Shift+M
• vibeReader.init() // transforms any webpage

FEATURES:
🎭 Visual Themes - 4 synthwave aesthetics
📸 Media Modes - Emoji/ASCII/Normal display
📜 Side Scrolls - Terminal metadata panels
🌧️ Vibe Rain - Matrix background effect

PERSISTENCE:
💾 Auto-saves settings every 5 seconds
📦 Export/Import settings as JSON
🗑️ Clear all stored data

KEYBOARD SHORTCUTS:
Ctrl+Shift+M - Toggle Vibe Mode
Ctrl+S - Save settings immediately
Ctrl+E - Export settings
Escape - Close settings panel

HOTKEYS:
Ctrl+Shift+M - Set Vibes
        `.trim();

    alert(helpText);
  }

  showAbout() {
    const aboutText = `
🔥 VIBE READER v2.0.0 🔥

Set Vibes // Transform any webpage into a cyberpunk coding aesthetic with hidden tab proxy architecture

FEATURES:
✨ 4 unique synthwave themes
✨ Real-time ASCII image conversion  
✨ Live metadata terminals
✨ Matrix rain effects
✨ Glitch text animations
✨ Neon glow effects
✨ Persistent settings with auto-save
✨ Export/Import configuration

Created with love for cyberpunk enthusiasts.

🚀 vibeReader.init() // Enter the code. Read the vibes. 🚀
        `.trim();

    alert(aboutText);
  }

  showFeedback(message, type = "success") {
    // Create feedback element
    const feedback = document.createElement("div");
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${
              type === "error" ? "var(--neon-pink)" : "var(--neon-green)"
            };
            color: black;
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 0 20px ${
              type === "error"
                ? "var(--glow-primary)"
                : "rgba(57, 255, 20, 0.8)"
            };
            animation: feedback-slide 3s ease-out forwards;
        `;

    document.body.appendChild(feedback);

    // Remove after animation
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 3000);
  }

  addSuccessEffect(element) {
    if (!element) return;
    element.classList.add("neon-pulse");
    setTimeout(() => {
      element.classList.remove("neon-pulse");
    }, 1000);
  }

  initGlitchEffects() {
    const glitchElements = document.querySelectorAll(".glitch");

    glitchElements.forEach((element) => {
      setInterval(() => {
        if (Math.random() < 0.15) {
          // 15% chance
          element.classList.add("glitching");
          setTimeout(() => {
            element.classList.remove("glitching");
          }, 300);
        }
      }, 3000);
    });
  }
}

// Add CSS for feedback animation and new features
const style = document.createElement("style");
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
    
    .save-indicator {
        text-align: center;
        color: var(--neon-green);
        font-size: 10px;
        margin-top: 10px;
        transition: opacity 0.3s ease;
        text-shadow: 0 0 10px rgba(57, 255, 20, 0.8);
    }
    
    .advanced-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(102, 217, 239, 0.3);
    }
    
    .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .section-title {
        font-size: 11px;
        font-weight: bold;
        color: var(--neon-cyan);
        text-transform: uppercase;
        letter-spacing: 2px;
    }
    
    .button-group {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .btn-small {
        padding: 4px 8px !important;
        font-size: 10px !important;
    }
    
    .btn-danger {
        background: rgba(255, 0, 0, 0.1) !important;
        border-color: rgba(255, 0, 0, 0.5) !important;
    }
    
    .btn-danger:hover {
        background: rgba(255, 0, 0, 0.2) !important;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5) !important;
    }
    
    .compact-view .settings-panel {
        max-height: 300px !important;
        overflow-y: auto !important;
    }
    
    .compact-view .popup-container {
        min-height: auto !important;
    }
`;
document.head.appendChild(style);

// Initialize popup when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new VibeReaderPopup();
  });
} else {
  new VibeReaderPopup();
}
