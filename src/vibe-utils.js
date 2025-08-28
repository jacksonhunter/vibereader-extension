// VibeReader v2.0 - Utility Classes with Injection Guards

// Prevent multiple injections with simple guard
if (window.__vibeReaderUtils) {
  console.log("⚠️ VibeReaderUtils already exists, skipping");
  false;
} else {
  try {
    // VibeReader Message Debugging System
    // Add this to vibe-utils.js or create message-debugger.js
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
        this.enabled = false;
        this.logToConsole = true;
        this.logToStorage = false;
        this.logToTerminal = true;
        this.messageLog = [];
        this.maxLogSize = 500;
        this.filters = {
          actions: [], // Only log these actions if set
          exclude: ["ping"], // Never log these actions
          sources: [], // Only log from these sources if set
        };

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
        // Load settings FIRST and wait
        await this.loadDebugSettings();

        // Detect context
        this.context = detectVibeContext();

        // Store original functions
        if (typeof browser !== "undefined") {
          this.originalSendMessage = browser.runtime.sendMessage;
          if (browser.tabs?.sendMessage) {
            this.originalTabsSendMessage = browser.tabs.sendMessage;
          }
        }

        // Only wrap if previously enabled
        if (this.enabled) {
          this.wrapMessagingAPIs();
        }

        // Listen for toggle messages from popup
        if (typeof browser !== "undefined") {
          browser.runtime.onMessage.addListener((message) => {
            if (message.action === "toggleVibeDebug") {
              if (message.enabled !== undefined) {
                // Explicit enable/disable from popup
                if (message.enabled && !this.enabled) {
                  this.enable();
                } else if (!message.enabled && this.enabled) {
                  this.disable();
                }
              } else {
                // Just toggle
                this.toggle();
              }
              return Promise.resolve({ enabled: this.enabled });
            }
          });
        }

        // Inject into console for easy access
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

      unwrapMessagingAPIs() {
        // Restore original functions
        browser.runtime.sendMessage = this.originalSendMessage;

        if (browser.tabs?.sendMessage) {
          browser.tabs.sendMessage = this.originalTabsSendMessage;
        }
      }

      wrapMessagingAPIs() {
        if (!this.originalSendMessage) return; // No originals stored

        const self = this;

        // Wrap browser.runtime.sendMessage
        browser.runtime.sendMessage = function (message) {
          self.logMessage("send", message.action || "unknown", message, {
            source: self.context,
            target: "background",
          });

          return self.originalSendMessage
            .apply(this, arguments)
            .then((response) => {
              self.logMessage(
                "response",
                message.action || "unknown",
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
                message.action || "unknown",
                { error: error.message },
                {
                  source: self.context,
                },
              );
              throw error;
            });
        };

        // Wrap tabs.sendMessage if available
        if (browser.tabs?.sendMessage && this.originalTabsSendMessage) {
          browser.tabs.sendMessage = function (tabId, message) {
            self.logMessage("send", message.action || "unknown", message, {
              source: self.context,
              target: `tab-${tabId}`,
              tabId: tabId,
            });

            return self.originalTabsSendMessage
              .apply(this, arguments)
              .then((response) => {
                self.logMessage(
                  "response",
                  message.action || "unknown",
                  response,
                  {
                    source: `tab-${tabId}`,
                    target: self.context,
                    tabId: tabId,
                  },
                );
                return response;
              })
              .catch((error) => {
                self.logMessage(
                  "error",
                  message.action || "unknown",
                  { error: error.message },
                  {
                    source: self.context,
                    target: `tab-${tabId}`,
                    tabId: tabId,
                  },
                );
                throw error;
              });
          };
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
        if (!this.enabled) return;

        // Check filters
        if (!this.shouldLog(action, context.source)) return;

        const entry = {
          id: this.generateId(),
          timestamp: Date.now(),
          type: type, // 'send', 'receive', 'broadcast', 'error', 'forward'
          action: action,
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
          this.consoleOutput(entry);
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
        if (entry.data && Object.keys(entry.data).length > 0) {
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
        if (entry.context.stack && entry.context.stack.length > 0) {
          console.log("%c📍 Call Stack:", "color: #95a5a6; font-size: 10px;");
          entry.context.stack.forEach((frame, i) => {
            console.log(`  ${i}: ${frame}`);
          });
        }

        console.groupEnd();
      }

      async terminalOutput(entry) {
        // Send to proxy-controller's terminal system
        try {
          const message = {
            [BYPASS_LOGGING]: true, // Skip logging this message
            action: "terminalLog",
            level: entry.type === "error" ? "ERR" : "INFO",
            message: `${entry.action} from ${entry.context.source}`,
            category: "NETWORK",
            metadata: entry,
          };

          // Try to send to active tabs
          if (browser?.tabs) {
            const tabs = await browser.tabs.query({});
            tabs.forEach((tab) => {
              browser.tabs.sendMessage(tab.id, message).catch(() => {});
            });
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
          this.filters.actions.length > 0 &&
          !this.filters.actions.includes(action)
        ) {
          return false;
        }

        // Check source filter
        if (
          this.filters.sources.length > 0 &&
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
          "background: #2c3e50; color: white; padding: 10px; font-size: 14px; font-weight: bold;",
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
          "background: #34495e; color: white; padding: 10px; font-size: 12px; font-weight: bold;",
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
            case "Error":
              const error = new Error(obj.message);
              error.name = obj.name;
              error.stack = obj.stack;
              return error;
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
        this.listeners = new Map();
      }

      on(event, callback, options = {}) {
        const listener = {
          callback,
          once: options.once || false,
          priority: options.priority || 0,
        };

        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }

        const listeners = this.listeners.get(event);
        listeners.push(listener);
        // Sort by priority (higher first)
        listeners.sort((a, b) => b.priority - a.priority);

        // Return unsubscribe function
        return () => {
          const index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        };
      }

      emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        const toRemove = [];

        listeners.forEach((listener, index) => {
          try {
            listener.callback(data);
            if (listener.once) {
              toRemove.push(index);
            }
          } catch (error) {
            console.error(`Event handler error for ${event}:`, error);
          }
        });

        // Remove once listeners
        toRemove.reverse().forEach((index) => {
          listeners.splice(index, 1);
        });
      }
    }

    class ThrottledEmitter {
      constructor(broker, delay = 100) {
        this.broker = broker;
        this.delay = delay;
        this.queue = new Map();
        this.timer = null;
      }

      emit(event, data) {
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
          this.broker.emit(event, data);
        }
        this.queue.clear();
      }
    }

    window.__vibeReaderUtils = {
      VibeLogger: new VibeLogger(),
      MessageSerializer: MessageSerializer,
      MessageBroker: MessageBroker,
      ThrottledEmitter: ThrottledEmitter,
      detectVibeContext: detectVibeContext(),
    };

    console.log("✅ VibeReader Message Serializer static class loaded");

    // Wrap browser message APIs with debugging
    if (typeof browser !== "undefined") {
      // Wrap sendMessage
      const originalSendMessage = browser.runtime.sendMessage;
      browser.runtime.sendMessage = function (message) {
        if (message[BYPASS_LOGGING]) {
          delete message[BYPASS_LOGGING];
          return originalSendMessage.call(this, message);
        }

        window.__vibeReaderUtils.VibeLogger.logMessage("send", message.action || "unknown", message, {
          source: window.__vibeReaderUtils.VibeLogger.context,
          target: "background",
        });

        return originalSendMessage
          .apply(this, arguments)
          .then((response) => {
            window.__vibeReaderUtils.VibeLogger.logMessage(
              "response",
              message.action || "unknown",
              response,
              {
                source: "background",
                target: window.__vibeReaderUtils.VibeLogger.context,
              },
            );
            return response;
          })
          .catch((error) => {
            window.__vibeReaderUtils.VibeLogger.logMessage(
              "error",
              message.action || "unknown",
              { error: error.message },
              {
                source: window.__vibeReaderUtils.VibeLogger.context,
              },
            );
            throw error;
          });
      };

      // Wrap tabs.sendMessage if available
      if (browser.tabs?.sendMessage) {
        const originalTabsSendMessage = browser.tabs.sendMessage;
        browser.tabs.sendMessage = function (tabId, message) {
          window.__vibeReaderUtils.VibeLogger.logMessage("send", message.action || "unknown", message, {
            source: window.__vibeReaderUtils.VibeLogger.context,
            target: `tab-${tabId}`,
            tabId: tabId,
          });

          return originalTabsSendMessage
            .apply(this, arguments)
            .then((response) => {
              window.__vibeReaderUtils.VibeLogger.logMessage(
                "response",
                message.action || "unknown",
                response,
                {
                  source: `tab-${tabId}`,
                  target: window.__vibeReaderUtils.VibeLogger.context,
                  tabId: tabId,
                },
              );
              return response;
            })
            .catch((error) => {
              window.__vibeReaderUtils.VibeLogger.logMessage(
                "error",
                message.action || "unknown",
                { error: error.message },
                {
                  source: window.__vibeReaderUtils.VibeLogger.context,
                  target: `tab-${tabId}`,
                  tabId: tabId,
                },
              );
              throw error;
            });
        };
      }

      // Wrap onMessage listener
      const originalAddListener = browser.runtime.onMessage.addListener;
      browser.runtime.onMessage.addListener = function (listener) {
        const wrappedListener = function (message, sender, sendResponse) {
          window.__vibeReaderUtils.VibeLogger.logMessage(
            "receive",
            message.action || "unknown",
            message,
            {
              source: sender.tab ? `tab-${sender.tab.id}` : "background",
              target: window.__vibeReaderUtils.VibeLogger.context,
              tabId: sender.tab?.id,
              frameId: sender.frameId,
              url: sender.url,
            },
          );

          return listener(message, sender, sendResponse);
        };

        return originalAddListener.call(this, wrappedListener);
      };
    }

    // Console banner when loaded
    console.log(
      "%c🐛 VibeReader VibeLogger Loaded\nPress Ctrl+Shift+D to toggle debug mode\nPress Ctrl+Shift+L to dump log\nAccess via: window.vibeDebug",
      "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; font-size: 12px; border-radius: 5px;",
    );

    // Convenience globals
    window.MessageSerializer = MessageSerializer;
    window.VibeLogger = window.__vibeReaderUtils.VibeLogger;
    window.VibeLogger.enabled = true; // Auto-enable

    true;
  } catch (error) {
    delete window.__vibeReaderUtils; // Clean up on failure
    throw error;
  }
}
