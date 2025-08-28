// VibeReader v2.0 - Background manager and script injector

// Unified Script Injector - eliminates duplicate injection logic
class ScriptInjector {
  constructor(logToVisibleFn) {
    this.logToVisible = logToVisibleFn;
    this.scripts = {
      extractor: {
        dependencies: [
          { file: "src/vibe-utils.js" },
          {
            file: "lib/purify.min.js",
            verify: 'typeof DOMPurify !== "undefined"',
            name: "DOMPurify.js",
          },
          {
            file: "lib/readability.js",
            verify: 'typeof Readability !== "undefined"',
            name: "Readability.js",
          },
        ],
        main: { file: "src/stealth-extractor.js" },
        pingType: "extractor",
      },
      proxy: {
        dependencies: [
          { file: "src/vibe-utils.js" },
          {
            file: "lib/rxjs.min.js",
            verify: 'typeof Rx !== "undefined"',
            name: "RxJS",
          },
          {
            file: "lib/aalib.js",
            verify: 'typeof aalib !== "undefined"',
            name: "aalib.js",
          },
        ],
        main: { file: "src/proxy-controller.js" },
        css: { file: "styles/generated.css" },
        pingType: "proxy",
        needsLogTarget: true, // Proxy needs visible tab ID for logging
      },
    };
  }

  async inject(tabId, scriptType, visibleTabId = null) {
    const config = this.scripts[scriptType];
    if (!config) throw new Error(`Unknown script type: ${scriptType}`);

    const logTabId = config.needsLogTarget ? visibleTabId : tabId;

    // Check if already injected
    if (await this.isInjected(tabId, config.pingType)) {
      console.log(`⚠️ ${scriptType} already injected`);
      return true;
    }

    // Log injection start
    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        `🔧 Injecting ${scriptType} scripts`,
        "SYSTEM",
      );
    }

    // Inject dependencies in order
    for (const dep of config.dependencies) {
      await this.injectFile(tabId, dep, logTabId);

      if (dep.verify) {
        await this.verifyCode(tabId, dep.verify, dep.name, logTabId);
      }
    }

    // Inject main script
    await this.injectFile(tabId, config.main, logTabId);

    // Inject CSS if present
    if (config.css) {
      await this.injectCSS(tabId, config.css, logTabId);
    }

    // Wait for script to be ready
    return this.waitForReady(tabId, config.pingType);
  }

  async injectFile(tabId, fileConfig, logTabId = null) {
    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        `📚 Injecting ${fileConfig.file}`,
        "SYSTEM",
      );
    }

    return browser.tabs.executeScript(tabId, {
      file: fileConfig.file,
      runAt: fileConfig.runAt || "document_end",
    });
  }

  async verifyCode(tabId, verifyCode, scriptName = "script", logTabId = null) {
    const [result] = await browser.tabs.executeScript(tabId, {
      code: verifyCode,
      runAt: "document_end",
    });

    if (!result) {
      throw new Error(`${scriptName} failed to load properly`);
    }

    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        `✅ ${scriptName} loaded successfully`,
        "SYSTEM",
      );
    }

    return result;
  }

  async injectCSS(tabId, cssConfig, logTabId = null) {
    if (logTabId && this.logToVisible) {
      await this.logToVisible(
        logTabId,
        "INFO",
        "🎨 Injecting generated.css",
        "CSS",
      );
    }

    await browser.tabs.insertCSS(tabId, {
      file: cssConfig.file,
      allFrames: false,
      runAt: "document_start",
    });

    // Give CSS time to apply
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (logTabId && this.logToVisible) {
      await this.verifyCSSLoadingLenient(tabId, logTabId);
    }
  }

  async verifyCSSLoadingLenient(tabId, logTabId) {
    try {
      const result = await browser.tabs.executeScript(tabId, {
        code: `
                    const sheets = document.styleSheets.length;
                    const hasExtensionCSS = Array.from(document.styleSheets).some(s => 
                        s.href && s.href.includes(chrome.runtime.id)
                    );
                    ({ sheets, hasExtensionCSS });
                `,
      });

      if (result[0].hasExtensionCSS) {
        await this.logToVisible(
          logTabId,
          "INFO",
          "✅ Extension CSS detected",
          "CSS",
        );
      } else {
        await this.logToVisible(
          logTabId,
          "WARN",
          "⚠️ CSS may not be fully loaded",
          "CSS",
        );
      }
    } catch (error) {
      await this.logToVisible(
        logTabId,
        "ERR",
        `❌ CSS verification failed: ${error.message}`,
        "CSS",
      );
    }
  }

  async isInjected(tabId, type) {
    try {
      const result = await browser.tabs.sendMessage(tabId, { action: "ping" });
      return result?.type === type;
    } catch {
      return false;
    }
  }

  async waitForReady(tabId, type, timeout = 2000) {
    const start = Date.now();
    const interval = 200;
    const maxAttempts = Math.floor(timeout / interval);

    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isInjected(tabId, type)) {
        console.log(`✅ ${type} ready after ${Date.now() - start}ms`);
        return true;
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    console.warn(`⚠️ ${type} not ready after ${timeout}ms`);
    return false;
  }
}

// WaitHelper removed - not used

// Consolidated cleanup operations
class TabCleaner {
  static cleanup(tabStates, tabRegistry, tabDataCache, tabId) {
    console.log("🗑️ TabCleaner cleaning up tab:", tabId);

    const state = tabStates.get(tabId);
    if (state) {
      // Clear all timers
      if (state.timers && state.timers.size > 0) {
        state.timers.forEach((timerId) => {
          clearTimeout(timerId);
          clearInterval(timerId);
        });
        state.timers.clear();
      }

      // Close hidden tab
      if (state.hiddenTabId) {
        browser.tabs.remove(state.hiddenTabId).catch(() => {});
      }
    }

    // Clean up WeakMap data
    const tabRef = tabDataCache.get(tabId);
    if (tabRef) {
      const tabData = tabRegistry.get(tabRef);
      if (tabData && tabData.timers) {
        tabData.timers.forEach((timerId) => {
          clearTimeout(timerId);
          clearInterval(timerId);
        });
        tabData.timers.clear();
      }
      tabDataCache.delete(tabId);
    }

    // Remove from consolidated state
    tabStates.delete(tabId);

    // Update badge
    browser.browserAction.setBadgeText({ text: "", tabId });
  }
}

class HiddenTabManager {
  constructor() {
    // Enhanced WeakMap for automatic memory cleanup when tabs are garbage collected
    this.tabRegistry = new WeakMap();
    this.tabDataCache = new Map(); // tab ID -> WeakMap key for reverse lookup

    // CONSOLIDATED STATE MANAGEMENT - single source of truth
    this.tabStates = new Map(); // tabId -> complete state object

    // Legacy Maps (gradually migrate to tabStates)
    this.hiddenTabs = new Map(); // visible tab ID -> hidden tab ID
    this.extractionStatus = new Map(); // hidden tab ID -> extraction info
    this.activeTabIds = new Set(); // Currently active visible tab IDs
    this.injectionStatus = new Map(); // tab ID -> injection status

    // DEBUG: Tab creation monitoring (for debugging + future tab manager foundation)
    this.tabCreationLog = new Map(); // visible tab ID -> array of creation attempts
    this.debugMode = true; // Enable tab creation debugging

    // Tab creation throttling
    this.tabCreationQueue = new Map();
    this.tabCreationCooldown = 1000; // 1 second between tabs
    this.lastTabCreation = 0;

    // Initialize MessageBroker and register handlers
    this.broker = new MessageBroker();
    this.setupMessageHandlers();

    // Initialize ScriptInjector with logging integration
    this.injector = new ScriptInjector(this.logToVisible.bind(this));

    this.init();
  }
  setupMessageHandlers() {
    // Register all action handlers with the broker
    this.broker.register("ping", () => ({ type: "background" }));
    this.broker.register("toggleFromPopup", (request) =>
      this.handleToggleFromPopup(request),
    );
    this.broker.register("contentExtracted", (request, sender) =>
      this.handleExtractedContent(request, sender),
    );
    this.broker.register("extractionProgress", (request, sender) =>
      this.updateExtractionProgress(request, sender),
    );
    this.broker.register("proxyCommand", (request, sender) =>
      this.routeProxyCommand(request, sender),
    );
  }

  // Consolidated tab state management
  getTabState(tabId) {
    if (!this.tabStates.has(tabId)) {
      this.tabStates.set(tabId, {
        active: this.activeTabIds.has(tabId),
        hiddenTabId: this.hiddenTabs.get(tabId) || null,
        injections: new Set(),
        timers: new Set(),
        extractionStatus: this.extractionStatus.get(tabId) || {},
        createdAt: Date.now(),
      });
    }
    return this.tabStates.get(tabId);
  }

  async handleToggleFromPopup(request) {
    const tab = await browser.tabs.get(request.tabId);
    await this.toggleVibeMode(tab);
    return { success: true };
  }
  async createHiddenTabThrottled(url, visibleTabId) {
    // Check if we already have a pending request for this tab
    if (this.tabCreationQueue.has(visibleTabId)) {
      console.log("⚠️ Tab creation already queued for:", visibleTabId);
      return this.tabCreationQueue.get(visibleTabId);
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastCreation = now - this.lastTabCreation;

    if (timeSinceLastCreation < this.tabCreationCooldown) {
      const waitTime = this.tabCreationCooldown - timeSinceLastCreation;
      console.log(`⏳ Throttling tab creation, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Create promise for this tab
    const promise = this.createHiddenTab(url, visibleTabId);
    this.tabCreationQueue.set(visibleTabId, promise);

    // Clean up after completion
    promise.finally(() => {
      this.tabCreationQueue.delete(visibleTabId);
      this.lastTabCreation = Date.now();
    });

    return promise;
  }

  async waitForTabReady(tab, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        browser.tabs.onUpdated.removeListener(listener);
        reject(new Error("Hidden tab creation timeout"));
      }, timeout);

      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id) {
          this.logToVisible(
            tab.id,
            "INFO",
            `Hidden tab status: ${changeInfo.status}`,
            "NETWORK",
          );

          if (changeInfo.status === "complete") {
            clearTimeout(timer);
            browser.tabs.onUpdated.removeListener(listener);
            resolve(tab);
          }
        }
      };

      browser.tabs.onUpdated.addListener(listener);
    });
  }

  // Helper method to get tab-specific settings
  async getTabSpecificSettings() {
    try {
      const result = await browser.storage.sync.get("vibeReaderSettings");
      return result.vibeReaderSettings || {};
    } catch (error) {
      console.warn("Failed to load settings:", error);
      return {};
    }
  }

  init() {
    // Listen for browser action clicks
    browser.browserAction.onClicked.addListener((tab) => {
      this.toggleVibeMode(tab).catch((error) =>
        console.error("Toggle failed:", error),
      );
    });

    // MessageBroker automatically handles runtime messages

    // Listen for tab updates
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete") {
        this.handleTabUpdate(tabId, tab);
        this.checkAutoActivate(tabId, tab);
      }
    });

    // Clean up when tabs are closed
    browser.tabs.onRemoved.addListener((tabId) => {
      this.cleanupTab(tabId);
    });

    // Listen for keyboard commands
    browser.commands.onCommand.addListener((command) => {
      if (command === "toggle-vibe-mode") {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            this.toggleVibeMode(tabs[0]).catch((error) =>
              console.error("Keyboard toggle failed:", error),
            );
          }
        });
      }
    });

    console.log("🔥 HiddenTabManager initialized with WeakMap registry");
  }

  async logToVisible(tabId, level, message, category = "SYSTEM") {
    // Direct logging to console and proxy-controller
    console.log(`[BG-${category}] ${level}: ${message}`);

    // Check if proxy is actually ready before sending
    const tabState = this.tabStates.get(tabId);
    if (!tabState?.injections?.has("proxy")) {
      // Proxy not ready yet, skip remote logging
      return;
    }

    try {
      await this.broker.send(tabId, "logFromBackground", {
        level,
        message,
        category,
        source: "background",
      });
    } catch (error) {
      // Proxy controller not ready yet, continue silently
    }
  }

  async toggleVibeMode(tab) {
    const isActive = this.activeTabIds.has(tab.id);

    if (isActive) {
      await this.deactivateVibeMode(tab.id);
    } else {
      await this.activateVibeMode(tab);
    }
  }

  async activateVibeMode(tab) {
    const activationStart = performance.now();
    const state = this.getTabState(tab.id);

    if (state.active) {
      console.log("⚠️ Already active for tab:", tab.id);
      return;
    }

    // Enhanced WeakMap storage for comprehensive tab data tracking
    const tabData = {
      activatedAt: Date.now(),
      url: tab.url,
      title: tab.title,
      hiddenTabId: null,
      extractionAttempts: 0,
      performanceMetrics: {
        activationStart,
        injectionTimes: {},
        extractionTime: null,
      },
      settings: await this.getTabSpecificSettings(),
      timers: new Set(), // Store timer IDs for cleanup
    };

    this.tabRegistry.set(tab, tabData);
    this.tabDataCache.set(tab.id, tab); // For reverse lookup

    try {
      console.log("🔥 Activating Vibe Mode for tab:", tab.id);

      // Prevent activation on restricted URLs
      if (!this.isValidUrl(tab.url)) {
        throw new Error("Cannot activate on restricted URL");
      }

      // Check if already processing (using consolidated state)
      if (state.injections.has("processing")) {
        console.log("⚠️ Activation already in progress for tab:", tab.id);
        return;
      }

      // Mark as processing in consolidated state
      state.injections.add("processing");

      // Step 1: Inject proxy controller into visible tab (includes CSS)
      await this.injector.inject(tab.id, "proxy", tab.id);
      state.injections.add("proxy");

      // Step 2: Create hidden tab
      const hiddenTab = await this.createHiddenTabThrottled(tab.url, tab.id);
      state.hiddenTabId = hiddenTab.id;
      this.hiddenTabs.set(tab.id, hiddenTab.id); // Legacy compatibility

      // Store extraction status (legacy compatibility)
      this.extractionStatus.set(hiddenTab.id, {
        status: "initializing",
        visibleTabId: tab.id,
        originalUrl: tab.url,
        startTime: Date.now(),
      });

      // Step 3: Inject stealth extractor into hidden tab
      await this.injector.inject(hiddenTab.id, "extractor");
      state.injections.add("extractor");

      // Step 4: Mark as active
      state.active = true;
      this.activeTabIds.add(tab.id); // Legacy compatibility
      this.updateBadge(tab.id, true);

      // Step 5: Start extraction immediately
      try {
        await this.broker.send(hiddenTab.id, "extractContent", {
          waitForFramework: true,
          simulateScroll: true,
          extractDelay: 500,
        });
      } catch (error) {
        console.error("❌ Failed to start extraction:", error);
        this.handleExtractionError(tab.id, error);
      }

      // Update WeakMap tab data
      const registryData = this.tabRegistry.get(tab);
      if (registryData) {
        registryData.hiddenTabId = hiddenTab.id;
      }

      console.log(
        `✅ Activation complete in ${(performance.now() - activationStart).toFixed(1)}ms`,
      );
    } catch (error) {
      console.error("❌ Activation failed:", error);
      TabCleaner.cleanup(
        this.tabStates,
        this.tabRegistry,
        this.tabDataCache,
        tab.id,
      );
      this.sendErrorToUser(tab.id, error.message);
      throw error;
    } finally {
      // Clean up processing flag
      state.injections.delete("processing");
    }
  }

  async deactivateVibeMode(tabId) {
    console.log("🔌 Deactivating Vibe Mode for tab:", tabId);

    try {
      // Notify visible tab to clean up before removing state
      await this.broker
        .send(tabId, "deactivate")
        .catch((_e) =>
          console.log("Tab already closed or script not injected"),
        );

      // Use unified cleanup
      TabCleaner.cleanup(
        this.tabStates,
        this.tabRegistry,
        this.tabDataCache,
        tabId,
      );

      // Legacy cleanup for compatibility
      const hiddenTabId = this.hiddenTabs.get(tabId);
      if (hiddenTabId) {
        this.extractionStatus.delete(hiddenTabId);
      }
      this.hiddenTabs.delete(tabId);
      this.activeTabIds.delete(tabId);
      this.injectionStatus.delete(tabId);

      console.log("✅ Deactivation complete with unified cleanup");
    } catch (error) {
      console.error("❌ Deactivation error:", error);
    }
  }

  async createHiddenTab(url, visibleTabId = "unknown") {
    // Get stack trace for debugging
    const stack = new Error().stack;
    const caller = stack.split("\n")[2]?.trim() || "unknown";

    console.log("🔧 Creating hidden tab for:", url);
    console.log("📍 Called from:", caller);

    // Log tab creation attempt for debugging + future tab manager
    if (!this.tabCreationLog.has(visibleTabId)) {
      this.tabCreationLog.set(visibleTabId, []);
    }

    const creationAttempt = {
      timestamp: Date.now(),
      url,
      caller,
      visibleTabId,
    };

    this.tabCreationLog.get(visibleTabId).push(creationAttempt);

    // DEBUG: Block additional tabs while debugging (temporary safeguard)
    if (this.debugMode && this.hiddenTabs.has(visibleTabId)) {
      const existingAttempts = this.tabCreationLog.get(visibleTabId).length;
      console.warn(
        `🚨 BLOCKED: Tab ${visibleTabId} trying to create ${existingAttempts} hidden tabs!`,
      );
      console.warn(
        "📋 Creation attempts:",
        this.tabCreationLog.get(visibleTabId),
      );

      if (typeof dump !== "undefined") {
        dump(
          `[TAB-DEBUG] BLOCKED: ${visibleTabId} -> ${url} | Attempts: ${existingAttempts} | Caller: ${caller.substring(0, 30)}\n`,
        );
      }

      // Return existing hidden tab instead of creating new one
      const existingHiddenTabId = this.hiddenTabs.get(visibleTabId);
      try {
        const existingTab = await browser.tabs.get(existingHiddenTabId);
        console.log("↩️ Returning existing hidden tab:", existingHiddenTabId);
        return existingTab;
      } catch (e) {
        console.warn("Existing hidden tab not found, allowing creation");
      }
    }

    const hiddenTab = await browser.tabs.create({
      url,
      active: false,
      pinned: true,
      index: 9999, // Move to end
    });

    console.log("✅ Hidden tab created:", hiddenTab.id);

    if (typeof dump !== "undefined") {
      dump(
        `[TAB-CREATE] ${visibleTabId} -> ${hiddenTab.id} | URL: ${url.substring(0, 50)} | Caller: ${caller.substring(0, 30)}\n`,
      );
    }

    // Wait for tab to be ready
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Hidden tab creation timeout"));
      }, 10000);

      const listener = (tabId, changeInfo) => {
        if (tabId === hiddenTab.id && changeInfo.status === "complete") {
          clearTimeout(timeout);
          browser.tabs.onUpdated.removeListener(listener);
          resolve(hiddenTab);
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });
  }

  // Legacy injection methods removed - now handled by ScriptInjector class

  async handleExtractedContent(request, sender) {
    const extractionInfo = this.extractionStatus.get(sender.tab.id);

    if (!extractionInfo) {
      console.error("No extraction info found for tab:", sender.tab.id);
      return { success: false, error: "No extraction info" };
    }

    try {
      // Send to visible tab with consistent action name
      await this.broker.send(extractionInfo.visibleTabId, "displayContent", {
        content: request.content,
        metadata: request.metadata,
        source: "hiddenTab",
      });

      // Update extraction status
      this.extractionStatus.set(sender.tab.id, {
        ...extractionInfo,
        status: "complete",
        extractedAt: Date.now(),
      });

      // Don't automatically cleanup hidden tab - let it stay for future interactions
      // Only cleanup when user manually deactivates or tab is actually closed
      console.log("💫 Hidden tab kept alive for future interactions");

      return { success: true };
    } catch (error) {
      console.error("Failed to send content to visible tab:", error);
      return { success: false, error: error.message };
    }
  }

  async routeProxyCommand(request, sender) {
    const hiddenTabId = this.hiddenTabs.get(sender.tab.id);

    if (!hiddenTabId) {
      return { success: false, error: "No hidden tab found" };
    }

    try {
      const response = await this.broker.send(
        hiddenTabId,
        "executeProxyCommand",
        {
          command: request.command,
          data: request.data,
        },
      );

      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateExtractionProgress(request, sender) {
    const extractionInfo = this.extractionStatus.get(sender.tab.id);

    if (extractionInfo) {
      this.extractionStatus.set(sender.tab.id, {
        ...extractionInfo,
        status: request.status,
        progress: request.progress,
      });

      // Send progress update to visible tab
      this.broker
        .send(extractionInfo.visibleTabId, "extractionProgress", {
          status: request.status,
          progress: request.progress,
        })
        .catch(() => {
          // Proxy controller might not be ready yet
        });
    }
  }

  handleTabUpdate(tabId, _tab) {
    // Re-inject if page was refreshed
    if (this.activeTabIds.has(tabId)) {
      console.log("📄 Page refreshed, re-injecting proxy controller");
      setTimeout(() => {
        this.injector
          .inject(tabId, "proxy", tabId)
          .catch((error) => console.error("Reinjection failed:", error));
      }, 1000);
    }
  }

  async verifyCSSLoadingWithRetry(tabId, maxAttempts = 5, delay = 500) {
    await this.logToVisible(
      tabId,
      "INFO",
      "🔍 Verifying CSS loading...",
      "CSS",
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const cssVerifyResult = await browser.tabs.executeScript(tabId, {
          code: `(() => {
                    const rootStyles = getComputedStyle(document.documentElement);
                    const primary500 = rootStyles.getPropertyValue('--primary-500').trim();
                    const twShadowColor = rootStyles.getPropertyValue('--tw-shadow-color').trim();
                    
                    // Check for link element as fallback
                    const cssLink = document.querySelector('link[href*="generated.css"]');
                    const linkFound = !!cssLink;
                    
                    // Check stylesheets
                    const styleSheets = Array.from(document.styleSheets);
                    let generatedCSSFound = false;
                    let generatedCSSRules = 0;
                    
                    styleSheets.forEach(sheet => {
                        try {
                            const href = sheet.href || '';
                            if (href.includes('generated.css') || 
                                href.includes('styles/generated') ||
                                href.includes(chrome.runtime.id)) {  // Check for extension URL
                                generatedCSSFound = true;
                                generatedCSSRules = sheet.cssRules?.length || 0;
                            }
                        } catch(e) {
                            // Some sheets may be inaccessible
                        }
                    });
                    
                    // Success if variables are set OR link exists
                    const success = (!!primary500 && !!twShadowColor) || linkFound || generatedCSSFound;
                    
                    return {
                        success,
                        cssLoaded: generatedCSSFound || linkFound,
                        cssRules: generatedCSSRules,
                        primary500Available: !!primary500,
                        twShadowColorAvailable: !!twShadowColor,
                        primary500Value: primary500,
                        linkFound,
                        totalStyleSheets: styleSheets.length
                    };
                })();`,
        });

        const cssResult = cssVerifyResult[0];
        if (cssResult.success) {
          await this.logToVisible(
            tabId,
            "INFO",
            `✅ CSS verified on attempt ${attempt} - Variables: ${cssResult.primary500Available}, Link: ${cssResult.linkFound}`,
            "CSS",
          );
          return true;
        }
        await this.logToVisible(
          tabId,
          "WARN",
          `⚠️ CSS verification attempt ${attempt}/${maxAttempts} - Still loading...`,
          "CSS",
        );

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        await this.logToVisible(
          tabId,
          "ERR",
          `❌ CSS verification error: ${error.message}`,
          "CSS",
        );
        if (attempt >= maxAttempts) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we get here, verification failed - but allow to continue with warning
    await this.logToVisible(
      tabId,
      "WARN",
      "⚠️ CSS verification inconclusive - proceeding anyway",
      "CSS",
    );
    return false; // Don't throw, just return false
  }
  cleanupTab(tabId) {
    console.log("🗑️ Cleaning up tab:", tabId);

    // Check if this is actually a tab close (not refresh) by verifying tab still exists
    browser.tabs
      .get(tabId)
      .then((_tab) => {
        // Tab still exists - this might be a refresh, don't cleanup hidden tab
        console.log("Tab still exists, skipping cleanup for refresh");
      })
      .catch(() => {
        // Tab doesn't exist - this is a real tab close, proceed with cleanup
        console.log("Tab actually closed, proceeding with cleanup");
        this.performActualCleanup(tabId);
      });
  }

  performActualCleanup(tabId) {
    // Use unified cleanup for visible tabs
    if (this.activeTabIds.has(tabId)) {
      TabCleaner.cleanup(
        this.tabStates,
        this.tabRegistry,
        this.tabDataCache,
        tabId,
      );

      // Legacy cleanup for compatibility
      const hiddenTabId = this.hiddenTabs.get(tabId);
      if (hiddenTabId) {
        this.extractionStatus.delete(hiddenTabId);
      }
      this.hiddenTabs.delete(tabId);
      this.activeTabIds.delete(tabId);
      this.injectionStatus.delete(tabId);
    }

    // Clean up if this was a hidden tab
    const extractionInfo = this.extractionStatus.get(tabId);
    if (extractionInfo) {
      this.extractionStatus.delete(tabId);
      // Notify visible tab
      this.broker
        .send(extractionInfo.visibleTabId, "hiddenTabClosed", {
          error: "Hidden tab was closed unexpectedly",
        })
        .catch(() => {});
    }
  }

  updateBadge(tabId, isActive) {
    const text = isActive ? "ON" : "";
    const color = isActive ? "#f92672" : "#000000";
    const title = isActive
      ? "VibeReader Active - Click to deactivate"
      : "VibeReader - Click to activate";

    browser.browserAction.setBadgeText({ text, tabId });
    browser.browserAction.setBadgeBackgroundColor({ color, tabId });
    browser.browserAction.setTitle({ title, tabId });
  }

  async sendErrorToUser(tabId, errorMessage) {
    try {
      await this.broker.send(tabId, "showError", {
        error: errorMessage,
      });
    } catch (error) {
      console.error("Could not notify user of error:", errorMessage);
    }
  }

  cleanupFailedActivation(tabId) {
    console.log("🧹 TabCleaner handling failed activation for tab:", tabId);

    // Use unified cleanup
    TabCleaner.cleanup(
      this.tabStates,
      this.tabRegistry,
      this.tabDataCache,
      tabId,
    );

    // Legacy cleanup for compatibility
    const hiddenTabId = this.hiddenTabs.get(tabId);
    if (hiddenTabId) {
      this.extractionStatus.delete(hiddenTabId);
    }
    this.hiddenTabs.delete(tabId);
    this.activeTabIds.delete(tabId);
    this.injectionStatus.delete(tabId);
  }

  handleExtractionError(tabId, error) {
    console.error("Extraction error for tab:", tabId, error);
    this.sendErrorToUser(tabId, "Content extraction failed. Please try again.");
    this.deactivateVibeMode(tabId);
  }

  isValidUrl(url) {
    if (!url) return false;

    const restrictedPrefixes = [
      "chrome://",
      "chrome-extension://",
      "moz-extension://",
      "about:",
      "file://",
      "edge://",
      "opera://",
      "vivaldi://",
      "brave://",
    ];

    return !restrictedPrefixes.some((prefix) => url.startsWith(prefix));
  }

  async checkAutoActivate(tabId, tab) {
    // Add check to prevent multiple activations
    if (
      this.activeTabIds.has(tabId) ||
      this.injectionStatus.has(tabId) || // Already processing
      !this.isValidUrl(tab.url)
    ) {
      return;
    }

    if (this.activeTabIds.has(tabId) || !this.isValidUrl(tab.url)) {
      return;
    }

    try {
      const result = await browser.storage.sync.get("vibeReaderSettings");
      const settings = result.vibeReaderSettings || {};

      if (settings.autoActivate) {
        console.log("🚀 Auto-activating for tab:", tabId);
        setTimeout(() => {
          this.activateVibeMode(tab).catch((error) =>
            console.error("Auto-activate failed:", error),
          );
        }, 1000);
      }
    } catch (error) {
      console.error("Auto-activate check failed:", error);
    }
  }
}

// Initialize with singleton pattern
if (!window.__vibeReaderBackgroundManager) {
  window.__vibeReaderBackgroundManager = new HiddenTabManager();
}
