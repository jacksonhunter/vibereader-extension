// VibeReader v2.5 -  Subscriber Architecture with Cross-Context Routing
// vibe-subscribe.js - Complete refactored version with singleton guards

// Prevent multiple injections with simple guard
if (window.__vibeSubscribe) {
  console.log("⚠️ VibeSubscribe already exists, skipping");
  false;
} else {
  try {
    // ===== BASE SUBSCRIBER CLASS =====
    class VibeSubscriber {
      constructor(id, callback, options = {}) {
        this.id =
          id || `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.callback = callback;
        this.state = options.state || "active";
        this.origin = this.getOrigin();
        this.preferences = {
          origin: options.origin || this.origin,
          eventTypes: options.eventTypes || [],
          priority: options.priority || 0,
          maxRetries: options.maxRetries || 3,
          fallbackBehavior: options.fallbackBehavior || "log",
          transformations: options.transformations || [],
          crossContext: options.crossContext !== false,
          maxPerSecond: options.maxPerSecond || 50,
          maxPerMinute: options.maxPerMinute || 1000,
          burstAllowed: options.burstAllowed || 20,
          rateLimitMs: options.rateLimitMs || 0,
          debounceMs: options.debounceMs || 0,
          ...options.preferences,
        };

        this.lastExecuted = 0;
        this.executionCount = 0;
        this.debounceTimer = null;
        this.pendingEvent = null;
        this.failureCount = 0;
        this.isQuarantined = false;
        this.quarantineUntil = 0;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();

        this.cleanup = () => {
          this.middlewares = null;
          this.callback = null;
          clearTimeout(this.debounceTimer);
        };

        this.middlewares = [];
        this.setupDefaultMiddlewares();
      }

      getOrigin() {
        // Check for background context FIRST using API availability
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            // Background has tabs API but content scripts don't
            if (browser.tabs && browser.tabs.query) {
              return "background";
            }
          } catch (e) {}
        }

        // Then check for specific component markers
        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        // Fallback for Node.js style background (shouldn't happen in Firefox)
        if (typeof window === "undefined") return "background";

        return "unknown";
      }
      setupDefaultMiddlewares() {
        this.middlewares = [
          new StateValidationMiddleware(),
          new RateLimitMiddleware(),
          new EventFilterMiddleware(),
          new TransformationMiddleware(),
          new ErrorRecoveryAndDeliveryMiddleware(),
        ];
      }

      addMiddleware(middleware, position = -1) {
        if (position === -1) {
          this.middlewares.push(middleware);
        } else {
          this.middlewares.splice(position, 0, middleware);
        }
      }

      async process(event, data, context = {}) {
        this.lastActivity = Date.now();

        const eventContext = {
          subscriber: this,
          event,
          data,
          context,
          timestamp: Date.now(),
          executionId: `exec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };

        try {
          for (const middleware of this.middlewares) {
            const result = await middleware.process(eventContext);
            if (result === false) {
              return {
                success: false,
                reason: `Blocked by ${middleware.constructor.name}`,
              };
            }
            if (result && result.modified) {
              eventContext.data = result.data;
              eventContext.context = result.context || eventContext.context;
            }
          }

          // Execute the callback
          this.executionCount++;
          const callbackResult = await this.callback(
            eventContext.event,
            eventContext.data,
            eventContext.context,
          );

          return { success: true, result: callbackResult };
        } catch (error) {
          this.failureCount++;
          return { success: false, error: error.message };
        }
      }

      updateState(newState) {
        this.state = newState;
        this.lastActivity = Date.now();
        if (newState === "disabled") {
          this.clearPendingExecution();
        }
      }

      updatePreferences(newPreferences) {
        Object.assign(this.preferences, newPreferences);
        this.lastActivity = Date.now();
      }

      clearPendingExecution() {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
          this.pendingEvent = null;
        }
      }

      getStats() {
        return {
          id: this.id,
          state: this.state,
          executionCount: this.executionCount,
          failureCount: this.failureCount,
          isQuarantined: this.isQuarantined,
          preferences: { ...this.preferences },
          createdAt: this.createdAt,
          lastActivity: this.lastActivity,
        };
      }

      destroy() {
        this.clearPendingExecution();
        this.state = "destroyed";
        this.middlewares = [];
        this.callback = null;
      }
    }

    // ===== MIDDLEWARE BASE CLASS =====
    class SubscriberMiddleware {
      static classes = new Set();

      static get register() {
        if (this !== SubscriberMiddleware) {
          this.classes.add(this);
        }
        window[this.name] = this;
        return true;
      }
      static _ = this.register;

      constructor(name, priority = 0) {
        this.name = name;
        this.priority = priority;
      }

      static getAllMiddlewareClasses() {
        return Array.from(this.classes);
      }

      async process(eventContext) {
        return true;
      }

      async postProcess(eventContext, results) {
        return results;
      }
    }

    // ===== CORE MIDDLEWARE IMPLEMENTATIONS =====
    class StateValidationMiddleware extends SubscriberMiddleware {
      constructor() {
        super("StateValidation", 1);
      }

      async process(eventContext) {
        const subscriber = eventContext.subscriber;

        if (
          subscriber.state === "disabled" ||
          subscriber.state === "destroyed"
        ) {
          return false;
        }

        if (subscriber.state === "paused") {
          return false;
        }

        if (
          subscriber.isQuarantined &&
          Date.now() < subscriber.quarantineUntil
        ) {
          return false;
        }

        if (
          subscriber.isQuarantined &&
          Date.now() >= subscriber.quarantineUntil
        ) {
          subscriber.isQuarantined = false;
          subscriber.failureCount = 0;
        }

        return true;
      }
    }

    // ===== MINIMAL THROTTLE & DEBOUNCE MIDDLEWARE =====
    class RateLimitMiddleware extends SubscriberMiddleware {
      constructor() {
        super("ThrottleDebounce", 3);

        this.throttleMap = new Map(); // event -> last execution time
        this.debounceMap = new Map(); // event -> timeout ID
        this.batchableEvents = new Set(); // events that should batch instead of throttle

        this.setupThrottleRules();
      }

      setupThrottleRules() {
        // Events that benefit from throttling (high frequency)
        this.throttleRules = new Map([
          [/scroll|mousemove|resize/i, { type: "throttle", ms: 16 }], // ~60fps
          [/search|input|filter/i, { type: "debounce", ms: 300 }],
          [/api-|network/i, { type: "throttle", ms: 100 }],
          [/dom-mutation/i, { type: "throttle", ms: 50 }],
        ]);

        // Events that should use batching middleware instead
        this.batchableEvents.add("terminal-log");
        this.batchableEvents.add("media-discovered");
        this.batchableEvents.add("content-update");
      }

      async process(eventContext) {
        const { event } = eventContext;

        // Skip if this event should be handled by batching middleware
        if (this.batchableEvents.has(event)) {
          return true;
        }

        // Find matching throttle rule
        const rule = this.findThrottleRule(event);
        if (!rule) return true;

        const key = `${event}-${eventContext.subscriber?.id || "global"}`;

        if (rule.type === "throttle") {
          return this.applyThrottle(key, rule.ms);
        } else if (rule.type === "debounce") {
          return this.applyDebounce(key, rule.ms, eventContext);
        }

        return true;
      }

      findThrottleRule(event) {
        for (const [pattern, rule] of this.throttleRules) {
          if (pattern.test(event)) return rule;
        }
        return null;
      }

      applyThrottle(key, intervalMs) {
        const now = Date.now();
        const lastExecution = this.throttleMap.get(key) || 0;

        if (now - lastExecution < intervalMs) {
          return false; // Block execution
        }

        this.throttleMap.set(key, now);
        return true; // Allow execution
      }

      applyDebounce(key, delayMs, eventContext) {
        // Clear existing debounce
        if (this.debounceMap.has(key)) {
          clearTimeout(this.debounceMap.get(key));
        }

        // Set new debounce
        const timeoutId = setTimeout(() => {
          this.debounceMap.delete(key);
          // Re-emit the event after debounce delay
          if (window.__globalSubscriberManager) {
            window.__globalSubscriberManager.emit(
              eventContext.event,
              eventContext.data,
              { ...eventContext.context, debounced: true },
            );
          }
        }, delayMs);

        this.debounceMap.set(key, timeoutId);

        return false; // Block immediate execution
      }

      cleanup() {
        // Clear all debounce timers
        for (const timeoutId of this.debounceMap.values()) {
          clearTimeout(timeoutId);
        }
        this.debounceMap.clear();
        this.throttleMap.clear();
      }
    }

    class EventFilterMiddleware extends SubscriberMiddleware {
      constructor() {
        super("EventFilter", 3);
      }

      async process(eventContext) {
        const subscriber = eventContext.subscriber;
        const eventTypes = subscriber.preferences.eventTypes;

        if (!eventTypes || eventTypes.length === 0) {
          return true;
        }

        const eventMatches = eventTypes.some((pattern) => {
          if (typeof pattern === "string") {
            return (
              eventContext.event === pattern ||
              eventContext.event.includes(pattern)
            );
          }
          if (pattern instanceof RegExp) {
            return pattern.test(eventContext.event);
          }
          return false;
        });

        return eventMatches;
      }
    }

    class TransformationMiddleware extends SubscriberMiddleware {
      constructor() {
        super("Transformation", 4);
      }

      async process(eventContext) {
        const subscriber = eventContext.subscriber;
        const transformations = subscriber.preferences.transformations;

        if (!transformations || transformations.length === 0) {
          return true;
        }

        let transformedData = eventContext.data;
        let transformedContext = eventContext.context;

        for (const transformation of transformations) {
          try {
            if (typeof transformation === "function") {
              const result = await transformation(
                transformedData,
                transformedContext,
                eventContext,
              );
              if (result && typeof result === "object") {
                transformedData =
                  result.data !== undefined ? result.data : transformedData;
                transformedContext =
                  result.context !== undefined
                    ? result.context
                    : transformedContext;
              }
            }
          } catch (error) {
            console.warn(
              `Transformation error in subscriber ${subscriber.id}:`,
              error,
            );
          }
        }

        return {
          modified: true,
          data: transformedData,
          context: transformedContext,
        };
      }
    }

    class ErrorRecoveryAndDeliveryMiddleware extends SubscriberMiddleware {
      constructor() {
        super("ErrorRecovery", 5);
      }

      async process(eventContext) {
        const subscriber = eventContext.subscriber;
        let lastError;
        let attempts = 0;
        const maxRetries = subscriber.preferences.maxRetries;

        while (attempts <= maxRetries) {
          try {
            await subscriber.callback(
              eventContext.event,
              eventContext.data,
              eventContext.context,
            );
            subscriber.failureCount = 0;
            return true;
          } catch (error) {
            lastError = error;
            attempts++;

            if (attempts <= maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              subscriber.failureCount++;

              if (subscriber.failureCount >= 5) {
                subscriber.isQuarantined = true;
                subscriber.quarantineUntil =
                  Date.now() +
                  60000 * Math.pow(2, Math.min(subscriber.failureCount - 5, 6));
              }

              switch (subscriber.preferences.fallbackBehavior) {
                case "ignore":
                  return true;
                case "fallback":
                  if (subscriber.preferences.fallbackCallback) {
                    try {
                      await subscriber.preferences.fallbackCallback(
                        eventContext.event,
                        eventContext.data,
                        lastError,
                      );
                      return true;
                    } catch (fallbackError) {
                      console.error(
                        `Fallback failed for subscriber ${subscriber.id}:`,
                        fallbackError,
                      );
                    }
                  }
                  break;
                case "log":
                default:
                  console.error(
                    `Subscriber ${subscriber.id} failed after ${maxRetries} retries:`,
                    lastError,
                  );
                  break;
              }

              throw lastError;
            }
          }
        }
      }
    }

    // ===== ADVANCED CROSS-CONTEXT SERIALIZATION MIDDLEWARE =====
    class CrossContextSerializationMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("CrossContextSerialization", 3); // Before routing

        this.serializers = new Map();
        this.deserializers = new Map();
        this.serializationStats = {
          serialized: 0,
          deserialized: 0,
          errors: 0,
          bytesOriginal: 0,
          bytesSerialized: 0,
        };

        this.setupSerializers();
        console.log("🔄 Cross-Context Serialization Middleware initialized");
      }

      setupSerializers() {
        // DOM Node serializer
        this.serializers.set("dom", this.serializeDOMNode.bind(this));
        this.deserializers.set("dom", this.deserializeDOMNode.bind(this));

        // Error object serializer
        this.serializers.set("error", this.serializeError.bind(this));
        this.deserializers.set("error", this.deserializeError.bind(this));

        // Function serializer (limited)
        this.serializers.set("function", this.serializeFunction.bind(this));
        this.deserializers.set("function", this.deserializeFunction.bind(this));

        // Complex object serializer (handles circular references)
        this.serializers.set("object", this.serializeComplexObject.bind(this));
        this.deserializers.set(
          "object",
          this.deserializeComplexObject.bind(this),
        );

        // HAST/AST serializer
        this.serializers.set("ast", this.serializeAST.bind(this));
        this.deserializers.set("ast", this.deserializeAST.bind(this));

        // Map/Set serializer
        this.serializers.set("collection", this.serializeCollection.bind(this));
        this.deserializers.set(
          "collection",
          this.deserializeCollection.bind(this),
        );
      }

      async process(eventContext) {
        const { event, data, context } = eventContext;

        // Only serialize for cross-context events or when explicitly requested
        if (
          context.crossContext ||
          context.forceSerialize ||
          this.needsSerialization(data)
        ) {
          try {
            const originalSize = this.estimateSize(data);
            const serializedData = await this.serialize(data);
            const serializedSize = this.estimateSize(serializedData);

            eventContext.data = serializedData;
            eventContext.context.serialized = true;
            eventContext.context.originalSize = originalSize;
            eventContext.context.serializedSize = serializedSize;

            this.serializationStats.serialized++;
            this.serializationStats.bytesOriginal += originalSize;
            this.serializationStats.bytesSerialized += serializedSize;
          } catch (error) {
            console.warn(`Serialization failed for ${event}:`, error);
            this.serializationStats.errors++;
            eventContext.context.serializationError = error.message;
          }
        }

        return true;
      }

      async postProcess(eventContext, results) {
        // Deserialize responses from other contexts
        if (eventContext.context.serialized && results.responses) {
          try {
            results.responses = await Promise.all(
              results.responses.map((response) => this.deserialize(response)),
            );
            this.serializationStats.deserialized++;
          } catch (error) {
            console.warn("Response deserialization failed:", error);
            this.serializationStats.errors++;
          }
        }

        return results;
      }

      needsSerialization(data) {
        if (!data || typeof data !== "object") return false;

        // Check for types that need special serialization
        return this.hasComplexTypes(data);
      }

      hasComplexTypes(obj, visited = new WeakSet()) {
        if (visited.has(obj)) return true; // Circular reference
        visited.add(obj);

        // DOM nodes
        if (obj.nodeType !== undefined) return true;

        // Error objects
        if (obj instanceof Error) return true;

        // Functions
        if (typeof obj === "function") return true;

        // Maps and Sets
        if (obj instanceof Map || obj instanceof Set) return true;

        // AST-like objects (have type property)
        if (
          obj.type &&
          (obj.children || obj.properties || obj.value !== undefined)
        )
          return true;

        // Check nested objects
        if (typeof obj === "object" && obj !== null) {
          for (const value of Object.values(obj)) {
            if (typeof value === "object" && value !== null) {
              if (this.hasComplexTypes(value, visited)) return true;
            }
          }
        }

        return false;
      }

      async serialize(data) {
        return this.serializeValue(data, new Map(), new Set());
      }

      serializeValue(value, refMap, processing) {
        if (value === null || value === undefined) return value;

        // Handle primitives
        if (typeof value !== "object" && typeof value !== "function") {
          return value;
        }

        // Handle circular references
        if (processing.has(value)) {
          const refId = refMap.get(value) || `ref_${refMap.size}`;
          refMap.set(value, refId);
          return { __ref: refId };
        }
        processing.add(value);

        try {
          // DOM Node
          if (value.nodeType !== undefined) {
            return {
              __type: "dom",
              __data: this.serializeDOMNode(value),
            };
          }

          // Error object
          if (value instanceof Error) {
            return {
              __type: "error",
              __data: this.serializeError(value),
            };
          }

          // Function
          if (typeof value === "function") {
            return {
              __type: "function",
              __data: this.serializeFunction(value),
            };
          }

          // Map
          if (value instanceof Map) {
            return {
              __type: "collection",
              __data: this.serializeCollection(value),
            };
          }

          // Set
          if (value instanceof Set) {
            return {
              __type: "collection",
              __data: this.serializeCollection(value),
            };
          }

          // AST-like object
          if (
            value.type &&
            (value.children || value.properties || value.value !== undefined)
          ) {
            return {
              __type: "ast",
              __data: this.serializeAST(value, refMap, processing),
            };
          }

          // Regular object or array
          if (Array.isArray(value)) {
            return value.map((item) =>
              this.serializeValue(item, refMap, processing),
            );
          }

          const serialized = {};
          for (const [key, val] of Object.entries(value)) {
            serialized[key] = this.serializeValue(val, refMap, processing);
          }

          return {
            __type: "object",
            __data: serialized,
          };
        } finally {
          processing.delete(value);
        }
      }

      // Specific serializers
      serializeDOMNode(node) {
        return {
          nodeType: node.nodeType,
          nodeName: node.nodeName,
          nodeValue: node.nodeValue,
          textContent: node.textContent,
          attributes: node.attributes
            ? Array.from(node.attributes).map((attr) => ({
                name: attr.name,
                value: attr.value,
              }))
            : null,
          classList: node.classList ? Array.from(node.classList) : null,
          id: node.id,
          className: node.className,
          innerHTML: node.innerHTML,
          outerHTML: node.outerHTML,
        };
      }

      serializeError(error) {
        return {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
          // Preserve custom properties
          ...Object.fromEntries(
            Object.getOwnPropertyNames(error)
              .filter((key) => !["name", "message", "stack"].includes(key))
              .map((key) => [key, error[key]]),
          ),
        };
      }

      serializeFunction(func) {
        return {
          name: func.name,
          source: func.toString(),
          isAsync: func.constructor.name === "AsyncFunction",
          isArrow: !func.prototype,
          length: func.length,
        };
      }

      serializeCollection(collection) {
        if (collection instanceof Map) {
          return {
            type: "Map",
            entries: Array.from(collection.entries()),
          };
        }

        if (collection instanceof Set) {
          return {
            type: "Set",
            values: Array.from(collection.values()),
          };
        }

        return { type: "unknown", value: collection };
      }

      serializeAST(ast, refMap, processing) {
        const serialized = {
          type: ast.type,
        };

        // Serialize common AST properties
        if (ast.children) {
          serialized.children = ast.children.map((child) =>
            this.serializeValue(child, refMap, processing),
          );
        }

        if (ast.properties) {
          serialized.properties = this.serializeValue(
            ast.properties,
            refMap,
            processing,
          );
        }

        if (ast.value !== undefined) {
          serialized.value = ast.value;
        }

        if (ast.data) {
          serialized.data = this.serializeValue(ast.data, refMap, processing);
        }

        // Serialize other properties
        for (const [key, value] of Object.entries(ast)) {
          if (
            !["type", "children", "properties", "value", "data"].includes(key)
          ) {
            serialized[key] = this.serializeValue(value, refMap, processing);
          }
        }

        return serialized;
      }

      // Deserialization methods
      async deserialize(data) {
        return this.deserializeValue(data, new Map());
      }

      deserializeValue(value, refMap) {
        if (value === null || value === undefined) return value;

        // Handle primitives
        if (typeof value !== "object") return value;

        // Handle references
        if (value.__ref) {
          return refMap.get(value.__ref) || null;
        }

        // Handle typed objects
        if (value.__type && value.__data !== undefined) {
          const deserializer = this.deserializers.get(value.__type);
          if (deserializer) {
            const deserialized = deserializer(value.__data);
            return deserialized;
          }
        }

        // Handle arrays
        if (Array.isArray(value)) {
          return value.map((item) => this.deserializeValue(item, refMap));
        }

        // Handle regular objects
        const deserialized = {};
        for (const [key, val] of Object.entries(value)) {
          deserialized[key] = this.deserializeValue(val, refMap);
        }

        return deserialized;
      }

      // Specific deserializers
      deserializeDOMNode(data) {
        // Create a representative object (can't recreate actual DOM nodes in cross-context)
        return {
          __isDOMNode: true,
          nodeType: data.nodeType,
          nodeName: data.nodeName,
          nodeValue: data.nodeValue,
          textContent: data.textContent,
          attributes: data.attributes,
          classList: data.classList,
          id: data.id,
          className: data.className,
          innerHTML: data.innerHTML,
          outerHTML: data.outerHTML,
        };
      }

      deserializeError(data) {
        const error = new Error(data.message);
        error.name = data.name;
        error.stack = data.stack;
        if (data.cause) error.cause = data.cause;

        // Restore custom properties
        for (const [key, value] of Object.entries(data)) {
          if (!["name", "message", "stack", "cause"].includes(key)) {
            error[key] = value;
          }
        }

        return error;
      }

      deserializeFunction(data) {
        // Return function info object (can't recreate actual functions in cross-context)
        return {
          __isFunction: true,
          name: data.name,
          source: data.source,
          isAsync: data.isAsync,
          isArrow: data.isArrow,
          length: data.length,
          toString: () => data.source,
        };
      }

      deserializeCollection(data) {
        if (data.type === "Map") {
          return new Map(data.entries);
        }

        if (data.type === "Set") {
          return new Set(data.values);
        }

        return data.value;
      }

      deserializeAST(data) {
        const ast = { type: data.type };

        // Deserialize AST properties
        for (const [key, value] of Object.entries(data)) {
          if (key !== "type") {
            ast[key] = this.deserializeValue(value);
          }
        }

        return ast;
      }

      serializeComplexObject(data) {
        return data;
      }

      deserializeComplexObject(data) {
        return data;
      }

      estimateSize(data) {
        try {
          return JSON.stringify(data).length;
        } catch {
          return 0; // Fallback for non-serializable data
        }
      }

      getSerializationStats() {
        return {
          ...this.serializationStats,
          compressionRatio:
            this.serializationStats.bytesSerialized > 0
              ? this.serializationStats.bytesOriginal /
                this.serializationStats.bytesSerialized
              : 1,
          errorRate:
            this.serializationStats.serialized > 0
              ? this.serializationStats.errors /
                (this.serializationStats.serialized +
                  this.serializationStats.errors)
              : 0,
        };
      }
    }

    // ===== CROSS-CONTEXT ROUTING MIDDLEWARE =====
    class CrossContextRoutingMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("CrossContextRouting", -1);

        this.origin = this.getOrigin();
        this.localSubscriptions = new Set();
        this.remoteSubscriptions = new Map();
        this.announcementHistory = new Map();
        this.routingTable = new Map();

        // Use existing MessageBroker if available
        if (window.MessageBroker) {
          this.broker = new window.MessageBroker();
          this.setupBrokerHandlers();
        } else {
          this.setupDirectMessaging();
        }

        // Setup storage listener for fallback communication
        this.setupStorageListener();

        console.log(
          `🌐 CrossContextRouting initialized in ${this.origin} context`,
        );
      }

      getOrigin() {
        // Check for background context FIRST using API availability
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            // Background has tabs API but content scripts don't
            if (browser.tabs && browser.tabs.query) {
              return "background";
            }
          } catch (e) {}
        }

        // Then check for specific component markers
        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        // Fallback for Node.js style background (shouldn't happen in Firefox)
        if (typeof window === "undefined") return "background";

        return "unknown";
      }

      setupBrokerHandlers() {
        this.broker.register("subscription-announcement", (data, sender) => {
          this.handleRemoteSubscriptionAnnouncement(data, sender);
          return { success: true };
        });

        this.broker.register("cross-context-event", (data, sender) => {
          this.handleCrossContextEvent(data, sender);
          return { success: true };
        });
      }

      setupDirectMessaging() {
        if (typeof browser !== "undefined" && browser.runtime) {
          browser.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
              if (request.action === "subscription-announcement") {
                this.handleRemoteSubscriptionAnnouncement(request.data, sender);
                sendResponse({ success: true });
              } else if (request.action === "cross-context-event") {
                this.handleCrossContextEvent(request.data, sender);
                sendResponse({ success: true });
              }
              return false;
            },
          );
        }
      }

      async process(eventContext) {
        const { event } = eventContext;

        if (!this.localSubscriptions.has(event)) {
          this.localSubscriptions.add(event);
          await this.announceSubscription(event);
        }

        return true;
      }

      async postProcess(eventContext, results) {
        const { event, data } = eventContext;
        await this.routeToRemoteSubscribers(event, data);
        return results;
      }
      // Refactored to remove redundancy
      async sendAnnouncement(action, data) {
        const strategies = [
          () => this.announceViaRuntime(action, data),
          () => this.announceViaTabs(action, data),
          () => this.announceViaStorage(action, data),
        ];

        for (const strategy of strategies) {
          try {
            const result = await strategy();
            if (result?.success) return result;
          } catch (error) {
            console.debug(`Strategy failed: ${error.message}`);
          }
        }

        return { success: false, error: "All strategies failed" };
      }

      async announceViaRuntime(action, data) {
        // Content scripts use runtime to send to background
        if (this.origin === "background") {
          return {
            success: false,
            error: "Background cannot use runtime.sendMessage to itself",
          };
        }

        try {
          await browser.runtime.sendMessage({
            action,
            data,
            method: "runtime",
            sourceContext: this.origin,
          });
          return { success: true, method: "runtime" };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      async announceViaTabs(action, data) {
        // Only background can use tabs API
        if (this.origin !== "background") {
          return { success: false, error: "Only background can use tabs API" };
        }

        try {
          const tabs = await browser.tabs.query({});
          let successCount = 0;

          for (const tab of tabs) {
            try {
              await browser.tabs.sendMessage(tab.id, {
                action,
                data,
                method: "tabs",
                sourceContext: this.origin,
              });
              successCount++;
            } catch (e) {
              // Tab might not have content script, skip silently
            }
          }

          return {
            success: successCount > 0,
            method: "tabs",
            sentTo: successCount,
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      async announce(sourceContext) {
        const announcement = {
          context: sourceContext,
          tabId: this.getTabId(),
          timestamp: Date.now(),
          capabilities: this.getContextCapabilities(sourceContext),
        };

        return this.sendAnnouncement("context-announcement", announcement);
      }

      async announceSubscription(eventType) {
        const announcement = {
          eventType,
          subscriberContext: this.origin,
          timestamp: Date.now(),
        };

        // Check if already announced
        const announcementKey = `${eventType}-${this.origin}`;
        if (this.announcementHistory.has(announcementKey)) return;
        this.announcementHistory.set(announcementKey, Date.now());

        return this.sendAnnouncement("subscription-announcement", announcement);
      }

      async announceViaStorage(announcement) {
        // FIX: Use storage as fallback announcement mechanism
        if (browser.storage && browser.storage.local) {
          const key = `context-announcement-${announcement.context}`;
          await browser.storage.local.set({
            [key]: {
              ...announcement,
              method: "storage",
            },
          });

          return { success: true, method: "storage" };
        }

        return { success: false, error: "Storage not available" };
      }

      setupStorageListener() {
        if (browser.storage && browser.storage.onChanged) {
          browser.storage.onChanged.addListener((changes, area) => {
            if (area !== "local") return;

            Object.keys(changes).forEach((key) => {
              if (key.startsWith("context-announcement-")) {
                const { newValue } = changes[key];
                if (newValue && newValue.context !== this.origin) {
                  this.handleRemoteSubscriptionAnnouncement(newValue, {
                    storage: true,
                    context: newValue.context,
                  });
                }
              }
            });
          });
        }
      }

      getContextCapabilities(context) {
        // Define what each context can do
        const capabilities = {
          background: ["orchestrate", "inject", "storage", "tabs"],
          proxy: ["display", "ui", "terminal", "user-input"],
          extractor: ["extract", "analyze", "observe", "media-discovery"],
          popup: ["settings", "controls", "status"],
        };

        return capabilities[context] || [];
      }

      handleRemoteSubscriptionAnnouncement(data, sender) {
        const { eventType, subscriberContext } = data;

        if (subscriberContext === this.origin) {
          return;
        }

        if (!this.remoteSubscriptions.has(eventType)) {
          this.remoteSubscriptions.set(eventType, new Set());
        }

        this.remoteSubscriptions.get(eventType).add(subscriberContext);

        if (this.origin === "background" && sender?.tab) {
          this.forwardAnnouncementToOtherTabs(data, sender.tab.id);
        }
      }

      async forwardAnnouncementToOtherTabs(announcement, excludeTabId) {
        try {
          const tabs = await browser.tabs.query({});
          for (const tab of tabs) {
            if (tab.id !== excludeTabId) {
              try {
                await browser.tabs.sendMessage(tab.id, {
                  action: "subscription-announcement",
                  data: announcement,
                });
              } catch (e) {
                // Ignore
              }
            }
          }
        } catch (error) {
          // Ignore
        }
      }

      async routeToRemoteSubscribers(eventType, data) {
        const interestedContexts = this.remoteSubscriptions.get(eventType);
        if (!interestedContexts || interestedContexts.size === 0) {
          return;
        }

        const eventPayload = {
          originalEvent: eventType,
          data,
          sourceContext: this.origin,
          timestamp: Date.now(),
        };

        try {
          if (this.broker) {
            await this.broker.send(null, "cross-context-event", eventPayload);
          } else {
            if (this.origin === "background") {
              const tabs = await browser.tabs.query({});
              for (const tab of tabs) {
                try {
                  await browser.tabs.sendMessage(tab.id, {
                    action: "cross-context-event",
                    data: eventPayload,
                  });
                } catch (e) {
                  // Ignore
                }
              }
            } else {
              await browser.runtime.sendMessage({
                action: "cross-context-event",
                data: eventPayload,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to route '${eventType}':`, error);
        }
      }

      handleCrossContextEvent(data, sender) {
        const { originalEvent, data: eventData, sourceContext } = data;

        if (sourceContext === this.origin) {
          return;
        }

        if (this.localSubscriptions.has(originalEvent)) {
          if (window.__globalSubscriberManager) {
            window.__globalSubscriberManager.emit(originalEvent, eventData, {
              crossContext: true,
              sourceContext,
              routedBy: this.origin,
            });
          }
        }
      }

      getRoutingStats() {
        return {
          origin: this.origin,
          localSubscriptions: Array.from(this.localSubscriptions),
          remoteSubscriptions: Object.fromEntries(
            Array.from(this.remoteSubscriptions.entries()).map(
              ([event, contexts]) => [event, Array.from(contexts)],
            ),
          ),
        };
      }
    }

    class UnhandledMessageMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("UnhandledMessage", 2);

        this.unhandledMessages = new Map();
        this.messagePatterns = new Map();
        this.alertThresholds = {
          count: 10, // Alert after 10 unhandled messages
          timeWindow: 60000, // within 1 minute
          severity: 5, // Alert after 5 of same type
        };

        this.setupMessageTracking();
      }

      setupMessageTracking() {
        // Clean up old unhandled message records
        setInterval(() => {
          this.cleanupOldMessages();
        }, 60000); // Every minute
      }

      async process(eventContext) {
        const { event, data, subscriber } = eventContext;

        // Skip if this is a system/internal event
        if (event.startsWith("system-") || event.startsWith("internal-")) {
          return true;
        }

        return true; // Let processing continue
      }

      async postProcess(eventContext, results) {
        const { event, data, context } = eventContext;

        // Check if message was handled
        const wasHandled =
          results.responses &&
          results.responses.length > 0 &&
          results.responses.some((r) => r.success);

        if (!wasHandled && !event.startsWith("system-")) {
          this.trackUnhandledMessage(event, data, context);
        }

        return results;
      }

      trackUnhandledMessage(event, data, context) {
        const messageId = `${event}-${Date.now()}`;
        const record = {
          id: messageId,
          event,
          data: JSON.stringify(data).substring(0, 200), // Truncate for storage
          context: context.sourceContext || "unknown",
          timestamp: Date.now(),
          origin: this.getOrigin(),
        };

        this.unhandledMessages.set(messageId, record);

        // Track patterns
        const patternKey = event;
        if (!this.messagePatterns.has(patternKey)) {
          this.messagePatterns.set(patternKey, {
            count: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            contexts: new Set(),
          });
        }

        const pattern = this.messagePatterns.get(patternKey);
        pattern.count++;
        pattern.lastSeen = Date.now();
        pattern.contexts.add(context.sourceContext || "unknown");

        // Check if we should alert
        this.checkAlertThresholds(patternKey, pattern);

        console.warn(
          `⚠️ Unhandled message: ${event} from ${context.sourceContext || "unknown"}`,
        );

        // Emit unhandled message event for debugging
        if (window.__globalSubscriberManager) {
          window.__globalSubscriberManager.emit("unhandled-message-detected", {
            event,
            context: context.sourceContext,
            timestamp: Date.now(),
          });
        }
      }

      checkAlertThresholds(patternKey, pattern) {
        const now = Date.now();
        const timeWindow = this.alertThresholds.timeWindow;

        // Check severity threshold (same message type repeatedly)
        if (pattern.count >= this.alertThresholds.severity) {
          console.error(
            `🚨 High frequency unhandled message: ${patternKey} (${pattern.count} times)`,
          );

          if (window.__globalSubscriberManager) {
            window.__globalSubscriberManager.emit("unhandled-message-alert", {
              type: "high-frequency",
              event: patternKey,
              count: pattern.count,
              contexts: Array.from(pattern.contexts),
            });
          }
        }

        // Check total unhandled messages in time window
        const recentMessages = Array.from(
          this.unhandledMessages.values(),
        ).filter((msg) => now - msg.timestamp < timeWindow);

        if (recentMessages.length >= this.alertThresholds.count) {
          console.error(
            `🚨 High volume of unhandled messages: ${recentMessages.length} in ${timeWindow}ms`,
          );

          if (window.__globalSubscriberManager) {
            window.__globalSubscriberManager.emit("unhandled-message-alert", {
              type: "high-volume",
              count: recentMessages.length,
              timeWindow,
            });
          }
        }
      }

      cleanupOldMessages() {
        const cutoffTime = Date.now() - 10 * 60 * 1000; // 10 minutes

        // Clean unhandled messages
        for (const [id, record] of this.unhandledMessages.entries()) {
          if (record.timestamp < cutoffTime) {
            this.unhandledMessages.delete(id);
          }
        }

        // Clean message patterns (but keep longer for trend analysis)
        const patternCutoff = Date.now() - 60 * 60 * 1000; // 1 hour
        for (const [pattern, data] of this.messagePatterns.entries()) {
          if (data.lastSeen < patternCutoff) {
            this.messagePatterns.delete(pattern);
          }
        }
      }

      getOrigin() {
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            if (browser.tabs && browser.tabs.query) {
              return "background";
            }
          } catch (e) {}
        }

        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        return "unknown";
      }

      getUnhandledStats() {
        return {
          totalUnhandled: this.unhandledMessages.size,
          patterns: Object.fromEntries(
            Array.from(this.messagePatterns.entries()).map(
              ([pattern, data]) => [
                pattern,
                {
                  count: data.count,
                  contexts: Array.from(data.contexts),
                  firstSeen: data.firstSeen,
                  lastSeen: data.lastSeen,
                },
              ],
            ),
          ),
          recentMessages: Array.from(this.unhandledMessages.values())
            .slice(-10)
            .map((msg) => ({
              event: msg.event,
              context: msg.context,
              timestamp: msg.timestamp,
            })),
        };
      }
    }

    class AutoRegistrationMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("AutoRegistration", 1);

        this.autoRegisteredHandlers = new Map();
        this.registrationPatterns = new Map();
        this.origin = this.getOrigin();

        this.setupAutoRegistration();
      }

      setupAutoRegistration() {
        // Set up patterns for auto-registration
        this.registrationPatterns.set(/^handle-(.+)$/, {
          priority: 3,
          crossContext: true,
          autoResponse: true,
        });

        this.registrationPatterns.set(/^process-(.+)$/, {
          priority: 4,
          crossContext: false,
          autoResponse: false,
        });

        this.registrationPatterns.set(/^route-(.+)$/, {
          priority: 2,
          crossContext: true,
          autoResponse: true,
        });
      }

      async process(eventContext) {
        const { event, subscriber } = eventContext;

        // Check if this event matches auto-registration patterns
        for (const [pattern, config] of this.registrationPatterns.entries()) {
          if (pattern.test(event)) {
            this.registerHandler(event, config);

            // Add auto-registration context
            eventContext.context.autoRegistered = true;
            eventContext.context.registrationPattern = pattern.source;
            eventContext.context.expectedCrossContext = config.crossContext;

            break;
          }
        }

        return true;
      }

      registerHandler(event, config) {
        const handlerKey = `${event}-${this.origin}`;

        if (!this.autoRegisteredHandlers.has(handlerKey)) {
          this.autoRegisteredHandlers.set(handlerKey, {
            event,
            config,
            registeredAt: Date.now(),
            origin: this.origin,
            callCount: 0,
            lastCalled: null,
          });

          console.log(
            `📝 Auto-registered handler: ${event} in ${this.origin} context`,
          );

          // Emit registration event
          if (window.__globalSubscriberManager) {
            window.__globalSubscriberManager.emit("auto-handler-registered", {
              event,
              origin: this.origin,
              config,
              timestamp: Date.now(),
            });
          }
        }

        // Update call statistics
        const handler = this.autoRegisteredHandlers.get(handlerKey);
        handler.callCount++;
        handler.lastCalled = Date.now();
      }

      getOrigin() {
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            if (browser.tabs && browser.tabs.query) {
              return "background";
            }
          } catch (e) {}
        }

        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        return "unknown";
      }

      getAutoRegistrationStats() {
        return {
          origin: this.origin,
          totalRegistered: this.autoRegisteredHandlers.size,
          patterns: Array.from(this.registrationPatterns.keys()).map(
            (p) => p.source,
          ),
          handlers: Object.fromEntries(
            Array.from(this.autoRegisteredHandlers.entries()).map(
              ([key, handler]) => [
                key,
                {
                  event: handler.event,
                  callCount: handler.callCount,
                  lastCalled: handler.lastCalled,
                  registeredAt: handler.registeredAt,
                },
              ],
            ),
          ),
        };
      }
    }

    // ===== MINIMAL PERFORMANCE TRACKER =====
    class PerformanceMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("MinimalPerformance", 10); // Low priority - runs after others

        this.slowEvents = new Map(); // event -> count
        this.slowThreshold = 100; // ms
        this.reportThreshold = 5; // report after 5 slow events

        // Track only problematic events
        this.trackingEnabled = false;
        this.enableTracking();
      }

      async process(eventContext) {
        if (!this.trackingEnabled) return true;

        eventContext.context.perfStart = performance.now();
        return true;
      }

      async postProcess(eventContext, results) {
        if (!this.trackingEnabled || !eventContext.context.perfStart) {
          return results;
        }

        const duration = performance.now() - eventContext.context.perfStart;

        if (duration > this.slowThreshold) {
          this.trackSlowEvent(eventContext.event, duration);
        }

        return results;
      }

      trackSlowEvent(event, duration) {
        const count = this.slowEvents.get(event) || 0;
        this.slowEvents.set(event, count + 1);

        // Report if threshold reached
        if (count + 1 >= this.reportThreshold) {
          console.warn(
            `🐌 Slow event detected: ${event} (${duration.toFixed(1)}ms) - occurred ${count + 1} times`,
          );

          // Emit performance warning
          if (window.__localEventBus) {
            window.__localEventBus.emitLocal("performance-warning", {
              event,
              duration,
              count: count + 1,
              threshold: this.slowThreshold,
            });
          }

          // Reset counter to avoid spam
          this.slowEvents.set(event, 0);
        }
      }

      enableTracking() {
        // Only enable in development or when explicitly requested
        this.trackingEnabled =
          window.location?.search?.includes("debug=performance") ||
          localStorage.getItem("vibe-debug-performance") === "true" ||
          window.__vibeDebugMode;
      }

      getStats() {
        return {
          trackingEnabled: this.trackingEnabled,
          slowThreshold: this.slowThreshold,
          slowEvents: Object.fromEntries(this.slowEvents),
          totalSlowEvents: Array.from(this.slowEvents.values()).reduce(
            (a, b) => a + b,
            0,
          ),
        };
      }
    }

    // ===== MINIMAL LOOP PREVENTION & DEDUPLICATION =====
    class LoopPreventionMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("LoopPrevention", 1); // High priority - runs early

        this.recentEvents = new Map(); // event+data hash -> timestamp
        this.loopDetection = new Map(); // event -> consecutive count
        this.maxDuplicates = 3; // Block after 3 identical events
        this.duplicateWindow = 100; // ms window for duplicate detection
        this.loopWindow = 1000; // ms window for loop detection

        // Cleanup old entries periodically
        setInterval(() => this.cleanup(), 30000);
      }

      async process(eventContext) {
        const { event, data } = eventContext;

        // Create simple hash for deduplication
        const eventHash = this.createEventHash(event, data);
        const now = Date.now();

        // Check for rapid duplicates
        if (this.recentEvents.has(eventHash)) {
          const lastTime = this.recentEvents.get(eventHash);
          if (now - lastTime < this.duplicateWindow) {
            return false; // Block duplicate
          }
        }

        // Update recent events
        this.recentEvents.set(eventHash, now);

        // Check for event loops (same event firing repeatedly)
        const loopCount = this.loopDetection.get(event) || 0;

        if (loopCount >= this.maxDuplicates) {
          // Reset if enough time has passed
          if (
            now - (this.loopDetection.get(`${event}-time`) || 0) >
            this.loopWindow
          ) {
            this.loopDetection.set(event, 1);
            this.loopDetection.set(`${event}-time`, now);
          } else {
            console.warn(
              `🔄 Event loop prevented: ${event} (${loopCount} rapid fires)`,
            );
            return false; // Block loop
          }
        } else {
          this.loopDetection.set(event, loopCount + 1);
          if (loopCount === 0) {
            this.loopDetection.set(`${event}-time`, now);
          }
        }

        return true;
      }

      createEventHash(event, data) {
        // Simple hash for deduplication - don't include timestamp/random data
        const hashData = {
          event,
          dataType: typeof data,
          dataKeys:
            data && typeof data === "object" ? Object.keys(data).sort() : null,
          stringData: typeof data === "string" ? data.slice(0, 50) : null,
        };

        try {
          return JSON.stringify(hashData);
        } catch (e) {
          return `${event}-${Date.now()}`;
        }
      }

      cleanup() {
        const now = Date.now();
        const cutoff = now - 5 * 60 * 1000; // 5 minutes

        // Remove old duplicate tracking
        for (const [hash, timestamp] of this.recentEvents.entries()) {
          if (timestamp < cutoff) {
            this.recentEvents.delete(hash);
          }
        }

        // Reset loop counters periodically
        for (const [key, timestamp] of this.loopDetection.entries()) {
          if (key.includes("-time") && timestamp < cutoff) {
            const event = key.replace("-time", "");
            this.loopDetection.delete(event);
            this.loopDetection.delete(key);
          }
        }
      }

      getStats() {
        return {
          recentEventsTracked: this.recentEvents.size,
          loopDetectionActive: this.loopDetection.size / 2, // Divide by 2 because we store event + time
          maxDuplicates: this.maxDuplicates,
          duplicateWindow: this.duplicateWindow,
          loopWindow: this.loopWindow,
        };
      }
    }
    // ===== TERMINAL INTEGRATION MIDDLEWARE =====
    class TerminalIntegrationMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("TerminalIntegration", 8);
        this.outputBuffer = [];
        this.flushTimer = null;
        this.terminalEvents = [
          "extraction-start",
          "extraction-progress",
          "extraction-complete",
          "extraction-failed",
          "css-loading",
          "css-loaded",
          "css-failed",
          "media-found",
          "media-mode-change",
          "ascii-conversion-start",
          "ascii-conversion-complete",
          "ascii-conversion-failed",
          "error",
          "warning",
        ];
      }

      async postProcess(eventContext, results) {
        const { event, data, context } = eventContext;

        if (this.shouldLogToTerminal(event)) {
          this.logToTerminal(event, data, context);
        }

        return results;
      }

      shouldLogToTerminal(eventType) {
        return (
          this.terminalEvents.some((e) => eventType.includes(e)) ||
          eventType.includes("error") ||
          eventType.includes("failed")
        );
      }

      logToTerminal(eventType, data, context) {
        if (window.__vibeReaderProxyController?.logToTerminal) {
          const proxy = window.__vibeReaderProxyController;
          const category = this.categorizeEvent(eventType);
          const level =
            eventType.includes("error") || eventType.includes("failed")
              ? "ERR"
              : "INFO";

          proxy.logToTerminal(
            level,
            `Event: ${eventType}`,
            category,
            "subscriber",
            { data, context },
          );
        }
      }
      async process(eventContext) {
        const { event, data } = eventContext;

        // Check if this is a batched terminal-log event
        if (event === "terminal-log" && data.batched) {
          // Process entire batch at once
          data.items.forEach((item) => {
            this.outputBuffer.push(this.formatMessage(item));
          });
          this.scheduleFlush();
          return false; // Prevent further processing
        }

        return true;
      }
      scheduleFlush() {
        if (!this.flushTimer) {
          this.flushTimer = setTimeout(() => this.flush(), 10);
        }
      }

      flush() {
        if (this.outputBuffer.length > 0 && typeof dump !== "undefined") {
          // Single dump() call for entire batch
          dump(this.outputBuffer.join(""));
          this.outputBuffer = [];
        }
        this.flushTimer = null;
      }

      categorizeEvent(eventType) {
        if (eventType.includes("error") || eventType.includes("failed"))
          return "ERRORS";
        if (eventType.includes("css")) return "CSS";
        if (
          eventType.includes("media") ||
          eventType.includes("image") ||
          eventType.includes("video")
        )
          return "MEDIA";
        if (eventType.includes("ascii")) return "ASCII";
        if (eventType.includes("extraction") || eventType.includes("proxy"))
          return "NETWORK";
        return "SYSTEM";
      }
    }

    // =====  BATCHING MIDDLEWARE =====
    class BatchingMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("Batching", 5);

        this.batches = new Map();
        this.batchStrategies = new Map();
        this.batchTimers = new Map();

        this.setupDefaultStrategies();
      }

      setupDefaultStrategies() {
        this.batchStrategies.set("extraction-progress", {
          strategy: "replace",
          delay: 200,
        });
        this.batchStrategies.set("media-discovered", {
          strategy: "accumulate",
          delay: 150,
        });
        this.batchStrategies.set("dom-mutation", {
          strategy: "replace",
          delay: 100,
        });
        this.batchStrategies.set("scroll-event", {
          strategy: "replace",
          delay: 50,
        });
        this.batchStrategies.set("content-updated", {
          strategy: "merge",
          delay: 300,
        });
        this.batchStrategies.set("terminal-log", {
          strategy: "accumulate",
          delay: 100,
        });
      }

      async process(eventContext) {
        const { event, data, context } = eventContext;

        const strategy = this.batchStrategies.get(event);
        if (!strategy && !context.batchable) {
          return true;
        }

        const batchConfig = strategy || {
          strategy: context.batchStrategy || "accumulate",
          delay: context.batchDelay || 100,
        };

        return await this.addToBatch(event, data, batchConfig, eventContext);
      }
      // Add to BatchingMiddleware class:
      getBatchingStats() {
        return {
          activeBatches: this.batches.size,
          batchStrategies: Object.fromEntries(this.batchStrategies),
          pendingTimers: this.batchTimers.size,
        };
      }
      async addToBatch(eventType, data, config, originalContext) {
        const batchKey = `${eventType}-${config.strategy}`;

        if (!this.batches.has(batchKey)) {
          this.batches.set(batchKey, {
            eventType,
            strategy: config.strategy,
            items: [],
            created: Date.now(),
            lastUpdated: Date.now(),
          });
        }

        const batch = this.batches.get(batchKey);

        switch (config.strategy) {
          case "replace":
            batch.items = [{ data, context: originalContext }];
            break;
          case "accumulate":
            batch.items.push({ data, context: originalContext });
            break;
          case "merge":
            if (batch.items.length === 0) {
              batch.items = [{ data, context: originalContext }];
            } else {
              const lastItem = batch.items[batch.items.length - 1];
              lastItem.data = { ...lastItem.data, ...data };
            }
            break;
        }

        batch.lastUpdated = Date.now();

        if (this.batchTimers.has(batchKey)) {
          clearTimeout(this.batchTimers.get(batchKey));
        }

        const timer = setTimeout(() => {
          this.processBatch(batchKey);
        }, config.delay);

        this.batchTimers.set(batchKey, timer);

        return false;
      }

      async processBatch(batchKey) {
        const batch = this.batches.get(batchKey);
        if (!batch) return;

        if (window.__globalSubscriberManager) {
          for (const item of batch.items) {
            await window.__globalSubscriberManager.directEmit(
              batch.eventType,
              item.data,
              {
                ...item.context.context,
                batched: true,
                batchSize: batch.items.length,
              },
            );
          }
        }

        this.batches.delete(batchKey);
        this.batchTimers.delete(batchKey);
      }

      cleanup() {
        for (const timer of this.batchTimers.values()) {
          clearTimeout(timer);
        }
        this.batches.clear();
        this.batchTimers.clear();
      }
    }

    // ===== MEMORY MANAGEMENT MIDDLEWARE =====
    class MemoryManagementMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("MemoryManagement", 2);

        this.memoryThresholds = {
          subscribers: 1000,
          events: 5000,
          history: 10000,
        };

        this.memoryMetrics = new Map();
        this.cleanupTimer = null;

        this.startMemoryMonitoring();
      }

      startMemoryMonitoring() {
        this.cleanupTimer = setInterval(() => {
          this.performMemoryCleanup();
        }, 30000);
      }

      async process(eventContext) {
        const { subscriber } = eventContext;
        this.recordSubscriberActivity(subscriber.id);
        return true;
      }

      recordSubscriberActivity(subscriberId) {
        this.memoryMetrics.set(`subscriber-${subscriberId}`, {
          lastActivity: Date.now(),
          activityCount:
            (this.memoryMetrics.get(`subscriber-${subscriberId}`)
              ?.activityCount || 0) + 1,
        });
      }

      performMemoryCleanup() {
        const now = Date.now();
        const thirtyMinutesAgo = now - 30 * 60 * 1000;

        // Cleanup old metrics
        for (const [key, metric] of this.memoryMetrics.entries()) {
          if (metric.lastActivity < thirtyMinutesAgo) {
            this.memoryMetrics.delete(key);
          }
        }

        // Cleanup inactive subscribers
        if (window.__globalSubscriberManager) {
          const manager = window.__globalSubscriberManager;
          manager.cleanupInactiveSubscribers(thirtyMinutesAgo);
        }

        // Cleanup proxy controller content
        if (window.__vibeReaderProxyController) {
          const proxy = window.__vibeReaderProxyController;

          if (
            proxy.extractedContent &&
            Date.now() - (proxy.contentTimestamp || 0) > 30 * 60 * 1000
          ) {
            proxy.extractedContent = null;
            console.log("🧹 Cleared old extracted content");
          }
        }
      }

      destroy() {
        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer);
          this.cleanupTimer = null;
        }
        this.memoryMetrics.clear();
      }
    }

    // ===== CROSS-CONTEXT METRICS MIDDLEWARE =====
    class CrossContextMetricsMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("CrossContextMetrics", 10); // Low priority - runs after everything else

        this.origin = this.getOrigin();

        // Metrics storage
        this.contextMetrics = new Map(); // contextPair -> detailed metrics
        this.eventTypeMetrics = new Map(); // eventType -> aggregated metrics
        this.performanceMetrics = new Map(); // performance tracking per context
        this.errorMetrics = new Map(); // error tracking per context pair
        this.throughputMetrics = new Map(); // throughput tracking

        // Configuration
        this.aggregationInterval = 30000; // 30 seconds
        this.retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
        this.performanceThresholds = {
          slow: 1000, // 1 second
          verySlow: 5000, // 5 seconds
          timeout: 30000, // 30 seconds
        };

        // Real-time metrics
        this.currentWindowStart = Date.now();
        this.currentWindowMetrics = new Map();

        this.initializeMetrics();
      }

      getOrigin() {
        // Check for background context FIRST using API availability
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            // Background has tabs API but content scripts don't
            if (browser.tabs && browser.tabs.query) {
              return "background";
            }
          } catch (e) {}
        }

        // Then check for specific component markers
        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        // Fallback for Node.js style background (shouldn't happen in Firefox)
        if (typeof window === "undefined") return "background";

        return "unknown";
      }

      initializeMetrics() {
        // Start aggregation timer
        this.aggregationTimer = setInterval(() => {
          this.aggregateMetrics();
        }, this.aggregationInterval);

        // Start cleanup timer
        this.cleanupTimer = setInterval(() => {
          this.cleanupOldMetrics();
        }, this.retentionPeriod / 24); // Cleanup every hour

        // Initialize current window
        this.resetCurrentWindow();

        console.log(
          `📊 CrossContextMetrics initialized in ${this.origin} context`,
        );
      }

      // Pre-processing - capture event start time
      async process(eventContext) {
        const { event, context } = eventContext;

        // Mark processing start time
        eventContext.context.metricsStartTime = Date.now();

        // Track event frequency
        this.trackEventFrequency(event, context);

        return true;
      }

      // Post-processing - collect comprehensive metrics
      async postProcess(eventContext, results) {
        const { event, data, context } = eventContext;
        const startTime = context.metricsStartTime || Date.now();
        const duration = Date.now() - startTime;

        // Collect base metrics
        const metrics = {
          event,
          duration,
          timestamp: Date.now(),
          success: results.responses && results.responses.length > 0,
          responseCount: results.responses ? results.responses.length : 0,
          dataSize: this.calculateDataSize(data),
          origin: this.origin,
          crossContext: context.crossContext || false,
          sourceContext: context.sourceContext,
          targetContext: context.targetContext,
          sessionId: context.sessionId,
          batchable: context.batchable || false,
          batched: context.batched || false,
          retried: context.retried || false,
          cached: context.cached || false,
        };

        // Record comprehensive metrics
        this.recordMetrics(metrics);

        // Track performance issues
        this.trackPerformanceIssues(metrics);

        // Update throughput metrics
        this.updateThroughputMetrics(metrics);

        // Track errors if any
        if (!metrics.success) {
          this.trackError(metrics, results.error);
        }

        return results;
      }

      recordMetrics(metrics) {
        // Record context pair metrics
        if (metrics.crossContext) {
          const contextPair = `${metrics.sourceContext}->${this.origin}`;
          this.recordContextPairMetrics(contextPair, metrics);
        }

        // Record event type metrics
        this.recordEventTypeMetrics(metrics.event, metrics);

        // Record in current window for real-time aggregation
        this.recordCurrentWindowMetrics(metrics);
      }

      recordContextPairMetrics(contextPair, metrics) {
        if (!this.contextMetrics.has(contextPair)) {
          this.contextMetrics.set(contextPair, {
            totalEvents: 0,
            successfulEvents: 0,
            failedEvents: 0,
            totalDuration: 0,
            averageDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            totalDataSize: 0,
            averageDataSize: 0,
            recentEvents: [],
            performanceBuckets: {
              fast: 0, // < 100ms
              normal: 0, // 100ms - 1s
              slow: 0, // 1s - 5s
              verySlow: 0, // > 5s
            },
            hourlyStats: new Map(),
            lastUpdated: Date.now(),
          });
        }

        const stats = this.contextMetrics.get(contextPair);

        // Update counters
        stats.totalEvents++;
        if (metrics.success) {
          stats.successfulEvents++;
        } else {
          stats.failedEvents++;
        }

        // Update duration stats
        stats.totalDuration += metrics.duration;
        stats.averageDuration = stats.totalDuration / stats.totalEvents;
        stats.minDuration = Math.min(stats.minDuration, metrics.duration);
        stats.maxDuration = Math.max(stats.maxDuration, metrics.duration);

        // Update data size stats
        stats.totalDataSize += metrics.dataSize;
        stats.averageDataSize = stats.totalDataSize / stats.totalEvents;

        // Update performance buckets
        if (metrics.duration < 100) {
          stats.performanceBuckets.fast++;
        } else if (metrics.duration < 1000) {
          stats.performanceBuckets.normal++;
        } else if (metrics.duration < 5000) {
          stats.performanceBuckets.slow++;
        } else {
          stats.performanceBuckets.verySlow++;
        }

        // Track recent events (keep last 50)
        stats.recentEvents.push({
          event: metrics.event,
          duration: metrics.duration,
          success: metrics.success,
          timestamp: metrics.timestamp,
          dataSize: metrics.dataSize,
        });

        if (stats.recentEvents.length > 50) {
          stats.recentEvents = stats.recentEvents.slice(-50);
        }

        // Update hourly stats
        const hour = new Date(metrics.timestamp).getHours();
        if (!stats.hourlyStats.has(hour)) {
          stats.hourlyStats.set(hour, {
            count: 0,
            avgDuration: 0,
            totalDuration: 0,
          });
        }
        const hourlyStats = stats.hourlyStats.get(hour);
        hourlyStats.count++;
        hourlyStats.totalDuration += metrics.duration;
        hourlyStats.avgDuration = hourlyStats.totalDuration / hourlyStats.count;

        stats.lastUpdated = Date.now();
      }

      recordEventTypeMetrics(eventType, metrics) {
        if (!this.eventTypeMetrics.has(eventType)) {
          this.eventTypeMetrics.set(eventType, {
            totalCount: 0,
            crossContextCount: 0,
            localCount: 0,
            averageDuration: 0,
            totalDuration: 0,
            successRate: 0,
            totalSuccesses: 0,
            contexts: new Set(),
            lastSeen: Date.now(),
          });
        }

        const stats = this.eventTypeMetrics.get(eventType);
        stats.totalCount++;

        if (metrics.crossContext) {
          stats.crossContextCount++;
          if (metrics.sourceContext) {
            stats.contexts.add(`${metrics.sourceContext}->${this.origin}`);
          }
        } else {
          stats.localCount++;
        }

        stats.totalDuration += metrics.duration;
        stats.averageDuration = stats.totalDuration / stats.totalCount;

        if (metrics.success) {
          stats.totalSuccesses++;
        }
        stats.successRate = stats.totalSuccesses / stats.totalCount;
        stats.lastSeen = Date.now();
      }

      recordCurrentWindowMetrics(metrics) {
        const windowKey = `${metrics.event}-${Math.floor(Date.now() / 1000)}`;

        if (!this.currentWindowMetrics.has(windowKey)) {
          this.currentWindowMetrics.set(windowKey, {
            eventType: metrics.event,
            count: 0,
            windowStart: Math.floor(Date.now() / 1000) * 1000,
            crossContext: metrics.crossContext || false,
          });
        }

        this.currentWindowMetrics.get(windowKey).count++;
      }

      trackEventFrequency(eventType, context) {
        const now = Date.now();
        const windowKey = `${eventType}-${Math.floor(now / 1000)}`; // 1-second windows

        if (!this.currentWindowMetrics.has(windowKey)) {
          this.currentWindowMetrics.set(windowKey, {
            eventType,
            count: 0,
            windowStart: Math.floor(now / 1000) * 1000,
            crossContext: context.crossContext || false,
          });
        }

        this.currentWindowMetrics.get(windowKey).count++;
      }

      trackPerformanceIssues(metrics) {
        if (metrics.duration > this.performanceThresholds.slow) {
          const issueKey = `${metrics.event}-${this.origin}`;

          if (!this.performanceMetrics.has(issueKey)) {
            this.performanceMetrics.set(issueKey, {
              eventType: metrics.event,
              slowEvents: 0,
              verySlowEvents: 0,
              timeoutEvents: 0,
              totalIssues: 0,
              firstSeen: Date.now(),
              lastSeen: Date.now(),
            });
          }

          const perfStats = this.performanceMetrics.get(issueKey);

          if (metrics.duration > this.performanceThresholds.timeout) {
            perfStats.timeoutEvents++;
          } else if (metrics.duration > this.performanceThresholds.verySlow) {
            perfStats.verySlowEvents++;
          } else {
            perfStats.slowEvents++;
          }

          perfStats.totalIssues++;
          perfStats.lastSeen = Date.now();
        }
      }

      updateThroughputMetrics(metrics) {
        const minuteKey = Math.floor(Date.now() / 60000); // 1-minute windows

        if (!this.throughputMetrics.has(minuteKey)) {
          this.throughputMetrics.set(minuteKey, {
            minute: minuteKey,
            totalEvents: 0,
            crossContextEvents: 0,
            localEvents: 0,
            totalDataSize: 0,
            successfulEvents: 0,
            failedEvents: 0,
          });
        }

        const throughput = this.throughputMetrics.get(minuteKey);
        throughput.totalEvents++;
        throughput.totalDataSize += metrics.dataSize;

        if (metrics.crossContext) {
          throughput.crossContextEvents++;
        } else {
          throughput.localEvents++;
        }

        if (metrics.success) {
          throughput.successfulEvents++;
        } else {
          throughput.failedEvents++;
        }
      }

      trackError(metrics, error) {
        const errorKey = `${metrics.event}-${this.origin}`;

        if (!this.errorMetrics.has(errorKey)) {
          this.errorMetrics.set(errorKey, {
            eventType: metrics.event,
            totalErrors: 0,
            errorTypes: new Map(),
            recentErrors: [],
            firstError: Date.now(),
            lastError: Date.now(),
          });
        }

        const errorStats = this.errorMetrics.get(errorKey);
        errorStats.totalErrors++;

        const errorType = error ? error.constructor.name : "UnknownError";
        const errorCount = errorStats.errorTypes.get(errorType) || 0;
        errorStats.errorTypes.set(errorType, errorCount + 1);

        errorStats.recentErrors.push({
          error: error ? error.message : "Unknown error",
          timestamp: Date.now(),
          duration: metrics.duration,
          crossContext: metrics.crossContext,
        });

        // Keep last 20 errors
        if (errorStats.recentErrors.length > 20) {
          errorStats.recentErrors = errorStats.recentErrors.slice(-20);
        }

        errorStats.lastError = Date.now();
      }

      calculateDataSize(data) {
        try {
          return JSON.stringify(data).length;
        } catch (error) {
          return 0;
        }
      }

      aggregateMetrics() {
        const aggregatedData = {
          timestamp: Date.now(),
          origin: this.origin,
          windowDuration: this.aggregationInterval,
          contextMetrics: Object.fromEntries(this.contextMetrics),
          eventTypeMetrics: Object.fromEntries(this.eventTypeMetrics),
          performanceIssues: Object.fromEntries(this.performanceMetrics),
          throughput: this.getThroughputSummary(),
          topEvents: this.getTopEvents(),
          systemHealth: this.calculateSystemHealth(),
        };

        // Emit aggregated metrics
        if (window.__globalSubscriberManager) {
          window.__globalSubscriberManager.emit(
            "cross-context-metrics-aggregated",
            aggregatedData,
          );
        }

        // Log summary for debugging
        console.log(`📊 Metrics Summary (${this.origin}):`, {
          totalContextPairs: this.contextMetrics.size,
          totalEventTypes: this.eventTypeMetrics.size,
          performanceIssues: this.performanceMetrics.size,
          systemHealth: aggregatedData.systemHealth,
        });
      }

      getThroughputSummary() {
        const recentMinutes = Array.from(this.throughputMetrics.values()).slice(
          -5,
        ); // Last 5 minutes

        return {
          recentMinutes: recentMinutes.length,
          avgEventsPerMinute:
            recentMinutes.reduce((sum, m) => sum + m.totalEvents, 0) /
            Math.max(recentMinutes.length, 1),
          avgDataSizePerMinute:
            recentMinutes.reduce((sum, m) => sum + m.totalDataSize, 0) /
            Math.max(recentMinutes.length, 1),
          crossContextRatio:
            recentMinutes.reduce((sum, m) => sum + m.crossContextEvents, 0) /
            Math.max(
              recentMinutes.reduce((sum, m) => sum + m.totalEvents, 0),
              1,
            ),
        };
      }

      getTopEvents() {
        return Array.from(this.eventTypeMetrics.entries())
          .map(([eventType, stats]) => ({ eventType, ...stats }))
          .sort((a, b) => b.totalCount - a.totalCount)
          .slice(0, 10);
      }

      calculateSystemHealth() {
        const now = Date.now();
        const recentThreshold = 5 * 60 * 1000; // 5 minutes

        let totalRecentEvents = 0;
        let successfulRecentEvents = 0;
        let slowRecentEvents = 0;

        // Analyze recent context metrics
        for (const stats of this.contextMetrics.values()) {
          const recentEvents = stats.recentEvents.filter(
            (event) => now - event.timestamp < recentThreshold,
          );

          totalRecentEvents += recentEvents.length;
          successfulRecentEvents += recentEvents.filter(
            (e) => e.success,
          ).length;
          slowRecentEvents += recentEvents.filter(
            (e) => e.duration > this.performanceThresholds.slow,
          ).length;
        }

        const successRate =
          totalRecentEvents > 0
            ? successfulRecentEvents / totalRecentEvents
            : 1;
        const performanceRate =
          totalRecentEvents > 0
            ? (totalRecentEvents - slowRecentEvents) / totalRecentEvents
            : 1;

        return {
          overall: Math.min(successRate, performanceRate),
          successRate,
          performanceRate,
          recentEvents: totalRecentEvents,
          health:
            successRate > 0.95 && performanceRate > 0.9
              ? "excellent"
              : successRate > 0.85 && performanceRate > 0.8
                ? "good"
                : successRate > 0.7 && performanceRate > 0.6
                  ? "fair"
                  : "poor",
        };
      }

      resetCurrentWindow() {
        this.currentWindowStart = Date.now();
        this.currentWindowMetrics.clear();
      }

      cleanupOldMetrics() {
        const cutoffTime = Date.now() - this.retentionPeriod;

        // Clean old throughput metrics
        for (const [
          minuteKey,
          throughput,
        ] of this.throughputMetrics.entries()) {
          if (minuteKey * 60000 < cutoffTime) {
            this.throughputMetrics.delete(minuteKey);
          }
        }

        // Clean old performance metrics
        for (const [issueKey, perfStats] of this.performanceMetrics.entries()) {
          if (perfStats.lastSeen < cutoffTime) {
            this.performanceMetrics.delete(issueKey);
          }
        }

        console.log(
          `🧹 Cleaned old metrics (${this.origin}): ${this.throughputMetrics.size} throughput entries remaining`,
        );
      }

      // Public API for accessing metrics
      getMetricsSummary() {
        return {
          origin: this.origin,
          contextMetrics: Object.fromEntries(this.contextMetrics),
          eventTypeMetrics: Object.fromEntries(this.eventTypeMetrics),
          performanceMetrics: Object.fromEntries(this.performanceMetrics),
          systemHealth: this.calculateSystemHealth(),
          topEvents: this.getTopEvents(),
          throughputSummary: this.getThroughputSummary(),
        };
      }

      getContextPairMetrics(contextPair) {
        return this.contextMetrics.get(contextPair) || null;
      }

      getEventTypeMetrics(eventType) {
        return this.eventTypeMetrics.get(eventType) || null;
      }
    }

    // ===== ADVANCED DEBUG MIDDLEWARE =====
    class VibeSystemMiddleware extends SubscriberMiddleware {
      static _ = this.register;

      constructor() {
        super("SystemSettings", 0.5); // Very high priority - runs early
        this.categoryRegistry = null; // Will be set when registry initializes

        this.origin = this.detectOrigin();

        // Context-logical settings structure
        this.settings = {
          system: new Map(), // autoActivate, debug.*, background orchestration, session data
          ui: new Map(), // theme, mediaMode, sideScrolls, vibeRain, display settings
          middleware: new Map(), // Cross-context middleware configuration
          extractor: new Map(), // Content extraction + proxy settings
          cache: new Map(), // Non-settings browser storage with TTL
        };

        this.storageKeys = {
          system: "vibeSystemSettings",
          ui: "vibeUISettings",
          middleware: "vibeMiddlewareSettings",
          extractor: "vibeExtractorSettings",
          cache: "vibeCacheStorage",
        };

        // Legacy debug properties for backward compatibility during transition
        this.debugSettings = new Map();
        this.terminalRouting = new Map();
        this.debugSessionId = `debug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // Debug categories
        this.debugCategories = {
          events: "EVENT_DEBUG",
          messaging: "MESSAGE_DEBUG",
          injection: "INJECTION_DEBUG",
          extraction: "EXTRACTION_DEBUG",
          performance: "PERFORMANCE_DEBUG",
          errors: "ERROR_DEBUG",
          lifecycle: "LIFECYCLE_DEBUG",
          storage: "STORAGE_DEBUG",
          ui: "UI_DEBUG",
          "cross-context": "CROSS_CONTEXT_DEBUG",
        };

        this.hasUnsavedChanges = false;

        this.initializeSystemMiddleware();
      }

      ensureArrayValue(value, defaultValue = []) {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          // Handle comma-separated strings
          if (value.includes(",")) {
            return value.split(",").map((s) => s.trim());
          }
          return [value];
        }
        if (value && typeof value === "object") {
          // Handle objects with numeric keys (like corrupted arrays)
          return Object.values(value);
        }
        return defaultValue;
      }

      detectOrigin() {
        if (typeof window === "undefined") return "background";
        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";
        return "unknown";
      }

      // Core storage methods with nested key support
      async loadAllSettings() {
        if (!browser.storage?.sync) return;

        try {
          const allKeys = Object.values(this.storageKeys);
          const data = await browser.storage.sync.get(allKeys);

          // Load each settings category
          Object.entries(this.storageKeys).forEach(([category, storageKey]) => {
            if (data[storageKey]) {
              const parsedSettings =
                typeof data[storageKey] === "string"
                  ? JSON.parse(data[storageKey])
                  : data[storageKey];

              // Convert object to Map for consistent interface
              this.settings[category].clear();
              Object.entries(parsedSettings).forEach(([key, value]) => {
                this.settings[category].set(key, value);
              });
            }
          });

          this.debug(`📁 Loaded all settings for ${this.origin}`, "storage");
        } catch (error) {
          this.debug(`❌ Failed to load settings: ${error.message}`, "errors");
        }
      }

      async saveSetting(category, key, value) {
        if (!this.settings[category]) {
          throw new Error(`Invalid settings category: ${category}`);
        }

        // Set in memory
        this.settings[category].set(key, value);

        // Schedule auto-save instead of immediate save
        this.scheduleAutoSave(category);

        // Notify subscribers
        this.notifySettingsSubscribers(category, key, value);

        this.debug(
          `💾 Scheduled save for setting: ${category}.${key}`,
          "storage",
        );
      }

      getSetting(category, key, defaultValue = null) {
        if (!this.settings[category]) {
          this.debug(`⚠️ Invalid settings category: ${category}`, "errors");
          return defaultValue;
        }

        return this.settings[category].get(key) ?? defaultValue;
      }

      async saveNestedSetting(path, value) {
        const pathParts = path.split(".");
        if (pathParts.length < 2) {
          throw new Error(
            `Invalid nested path: ${path}. Must be at least category.key`,
          );
        }

        const [category, ...keyParts] = pathParts;
        const key = keyParts.join(".");

        await this.saveSetting(category, key, value);
      }

      getNestedSetting(path, defaultValue = null) {
        const pathParts = path.split(".");
        if (pathParts.length < 2) {
          this.debug(`⚠️ Invalid nested path: ${path}`, "errors");
          return defaultValue;
        }

        const [category, ...keyParts] = pathParts;
        const key = keyParts.join(".");

        return this.getSetting(category, key, defaultValue);
      }

      async saveCategory(category) {
        if (!browser.storage?.sync || !this.settings[category]) return;

        try {
          const storageKey = this.storageKeys[category];
          const settingsObj = Object.fromEntries(this.settings[category]);

          await browser.storage.sync.set({
            [storageKey]: JSON.stringify(settingsObj),
          });

          this.debug(`💾 Saved category: ${category}`, "storage");
        } catch (error) {
          this.debug(
            `❌ Failed to save category ${category}: ${error.message}`,
            "errors",
          );
        }
      }

      // Unified auto-save system
      setupAutoSave() {
        this.autoSaveConfig = {
          enabled: true,
          debounceTime: 1000, // 1 second debounce
          batchSaveTime: 5000, // Batch saves every 5 seconds
          maxRetries: 3,
        };

        this.pendingSaves = new Set();
        this.saveTimers = new Map();
        this.batchSaveTimer = null;

        // Setup batch save interval
        this.setupBatchSave();

        this.debug(
          `⚡ Auto-save system initialized with ${this.autoSaveConfig.debounceTime}ms debounce`,
          "storage",
        );
      }

      setupBatchSave() {
        if (this.batchSaveTimer) {
          clearInterval(this.batchSaveTimer);
        }

        this.batchSaveTimer = setInterval(async () => {
          if (this.pendingSaves.size > 0) {
            await this.processBatchSaves();
          }
        }, this.autoSaveConfig.batchSaveTime);
      }

      async processBatchSaves() {
        const categoriesToSave = Array.from(this.pendingSaves);
        this.pendingSaves.clear();

        this.debug(
          `🔄 Processing batch save for categories: ${categoriesToSave.join(", ")}`,
          "storage",
        );

        const savePromises = categoriesToSave.map(async (category) => {
          try {
            await this.saveCategory(category);
            return { category, success: true };
          } catch (error) {
            this.debug(
              `❌ Batch save failed for ${category}: ${error.message}`,
              "errors",
            );
            return { category, success: false, error };
          }
        });

        const results = await Promise.allSettled(savePromises);
        const failed = results.filter(
          (r) => r.status === "rejected" || !r.value.success,
        );

        if (failed.length > 0) {
          this.debug(
            `⚠️ ${failed.length} batch saves failed, will retry`,
            "storage",
          );
          failed.forEach((f) => {
            if (f.value) this.pendingSaves.add(f.value.category);
          });
        }
      }

      scheduleAutoSave(category) {
        if (!this.autoSaveConfig.enabled) return;

        // Add to pending saves
        this.pendingSaves.add(category);

        // Clear existing timer for this category
        if (this.saveTimers.has(category)) {
          clearTimeout(this.saveTimers.get(category));
        }

        // Setup debounced save
        const timer = setTimeout(async () => {
          if (this.pendingSaves.has(category)) {
            try {
              await this.saveCategory(category);
              this.pendingSaves.delete(category);
              this.debug(`⚡ Auto-saved category: ${category}`, "storage");
            } catch (error) {
              this.debug(
                `❌ Auto-save failed for ${category}: ${error.message}`,
                "errors",
              );
            }
          }
          this.saveTimers.delete(category);
        }, this.autoSaveConfig.debounceTime);

        this.saveTimers.set(category, timer);
      }

      async flushAllPendingSaves() {
        // Clear all timers
        this.saveTimers.forEach((timer) => clearTimeout(timer));
        this.saveTimers.clear();

        // Save all pending categories immediately
        if (this.pendingSaves.size > 0) {
          await this.processBatchSaves();
        }

        this.debug(`🏁 Flushed all pending saves`, "storage");
      }

      // Service subscription management
      setupSubscriptions() {
        this.subscribers = {
          settings: new Set(), // Components that need settings updates
          dialog: new Set(), // Components that handle user confirmations
          cache: new Set(), // Components that manage temporary storage
        };

        this.debug(
          `📝 Setup service subscriptions for ${this.origin}`,
          "storage",
        );
      }

      subscribeToService(service, callback) {
        if (!this.subscribers[service]) {
          this.debug(`⚠️ Invalid service subscription: ${service}`, "errors");
          return false;
        }

        this.subscribers[service].add(callback);
        this.debug(`➕ Added subscriber to ${service} service`, "storage");
        return true;
      }

      unsubscribeFromService(service, callback) {
        if (!this.subscribers[service]) return false;

        const removed = this.subscribers[service].delete(callback);
        if (removed) {
          this.debug(
            `➖ Removed subscriber from ${service} service`,
            "storage",
          );
        }
        return removed;
      }

      notifySettingsSubscribers(category, key, value) {
        const settingsData = {
          category,
          key,
          value,
          fullPath: `${category}.${key}`,
          timestamp: Date.now(),
          origin: this.origin,
        };

        this.subscribers.settings.forEach((callback) => {
          try {
            callback(settingsData);
          } catch (error) {
            this.debug(
              `❌ Settings subscriber error: ${error.message}`,
              "errors",
            );
          }
        });

        this.debug(
          `📢 Notified ${this.subscribers.settings.size} settings subscribers`,
          "storage",
        );
      }

      registerDebugCategories() {
        // Get CategoryRegistry instance from global middlewares
        const categoryRegistry = this.getCategoryRegistry();
        if (!categoryRegistry) {
          this.debug('⚠️ CategoryRegistry not available for debug category registration', 'errors');
          return;
        }

        // Register debug categories using batch registration
        const debugCategories = [
          {
            id: "debug-events",
            patterns: ["all-events"],
            metadata: {
              category: "EVENT_DEBUG",
              priority: "normal",
              terminalTarget: "debug"
            }
          },
          {
            id: "debug-messaging", 
            patterns: [/handle-|cross-context|message/i],
            metadata: {
              category: "MESSAGE_DEBUG", 
              priority: "normal",
              terminalTarget: "system"
            }
          },
          {
            id: "debug-injection",
            patterns: [/inject|script/i],
            metadata: {
              category: "INJECTION_DEBUG",
              priority: "normal", 
              terminalTarget: "system"
            }
          },
          {
            id: "debug-extraction",
            patterns: [/extract|content|media/i],
            metadata: {
              category: "EXTRACTION_DEBUG",
              priority: "normal",
              terminalTarget: "network"
            }
          },
          {
            id: "debug-performance", 
            patterns: [/performance|metric|timing/i],
            metadata: {
              category: "PERFORMANCE_DEBUG",
              priority: "high",
              terminalTarget: "system"
            }
          },
          {
            id: "debug-errors",
            patterns: [/error|failed|exception/i],
            metadata: {
              category: "ERROR_DEBUG",
              priority: "high",
              terminalTarget: "error"
            }
          },
          {
            id: "debug-lifecycle",
            patterns: [/init|destroy|cleanup|lifecycle/i],
            metadata: {
              category: "LIFECYCLE_DEBUG", 
              priority: "normal",
              terminalTarget: "system"
            }
          },
          {
            id: "debug-ui",
            patterns: [/ui-|display|theme|terminal/i],
            metadata: {
              category: "UI_DEBUG",
              priority: "normal",
              terminalTarget: "media"
            }
          },
          {
            id: "debug-cross-context",
            patterns: [/cross-context|route|announcement/i], 
            metadata: {
              category: "CROSS_CONTEXT_DEBUG",
              priority: "normal",
              terminalTarget: "network"
            }
          }
        ];

        categoryRegistry.registerBatch(debugCategories);
        this.debug(`✅ Registered ${debugCategories.length} debug categories with CategoryRegistry`, 'storage');
      }

      getCategoryRegistry() {
        // Access CategoryRegistry through global subscriber manager
        if (window.__globalSubscriberManager) {
          const middlewares = window.__globalSubscriberManager.globalMiddlewares;
          return middlewares.find(m => m.constructor.name === 'CategoryRegistryMiddleware');
        }
        return null;
      }

      setupCategoryRegistrySubscriptions() {
        const categoryRegistry = this.getCategoryRegistry();
        if (!categoryRegistry) {
          this.debug('⚠️ CategoryRegistry not available for subscriptions', 'errors');
          return;
        }

        // Subscribe to category-registered events
        this.subscribeToService('category-registered', (data) => {
          this.debug(`📂 Category registered: ${data.id} with ${data.patterns?.length || 0} patterns`, 'storage');
        });

        // Subscribe to category-updated events  
        this.subscribeToService('category-updated', (data) => {
          this.debug(`📝 Category updated: ${data.id}`, 'storage');
        });

        // Subscribe to category-resolved events for debugging
        this.subscribeToService('category-resolved', (data) => {
          if (this.debugSettings.get('showResolution')) {
            this.debug(`🔍 Category resolved: ${data.input} → ${data.primary || 'no match'}`, 'debug');
          }
        });

        this.debug('✅ CategoryRegistry subscriptions setup complete', 'storage');
      }

      async requestUserConfirmation(message, options = {}) {
        const dialogData = {
          message,
          options,
          timestamp: Date.now(),
          origin: this.origin,
        };

        // Try dialog service subscribers first
        for (const callback of this.subscribers.dialog) {
          try {
            const result = await callback(dialogData);
            if (result !== undefined) {
              return result;
            }
          } catch (error) {
            this.debug(
              `❌ Dialog subscriber error: ${error.message}`,
              "errors",
            );
          }
        }

        // Fallback to browser confirm if no dialog service available
        return confirm(message);
      }

      // Add control methods:
      disableCategoriesByPattern(pattern) {
        if (!this.categoryRegistry) {
          this.categoryRegistry =
            window.__globalSubscriberManager?.globalMiddlewares?.find(
              (m) => m instanceof CategoryRegistryMiddleware,
            );
        }

        if (!this.categoryRegistry) return 0;

        let disabled = 0;
        for (const [id, category] of this.categoryRegistry.categories) {
          if (pattern.test(id) || pattern.test(category.dimension)) {
            this.categoryRegistry.disableCategory(id);
            disabled++;
          }
        }

        console.log(`🚫 Disabled ${disabled} categories matching ${pattern}`);
        return disabled;
      }

      enableCategoriesByDimension(dimension) {
        if (!this.categoryRegistry) return 0;

        const categories =
          this.categoryRegistry.getCategoriesInDimension(dimension);
        categories.forEach((cat) =>
          this.categoryRegistry.enableCategory(cat.id),
        );

        console.log(
          `✅ Enabled ${categories.length} categories in dimension '${dimension}'`,
        );
        return categories.length;
      }

      async initializeSystemMiddleware() {
        // Load all settings from storage
        await this.loadAllSettings();

        // Setup service subscriptions
        this.setupSubscriptions();

        // Register debug categories with CategoryRegistry
        this.registerDebugCategories();

        // Subscribe to CategoryRegistry events
        this.setupCategoryRegistrySubscriptions();

        // Setup unified auto-save system
        this.setupAutoSave();

        // Legacy debug support - Load debug settings from storage
        await this.loadDebugSettings();

        // Setup storage listeners
        this.setupStorageListeners();

        // Setup debug routing
        this.setupDebugRouting();

        // Periodic refresh of settings
        setInterval(() => {
          this.loadDebugSettings();
        }, 30000); // Every 30 seconds

        console.log(
          `🔧 VibeSystemMiddleware initialized in ${this.origin} context`,
        );
      }

      async loadDebugSettings() {
        try {
          if (
            typeof browser !== "undefined" &&
            browser.storage &&
            browser.storage.sync
          ) {
            const settings = await browser.storage.sync.get([
              "vibeDebugEnabled",
              "vibeDebugCategories",
              "vibeDebugEventFilter",
              "vibeDebugPerformance",
              "vibeDebugVerbosity",
              "vibeDebugContexts",
              "vibeDebugAutoRoute",
              "vibeDebugStorage",
            ]);

            // Update debug settings with type safety
            const safeCategories = this.ensureArrayValue(
              settings.vibeDebugCategories,
              ["events", "errors"],
            );

            this.debugSettings.set(
              "enabled",
              settings.vibeDebugEnabled || false,
            );
            this.debugSettings.set("categories", safeCategories);
            this.debugSettings.set(
              "eventFilter",
              settings.vibeDebugEventFilter || [],
            );
            this.debugSettings.set(
              "performance",
              settings.vibeDebugPerformance || false,
            );
            this.debugSettings.set(
              "verbosity",
              settings.vibeDebugVerbosity || "normal",
            );
            this.debugSettings.set(
              "contexts",
              settings.vibeDebugContexts || ["all"],
            );
            this.debugSettings.set(
              "autoRoute",
              settings.vibeDebugAutoRoute !== false,
            ); // Default true
            this.debugSettings.set(
              "storageDebug",
              settings.vibeDebugStorage || false,
            );

            // Debug filters now handled by CategoryRegistry

            console.log(
              `🔧 Debug settings loaded:`,
              Object.fromEntries(this.debugSettings),
            );
          } else {
            // Fallback to localStorage
            this.loadDebugSettingsFromLocal();
          }
        } catch (error) {
          console.warn("Failed to load debug settings:", error);
          this.setDefaultDebugSettings();
        }
      }

      loadDebugSettingsFromLocal() {
        try {
          const localSettings = JSON.parse(
            localStorage.getItem("vibeDebugSettings") || "{}",
          );

          // Ensure categories is always an array with type safety
          const safeCategories = this.ensureArrayValue(
            localSettings.categories,
            ["events", "errors"],
          );

          this.debugSettings.set("enabled", localSettings.enabled || false);
          this.debugSettings.set("categories", safeCategories);
          this.debugSettings.set(
            "eventFilter",
            localSettings.eventFilter || [],
          );
          this.debugSettings.set(
            "performance",
            localSettings.performance || false,
          );
          this.debugSettings.set(
            "verbosity",
            localSettings.verbosity || "normal",
          );
          this.debugSettings.set("contexts", localSettings.contexts || ["all"]);
          this.debugSettings.set(
            "autoRoute",
            localSettings.autoRoute !== false,
          );

          // Debug filters now handled by CategoryRegistry

          console.log("🔧 Debug settings loaded from localStorage");
        } catch (error) {
          console.warn(
            "Failed to load debug settings from localStorage:",
            error,
          );
          this.setDefaultDebugSettings();
        }
      }

      setDefaultDebugSettings() {
        this.debugSettings.set("enabled", false);
        this.debugSettings.set("categories", ["errors"]);
        this.debugSettings.set("eventFilter", []);
        this.debugSettings.set("performance", false);
        this.debugSettings.set("verbosity", "normal");
        this.debugSettings.set("contexts", ["all"]);
        this.debugSettings.set("autoRoute", true);
      }

      // applyDebugFilters() method removed - now using CategoryRegistry for debug categorization

      setupStorageListeners() {
        if (
          typeof browser !== "undefined" &&
          browser.storage &&
          browser.storage.onChanged
        ) {
          browser.storage.onChanged.addListener((changes, area) => {
            if (area === "sync") {
              const debugKeys = Object.keys(changes).filter((key) =>
                key.startsWith("vibeDebug"),
              );

              if (debugKeys.length > 0) {
                console.log("🔧 Debug settings changed:", debugKeys);
                this.loadDebugSettings();

                // Route storage debug event if enabled
                if (this.debugSettings.get("storageDebug")) {
                  this.routeToTerminal(
                    "STORAGE_DEBUG",
                    `Debug settings updated: ${debugKeys.join(", ")}`,
                    "storage-change",
                  );
                }
              }
            }
          });
        }
      }

      setupDebugRouting() {
        // Setup routing to terminal based on origin
        switch (this.origin) {
          case "background":
            // Background can route to all visible tabs
            this.terminalRouting.set("method", "broadcast-to-visible");
            break;

          case "proxy":
            // Proxy has direct terminal access
            this.terminalRouting.set("method", "direct-terminal");
            break;

          case "extractor":
          case "popup":
            // Send to proxy via cross-context
            this.terminalRouting.set("method", "cross-context");
            this.terminalRouting.set("target", "proxy");
            break;

          default:
            this.terminalRouting.set("method", "console-fallback");
        }
      }

      // Main middleware process method
      async process(eventContext) {
        const { event, data, context } = eventContext;

        // Check if debugging is enabled
        if (!this.debugSettings.get("enabled")) {
          return true; // Continue processing
        }

        // Check if this context should be debugged
        const contexts = this.debugSettings.get("contexts");
        if (!contexts.includes("all") && !contexts.includes(this.origin)) {
          return true; // Skip this context
        }

        // Check if event should be routed to terminal
        const shouldRoute = this.shouldRouteEvent(event, data, context);

        if (shouldRoute) {
          const routeInfo = this.getRouteInfo(event);
          await this.routeToTerminal(
            routeInfo.category,
            this.formatDebugMessage(event, data, context),
            event,
            routeInfo.priority,
          );
        }

        // Performance tracking if enabled
        if (this.debugSettings.get("performance")) {
          this.trackPerformance(eventContext);
        }

        return true; // Always continue processing
      }

      shouldRouteEvent(event, data, context) {
        // Check auto-route setting
        if (!this.debugSettings.get("autoRoute")) {
          return false;
        }

        // Filtering now handled by CategoryRegistry in getRouteInfo()
        const routeInfo = this.getRouteInfo(event);
        return routeInfo.terminalTarget !== "debug"; // Route if not just debug terminal
      }

      getRouteInfo(event) {
        // Use CategoryRegistry to resolve debug routing information
        const categoryRegistry = this.getCategoryRegistry();
        
        if (categoryRegistry) {
          try {
            // Query CategoryRegistry for event categorization
            const resolution = categoryRegistry.resolve(event, {}, { strategy: "first" });
            
            if (resolution && resolution.primary) {
              const categoryMeta = categoryRegistry.getCategory(resolution.primary);
              if (categoryMeta && categoryMeta.metadata) {
                return {
                  category: categoryMeta.metadata.category || "DEBUG",
                  priority: categoryMeta.metadata.priority || "normal",
                  terminalTarget: categoryMeta.metadata.terminalTarget || "debug"
                };
              }
            }
          } catch (error) {
            console.warn('CategoryRegistry resolution failed in getRouteInfo:', error);
          }
        }
        
        // Fallback to legacy logic for backward compatibility
        // Check if event matches common patterns manually
        if (event.includes('error') || event.includes('failed') || event.includes('exception')) {
          return { category: "ERROR_DEBUG", priority: "high", terminalTarget: "error" };
        }
        if (event.includes('performance') || event.includes('metric') || event.includes('timing')) {
          return { category: "PERFORMANCE_DEBUG", priority: "high", terminalTarget: "system" };
        }
        
        return { category: "DEBUG", priority: "normal", terminalTarget: "debug" };
      }

      formatDebugMessage(event, data, context) {
        const verbosity = this.debugSettings.get("verbosity");
        const timestamp = new Date().toISOString();

        let message = `[${this.origin.toUpperCase()}] ${event}`;

        if (verbosity === "verbose") {
          // Include data and context details
          const dataStr = this.safeStringify(data);
          const contextStr = this.safeStringify(context);

          message += `\n  Data: ${dataStr}`;
          message += `\n  Context: ${contextStr}`;
          message += `\n  Session: ${this.debugSessionId}`;
          message += `\n  Time: ${timestamp}`;
        } else if (verbosity === "detailed") {
          // Include limited data
          message += ` | Data: ${this.safeStringify(data, 100)}`;
          message += ` | Time: ${timestamp.split("T")[1].split(".")[0]}`;
        }

        return message;
      }

      safeStringify(obj, maxLength = 500) {
        try {
          let str = JSON.stringify(obj, (key, value) => {
            // Filter out functions and complex objects
            if (typeof value === "function") return "[Function]";
            if (value instanceof Element) return "[DOM Element]";
            if (value instanceof Window) return "[Window]";
            return value;
          });

          if (maxLength && str.length > maxLength) {
            str = str.substring(0, maxLength) + "...";
          }

          return str;
        } catch (error) {
          return `[Stringify Error: ${error.message}]`;
        }
      }

      async routeToTerminal(category, message, eventType, priority = "normal") {
        const routingMethod = this.terminalRouting.get("method");

        try {
          switch (routingMethod) {
            case "direct-terminal":
              await this.routeDirectToTerminal(
                category,
                message,
                eventType,
                priority,
              );
              break;

            case "cross-context":
              await this.routeCrossContext(
                category,
                message,
                eventType,
                priority,
              );
              break;

            case "broadcast-to-visible":
              await this.routeBroadcastToVisible(
                category,
                message,
                eventType,
                priority,
              );
              break;

            case "console-fallback":
            default:
              this.routeToConsole(category, message, eventType, priority);
              break;
          }
        } catch (error) {
          console.warn(`Debug routing failed (${routingMethod}):`, error);
          this.routeToConsole(category, message, eventType, priority);
        }
      }

      async routeDirectToTerminal(category, message, eventType, priority) {
        // Direct access to SmartTerminal in proxy context
        if (window.__smartTerminal) {
          const level = priority === "high" ? "warn" : "debug";
          window.__smartTerminal.displayLog(
            level,
            message,
            category,
            "debug-middleware",
          );
        } else if (window.__localEventBus) {
          // Fallback to local event bus
          window.__localEventBus.emitLocal("debug-terminal-log", {
            level: "debug",
            message,
            category,
            source: "debug-middleware",
          });
        }
      }

      async routeCrossContext(category, message, eventType, priority) {
        // Send to proxy via cross-context bridge
        if (window.__crossContextBridge) {
          await window.__crossContextBridge.sendToProxy("logFromBackground", {
            level: priority === "high" ? "warn" : "debug",
            message,
            category,
            source: `debug-${this.origin}`,
          });
        }
      }

      async routeBroadcastToVisible(category, message, eventType, priority) {
        // Background broadcasting to all visible tabs
        if (window.__enhancedOrchestrator) {
          const visibleTabs = Array.from(
            window.__enhancedOrchestrator.smartTabs.values(),
          ).filter((tab) => tab.type === "visible");

          for (const tab of visibleTabs) {
            try {
              await tab.sendMessage("logFromBackground", {
                level: priority === "high" ? "warn" : "debug",
                message,
                category,
                source: "debug-background",
              });
            } catch (error) {
              // Continue with other tabs
            }
          }
        }
      }

      routeToConsole(category, message, eventType, priority) {
        const logMethod = priority === "high" ? console.warn : console.log;
        logMethod(`[${category}] ${message}`);
      }

      trackPerformance(eventContext) {
        const { event, context } = eventContext;

        if (!context.startTime) {
          context.startTime = Date.now();
          return;
        }

        const duration = Date.now() - context.startTime;

        if (duration > 100) {
          // Log slow events
          this.routeToTerminal(
            "PERFORMANCE_DEBUG",
            `Slow event: ${event} took ${duration}ms`,
            "performance-warning",
            "high",
          );
        }
      }

      // Simple debug wrapper for backward compatibility
      debug(message, category = "storage") {
        // Use CategoryRegistry to resolve debug category and routing info
        const categoryRegistry = this.getCategoryRegistry();
        let resolvedCategory = category.toUpperCase() + "_DEBUG";
        let priority = category === "errors" ? "high" : "normal";
        let terminalTarget = "debug";

        if (categoryRegistry) {
          try {
            // Query CategoryRegistry for category resolution
            const resolution = categoryRegistry.resolve(message, { category }, { strategy: "first" });
            if (resolution && resolution.primary) {
              const categoryMeta = categoryRegistry.getCategory(resolution.primary);
              if (categoryMeta && categoryMeta.metadata) {
                resolvedCategory = categoryMeta.metadata.category || resolvedCategory;
                priority = categoryMeta.metadata.priority || priority;
                terminalTarget = categoryMeta.metadata.terminalTarget || terminalTarget;
              }
            }
          } catch (error) {
            console.warn('CategoryRegistry resolution failed for debug message:', error);
          }
        }

        this.debugEvent(
          message,
          {},
          {
            category: resolvedCategory,
            priority: priority,
            terminalTarget: terminalTarget
          },
        );
      }

      // Public API for manual debug routing
      debugEvent(event, data, options = {}) {
        if (this.debugSettings.get("enabled")) {
          this.routeToTerminal(
            options.category || "MANUAL_DEBUG",
            this.formatDebugMessage(event, data, options),
            event,
            options.priority || "normal",
          );
        }
      }

      // Configuration methods
      async enableDebug(categories = ["events", "errors"]) {
        // Ensure categories is always an array
        const safeCategories = this.ensureArrayValue(categories, [
          "events",
          "errors",
        ]);

        await this.updateDebugSettings({
          vibeDebugEnabled: true,
          vibeDebugCategories: safeCategories,
        });
      }

      async disableDebug() {
        await this.updateDebugSettings({
          vibeDebugEnabled: false,
        });
      }

      async updateDebugSettings(updates) {
        try {
          if (
            typeof browser !== "undefined" &&
            browser.storage &&
            browser.storage.sync
          ) {
            await browser.storage.sync.set(updates);
          } else {
            // Fallback to localStorage
            const current = JSON.parse(
              localStorage.getItem("vibeDebugSettings") || "{}",
            );
            const updated = { ...current, ...updates };
            localStorage.setItem("vibeDebugSettings", JSON.stringify(updated));
            this.loadDebugSettingsFromLocal();
          }
        } catch (error) {
          console.error("Failed to update debug settings:", error);
        }
      }

      // Status and monitoring
      getDebugStatus() {
        return {
          enabled: this.debugSettings.get("enabled"),
          origin: this.origin,
          settings: Object.fromEntries(this.debugSettings),
          filters: "CategoryRegistry", // Now using centralized registry
          routing: Object.fromEntries(this.terminalRouting),
          sessionId: this.debugSessionId,
        };
      }
    }

    /**
     * CategoryRegistryMiddleware - N-dimensional categorization system
     *
     * @description
     * A high-performance categorization middleware that supports multiple dimensions,
     * hierarchical relationships, and pluggable resolution strategies. Optimized for
     * the common case (simple pattern matching) while supporting complex scenarios.
     *
     * @example
     * // Simple usage - just pattern matching
     * registry.register('errors', /error|fail|exception/i);
     *
     * // With metadata for routing
     * registry.register('media-events', /media|image|video/i, {
     *   terminal: 'media-terminal',
     *   icon: '📺'
     * });
     *
     * // Hierarchical categories
     * registry.register('raster-images', /\.(jpe?g|png|gif)/i, {
     *   parent: 'images'
     * });
     */
    /**
     * CategoryRegistryMiddleware - N-dimensional categorization system
     *
     * @description
     * A high-performance categorization middleware that supports multiple dimensions,
     * hierarchical relationships, and pluggable resolution strategies. Optimized for
     * the common case (simple pattern matching) while supporting complex scenarios.
     *
     * @example
     * // Simple usage - just pattern matching
     * registry.register('errors', /error|fail|exception/i);
     *
     * // With metadata for routing
     * registry.register('media-events', /media|image|video/i, {
     *   terminal: 'media-terminal',
     *   icon: '📺'
     * });
     *
     * // Hierarchical categories
     * registry.register('raster-images', /\.(jpe?g|png|gif)/i, {
     *   parent: 'images'
     * });
     */
    /**
     * CategoryRegistryMiddleware - N-dimensional categorization system
     * Clean Implementation v3.0
     *
     * @description
     * A categorization middleware that supports multiple dimensions,
     * hierarchical relationships, and pluggable resolution strategies.
     */
    class CategoryRegistryMiddleware extends SubscriberMiddleware {
      static _ = this.register; // Enable auto-registration with SubscriberMiddleware

      constructor() {
        super("CategoryRegistry", 1); // Run early in pipeline

        /**
         * @typedef {Object} Category
         * @property {string} id - Unique identifier
         * @property {RegExp[]} patterns - Compiled regex patterns
         * @property {Function} [validator] - Optional async validator
         * @property {string} [dimension='default'] - Category dimension/namespace
         * @property {string} [parent] - Parent category ID for hierarchy
         * @property {Object} metadata - Arbitrary metadata for routing/display
         * @property {Set<string>} [children] - Child category IDs
         * @property {number} priority - Resolution priority (higher = first)
         */

        /** @type {Map<string, Category>} Core registry storage */
        this.categories = new Map();

        /** @type {Map<string, Set<string>>} dimension -> categoryIds mapping */
        this.dimensions = new Map();

        /** @type {Map<string, Set<string>>} parent -> children mapping */
        this.hierarchy = new Map();

        /**
         * Resolution strategies
         * @type {Map<string, Function>}
         */
        this.strategies = new Map([
          ["first", this.resolveFirst.bind(this)], // Returns first match
          ["specific", this.resolveSpecific.bind(this)], // Most specific match (default)
          ["all", this.resolveAll.bind(this)], // Returns all matches
          ["hierarchical", this.resolveHierarchical.bind(this)], // With parent/child
        ]);

        /** @type {string} Current execution context */
        this.origin = this.detectOrigin();

        /** @type {number} Default validator timeout in ms */
        this.validatorTimeout = 1000;

        // Initialize with standard categories
        this.setupStandardCategories();

        console.log(
          `📊 CategoryRegistryMiddleware initialized in ${this.origin} context`,
        );
      }

      /**
       * Register a new category
       *
       * @param {string} id - Unique category identifier
       * @param {RegExp|string|RegExp[]} patterns - Pattern(s) to match
       * @param {Object} [options={}] - Configuration options
       * @returns {string} The registered category ID
       */
      register(id, patterns, options = {}) {
        // Validate inputs
        if (!id || typeof id !== "string") {
          throw new Error("Category ID must be a non-empty string");
        }

        // Warn if overwriting
        if (this.categories.has(id)) {
          console.warn(`⚠️ Overwriting existing category: ${id}`);
        }

        // Normalize patterns to array of RegExp
        const normalizedPatterns = this.normalizePatterns(patterns);

        // Create category object
        const category = {
          id,
          patterns: normalizedPatterns,
          dimension: options.dimension || "default",
          parent: options.parent,
          validator: options.validator,
          metadata: options.metadata || {},
          priority: options.priority || 0,
          children: new Set(),
          enabled: options.enabled !== false, // Default to true
        };

        // Store in registry
        this.categories.set(id, category);

        // Index by dimension
        if (!this.dimensions.has(category.dimension)) {
          this.dimensions.set(category.dimension, new Set());
        }
        this.dimensions.get(category.dimension).add(id);

        // Update hierarchy if parent specified
        if (category.parent) {
          this.establishHierarchy(category.parent, id);
        }

        return id;
      }

      /**
       * Register multiple categories at once
       *
       * @param {Array<Object>} categorySpecs - Array of category specifications
       * @returns {Array<string>} Array of registered category IDs
       *
       * @example
       * registry.registerBatch([
       *   { id: 'errors', patterns: /error/i, options: { priority: 10 } },
       *   { id: 'warnings', patterns: /warn/i, options: { priority: 5 } }
       * ]);
       */
      // Add public methods to control it:
      enableCategory(id) {
        const category = this.categories.get(id);
        if (category) {
          category.enabled = true;
          return true;
        }
        return false;
      }

      disableCategory(id) {
        const category = this.categories.get(id);
        if (category) {
          category.enabled = false;
          return true;
        }
        return false;
      }

      toggleCategory(id) {
        const category = this.categories.get(id);
        if (category) {
          category.enabled = !category.enabled;
          return category.enabled;
        }
        return null;
      }

      registerBatch(categorySpecs) {
        const registered = [];

        for (const spec of categorySpecs) {
          const { id, patterns, options = {} } = spec;

          if (!id) {
            console.warn("Skipping category without ID:", spec);
            continue;
          }

          try {
            this.register(id, patterns || [], options);
            registered.push(id);
          } catch (error) {
            console.error(`Failed to register category ${id}:`, error);
          }
        }

        return registered;
      }

      /**
       * Establish parent-child relationship with circular reference protection
       * @private
       */
      establishHierarchy(parentId, childId) {
        // Prevent self-parenting
        if (parentId === childId) {
          console.warn(`⚠️ Cannot set ${childId} as its own parent`);
          return;
        }

        // Check for circular reference
        let current = parentId;
        const visited = new Set([childId]);

        while (current) {
          if (visited.has(current)) {
            throw new Error(
              `🔄 Circular hierarchy detected: ${childId} -> ${parentId}`,
            );
          }
          visited.add(current);
          const parentCategory = this.categories.get(current);
          current = parentCategory?.parent;
        }

        // Ensure parent exists (auto-create if needed)
        if (!this.categories.has(parentId)) {
          // Auto-create parent category as a container
          this.register(parentId, [], {
            metadata: { synthetic: true },
          });
        }

        // Add to hierarchy map
        if (!this.hierarchy.has(parentId)) {
          this.hierarchy.set(parentId, new Set());
        }
        this.hierarchy.get(parentId).add(childId);

        // Update parent's children set
        const parent = this.categories.get(parentId);
        if (parent) {
          parent.children.add(childId);
        }

        // Update child's parent reference
        const child = this.categories.get(childId);
        if (child) {
          child.parent = parentId;
        }
      }

      /**
       * Main middleware process function
       */
      async process(eventContext) {
        const { event, data, context } = eventContext;

        // Determine resolution strategy (default: 'specific')
        const strategy = context.categoryStrategy || "specific";

        // Build test data for categorization
        const testData = this.buildTestData(event, data);

        // Resolve categories using specified strategy
        const resolution = await this.resolve(testData, strategy, context);

        // Add results to context for downstream middleware
        eventContext.context.category = resolution.primary;
        eventContext.context.categories = resolution.all;
        eventContext.context.categoryMetadata = resolution.metadata;
        eventContext.context.categoryDimension = resolution.dimension;
        eventContext.context.categoryHierarchy = resolution.hierarchy;

        return true; // Continue processing
      }

      /**
       * Resolve categories for given data
       */
      async resolve(data, strategy = "specific", context = {}) {
        const resolver =
          this.strategies.get(strategy) || this.strategies.get("specific");
        return await resolver(data, context);
      }

      /**
       * STRATEGY: First match (fastest)
       * Returns immediately on first pattern match
       */
      async resolveFirst(data, context) {
        const testStrings = this.extractTestStrings(data);

        for (const [id, category] of this.categories) {
          if (!category.enabled) continue;

          // Apply dimension filter if specified
          if (context.dimension && category.dimension !== context.dimension) {
            continue;
          }

          // Pattern check
          if (this.testPatterns(category.patterns, testStrings)) {
            // Run validator if present
            if (category.validator && !context.skipValidators) {
              try {
                const valid = await this.validateWithTimeout(
                  category.validator,
                  data,
                  context,
                  this.validatorTimeout,
                );
                if (!valid) continue; // Skip if validation fails
              } catch (error) {
                console.warn(`Validator failed for ${id}:`, error);
                continue;
              }
            }

            return {
              primary: id,
              all: [id],
              metadata: category.metadata,
              dimension: category.dimension,
              strategy: "first",
            };
          }
        }

        return {
          primary: null,
          all: [],
          metadata: {},
          dimension: null,
          strategy: "first",
        };
      }

      /**
       * STRATEGY: Most specific (default)
       * Returns the most specific match based on pattern count and priority
       */
      async resolveSpecific(data, context) {
        const testStrings = this.extractTestStrings(data);
        const matches = [];

        for (const [id, category] of this.categories) {
          if (!category.enabled) continue;

          // Apply dimension filter
          if (context.dimension && category.dimension !== context.dimension) {
            continue;
          }

          // Count matching patterns
          const matchCount = this.countMatchingPatterns(
            category.patterns,
            testStrings,
          );

          if (matchCount > 0) {
            // Run validator if present
            let validated = true;
            if (category.validator && !context.skipValidators) {
              try {
                validated = await this.validateWithTimeout(
                  category.validator,
                  data,
                  context,
                  this.validatorTimeout,
                );
              } catch (error) {
                console.warn(`Validator failed for ${id}:`, error);
                validated = false;
              }
            }

            if (validated) {
              matches.push({
                id,
                category,
                specificity: matchCount * 1000 + category.priority,
                matchCount,
              });
            }
          }
        }

        // Sort by specificity (most specific first)
        matches.sort((a, b) => b.specificity - a.specificity);

        if (matches.length > 0) {
          const best = matches[0];

          return {
            primary: best.id,
            all: matches.map((m) => m.id),
            metadata: best.category.metadata,
            dimension: best.category.dimension,
            specificity: best.specificity,
            strategy: "specific",
          };
        }

        return {
          primary: null,
          all: [],
          metadata: {},
          dimension: null,
          strategy: "specific",
        };
      }

      /**
       * STRATEGY: All matches
       * Returns all matching categories with validation
       */
      async resolveAll(data, context) {
        const testStrings = this.extractTestStrings(data);
        const matches = [];

        for (const [id, category] of this.categories) {
          if (!category.enabled) continue;
          // Apply dimension filter
          if (context.dimension && category.dimension !== context.dimension) {
            continue;
          }

          // Pattern check
          const matchCount = this.countMatchingPatterns(
            category.patterns,
            testStrings,
          );

          if (matchCount > 0) {
            // Run validator if present
            let validated = true;
            if (category.validator && !context.skipValidators) {
              try {
                validated = await this.validateWithTimeout(
                  category.validator,
                  data,
                  context,
                  this.validatorTimeout,
                );
              } catch (error) {
                console.warn(`Validator failed for ${id}:`, error);
                validated = false;
              }
            }

            if (validated) {
              matches.push({
                id,
                metadata: category.metadata,
                dimension: category.dimension,
                matchCount,
                validated: category.validator ? true : undefined,
                priority: category.priority,
              });
            }
          }
        }

        // Sort by match count, then priority
        matches.sort((a, b) => {
          if (b.matchCount !== a.matchCount) {
            return b.matchCount - a.matchCount;
          }
          return b.priority - a.priority;
        });

        return {
          primary: matches[0]?.id || null,
          all: matches.map((m) => m.id),
          matches, // Full match details
          dimension: matches[0]?.dimension || null,
          strategy: "all",
        };
      }

      /**
       * STRATEGY: Hierarchical
       * Returns matches organized by parent-child relationships
       */
      async resolveHierarchical(data, context) {
        // First get all matches
        const allMatches = await this.resolveAll(data, context);

        // Build hierarchy tree
        const tree = {};
        const processed = new Set();
        const hierarchyInfo = [];

        for (const matchId of allMatches.all) {
          if (!category.enabled) continue;

          const category = this.categories.get(matchId);
          if (!category) continue;

          // Find root of hierarchy
          let root = matchId;
          let current = category;
          const path = [matchId];

          while (current.parent && this.categories.has(current.parent)) {
            root = current.parent;
            path.unshift(current.parent);
            current = this.categories.get(current.parent);
          }

          // Build tree from root
          if (!processed.has(root)) {
            tree[root] = this.buildHierarchyTree(root, allMatches.all);
            processed.add(root);
          }

          // Add hierarchy info
          hierarchyInfo.push({
            id: matchId,
            root,
            path,
            depth: path.length - 1,
          });
        }

        return {
          primary: allMatches.primary,
          all: allMatches.all,
          tree,
          hierarchy: hierarchyInfo,
          dimension: allMatches.dimension,
          strategy: "hierarchical",
        };
      }

      /**
       * Build hierarchy tree for a root category
       * @private
       */
      buildHierarchyTree(rootId, matchedIds) {
        const node = {
          id: rootId,
          matched: matchedIds.includes(rootId),
          metadata: this.categories.get(rootId)?.metadata || {},
          children: [],
        };

        const children = this.hierarchy.get(rootId);
        if (children) {
          for (const childId of children) {
            if (matchedIds.includes(childId) || this.hierarchy.has(childId)) {
              node.children.push(this.buildHierarchyTree(childId, matchedIds));
            }
          }
        }

        return node;
      }

      /**
       * Run validator with timeout protection
       * @private
       */
      async validateWithTimeout(validator, data, context, timeout = 1000) {
        return Promise.race([
          validator(data, context),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Validation timeout")), timeout),
          ),
        ]);
      }

      /**
       * Normalize patterns to RegExp array
       * @private
       */
      normalizePatterns(patterns) {
        if (!patterns) return [];
        if (!Array.isArray(patterns)) patterns = [patterns];

        return patterns
          .map((pattern) => {
            if (pattern instanceof RegExp) return pattern;
            if (typeof pattern === "string") {
              // Escape special regex chars and make case-insensitive
              const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              return new RegExp(escaped, "i");
            }
            return null;
          })
          .filter(Boolean);
      }

      /**
       * Build testable data from event context
       * @private
       */
      buildTestData(event, data) {
        return {
          event,
          action: data?.action,
          message: data?.message,
          type: data?.type,
          url: data?.url,
          src: data?.src,
          error: data?.error,
          level: data?.level,
          raw: data,
        };
      }

      /**
       * Extract strings for pattern testing
       * Test strings are the string values from the data object that we test regex patterns against
       * @private
       */
      extractTestStrings(data) {
        const strings = [];

        if (typeof data === "string") {
          strings.push(data);
        } else if (data && typeof data === "object") {
          // Add specific string properties
          if (data.event) strings.push(data.event);
          if (data.action) strings.push(data.action);
          if (data.message) strings.push(data.message);
          if (data.type) strings.push(data.type);
          if (data.url) strings.push(data.url);
          if (data.src) strings.push(data.src);
          if (data.error) strings.push(data.error);
          if (data.level) strings.push(data.level);

          // Add any other string values (limited depth)
          for (const value of Object.values(data)) {
            if (typeof value === "string" && !strings.includes(value)) {
              strings.push(value);
            }
          }
        }

        return strings;
      }

      /**
       * Test if any pattern matches any test string
       * @private
       */
      testPatterns(patterns, testStrings) {
        for (const pattern of patterns) {
          for (const str of testStrings) {
            if (pattern.test(str)) {
              return true;
            }
          }
        }
        return false;
      }

      /**
       * Count how many patterns match
       * @private
       */
      countMatchingPatterns(patterns, testStrings) {
        let count = 0;
        for (const pattern of patterns) {
          for (const str of testStrings) {
            if (pattern.test(str)) {
              count++;
              break; // Each pattern counts once
            }
          }
        }
        return count;
      }

      /**
       * Detect current execution context
       * @private
       */
      detectOrigin() {
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            if (browser.tabs && browser.tabs.query) return "background";
          } catch (e) {}
        }

        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        return "unknown";
      }

      /**
       * Setup standard categories based on context
       * @private
       */
      setupStandardCategories() {
        // Use batch registration for standard categories
        const universalCategories = [
          {
            id: "errors",
            patterns: /error|fail|exception|❌/i,
            options: {
              metadata: { icon: "🔴", priority: "high", level: "error" },
            },
          },
          {
            id: "warnings",
            patterns: /warn|slow|timeout|⚠/i,
            options: {
              metadata: { icon: "⚠️", priority: "medium", level: "warn" },
            },
          },
          {
            id: "success",
            patterns: /success|complete|done|✅/i,
            options: {
              metadata: { icon: "✅", priority: "normal", level: "info" },
            },
          },
          {
            id: "debug",
            patterns: /debug|trace|verbose/i,
            options: {
              metadata: { icon: "🐛", priority: "low", level: "debug" },
            },
          },
          {
            id: "high-frequency",
            patterns: /scroll|mousemove|resize/i,
            options: {
              metadata: { throttle: 16, batchStrategy: "replace" },
            },
          },
          {
            id: "batchable",
            patterns: /media-discovered|content-update|terminal-log/i,
            options: {
              metadata: { batchStrategy: "accumulate", delay: 100 },
            },
          },
        ];

        this.registerBatch(universalCategories);

        // Context-specific categories
        if (this.origin === "proxy") {
          this.setupProxyCategories();
        } else if (this.origin === "extractor") {
          this.setupExtractorCategories();
        } else if (this.origin === "background") {
          this.setupBackgroundCategories();
        }

        console.log(
          `📋 Initialized ${this.categories.size} standard categories for ${this.origin}`,
        );
      }

      setupProxyCategories() {
        this.registerBatch([
          {
            id: "terminal-errors",
            patterns: /error|fail|exception/i,
            options: {
              dimension: "terminal",
              metadata: {
                terminal: "error-terminal",
                icon: "🔴",
                level: "error",
              },
            },
          },
          {
            id: "terminal-media",
            patterns: /media|image|video/i,
            options: {
              dimension: "terminal",
              metadata: {
                terminal: "media-terminal",
                icon: "📺",
                level: "info",
              },
            },
          },
          {
            id: "terminal-network",
            patterns: /network|fetch|proxy/i,
            options: {
              dimension: "terminal",
              metadata: {
                terminal: "network-terminal",
                icon: "🌐",
                level: "info",
              },
            },
          },
          {
            id: "display-text",
            patterns: /text|content|article/i,
            options: {
              dimension: "display",
              metadata: { panel: "text-panel", renderer: "text" },
            },
          },
          {
            id: "display-media",
            patterns: /media|image|video/i,
            options: {
              dimension: "display",
              metadata: { panel: "media-panel", renderer: "media" },
            },
          },
        ]);
      }

      setupExtractorCategories() {
        // Content type hierarchy
        this.registerBatch([
          {
            id: "content",
            patterns: [],
            options: {
              dimension: "content",
              metadata: { type: "root" },
            },
          },
          {
            id: "media",
            patterns: [],
            options: {
              dimension: "content",
              parent: "content",
              metadata: { type: "media" },
            },
          },
          {
            id: "images",
            patterns: [],
            options: {
              dimension: "content",
              parent: "media",
              metadata: { type: "image" },
            },
          },
          {
            id: "jpeg",
            patterns: /\.jpe?g$/i,
            options: {
              dimension: "content",
              parent: "images",
              metadata: {
                mimeType: "image/jpeg",
                extensions: [".jpg", ".jpeg"],
              },
            },
          },
          {
            id: "png",
            patterns: /\.png$/i,
            options: {
              dimension: "content",
              parent: "images",
              metadata: { mimeType: "image/png", extensions: [".png"] },
            },
          },
          {
            id: "extraction-start",
            patterns: /extract.*start|begin.*extract/i,
            options: {
              dimension: "extraction",
              metadata: { phase: "start" },
            },
          },
          {
            id: "extraction-complete",
            patterns: /extract.*complete|finish.*extract/i,
            options: {
              dimension: "extraction",
              metadata: { phase: "complete" },
            },
          },
        ]);
      }

      setupBackgroundCategories() {
        this.registerBatch([
          {
            id: "lifecycle",
            patterns: /init|create|destroy|cleanup/i,
            options: {
              dimension: "system",
              metadata: { importance: "high", trackable: true },
            },
          },
          {
            id: "session",
            patterns: /session|activate|deactivate/i,
            options: {
              dimension: "system",
              metadata: { trackable: true },
            },
          },
          {
            id: "cross-context",
            patterns: /handle-|route-|cross-context/i,
            options: {
              dimension: "messaging",
              metadata: { crossContext: true },
            },
          },
          {
            id: "tab-created",
            patterns: /tab.*create|new.*tab/i,
            options: {
              dimension: "tabs",
              metadata: { action: "create" },
            },
          },
          {
            id: "tab-updated",
            patterns: /tab.*update|modify.*tab/i,
            options: {
              dimension: "tabs",
              metadata: { action: "update" },
            },
          },
        ]);
      }

      /**
       * Public API Methods
       */

      /**
       * Get all categories in a dimension
       */
      getCategoriesInDimension(dimension) {
        const ids = this.dimensions.get(dimension) || new Set();
        return Array.from(ids)
          .map((id) => this.categories.get(id))
          .filter(Boolean);
      }

      /**
       * Get category by ID
       */
      getCategory(id) {
        return this.categories.get(id) || null;
      }

      /**
       * Update category metadata
       */
      updateCategory(id, updates) {
        const category = this.categories.get(id);
        if (!category) return false;

        // Update allowed fields
        if (updates.metadata) {
          Object.assign(category.metadata, updates.metadata);
        }
        if (updates.priority !== undefined) {
          category.priority = updates.priority;
        }
        if (updates.validator !== undefined) {
          category.validator = updates.validator;
        }

        return true;
      }

      /**
       * Get children of a category
       */
      getChildren(parentId) {
        return Array.from(this.hierarchy.get(parentId) || []);
      }

      /**
       * Get ancestors of a category
       */
      getAncestors(childId) {
        const ancestors = [];
        let current = this.categories.get(childId);

        while (current?.parent) {
          ancestors.push(current.parent);
          current = this.categories.get(current.parent);
        }

        return ancestors;
      }

      /**
       * Check if category has specific ancestor
       */
      hasAncestor(childId, ancestorId) {
        let current = this.categories.get(childId);

        while (current?.parent) {
          if (current.parent === ancestorId) return true;
          current = this.categories.get(current.parent);
        }

        return false;
      }

      /**
       * Clear all categories (with option to keep standards)
       */
      clear(keepStandard = true) {
        this.categories.clear();
        this.dimensions.clear();
        this.hierarchy.clear();

        if (keepStandard) {
          this.setupStandardCategories();
        }
      }

      /**
       * Get statistics about registered categories
       */
      getStats() {
        const stats = {
          totalCategories: this.categories.size,
          dimensions: Array.from(this.dimensions.keys()),
          hierarchies: this.hierarchy.size,
          origin: this.origin,
          byDimension: {},
        };

        // Categories by dimension
        for (const [dim, ids] of this.dimensions.entries()) {
          stats.byDimension[dim] = ids.size;
        }

        return stats;
      }

      /**
       * Debug method to visualize hierarchy
       */
      visualizeHierarchy(rootId = null) {
        const lines = [];
        const visited = new Set();

        const drawNode = (id, prefix = "", isLast = true) => {
          const category = this.categories.get(id);
          if (!category || visited.has(id)) return;

          visited.add(id);

          const connector = isLast ? "└── " : "├── ";
          const info = `${category.id} (${category.dimension})`;
          lines.push(prefix + connector + info);

          const children = Array.from(category.children);
          const childPrefix = prefix + (isLast ? "    " : "│   ");

          children.forEach((childId, index) => {
            drawNode(childId, childPrefix, index === children.length - 1);
          });
        };

        if (rootId) {
          drawNode(rootId);
        } else {
          // Find all roots (categories without parents)
          const roots = Array.from(this.categories.values())
            .filter((c) => !c.parent)
            .sort((a, b) => a.dimension.localeCompare(b.dimension));

          roots.forEach((category, index) => {
            if (index > 0) lines.push("");
            drawNode(category.id, "", true);
          });
        }

        return lines.join("\n");
      }
    }

    // =====  SUBSCRIBER MANAGER =====
    class SubscriberManager {
      constructor() {
        this.subscribers = new Map();
        this.globalMiddlewares = [];
        this.eventStats = new Map();
        this.isDestroyed = false;
        this.origin = this.getOrigin();
        this.middlewareClasses = SubscriberMiddleware.getAllMiddlewareClasses();
        console.log(
          "Found middleware:",
          this.middlewareClasses.map((c) => c.name),
        );

        // Auto-discover and load all middlewares
        this.setupMiddlewares();

        if (typeof unified !== "undefined" && window.__vibeUnified) {
          this.contentTransformer = window.__vibeUnified.ContentTransformer;
          this.pipelineProcessor = new window.__vibeUnified.PipelineProcessor();
        }

        // Setup context info responder
        this.setupContextInfoResponder();

        console.log(
          `🎯 SubscriberManager initialized in ${this.origin} context`,
        );
      }

      setupMiddlewares() {
        for (const Class of this.middlewareClasses) {
          if (Class === SubscriberMiddleware) continue;
          try {
            const instance = new Class();
            this.addGlobalMiddleware(instance);
          } catch (e) {
            console.warn(`Failed to instantiate ${Class.name}:`, e);
          }
        }
      }

      getOrigin() {
        // Check for background context FIRST using API availability
        if (
          typeof browser !== "undefined" &&
          browser.runtime &&
          browser.runtime.getManifest
        ) {
          try {
            // Background has tabs API but content scripts don't
            if (browser.tabs && browser.tabs.query) {
              return "background";
            }
          } catch (e) {}
        }

        // Then check for specific component markers
        if (window.__vibeReaderProxyController) return "proxy";
        if (window.__vibeReaderStealthExtractor) return "extractor";
        if (window.location?.href?.includes("popup.html")) return "popup";

        // Fallback for Node.js style background (shouldn't happen in Firefox)
        if (typeof window === "undefined") return "background";

        return "unknown";
      }

      setupContextInfoResponder() {
        if (typeof browser !== "undefined" && browser.runtime) {
          browser.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
              if (request.action === "get-context-info") {
                sendResponse({ context: this.origin });
                return false;
              }
            },
          );
        }
      }

      subscribe(eventType, callback, options = {}) {
        if (this.isDestroyed) {
          throw new Error("SubscriberManager has been destroyed");
        }

        const subscriber = new VibeSubscriber(options.id, callback, options);

        if (!this.subscribers.has(eventType)) {
          this.subscribers.set(eventType, new Set());
        }

        this.subscribers.get(eventType).add(subscriber);

        // Add global middlewares to subscriber
        this.globalMiddlewares.forEach((middleware) => {
          subscriber.addMiddleware(middleware);
        });

        // Process subscription through global middlewares
        const eventContext = {
          event: eventType,
          subscriber,
          context: { origin: this.origin },
        };

        for (const middleware of this.globalMiddlewares) {
          if (middleware.process) {
            middleware.process(eventContext);
          }
        }

        // Return unsubscribe function
        return () => this.unsubscribe(eventType, subscriber.id);
      }

      unsubscribe(eventType, subscriberId) {
        const subscribers = this.subscribers.get(eventType);
        if (!subscribers) return false;

        for (const subscriber of subscribers) {
          if (subscriber.id === subscriberId) {
            subscriber.destroy();
            subscribers.delete(subscriber);

            if (subscribers.size === 0) {
              this.subscribers.delete(eventType);
            }

            return true;
          }
        }

        return false;
      }

      addGlobalMiddleware(middleware) {
        this.globalMiddlewares.push(middleware);
        this.globalMiddlewares.sort(
          (a, b) => (a.priority || 0) - (b.priority || 0),
        );

        // Add to existing subscribers
        this.subscribers.forEach((subscriberSet) => {
          subscriberSet.forEach((subscriber) => {
            subscriber.addMiddleware(middleware);
          });
        });
      }

      async emit(eventType, data, context = {}) {
        if (this.isDestroyed) return;

        // Add origin to context
        context.origin = context.origin || this.origin;
        context.timestamp = context.timestamp || Date.now();

        const subscribers = this.subscribers.get(eventType) || new Set();
        const globalSubscribers = this.subscribers.get("*") || new Set();

        const allSubscribers = [...subscribers, ...globalSubscribers];

        if (allSubscribers.length === 0 && !context.crossContext) {
          return {
            eventType,
            subscriberCount: 0,
            successCount: 0,
            failureCount: 0,
          };
        }

        // Update event stats
        if (!this.eventStats.has(eventType)) {
          this.eventStats.set(eventType, { count: 0, lastEmitted: 0 });
        }
        const stats = this.eventStats.get(eventType);
        stats.count++;
        stats.lastEmitted = Date.now();

        // Sort subscribers by priority
        const sortedSubscribers = allSubscribers.sort(
          (a, b) =>
            (b.preferences.priority || 0) - (a.preferences.priority || 0),
        );

        // Process subscribers
        const results = {
          eventType,
          subscriberCount: allSubscribers.length,
          successCount: 0,
          failureCount: 0,
          responses: [],
        };

        for (const subscriber of sortedSubscribers) {
          try {
            const result = await subscriber.process(eventType, data, context);
            if (result.success) {
              results.successCount++;
            } else {
              results.failureCount++;
            }
            results.responses.push(result);
          } catch (error) {
            results.failureCount++;
            console.warn(`Subscriber ${subscriber.id} failed:`, error);
          }
        }

        // Run postProcess on global middlewares
        for (const middleware of this.globalMiddlewares) {
          if (middleware.postProcess) {
            await middleware.postProcess(
              { event: eventType, data, context },
              results,
            );
          }
        }

        return results;
      }

      // Direct emit without batching (used internally)
      async directEmit(eventType, data, context = {}) {
        context.direct = true;
        return this.emit(eventType, data, context);
      }

      getSubscriber(eventType, subscriberId) {
        const subscribers = this.subscribers.get(eventType);
        if (!subscribers) return null;

        for (const subscriber of subscribers) {
          if (subscriber.id === subscriberId) {
            return subscriber;
          }
        }
        return null;
      }

      updateSubscriber(eventType, subscriberId, updates) {
        const subscriber = this.getSubscriber(eventType, subscriberId);
        if (!subscriber) return false;

        if (updates.state) {
          subscriber.updateState(updates.state);
        }
        if (updates.preferences) {
          subscriber.updatePreferences(updates.preferences);
        }

        return true;
      }

      cleanupInactiveSubscribers(cutoffTime) {
        let cleaned = 0;

        this.subscribers.forEach((subscriberSet, eventType) => {
          const toRemove = [];

          subscriberSet.forEach((subscriber) => {
            if (
              subscriber.state === "disabled" &&
              subscriber.lastActivity < cutoffTime
            ) {
              toRemove.push(subscriber);
            }
          });

          toRemove.forEach((subscriber) => {
            subscriber.destroy();
            subscriberSet.delete(subscriber);
            cleaned++;
          });

          if (subscriberSet.size === 0) {
            this.subscribers.delete(eventType);
          }
        });

        if (cleaned > 0) {
          console.log(`🧹 Cleaned up ${cleaned} inactive subscribers`);
        }
      }

      getSubscriberStats() {
        const stats = {
          totalSubscribers: 0,
          byEventType: {},
          byState: { active: 0, paused: 0, disabled: 0 },
          quarantined: 0,
        };

        this.subscribers.forEach((subscriberSet, eventType) => {
          stats.byEventType[eventType] = {
            count: subscriberSet.size,
            subscribers: [],
          };

          subscriberSet.forEach((subscriber) => {
            stats.totalSubscribers++;
            stats.byState[subscriber.state] =
              (stats.byState[subscriber.state] || 0) + 1;

            if (subscriber.isQuarantined) {
              stats.quarantined++;
            }

            stats.byEventType[eventType].subscribers.push(
              subscriber.getStats(),
            );
          });
        });

        return stats;
      }
      // Pipeline integration methods
      addPipelineTransform(transform, options = {}) {
        if (this.pipelineProcessor) {
          this.pipelineProcessor.use(transform, options);
        }
      }

      async processContent(htmlContent, transforms = []) {
        if (!this.contentTransformer || !this.pipelineProcessor) {
          throw new Error("Unified pipeline not available");
        }
        const hast = this.contentTransformer.htmlToHast(htmlContent);

        // Temporarily add transforms
        const originalTransforms = [...this.pipelineProcessor.transforms];
        transforms.forEach((transform) =>
          this.pipelineProcessor.use(transform),
        );

        try {
          const result = await this.pipelineProcessor.process(hast);
          return {
            html: this.contentTransformer.hastToHtml(result.tree),
            context: result.context,
          };
        } finally {
          // Restore original transforms
          this.pipelineProcessor.transforms = originalTransforms;
        }
      }

      getStats() {
        const baseStats = this.getSubscriberStats();

        return {
          ...baseStats,
          origin: this.origin,
          crossContextRouting: this.crossContextMiddleware?.getRoutingStats(),
          batching: this.batchingMiddleware?.getBatchingStats(),
          rateLimiting: this.rateLimitMiddleware?.getRateLimitStats(),
          serialization:
            this.crossContextSerializationMiddleware?.getSerializationStats(),
          metrics: this.crossContextMetricsMiddleware?.getMetricsSummary(),
          replay: this.crossContextReplayMiddleware?.getReplayStats(),
          debug: this.debugMiddleware?.getDebugStatus(),
          eventStats: Object.fromEntries(this.eventStats),
        };
      }

      cleanup() {
        // Clear all pending timers
        this.subscribers.forEach((subscriberSet) => {
          subscriberSet.forEach((subscriber) => {
            subscriber.clearPendingExecution();
          });
        });

        // Cleanup middlewares
        this.globalMiddlewares.forEach((middleware) => {
          if (middleware.cleanup) {
            middleware.cleanup();
          }
          if (middleware.destroy) {
            middleware.destroy();
          }
        });
      }

      getVibeSystemMiddleware() {
        // Find the VibeSystemMiddleware instance in globalMiddlewares
        for (const middleware of this.globalMiddlewares) {
          if (middleware.constructor.name === "VibeSystemMiddleware") {
            return middleware;
          }
        }

        console.warn("VibeSystemMiddleware not found in global middlewares");
        return null;
      }

      destroy() {
        this.cleanup();

        // Destroy all subscribers
        this.subscribers.forEach((subscriberSet) => {
          subscriberSet.forEach((subscriber) => {
            subscriber.destroy();
          });
        });

        this.subscribers.clear();
        this.globalMiddlewares = [];
        this.eventStats.clear();
        this.isDestroyed = true;

        console.log("SubscriberManager destroyed");
      }
    }

    // =====  SUBSCRIBER ENABLED COMPONENT =====
    class SubscriberEnabledComponent {
      constructor() {
        // Use global singleton manager
        if (!window.__globalSubscriberManager) {
          window.__globalSubscriberManager = new SubscriberManager();
        }

        this.subscriberManager = window.__globalSubscriberManager;
        this.subscriptions = [];
        this.origin = this.subscriberManager.origin;
      }

      subscribe(eventType, callback, options = {}) {
        const enhancedOptions = {
          ...options,
          origin: this.origin,
          crossContext: options.crossContext !== false,
        };

        const unsubscribe = this.subscriberManager.subscribe(
          eventType,
          callback,
          enhancedOptions,
        );
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
      }

      subscribeWithTransforms(
        eventType,
        callback,
        transforms = [],
        options = {},
      ) {
        const enhancedOptions = {
          ...options,
          transformations: [...transforms, ...(options.transformations || [])],
        };

        return this.subscribe(eventType, callback, enhancedOptions);
      }

      async emit(eventType, data, context = {}) {
        const enhancedContext = {
          ...context,
          origin: this.origin,
          component: this.constructor.name,
        };

        return await this.subscriberManager.emit(
          eventType,
          data,
          enhancedContext,
        );
      }

      deactivate() {
        this.subscriptions.forEach((unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.warn("Error during subscription cleanup:", error);
          }
        });
        this.subscriptions = [];
      }

      destroy() {
        this.deactivate();
      }

      getSubscriberStats() {
        return this.subscriberManager
          ? this.subscriberManager.getSubscriberStats()
          : {};
      }

      getStats() {
        return this.subscriberManager ? this.subscriberManager.getStats() : {};
      }

      getCrossContextInfo() {
        return this.subscriberManager
          ? this.subscriberManager.crossContextMiddleware?.getRoutingStats()
          : null;
      }
    }

    // ===== GLOBAL INITIALIZATION =====
    // Create the global enhanced subscriber manager
    if (!window.__globalSubscriberManager) {
      window.__globalSubscriberManager = new SubscriberManager();
    }

    // Export to window
    window.__vibeSubscribe = {
      version: "2.5",
      VibeSubscriber,
      SubscriberMiddleware,
      SubscriberManager: SubscriberManager,
      SubscriberEnabledComponent: SubscriberEnabledComponent,
      globalManager: window.__globalSubscriberManager,
    };

    window.VibeSubscriber = VibeSubscriber;
    window.SubscriberManager = window.__globalSubscriberManager;
    window.SubscriberEnabledComponent = SubscriberEnabledComponent;
    window.SubscriberMiddleware = SubscriberMiddleware;

    console.log("✅ VibeSubscribe v2.5 loaded with cross-context routing");
    console.log(`📡 Global manager at window.__globalSubscriberManager`);
    console.log(
      `🌐 Active in ${window.__globalSubscriberManager.origin} context`,
    );

    true; // Return true for successful injection
  } catch (error) {
    // Cleanup on failure
    delete window.__vibeSubscribe;
    delete window.__globalSubscriberManager;
    delete window.VibeSubscriber;
    delete window.SubscriberManager;
    delete window.SubscriberEnabledComponent;
    delete window.SubscriberMiddleware;
    console.error("Failed to initialize VibeSubscribe:", error);
    throw error;
  }
}
