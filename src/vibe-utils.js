// VibeReader v2.0 - Utility Classes with Injection Guards

// Prevent multiple injections with simple guard
if (window.__vibeReaderUtils) {
  console.log("⚠️ VibeReaderUtils already exists, skipping");
  false;
} else {
  try {
    // VibeReader Message Debugging System
    function detectVibeContext() {
      if (typeof window === "undefined") return "background";
      if (window.__vibeReaderProxyController) return "proxy";
      if (window.__vibeReaderStealthExtractor) return "extractor";
      if (window.location?.href?.includes("popup.html")) return "popup";
      return "unknown";
    }

    const BYPASS_LOGGING = Symbol("bypass");

    class VibeLogger {
      constructor() {
        this.enabled = true;
        this.logToConsole = true;
        this.logToStorage = true;
        this.logToTerminal = true;
        this.messageLog = [];
        this.maxLogSize = 500;
        this.filters = {
          actions: [],
          exclude: ["ping"],
          sources: [],
        };

        // Add CLI dump mode without breaking existing functionality
        this.cliDumpMode = false; // New feature for spartan terminal output

        // Store TRULY native functions before ANY wrapping
        this.nativeSendMessage = null;
        this.nativeTabsSendMessage = null;

        // Color coding for different components
        this.colors = {
          popup: "#ff6b6b",
          background: "#4ecdc4",
          proxy: "#45b7d1",
          extractor: "#96ceb4",
          hidden: "#ffeaa7",
          visible: "#dfe6e9",
        };

        // Emoji indicators for message types
        this.icons = {
          send: "📤",
          receive: "📥",
          broadcast: "📡",
          error: "❌",
          success: "✅",
          forward: "➡️",
          response: "↩️",
        };

        this.init();
      }

      async init() {
        await this.loadDebugSettings();
        this.context = detectVibeContext();

        // Only store natives if we haven't already
        if (typeof browser !== "undefined" && browser.runtime) {
          if (!browser.runtime.__vibeNatives) {
            // Store the TRULY native functions globally
            browser.runtime.__vibeNatives = {
              sendMessage: browser.runtime.sendMessage.bind(browser.runtime),
              tabsSendMessage: browser.tabs?.sendMessage?.bind(browser.tabs),
            };
          }

          // Always use the stored natives
          this.nativeSendMessage = browser.runtime.__vibeNatives.sendMessage;
          this.nativeTabsSendMessage =
            browser.runtime.__vibeNatives.tabsSendMessage;

          if (this.enabled && !browser.runtime.__vibeWrapped) {
            this.wrapMessagingAPIs();
            browser.runtime.__vibeWrapped = true;
          }
        }

        // Listen for toggle messages
        if (typeof browser !== "undefined") {
          browser.runtime.onMessage.addListener((message) => {
            if (message.action === "toggleVibeDebug") {
              if (message.enabled !== undefined) {
                if (message.enabled && !this.enabled) {
                  this.enable();
                } else if (!message.enabled && this.enabled) {
                  this.disable();
                }
              } else {
                this.toggle();
              }
              return Promise.resolve({ enabled: this.enabled });
            }
            return undefined; // Explicitly return undefined for non-matching messages
          });
        }

        if (typeof window !== "undefined") {
          window.vibeDebug = this;
        }
      }

      enable() {
        if (!this.enabled) {
          this.enabled = true;
          this.wrapMessagingAPIs();
        }
      }

      disable() {
        if (this.enabled) {
          this.enabled = false;
          this.unwrapMessagingAPIs();
        }
      }

      wrapMessagingAPIs() {
        if (!this.nativeSendMessage) return;

        const self = this;
        // Use the module-level BYPASS_LOGGING symbol

        // Wrap browser.runtime.sendMessage
        browser.runtime.sendMessage = function (message) {
          // Check for bypass BEFORE doing anything else
          if (message?.action === "terminalLog" || message?.[BYPASS_LOGGING]) {
            delete message[BYPASS_LOGGING];
            return self.nativeSendMessage(message);
          }

          self.logMessage("send", message?.action || "unknown", message, {
            source: self.context,
            target: "background",
          });

          return self
            .nativeSendMessage(message)
            .then((response) => {
              self.logMessage(
                "response",
                message?.action || "unknown",
                response,
                {
                  source: "background",
                  target: self.context,
                },
              );
              return response;
            })
            .catch((error) => {
              self.logMessage(
                "error",
                message?.action || "unknown",
                { error: error.message },
                {
                  source: self.context,
                },
              );
              throw error;
            });
        };

        // Wrap tabs.sendMessage if available
        if (browser.tabs?.sendMessage && this.nativeTabsSendMessage) {
          browser.tabs.sendMessage = function (tabId, message) {
            // Check for bypass BEFORE doing anything else
            if (
              message?.action === "terminalLog" ||
              message?.[BYPASS_LOGGING]
            ) {
              delete message[BYPASS_LOGGING];
              return self.nativeTabsSendMessage(tabId, message);
            }

            self.logMessage("send", message?.action || "unknown", message, {
              source: self.context,
              target: `tab-${tabId}`,
              tabId,
            });

            return self
              .nativeTabsSendMessage(tabId, message)
              .then((response) => {
                self.logMessage(
                  "response",
                  message?.action || "unknown",
                  response,
                  {
                    source: `tab-${tabId}`,
                    target: self.context,
                    tabId,
                  },
                );
                return response;
              })
              .catch((error) => {
                self.logMessage(
                  "error",
                  message?.action || "unknown",
                  { error: error.message },
                  {
                    source: self.context,
                    target: `tab-${tabId}`,
                    tabId,
                  },
                );
                throw error;
              });
          };
        }
      }

      unwrapMessagingAPIs() {
        if (browser.runtime.__vibeNatives) {
          browser.runtime.sendMessage =
            browser.runtime.__vibeNatives.sendMessage;
          if (
            browser.tabs?.sendMessage &&
            browser.runtime.__vibeNatives.tabsSendMessage
          ) {
            browser.tabs.sendMessage =
              browser.runtime.__vibeNatives.tabsSendMessage;
          }
          browser.runtime.__vibeWrapped = false;
        }
      }

      async loadDebugSettings() {
        try {
          const settings = await browser.storage.local.get("vibeDebugSettings");
          if (settings.vibeDebugSettings) {
            Object.assign(this, settings.vibeDebugSettings);
          }
        } catch (e) {
          // Storage might not be available in all contexts
        }
      }

      async saveDebugSettings() {
        try {
          await browser.storage.local.set({
            vibeDebugSettings: {
              enabled: this.enabled,
              logToConsole: this.logToConsole,
              logToStorage: this.logToStorage,
              logToTerminal: this.logToTerminal,
              filters: this.filters,
            },
          });
        } catch (e) {
          // Storage might not be available
        }
      }

      toggle() {
        if (this.enabled) {
          this.disable(); // Actually unwrap message functions
        } else {
          this.enable(); // Wrap message functions
        }

        return this.enabled;
      }

      // Enhanced message logging with full context
      logMessage(type, action, data, context = {}) {
        if (!this.enabled) return undefined;

        // Check filters
        if (!this.shouldLog(action, context.source)) return undefined;

        const entry = {
          id: this.generateId(),
          timestamp: Date.now(),
          type, // 'send', 'receive', 'broadcast', 'error', 'forward'
          action,
          data: this.sanitizeData(data),
          context: {
            source: context.source || this.context,
            target: context.target,
            tabId: context.tabId,
            frameId: context.frameId,
            url:
              context.url ||
              (typeof window !== "undefined" ? window.location?.href : null),
            stack: this.getCallStack(),
          },
          performance: {
            timing: performance.now(),
            memory: this.getMemoryUsage(),
          },
        };

        // Add to log
        this.messageLog.push(entry);
        if (this.messageLog.length > this.maxLogSize) {
          this.messageLog.shift();
        }

        // Output based on settings
        if (this.logToConsole) {
          // Use CLI dump in terminal mode, otherwise use original
          if (this.cliDumpMode && typeof dump !== 'undefined') {
            this.cliDump(entry);
          } else {
          this.consoleOutput(entry);
        }
        }

        if (this.logToStorage) {
          this.storageOutput(entry);
        }

        if (this.logToTerminal) {
          this.terminalOutput(entry);
        }

        // If we're in proxy context, update terminals directly
        if (this.context === "proxy" && window.__vibeReaderProxyController) {
          const proxy = window.__vibeReaderProxyController;

          // Determine category from message type/content
          const category = this.categorizeForTerminal(type, action, data);
          const level = this.getLevelFromType(type);

          // Use proxy's existing terminal update system
          proxy.addToDiagnostics(level, data.message || action, category);
        }

        return entry;
      }

      // NEW: Spartan CLI dump for terminal debugging
      cliDump(entry) {
        const time = new Date(entry.timestamp).toISOString().slice(11, 19);
        const icon = this.icons[entry.type] || '-';
        const src = (entry.context.source || '???').slice(0, 3).toUpperCase();
        const dst = (entry.context.target || '???').slice(0, 3).toUpperCase();

        let line = `${time} ${src}${icon}${dst} ${entry.action}`;

        if (entry.data) {
          const size = JSON.stringify(entry.data).length;
          line += ` [${size}b]`;
        }

        if (entry.type === 'error' && entry.data?.error) {
          line += ` ERR:${entry.data.error}`;
        }

        dump(line + '\n');
      }

      consoleOutput(entry) {
        const source = entry.context.source;
        const color = this.colors[source] || "#95a5a6";
        const icon = this.icons[entry.type] || "📨";

        // Create formatted output
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        const header = `%c${icon} [${timestamp}] ${source.toUpperCase()} → ${entry.action}`;
        const style = `color: ${color}; font-weight: bold;`;

        // Group related info
        console.group(header, style);

        // Show data if present
        if (entry.data && Object.keys(entry.data).length) {
          console.log(
            "%c📦 Data:",
            "color: #3498db; font-weight: bold;",
            entry.data,
          );
        }

        // Show context
        if (entry.context.target) {
          console.log(
            `%c🎯 Target: ${entry.context.target}`,
            "color: #e74c3c;",
          );
        }

        if (entry.context.tabId) {
          console.log(`%c🏷️ Tab ID: ${entry.context.tabId}`, "color: #9b59b6;");
        }

        // Show performance metrics in debug
        if (this.enabled) {
          console.log(
            `%c⚡ Performance:`,
            "color: #f39c12;",
            `Time: ${entry.performance.timing.toFixed(2)}ms, Memory: ${entry.performance.memory}`,
          );
        }

        // Show call stack for tracing
        if (entry.context.stack && entry.context.stack.length) {
          console.log("%c🔍 Call Stack:", "color: #95a5a6; font-size: 10px;");
          entry.context.stack.forEach((frame, i) => {
            console.log(`  ${i}: ${frame}`);
          });
        }

        console.groupEnd();
      }

      async terminalOutput(entry) {
        // Send to proxy-controller's terminal system
        try {
          // Map to terminal categories (consolidate duplicate logic)
          const category = this.categorizeMessage(entry.action);

          const message = {
            [BYPASS_LOGGING]: true, // Skip logging this message
            action: "terminalLog",
            level: entry.type === "error" ? "ERR" : "INFO",
            message: `${entry.action} from ${entry.context.source}`,
            category: category,
            metadata: entry,
          };

          // Try to send to active tabs
          if (browser?.tabs && this.nativeTabsSendMessage) {
            const tabs = await browser.tabs.query({});
            for (const tab of tabs) {
              // Use the NATIVE function directly for terminal messages
              await this.nativeTabsSendMessage(tab.id, message).catch(() => {});
            }
          }
        } catch (e) {
          // Terminal might not be available
        }
      }

      async storageOutput(entry) {
        try {
          // Get existing log
          const stored = await browser.storage.local.get("vibeMessageLog");
          const log = stored.vibeMessageLog || [];

          // Add new entry
          log.push(entry);

          // Trim to max size
          if (log.length > this.maxLogSize) {
            log.splice(0, log.length - this.maxLogSize);
          }

          // Save back
          await browser.storage.local.set({ vibeMessageLog: log });
        } catch (e) {
          console.warn("Failed to store message log:", e);
        }
      }

      // Consolidate categorization logic
      categorizeMessage(message) {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('err') || lowerMsg.includes('failed') || lowerMsg.includes('error')) {
          return 'ERRORS';
        } else if (lowerMsg.includes('media') || lowerMsg.includes('image') || lowerMsg.includes('video')) {
          return 'MEDIA';
        } else if (lowerMsg.includes('css') || lowerMsg.includes('style')) {
          return 'CSS';
        } else if (lowerMsg.includes('ascii') || lowerMsg.includes('conversion')) {
          return 'ASCII';
        } else if (lowerMsg.includes('extraction') || lowerMsg.includes('proxy') || lowerMsg.includes('framework')) {
          return 'NETWORK';
        }
        return 'SYSTEM';
      }

      // Utility methods
      sanitizeData(data) {
        // Remove or truncate large data
        if (!data) return null;

        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
          if (
            key === "content" &&
            typeof value === "string" &&
            value.length > 1000
          ) {
            sanitized[key] = value.substring(0, 1000) + "... [truncated]";
          } else if (value instanceof Element) {
            sanitized[key] =
              `<${value.tagName} id="${value.id}" class="${value.className}">`;
          } else if (typeof value === "object" && value !== null) {
            sanitized[key] = this.sanitizeData(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }

      getCallStack() {
        const stack = new Error().stack;
        if (!stack) return [];

        return stack
          .split("\n")
          .slice(3, 8) // Skip this function and take next 5
          .map((line) => line.trim())
          .filter((line) => line && !line.includes("VibeLogger"));
      }

      getMemoryUsage() {
        if (performance.memory) {
          const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
          return `${mb}MB`;
        }
        return "N/A";
      }

      shouldLog(action, source) {
        // Check exclude list
        if (this.filters.exclude.includes(action)) {
          return false;
        }

        // Check action filter
        if (
          this.filters.actions.length &&
          !this.filters.actions.includes(action)
        ) {
          return false;
        }

        // Check source filter
        if (
          this.filters.sources.length &&
          !this.filters.sources.includes(source)
        ) {
          return false;
        }

        return true;
      }

      generateId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Analysis methods
      dumpLog() {
        console.log(
          "%c📊 VibeReader Message Log Dump",
          "color: #667eea; padding: 10px; font-size: 14px; font-weight: bold;",
        );

        console.table(
          this.messageLog.map((entry) => ({
            Time: new Date(entry.timestamp).toLocaleTimeString(),
            Type: entry.type,
            Action: entry.action,
            Source: entry.context.source,
            Target: entry.context.target,
            TabId: entry.context.tabId,
            Timing: entry.performance.timing.toFixed(2) + "ms",
          })),
        );

        this.analyzeFlow();
      }

      analyzeFlow() {
        console.log(
          "%c🔍 Message Flow Analysis",
          "color: #667eea; padding: 10px; font-size: 12px; font-weight: bold;",
        );

        // Count by action
        const actionCounts = {};
        this.messageLog.forEach((entry) => {
          actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
        });

        console.log("📈 Message counts by action:");
        console.table(actionCounts);

        // Average timing by action
        const timings = {};
        this.messageLog.forEach((entry) => {
          if (!timings[entry.action]) {
            timings[entry.action] = [];
          }
          timings[entry.action].push(entry.performance.timing);
        });

        const avgTimings = {};
        for (const [action, times] of Object.entries(timings)) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          avgTimings[action] = avg.toFixed(2) + "ms";
        }

        console.log("⏱️ Average timing by action:");
        console.table(avgTimings);

        // Message flow visualization
        this.visualizeFlow();
      }

      visualizeFlow() {
        const flow = this.messageLog.slice(-20).map((entry) => {
          const arrow =
            {
              send: "→",
              receive: "←",
              broadcast: "⟷",
              forward: "↗",
              error: "✗",
            }[entry.type] || "—";

          return `${entry.context.source} ${arrow} ${entry.context.target || "?"}: ${entry.action}`;
        });

        console.log("🌊 Recent message flow:");
        flow.forEach((line) => console.log(line));
      }

      clearLog() {
        this.messageLog = [];
        console.log("%c🗑️ Message log cleared", "color: #e74c3c;");
      }

      exportLog() {
        const data = {
          version: "2.0.0",
          timestamp: Date.now(),
          messages: this.messageLog,
          stats: {
            total: this.messageLog.length,
            byAction: this.getActionCounts(),
            bySource: this.getSourceCounts(),
          },
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vibe-messages-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log("%c📦 Message log exported", "color: #3498db;");
      }

      getActionCounts() {
        const counts = {};
        this.messageLog.forEach((entry) => {
          counts[entry.action] = (counts[entry.action] || 0) + 1;
        });
        return counts;
      }

      getSourceCounts() {
        const counts = {};
        this.messageLog.forEach((entry) => {
          counts[entry.context.source] =
            (counts[entry.context.source] || 0) + 1;
        });
        return counts;
      }

      setTerminalHandler(handler) {
        this.terminalHandler = handler;
      }

      // NEW: Enable/disable CLI dump mode
      setCliDumpMode(enabled) {
        this.cliDumpMode = enabled;
        console.log(`CLI dump mode: ${enabled ? 'ON' : 'OFF'}`);
      }
    }

    class MessageSerializer {
      static serialize(obj, seen = new WeakSet()) {
        if (obj === undefined) return { __undefined: true };
        if (obj === null) return null;
        if (typeof obj !== "object") return obj;

        if (seen.has(obj)) return { __circular: true };
        seen.add(obj);

        if (obj instanceof Error) {
          return {
            __type: "Error",
            name: obj.name,
            message: obj.message,
            stack: obj.stack,
          };
        }

        if (obj instanceof Element) {
          return {
            __type: "Element",
            tagName: obj.tagName,
            id: obj.id,
            className: obj.className,
            textContent: obj.textContent?.substring(0, 100),
          };
        }

        if (obj instanceof Date) {
          return { __type: "Date", value: obj.toISOString() };
        }

        if (Array.isArray(obj)) {
          return obj.map((item) => MessageSerializer.serialize(item, seen));
        }

        const serialized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value !== "function") {
            serialized[key] = MessageSerializer.serialize(value, seen);
          }
        }
        return serialized;
      }

      static deserialize(obj) {
        if (!obj || typeof obj !== "object") return obj;

        if (obj.__undefined) return undefined;
        if (obj.__circular) return "[Circular Reference]";

        if (obj.__type) {
          switch (obj.__type) {
            case "Error": {
              const error = new Error(obj.message);
              error.name = obj.name;
              error.stack = obj.stack;
              return error;
            }
            case "Date":
              return new Date(obj.value);
            case "Element":
              return obj; // Can't reconstruct
          }
        }

        if (Array.isArray(obj)) {
          return obj.map((item) => MessageSerializer.deserialize(item));
        }

        const deserialized = {};
        for (const [key, value] of Object.entries(obj)) {
          deserialized[key] = MessageSerializer.deserialize(value);
        }
        return deserialized;
      }
    }

      class MessageBroker {
          constructor() {
              this.handlers = new Map();
              this.middlewares = [];
              this.context = detectVibeContext();

        // Auto-register as the message listener
        if (typeof browser !== "undefined") {
          browser.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
              this.dispatch(request, sender).then(sendResponse);
              return true; // Keep channel open
            },
          );
        }
      }

      // Register action handlers
      on(action, handler, options = {}) {
        if (!this.handlers.has(action)) {
          this.handlers.set(action, []);
        }

        this.handlers.get(action).push({
          handler,
          priority: options.priority || 0,
          validate: options.validate || null,
        });

        // Sort by priority
        this.handlers.get(action).sort((a, b) => b.priority - a.priority);
      }

      // Middleware for all messages
      use(middleware) {
        this.middlewares.push(middleware);
      }

      // Main dispatcher - replaces handleMessage
      async dispatch(request, sender) {
        const { action } = request;

        // Run middlewares first
        for (const middleware of this.middlewares) {
          const result = await middleware(request, sender);
          if (result === false)
            return { success: false, error: "Blocked by middleware" };
        }

        // Get handlers for this action
        const handlers = this.handlers.get(action) || [];

        if (handlers.length === 0) {
          console.warn("No handler for action:", action);
          return { success: false, error: "Unknown action" };
        }

        // Run handlers in priority order
        for (const { handler, validate } of handlers) {
          // Optional validation
          if (validate && !validate(request)) {
            continue;
          }

          try {
            const result = await handler(request, sender);
            if (result !== undefined) {
              return result;
            }
          } catch (error) {
            console.error(`Handler error for ${action}:`, error);
            // Continue to next handler
          }
        }

        return { success: false, error: "No handler returned a result" };
      }

      // Convenience method for simple responses
      register(action, handler) {
        this.on(action, async (request, sender) => {
          // Handle both formats: request.data and direct request properties
          const data = request.data || request;
          const result = await handler(data, sender);
          return { success: true, ...result };
        });
      }

      // Send message with automatic response handling
      async send(target, action, data) {
        const message = { action, data, from: this.context };

        if (typeof target === "number") {
          // Tab ID
          return await browser.tabs.sendMessage(target, message);
        } 
          // Runtime message
          return await browser.runtime.sendMessage(message);
        
      }
    }

    // NEW: Improved ThrottledEmitter with better queue management
    class ThrottledEmitter {
      constructor(broker, delay = 100) {
        this.broker = broker;
        this.delay = delay;
        this.queue = new Map();
        this.timer = null;
      }

      emit(event, data) {
        // Always update with latest data
        this.queue.set(event, data);

        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.flush();
            this.timer = null;
          }, this.delay);
        }
      }

      flush() {
        for (const [event, data] of this.queue) {
          this.broker.emit ?
            this.broker.emit(event, data) :
            this.broker.send(null, event, data);
        }
        this.queue.clear();
      }

      // NEW: Force immediate flush
      forceFlush() {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.flush();
      }

      // NEW: Clear without sending
      clear() {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.queue.clear();
      }
    }

    // NEW: EventBus for intra-context events
    class EventBus {
      constructor() {
        this.listeners = new Map();
        this.once = new Map();
      }

      on(event, handler) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);

        // Return unsubscribe function
        return () => this.off(event, handler);
      }

      once(event, handler) {
        const wrapper = (...args) => {
          handler(...args);
          this.off(event, wrapper);
        };
        return this.on(event, wrapper);
      }

      off(event, handler) {
        this.listeners.get(event)?.delete(handler);
      }

      emit(event, ...args) {
        const handlers = this.listeners.get(event);
        if (!handlers) return;

        // Copy to avoid mutation during iteration
        [...handlers].forEach(handler => {
          try {
            handler(...args);
          } catch (error) {
            console.error(`EventBus error in ${event}:`, error);
          }
        });
      }

      clear(event) {
        if (event) {
          this.listeners.delete(event);
        } else {
          this.listeners.clear();
        }
      }
    }

    window.__vibeReaderUtils = {
      VibeLogger: new VibeLogger(),
      MessageSerializer,
      MessageBroker,
      ThrottledEmitter,
      EventBus,
      detectVibeContext: detectVibeContext(),
      BYPASS_LOGGING // Export the symbol
    };
      // Expose commonly used classes as globals for easier access
      window.MessageBroker = MessageBroker;
      window.MessageSerializer = MessageSerializer;
    window.ThrottledEmitter = ThrottledEmitter;
    window.EventBus = EventBus;
      window.VibeLogger = window.__vibeReaderUtils.VibeLogger;
    window.detectVibeContext = detectVibeContext;

    console.log("✅ VibeReader Utilities v2.0 loaded");

    // Console banner when loaded
    console.log(
      "%c🛠 VibeReader Debug Tools\nCtrl+Shift+D: Toggle debug\nCtrl+Shift+L: Dump log\nwindow.vibeDebug: Access logger",
      "color: #667eea; padding: 10px; font-size: 12px; border-radius: 5px;",
    );

    true;
  } catch (error) {
    delete window.__vibeReaderUtils; // Clean up on failure
    throw error;
  }
}
