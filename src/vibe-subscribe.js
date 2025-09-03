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
                this.id = id || `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
            if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest) {
                try {
                    // Background has tabs API but content scripts don't
                    if (browser.tabs && browser.tabs.query) {
                        return "background";
                    }
                } catch(e) {}
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
                        eventContext.context
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
      constructor(name, priority = 0) {
        this.name = name;
        this.priority = priority;
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

                if (subscriber.state === "disabled" || subscriber.state === "destroyed") {
          return false;
        }

        if (subscriber.state === "paused") {
          return false;
        }

                if (subscriber.isQuarantined && Date.now() < subscriber.quarantineUntil) {
          return false;
        }

                if (subscriber.isQuarantined && Date.now() >= subscriber.quarantineUntil) {
          subscriber.isQuarantined = false;
          subscriber.failureCount = 0;
        }

        return true;
      }
    }

    class RateLimitMiddleware extends SubscriberMiddleware {
        constructor() {
            super('UnifiedRateLimit', 4);

            // Cross-context rate limits (context-pair based)
            this.crossContextLimits = new Map();
            this.crossContextTracking = new Map();

            // Subscriber-specific rate limits (subscriber-based)
            this.subscriberLimits = new Map();
            this.subscriberTracking = new Map();

            // Default limits
            this.setupDefaultLimits();

            console.log('⏱️ Unified Rate Limit Middleware initialized');
        }

        setupDefaultLimits() {
            // Default cross-context limits
            this.crossContextLimits.set('extractor->proxy', {
                maxPerSecond: 20,
                maxPerMinute: 200,
                burstAllowed: 5,
                window: 1000
            });

            this.crossContextLimits.set('proxy->background', {
                maxPerSecond: 30,
                maxPerMinute: 500,
                burstAllowed: 10,
                window: 1000
            });

            this.crossContextLimits.set('background->extractor', {
                maxPerSecond: 15,
                maxPerMinute: 300,
                burstAllowed: 3,
                window: 1000
            });

            // Default subscriber limits (can be overridden per subscriber)
            this.defaultSubscriberLimits = {
                maxPerSecond: 50,
                maxPerMinute: 1000,
                burstAllowed: 20,
                debounceMs: 0,
                throttleMs: 0
            };
        }

        async process(eventContext) {
            const { event, subscriber, context } = eventContext;

            // Check subscriber-specific rate limits first (highest priority)
                if (subscriber && subscriber.preferences) {
                const subscriberResult = this.checkSubscriberRateLimit(subscriber, event, context);
                if (!subscriberResult.allowed) {
                    eventContext.context.rateLimited = true;
                    eventContext.context.rateLimitReason = subscriberResult.reason;
                    eventContext.context.rateLimitType = 'subscriber';
                    return false;
                }
            }

            // Check cross-context rate limits for cross-context events
            if (context.crossContext || context.sourceContext) {
                const crossContextResult = this.checkCrossContextRateLimit(event, context);
                if (!crossContextResult.allowed) {
                    eventContext.context.rateLimited = true;
                    eventContext.context.rateLimitReason = crossContextResult.reason;
                    eventContext.context.rateLimitType = 'cross-context';
                    return false;
                }
            }

            return true;
        }

        checkSubscriberRateLimit(subscriber, event, context) {
            const subscriberId = subscriber.id;

            // Get subscriber-specific limits (with fallback to defaults)
            const limits = {
                ...this.defaultSubscriberLimits,
                    ...(subscriber.preferences.rateLimit || {}),
                    maxPerSecond: subscriber.preferences.maxPerSecond || this.defaultSubscriberLimits.maxPerSecond,
                    maxPerMinute: subscriber.preferences.maxPerMinute || this.defaultSubscriberLimits.maxPerMinute,
                    burstAllowed: subscriber.preferences.burstAllowed || this.defaultSubscriberLimits.burstAllowed,
                    debounceMs: subscriber.preferences.debounceMs || 0,
                    throttleMs: subscriber.preferences.throttleMs || subscriber.preferences.rateLimitMs || 0
            };

            // Get or create tracking for this subscriber
            if (!this.subscriberTracking.has(subscriberId)) {
                this.subscriberTracking.set(subscriberId, {
                    secondWindow: [],
                    minuteWindow: [],
                    lastEvent: 0,
                    burstCount: 0,
                    lastBurstReset: Date.now()
                });
            }

            const tracking = this.subscriberTracking.get(subscriberId);
            const now = Date.now();

            // Clean old entries
            this.cleanTrackingWindows(tracking, now);

            // Check debounce (subscriber-specific feature)
            if (limits.debounceMs > 0) {
                const timeSinceLastEvent = now - tracking.lastEvent;
                if (timeSinceLastEvent < limits.debounceMs) {
                    return {
                        allowed: false,
                        reason: `Debounced: ${timeSinceLastEvent}ms < ${limits.debounceMs}ms`,
                        retryAfter: limits.debounceMs - timeSinceLastEvent
                    };
                }
            }

            // Check throttle (subscriber-specific feature)
            if (limits.throttleMs > 0) {
                const timeSinceLastEvent = now - tracking.lastEvent;
                if (timeSinceLastEvent < limits.throttleMs) {
                    return {
                        allowed: false,
                        reason: `Throttled: ${timeSinceLastEvent}ms < ${limits.throttleMs}ms`,
                        retryAfter: limits.throttleMs - timeSinceLastEvent
                    };
                }
            }

            // Check burst limit
            if (now - tracking.lastBurstReset > 1000) {
                tracking.burstCount = 0;
                tracking.lastBurstReset = now;
            }

            if (tracking.burstCount >= limits.burstAllowed) {
                return {
                    allowed: false,
                    reason: `Burst limit exceeded: ${tracking.burstCount}/${limits.burstAllowed}`,
                    retryAfter: 1000 - (now - tracking.lastBurstReset)
                };
            }

            // Check rate limits
            if (tracking.secondWindow.length >= limits.maxPerSecond) {
                return {
                    allowed: false,
                    reason: `Rate limit exceeded: ${tracking.secondWindow.length}/${limits.maxPerSecond} per second`,
                    retryAfter: 1000 - (now - tracking.secondWindow[0])
                };
            }

            if (tracking.minuteWindow.length >= limits.maxPerMinute) {
                return {
                    allowed: false,
                    reason: `Rate limit exceeded: ${tracking.minuteWindow.length}/${limits.maxPerMinute} per minute`,
                    retryAfter: 60000 - (now - tracking.minuteWindow[0])
                };
            }

            // Record the event
            tracking.secondWindow.push(now);
            tracking.minuteWindow.push(now);
            tracking.lastEvent = now;
            tracking.burstCount++;

            return { allowed: true };
        }

        checkCrossContextRateLimit(event, context) {
            const sourceContext = context.sourceContext || this.origin;
            const targetContext = context.targetContext || 'unknown';
            const contextPair = `${sourceContext}->${targetContext}`;

            const limits = this.crossContextLimits.get(contextPair);
            if (!limits) {
                return { allowed: true }; // No limits configured
            }

            // Get or create tracking for this context pair
            if (!this.crossContextTracking.has(contextPair)) {
                this.crossContextTracking.set(contextPair, {
                    secondWindow: [],
                    minuteWindow: [],
                    burstCount: 0,
                    lastBurstReset: Date.now()
                });
            }

            const tracking = this.crossContextTracking.get(contextPair);
            const now = Date.now();

            // Clean old entries
            this.cleanTrackingWindows(tracking, now);

            // Check burst limit
            if (now - tracking.lastBurstReset > 1000) {
                tracking.burstCount = 0;
                tracking.lastBurstReset = now;
            }

            if (tracking.burstCount >= limits.burstAllowed) {
                return {
                    allowed: false,
                    reason: `Cross-context burst limit exceeded for ${contextPair}: ${tracking.burstCount}/${limits.burstAllowed}`,
                    retryAfter: 1000 - (now - tracking.lastBurstReset)
                };
            }

            // Check rate limits
            if (tracking.secondWindow.length >= limits.maxPerSecond) {
                return {
                    allowed: false,
                    reason: `Cross-context rate limit exceeded for ${contextPair}: ${tracking.secondWindow.length}/${limits.maxPerSecond} per second`,
                    retryAfter: 1000 - (now - tracking.secondWindow[0])
                };
            }

            if (tracking.minuteWindow.length >= limits.maxPerMinute) {
                return {
                    allowed: false,
                    reason: `Cross-context rate limit exceeded for ${contextPair}: ${tracking.minuteWindow.length}/${limits.maxPerMinute} per minute`,
                    retryAfter: 60000 - (now - tracking.minuteWindow[0])
                };
            }

            // Record the event
            tracking.secondWindow.push(now);
            tracking.minuteWindow.push(now);
            tracking.burstCount++;

            return { allowed: true };
        }

        cleanTrackingWindows(tracking, now) {
            // Clean second window (keep last 1 second)
            tracking.secondWindow = tracking.secondWindow.filter(timestamp =>
                now - timestamp < 1000
            );

            // Clean minute window (keep last 1 minute)
            tracking.minuteWindow = tracking.minuteWindow.filter(timestamp =>
                now - timestamp < 60000
            );
        }

        // Public API for dynamic configuration
        setSubscriberRateLimit(subscriberId, limits) {
                if (!this.subscriberLimits.has(subscriberId)) {
                    this.subscriberLimits.set(subscriberId, {});
                }
                Object.assign(this.subscriberLimits.get(subscriberId), limits);
                console.log(`⏱️ Updated rate limits for subscriber ${subscriberId}`);
                return true;
            }

        setCrossContextRateLimit(contextPair, limits) {
            this.crossContextLimits.set(contextPair, {
                ...this.crossContextLimits.get(contextPair),
                ...limits
            });
            console.log(`⏱️ Updated cross-context rate limits for ${contextPair}`);
        }

        getRateLimitStats() {
            return {
                subscriberTracking: this.subscriberTracking.size,
                crossContextTracking: this.crossContextTracking.size,
                activeLimits: {
                    subscribers: this.subscriberLimits.size,
                    crossContext: this.crossContextLimits.size
                },
                recentBlocks: this.getRecentBlocks()
            };
        }

        getRecentBlocks() {
            // This would track recent rate limit blocks for debugging
            return {
                subscriberBlocks: 0,
                crossContextBlocks: 0,
                lastBlockTime: null
            };
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
                                transformedData = result.data !== undefined ? result.data : transformedData;
                                transformedContext = result.context !== undefined
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
          constructor() {
              super('CrossContextSerialization', 3); // Before routing

              this.serializers = new Map();
              this.deserializers = new Map();
              this.serializationStats = {
                  serialized: 0,
                  deserialized: 0,
                  errors: 0,
                  bytesOriginal: 0,
                  bytesSerialized: 0
              };

              this.setupSerializers();
              console.log('🔄 Cross-Context Serialization Middleware initialized');
          }

          setupSerializers() {
              // DOM Node serializer
              this.serializers.set('dom', this.serializeDOMNode.bind(this));
              this.deserializers.set('dom', this.deserializeDOMNode.bind(this));

              // Error object serializer
              this.serializers.set('error', this.serializeError.bind(this));
              this.deserializers.set('error', this.deserializeError.bind(this));

              // Function serializer (limited)
              this.serializers.set('function', this.serializeFunction.bind(this));
              this.deserializers.set('function', this.deserializeFunction.bind(this));

              // Complex object serializer (handles circular references)
              this.serializers.set('object', this.serializeComplexObject.bind(this));
              this.deserializers.set('object', this.deserializeComplexObject.bind(this));

              // HAST/AST serializer
              this.serializers.set('ast', this.serializeAST.bind(this));
              this.deserializers.set('ast', this.deserializeAST.bind(this));

              // Map/Set serializer
              this.serializers.set('collection', this.serializeCollection.bind(this));
              this.deserializers.set('collection', this.deserializeCollection.bind(this));
          }

          async process(eventContext) {
              const { event, data, context } = eventContext;

              // Only serialize for cross-context events or when explicitly requested
              if (context.crossContext || context.forceSerialize || this.needsSerialization(data)) {
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
                          results.responses.map(response => this.deserialize(response))
                      );
                      this.serializationStats.deserialized++;
                  } catch (error) {
                      console.warn('Response deserialization failed:', error);
                      this.serializationStats.errors++;
                  }
              }

              return results;
          }

          needsSerialization(data) {
              if (!data || typeof data !== 'object') return false;

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
              if (typeof obj === 'function') return true;

              // Maps and Sets
              if (obj instanceof Map || obj instanceof Set) return true;

              // AST-like objects (have type property)
              if (obj.type && (obj.children || obj.properties || obj.value !== undefined)) return true;

              // Check nested objects
              if (typeof obj === 'object' && obj !== null) {
                  for (const value of Object.values(obj)) {
                      if (typeof value === 'object' && value !== null) {
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
              if (typeof value !== 'object' && typeof value !== 'function') {
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
                          __type: 'dom',
                          __data: this.serializeDOMNode(value)
                      };
                  }

                  // Error object
                  if (value instanceof Error) {
                      return {
                          __type: 'error',
                          __data: this.serializeError(value)
                      };
                  }

                  // Function
                  if (typeof value === 'function') {
                      return {
                          __type: 'function',
                          __data: this.serializeFunction(value)
                      };
                  }

                  // Map
                  if (value instanceof Map) {
                      return {
                          __type: 'collection',
                          __data: this.serializeCollection(value)
                      };
                  }

                  // Set
                  if (value instanceof Set) {
                      return {
                          __type: 'collection',
                          __data: this.serializeCollection(value)
                      };
                  }

                  // AST-like object
                  if (value.type && (value.children || value.properties || value.value !== undefined)) {
                      return {
                          __type: 'ast',
                          __data: this.serializeAST(value, refMap, processing)
                      };
                  }

                  // Regular object or array
                  if (Array.isArray(value)) {
                      return value.map(item => this.serializeValue(item, refMap, processing));
                  }

                  const serialized = {};
                  for (const [key, val] of Object.entries(value)) {
                      serialized[key] = this.serializeValue(val, refMap, processing);
                  }

                  return {
                      __type: 'object',
                      __data: serialized
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
                  attributes: node.attributes ? Array.from(node.attributes).map(attr => ({
                      name: attr.name,
                      value: attr.value
                  })) : null,
                  classList: node.classList ? Array.from(node.classList) : null,
                  id: node.id,
                  className: node.className,
                  innerHTML: node.innerHTML,
                  outerHTML: node.outerHTML
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
                          .filter(key => !['name', 'message', 'stack'].includes(key))
                          .map(key => [key, error[key]])
                  )
              };
          }

          serializeFunction(func) {
              return {
                  name: func.name,
                  source: func.toString(),
                  isAsync: func.constructor.name === 'AsyncFunction',
                  isArrow: !func.prototype,
                  length: func.length
              };
          }

          serializeCollection(collection) {
              if (collection instanceof Map) {
                  return {
                      type: 'Map',
                      entries: Array.from(collection.entries())
                  };
              }

              if (collection instanceof Set) {
                  return {
                      type: 'Set',
                      values: Array.from(collection.values())
                  };
              }

              return { type: 'unknown', value: collection };
          }

          serializeAST(ast, refMap, processing) {
              const serialized = {
                  type: ast.type
              };

              // Serialize common AST properties
              if (ast.children) {
                  serialized.children = ast.children.map(child =>
                      this.serializeValue(child, refMap, processing)
                  );
              }

              if (ast.properties) {
                  serialized.properties = this.serializeValue(ast.properties, refMap, processing);
              }

              if (ast.value !== undefined) {
                  serialized.value = ast.value;
              }

              if (ast.data) {
                  serialized.data = this.serializeValue(ast.data, refMap, processing);
              }

              // Serialize other properties
              for (const [key, value] of Object.entries(ast)) {
                  if (!['type', 'children', 'properties', 'value', 'data'].includes(key)) {
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
              if (typeof value !== 'object') return value;

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
                  return value.map(item => this.deserializeValue(item, refMap));
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
                  outerHTML: data.outerHTML
              };
          }

          deserializeError(data) {
              const error = new Error(data.message);
              error.name = data.name;
              error.stack = data.stack;
              if (data.cause) error.cause = data.cause;

              // Restore custom properties
              for (const [key, value] of Object.entries(data)) {
                  if (!['name', 'message', 'stack', 'cause'].includes(key)) {
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
                  toString: () => data.source
              };
          }

          deserializeCollection(data) {
              if (data.type === 'Map') {
                  return new Map(data.entries);
              }

              if (data.type === 'Set') {
                  return new Set(data.values);
              }

              return data.value;
          }

          deserializeAST(data) {
              const ast = { type: data.type };

              // Deserialize AST properties
              for (const [key, value] of Object.entries(data)) {
                  if (key !== 'type') {
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
                  compressionRatio: this.serializationStats.bytesSerialized > 0
                      ? this.serializationStats.bytesOriginal / this.serializationStats.bytesSerialized
                      : 1,
                  errorRate: this.serializationStats.serialized > 0
                      ? this.serializationStats.errors / (this.serializationStats.serialized + this.serializationStats.errors)
                      : 0
              };
          }
      }

      // ===== CROSS-CONTEXT ROUTING MIDDLEWARE =====
    class CrossContextRoutingMiddleware extends SubscriberMiddleware {
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

                console.log(`🌐 CrossContextRouting initialized in ${this.origin} context`);
      }

      getOrigin() {
        // Check for background context FIRST using API availability
        if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest) {
            try {
                // Background has tabs API but content scripts don't
                if (browser.tabs && browser.tabs.query) {
                    return "background";
                }
            } catch(e) {}
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
                () => this.announceViaStorage(action, data)
            ];

            for (const strategy of strategies) {
                try {
                    const result = await strategy();
                    if (result?.success) return result;
                } catch (error) {
                    console.debug(`Strategy failed: ${error.message}`);
                }
            }

            return { success: false, error: 'All strategies failed' };
        }

        async announceViaRuntime(action, data) {
            // Content scripts use runtime to send to background
            if (this.origin === 'background') {
                return { success: false, error: 'Background cannot use runtime.sendMessage to itself' };
            }
            
            try {
                await browser.runtime.sendMessage({
                    action,
                    data,
                    method: 'runtime',
                    sourceContext: this.origin
                });
                return { success: true, method: 'runtime' };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        async announceViaTabs(action, data) {
            // Only background can use tabs API
            if (this.origin !== 'background') {
                return { success: false, error: 'Only background can use tabs API' };
            }
            
            try {
                const tabs = await browser.tabs.query({});
                let successCount = 0;
                
                for (const tab of tabs) {
                    try {
                        await browser.tabs.sendMessage(tab.id, {
                            action,
                            data,
                            method: 'tabs',
                            sourceContext: this.origin
                        });
                        successCount++;
                    } catch (e) {
                        // Tab might not have content script, skip silently
                    }
                }
                
                return { 
                    success: successCount > 0, 
                    method: 'tabs',
                    sentTo: successCount 
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
                capabilities: this.getContextCapabilities(sourceContext)
            };

            return this.sendAnnouncement('context-announcement', announcement);
        }

        async announceSubscription(eventType) {
            const announcement = {
                eventType,
                subscriberContext: this.origin,
                timestamp: Date.now()
            };

            // Check if already announced
            const announcementKey = `${eventType}-${this.origin}`;
            if (this.announcementHistory.has(announcementKey)) return;
            this.announcementHistory.set(announcementKey, Date.now());

            return this.sendAnnouncement('subscription-announcement', announcement);
        }

        async announceViaStorage(announcement) {
            // FIX: Use storage as fallback announcement mechanism
            if (browser.storage && browser.storage.local) {
                const key = `context-announcement-${announcement.context}`;
                await browser.storage.local.set({
                    [key]: {
                        ...announcement,
                        method: 'storage'
                    }
                });

                return { success: true, method: 'storage' };
            }

            return { success: false, error: 'Storage not available' };
        }

        setupStorageListener() {
            if (browser.storage && browser.storage.onChanged) {
                browser.storage.onChanged.addListener((changes, area) => {
                    if (area !== 'local') return;
                    
                    Object.keys(changes).forEach(key => {
                        if (key.startsWith('context-announcement-')) {
                            const { newValue } = changes[key];
                            if (newValue && newValue.context !== this.origin) {
                                this.handleRemoteSubscriptionAnnouncement(newValue, {
                                    storage: true,
                                    context: newValue.context
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
                background: ['orchestrate', 'inject', 'storage', 'tabs'],
                proxy: ['display', 'ui', 'terminal', 'user-input'],
                extractor: ['extract', 'analyze', 'observe', 'media-discovery'],
                popup: ['settings', 'controls', 'status']
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

    // ===== TERMINAL INTEGRATION MIDDLEWARE =====
    class TerminalIntegrationMiddleware extends SubscriberMiddleware {
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
                    const level = eventType.includes("error") || eventType.includes("failed")
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
            if (event === 'terminal-log' && data.batched) {
                // Process entire batch at once
                data.items.forEach(item => {
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
            if (this.outputBuffer.length > 0 && typeof dump !== 'undefined') {
                // Single dump() call for entire batch
                dump(this.outputBuffer.join(''));
                this.outputBuffer = [];
            }
            this.flushTimer = null;
        }

      categorizeEvent(eventType) {
                if (eventType.includes("error") || eventType.includes("failed")) return "ERRORS";
        if (eventType.includes("css")) return "CSS";
                if (eventType.includes("media") || eventType.includes("image") || eventType.includes("video"))
          return "MEDIA";
        if (eventType.includes("ascii")) return "ASCII";
        if (eventType.includes("extraction") || eventType.includes("proxy"))
          return "NETWORK";
        return "SYSTEM";
      }
    }

    // =====  BATCHING MIDDLEWARE =====
    class BatchingMiddleware extends SubscriberMiddleware {
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
                    activityCount: (this.memoryMetrics.get(`subscriber-${subscriberId}`)
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

                    if (proxy.extractedContent && Date.now() - (proxy.contentTimestamp || 0) > 30 * 60 * 1000) {
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
          constructor() {
              super('CrossContextMetrics', 10); // Low priority - runs after everything else

              this.origin = this.getOrigin();

              // Metrics storage
              this.contextMetrics = new Map();          // contextPair -> detailed metrics
              this.eventTypeMetrics = new Map();        // eventType -> aggregated metrics
              this.performanceMetrics = new Map();      // performance tracking per context
              this.errorMetrics = new Map();            // error tracking per context pair
              this.throughputMetrics = new Map();       // throughput tracking

              // Configuration
              this.aggregationInterval = 30000;         // 30 seconds
              this.retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
              this.performanceThresholds = {
                  slow: 1000,      // 1 second
                  verySlow: 5000,  // 5 seconds
                  timeout: 30000   // 30 seconds
              };

              // Real-time metrics
              this.currentWindowStart = Date.now();
              this.currentWindowMetrics = new Map();

              this.initializeMetrics();
          }

          getOrigin() {
              // Check for background context FIRST using API availability
              if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest) {
                  try {
                      // Background has tabs API but content scripts don't
                      if (browser.tabs && browser.tabs.query) {
                          return "background";
                      }
                  } catch(e) {}
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

              console.log(`📊 CrossContextMetrics initialized in ${this.origin} context`);
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
                  cached: context.cached || false
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
                          fast: 0,        // < 100ms
                          normal: 0,      // 100ms - 1s
                          slow: 0,        // 1s - 5s
                          verySlow: 0     // > 5s
                      },
                      hourlyStats: new Map(),
                      lastUpdated: Date.now()
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
                  dataSize: metrics.dataSize
              });

              if (stats.recentEvents.length > 50) {
                  stats.recentEvents = stats.recentEvents.slice(-50);
              }

              // Update hourly stats
              const hour = new Date(metrics.timestamp).getHours();
              if (!stats.hourlyStats.has(hour)) {
                  stats.hourlyStats.set(hour, { count: 0, avgDuration: 0, totalDuration: 0 });
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
                      lastSeen: Date.now()
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
                        crossContext: metrics.crossContext || false
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
                      crossContext: context.crossContext || false
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
                          lastSeen: Date.now()
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
                      failedEvents: 0
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
                      lastError: Date.now()
                  });
              }

              const errorStats = this.errorMetrics.get(errorKey);
              errorStats.totalErrors++;

              const errorType = error ? error.constructor.name : 'UnknownError';
              const errorCount = errorStats.errorTypes.get(errorType) || 0;
              errorStats.errorTypes.set(errorType, errorCount + 1);

              errorStats.recentErrors.push({
                  error: error ? error.message : 'Unknown error',
                  timestamp: Date.now(),
                  duration: metrics.duration,
                  crossContext: metrics.crossContext
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
                  systemHealth: this.calculateSystemHealth()
              };

              // Emit aggregated metrics
              if (window.__globalSubscriberManager) {
                  window.__globalSubscriberManager.emit('cross-context-metrics-aggregated', aggregatedData);
              }

              // Log summary for debugging
              console.log(`📊 Metrics Summary (${this.origin}):`, {
                  totalContextPairs: this.contextMetrics.size,
                  totalEventTypes: this.eventTypeMetrics.size,
                  performanceIssues: this.performanceMetrics.size,
                  systemHealth: aggregatedData.systemHealth
              });
          }

          getThroughputSummary() {
              const recentMinutes = Array.from(this.throughputMetrics.values())
                  .slice(-5); // Last 5 minutes

              return {
                  recentMinutes: recentMinutes.length,
                  avgEventsPerMinute: recentMinutes.reduce((sum, m) => sum + m.totalEvents, 0) / Math.max(recentMinutes.length, 1),
                  avgDataSizePerMinute: recentMinutes.reduce((sum, m) => sum + m.totalDataSize, 0) / Math.max(recentMinutes.length, 1),
                  crossContextRatio: recentMinutes.reduce((sum, m) => sum + m.crossContextEvents, 0) /
                      Math.max(recentMinutes.reduce((sum, m) => sum + m.totalEvents, 0), 1)
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
                      event => now - event.timestamp < recentThreshold
                  );

                  totalRecentEvents += recentEvents.length;
                  successfulRecentEvents += recentEvents.filter(e => e.success).length;
                  slowRecentEvents += recentEvents.filter(e => e.duration > this.performanceThresholds.slow).length;
              }

              const successRate = totalRecentEvents > 0 ? successfulRecentEvents / totalRecentEvents : 1;
              const performanceRate = totalRecentEvents > 0 ? (totalRecentEvents - slowRecentEvents) / totalRecentEvents : 1;

              return {
                  overall: Math.min(successRate, performanceRate),
                  successRate,
                  performanceRate,
                  recentEvents: totalRecentEvents,
                  health: successRate > 0.95 && performanceRate > 0.9 ? 'excellent' :
                      successRate > 0.85 && performanceRate > 0.8 ? 'good' :
                          successRate > 0.7 && performanceRate > 0.6 ? 'fair' : 'poor'
              };
          }

          resetCurrentWindow() {
              this.currentWindowStart = Date.now();
              this.currentWindowMetrics.clear();
          }

          cleanupOldMetrics() {
              const cutoffTime = Date.now() - this.retentionPeriod;

              // Clean old throughput metrics
              for (const [minuteKey, throughput] of this.throughputMetrics.entries()) {
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

              console.log(`🧹 Cleaned old metrics (${this.origin}): ${this.throughputMetrics.size} throughput entries remaining`);
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
                  throughputSummary: this.getThroughputSummary()
              };
          }

          getContextPairMetrics(contextPair) {
              return this.contextMetrics.get(contextPair) || null;
          }

          getEventTypeMetrics(eventType) {
              return this.eventTypeMetrics.get(eventType) || null;
          }
      }

// ===== CROSS-CONTEXT EVENT REPLAY MIDDLEWARE =====
      class CrossContextReplayMiddleware extends SubscriberMiddleware {
          constructor() {
              super('CrossContextReplay', 11); // Lowest priority

              this.origin = this.getOrigin();

              // Event storage
              this.sessionHistory = new Map();          // sessionId -> event history
              this.contextHistory = new Map();          // contextPair -> recent events
              this.replayableEvents = new Set();        // events that can be replayed
              this.sessionMetadata = new Map();         // sessionId -> metadata

              // Configuration
              this.maxHistoryPerSession = 200;          // max events per session
              this.maxHistoryPerContext = 100;          // max events per context pair
              this.retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
              this.compressionThreshold = 50;           // compress after 50 events

              // Replay state
              this.activeReplays = new Map();           // replayId -> replay state
              this.replayQueue = new Map();             // queued replay operations

              this.initializeReplay();
          }

          getOrigin() {
              // Check for background context FIRST using API availability
              if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest) {
                  try {
                      // Background has tabs API but content scripts don't
                      if (browser.tabs && browser.tabs.query) {
                          return "background";
                      }
                  } catch(e) {}
              }
              
              // Then check for specific component markers
              if (window.__vibeReaderProxyController) return "proxy";
              if (window.__vibeReaderStealthExtractor) return "extractor";
              if (window.location?.href?.includes("popup.html")) return "popup";
              
              // Fallback for Node.js style background (shouldn't happen in Firefox)
              if (typeof window === "undefined") return "background";
              
              return "unknown";
          }

          initializeReplay() {
              // Setup replayable events
              this.setupReplayableEvents();

              // Start cleanup timer
              this.cleanupTimer = setInterval(() => {
                  this.cleanupOldHistory();
              }, this.retentionPeriod / 24); // Cleanup every hour

              // Setup replay queue processor
              this.queueProcessor = setInterval(() => {
                  this.processReplayQueue();
              }, 1000); // Process queue every second

              console.log(`🎬 CrossContextReplay initialized in ${this.origin} context`);
          }

          setupReplayableEvents() {
              // Define events that are safe and useful to replay
              this.replayableEvents = new Set([
                  'content-extracted',
                  'media-discovered',
                  'user-command',
                  'settings-changed',
                  'theme-updated',
                  'extraction-progress',
                  'pipeline-step-complete',
                  'terminal-log',
                  'display-content',
                  'structure-analyzed',
                  'content-updated',
                  'session-state-changed'
              ]);
          }

          // Pre-processing - determine if event should be recorded
          async process(eventContext) {
              const { event, data, context } = eventContext;

              // Mark for recording if it's replayable
              if (this.isReplayable(event, context)) {
                  eventContext.context.recordForReplay = true;
                  eventContext.context.replayTimestamp = Date.now();
              }

              return true;
          }

          // Post-processing - record successful events for replay
          async postProcess(eventContext, results) {
              const { event, data, context } = eventContext;

              if (context.recordForReplay && this.shouldRecord(eventContext, results)) {
                  this.recordEvent(eventContext, results);
              }

              return results;
          }

          isReplayable(event, context) {
              // Check if event type is replayable
              if (!this.replayableEvents.has(event)) {
                  return false;
              }

              // Don't record replay events themselves to avoid loops
              if (context.isReplay) {
                  return false;
              }

              // Don't record system/internal events
              if (event.startsWith('system-') || event.startsWith('internal-')) {
                  return false;
              }

              return true;
          }

          shouldRecord(eventContext, results) {
              const { context } = eventContext;

              // Only record successful events by default
              if (results.responses && results.responses.length === 0 && !context.recordFailures) {
                  return false;
              }

              // Don't record if explicitly disabled
              if (context.replayable === false) {
                  return false;
              }

              return true;
          }

          recordEvent(eventContext, results) {
              const { event, data, context } = eventContext;

              const eventRecord = {
                  id: this.generateEventId(),
                  event,
                  data: this.serializeEventData(data),
                  context: {
                      sessionId: context.sessionId,
                      sourceContext: context.sourceContext || this.origin,
                      targetContext: context.targetContext,
                      crossContext: context.crossContext || false,
                      timestamp: context.replayTimestamp,
                      duration: results.duration,
                      success: results.responses && results.responses.length > 0
                  },
                  results: {
                      responseCount: results.responses ? results.responses.length : 0,
                      success: results.responses && results.responses.length > 0
                  },
                  metadata: {
                      recordedAt: Date.now(),
                      recordedBy: this.origin,
                      size: JSON.stringify(data).length,
                      compressed: false
                  }
              };

              // Record by session if available
              if (context.sessionId) {
                  this.recordSessionEvent(context.sessionId, eventRecord);
              }

              // Record by context pair if cross-context
              if (context.crossContext && context.sourceContext) {
                  this.recordContextEvent(context.sourceContext, eventRecord);
              }

              // Update session metadata
              this.updateSessionMetadata(context.sessionId, eventRecord);
          }

          recordSessionEvent(sessionId, eventRecord) {
              if (!this.sessionHistory.has(sessionId)) {
                  this.sessionHistory.set(sessionId, {
                      sessionId,
                      events: [],
                      totalEvents: 0,
                      startTime: Date.now(),
                      lastActivity: Date.now(),
                      compressed: false
                  });
              }

              const session = this.sessionHistory.get(sessionId);
              session.events.push(eventRecord);
              session.totalEvents++;
              session.lastActivity = Date.now();

              // Compress if needed
              if (session.events.length > this.compressionThreshold && !session.compressed) {
                  this.compressSessionHistory(sessionId);
              }

              // Trim if too large
              if (session.events.length > this.maxHistoryPerSession) {
                  session.events = session.events.slice(-this.maxHistoryPerSession);
              }
          }

          recordContextEvent(sourceContext, eventRecord) {
              const contextPair = `${sourceContext}->${this.origin}`;

              if (!this.contextHistory.has(contextPair)) {
                  this.contextHistory.set(contextPair, {
                      contextPair,
                      events: [],
                      totalEvents: 0,
                      firstEvent: Date.now(),
                      lastEvent: Date.now()
                  });
              }

              const contextEvents = this.contextHistory.get(contextPair);
              contextEvents.events.push({
                  event: eventRecord.event,
                  timestamp: eventRecord.context.timestamp,
                  success: eventRecord.results.success,
                  duration: eventRecord.context.duration,
                  size: eventRecord.metadata.size
              });
              contextEvents.totalEvents++;
              contextEvents.lastEvent = Date.now();

              // Trim if too large
              if (contextEvents.events.length > this.maxHistoryPerContext) {
                  contextEvents.events = contextEvents.events.slice(-this.maxHistoryPerContext);
              }
          }

          updateSessionMetadata(sessionId, eventRecord) {
              if (!sessionId) return;

              if (!this.sessionMetadata.has(sessionId)) {
                  this.sessionMetadata.set(sessionId, {
                      sessionId,
                      eventTypes: new Set(),
                      contexts: new Set(),
                      firstEvent: Date.now(),
                      lastEvent: Date.now(),
                      totalEvents: 0,
                      successfulEvents: 0,
                      failedEvents: 0,
                      averageDuration: 0,
                      totalDuration: 0
                  });
              }

              const metadata = this.sessionMetadata.get(sessionId);
              metadata.eventTypes.add(eventRecord.event);

              if (eventRecord.context.sourceContext) {
                  metadata.contexts.add(eventRecord.context.sourceContext);
              }
              if (eventRecord.context.targetContext) {
                  metadata.contexts.add(eventRecord.context.targetContext);
              }

              metadata.lastEvent = Date.now();
              metadata.totalEvents++;

              if (eventRecord.results.success) {
                  metadata.successfulEvents++;
              } else {
                  metadata.failedEvents++;
              }

              if (eventRecord.context.duration) {
                  metadata.totalDuration += eventRecord.context.duration;
                  metadata.averageDuration = metadata.totalDuration / metadata.totalEvents;
              }
          }

          compressSessionHistory(sessionId) {
              const session = this.sessionHistory.get(sessionId);
              if (!session || session.compressed) return;

              try {
                  // Simple compression: remove duplicate consecutive events of same type
                  const compressedEvents = [];
                  let lastEventType = null;
                  let duplicateCount = 0;

                  for (const event of session.events) {
                      if (event.event === lastEventType) {
                          duplicateCount++;
                          if (duplicateCount === 1) {
                              // Add a compression marker
                              compressedEvents.push({
                                  ...event,
                                  compressed: true,
                                  duplicateCount: 1
                              });
                          } else {
                              // Update the last compressed event
                              const lastCompressed = compressedEvents[compressedEvents.length - 1];
                              if (lastCompressed.compressed) {
                                  lastCompressed.duplicateCount = duplicateCount;
                              }
                          }
                      } else {
                          compressedEvents.push(event);
                          lastEventType = event.event;
                          duplicateCount = 0;
                      }
                  }

                  session.events = compressedEvents;
                  session.compressed = true;

                  console.log(`🗜️ Compressed session ${sessionId}: ${session.totalEvents} -> ${compressedEvents.length} events`);

              } catch (error) {
                  console.warn(`Failed to compress session ${sessionId}:`, error);
              }
          }

          // ===== REPLAY FUNCTIONALITY =====
          async replaySession(sessionId, options = {}) {
              const session = this.sessionHistory.get(sessionId);
              if (!session) {
                  throw new Error(`Session ${sessionId} not found`);
              }

              const replayId = this.generateReplayId();
              const replayOptions = {
                  targetContext: options.targetContext || 'all',
                  speed: options.speed || 1.0,          // 1.0 = real-time, 2.0 = 2x speed, etc.
                  startTime: options.startTime || 0,    // Start from specific time offset
                  endTime: options.endTime,             // End at specific time offset
                  eventFilter: options.eventFilter,     // Function to filter events
                  pauseOnErrors: options.pauseOnErrors || false,
                  dryRun: options.dryRun || false,      // Don't actually emit events
                  ...options
              };

              const replayState = {
                  replayId,
                  sessionId,
                  status: 'queued',
                  options: replayOptions,
                  progress: 0,
                  currentEventIndex: 0,
                  totalEvents: session.events.length,
                  startTime: Date.now(),
                  errors: [],
                  replayedEvents: []
              };

              this.activeReplays.set(replayId, replayState);
              this.queueReplay(replayId);

              console.log(`🎬 Queued replay ${replayId} for session ${sessionId} (${session.events.length} events)`);

              return {
                  replayId,
                  status: 'queued',
                  totalEvents: session.events.length,
                  options: replayOptions
              };
          }

          async replayContextPair(contextPair, options = {}) {
              const contextEvents = this.contextHistory.get(contextPair);
              if (!contextEvents) {
                  throw new Error(`Context pair ${contextPair} not found`);
              }

              // Create a temporary session for context replay
              const tempSessionId = `context-replay-${Date.now()}`;
              const tempSession = {
                  sessionId: tempSessionId,
                  events: contextEvents.events.map(event => ({
                      ...event,
                      id: this.generateEventId(),
                      data: {},
                      context: {
                          sessionId: tempSessionId,
                          crossContext: true,
                          timestamp: event.timestamp
                      },
                      metadata: {
                          recordedAt: event.timestamp,
                          recordedBy: this.origin,
                          size: event.size || 0
                      }
                  })),
                  totalEvents: contextEvents.events.length,
                  startTime: contextEvents.firstEvent,
                  lastActivity: contextEvents.lastEvent
              };

              this.sessionHistory.set(tempSessionId, tempSession);

              const result = await this.replaySession(tempSessionId, {
                  ...options,
                  targetContext: contextPair.split('->')[1] // Extract target context
              });

              return result;
          }

          queueReplay(replayId) {
              this.replayQueue.set(replayId, {
                  replayId,
                  queuedAt: Date.now()
              });
          }

          async processReplayQueue() {
              if (this.replayQueue.size === 0) return;

              // Process one replay at a time
              const [replayId] = this.replayQueue.keys();
              this.replayQueue.delete(replayId);

              try {
                  await this.executeReplay(replayId);
              } catch (error) {
                  console.error(`Replay ${replayId} failed:`, error);

                  const replayState = this.activeReplays.get(replayId);
                  if (replayState) {
                      replayState.status = 'failed';
                      replayState.error = error.message;
                  }
              }
          }

          async executeReplay(replayId) {
              const replayState = this.activeReplays.get(replayId);
              if (!replayState) return;

              replayState.status = 'running';

              const session = this.sessionHistory.get(replayState.sessionId);
              if (!session) {
                  throw new Error(`Session ${replayState.sessionId} not found for replay`);
              }

              console.log(`▶️ Starting replay ${replayId} (${session.events.length} events)`);

              const events = this.filterEventsForReplay(session.events, replayState.options);
              let replayStartTime = Date.now();
              let originalStartTime = events.length > 0 ? events[0].context.timestamp : Date.now();

              for (let i = 0; i < events.length; i++) {
                  if (replayState.status !== 'running') break; // Check for cancellation

                  const event = events[i];
                  replayState.currentEventIndex = i;
                  replayState.progress = (i / events.length) * 100;

                  try {
                      // Calculate timing for realistic replay
                      if (i > 0) {
                          const originalDelay = event.context.timestamp - events[i-1].context.timestamp;
                          const scaledDelay = originalDelay / replayState.options.speed;

                          if (scaledDelay > 0) {
                              await this.sleep(Math.min(scaledDelay, 5000)); // Cap at 5 seconds
                          }
                      }

                      // Replay the event
                      await this.replayEvent(event, replayState);

                      replayState.replayedEvents.push({
                          originalEvent: event.event,
                          replayedAt: Date.now(),
                          success: true
                      });

                  } catch (error) {
                      console.warn(`Error replaying event ${event.id}:`, error);

                      replayState.errors.push({
                          eventId: event.id,
                          event: event.event,
                          error: error.message,
                          timestamp: Date.now()
                      });

                      if (replayState.options.pauseOnErrors) {
                          replayState.status = 'paused';
                          break;
                      }
                  }
              }

              if (replayState.status === 'running') {
                  replayState.status = 'completed';
              }

              replayState.completedAt = Date.now();
              replayState.totalDuration = Date.now() - replayState.startTime;

              console.log(`✅ Replay ${replayId} ${replayState.status}: ${replayState.replayedEvents.length}/${events.length} events`);

              // Emit replay completion event
              if (window.__globalSubscriberManager) {
                  window.__globalSubscriberManager.emit('replay-completed', {
                      replayId,
                      status: replayState.status,
                      replayedEvents: replayState.replayedEvents.length,
                      totalEvents: events.length,
                      errors: replayState.errors.length,
                      duration: replayState.totalDuration
                  });
              }
          }

          filterEventsForReplay(events, options) {
              let filtered = events;

              // Apply time range filter
              if (options.startTime || options.endTime) {
                  const sessionStartTime = events.length > 0 ? events[0].context.timestamp : 0;
                  filtered = filtered.filter(event => {
                      const relativeTime = event.context.timestamp - sessionStartTime;
                      return (!options.startTime || relativeTime >= options.startTime) &&
                          (!options.endTime || relativeTime <= options.endTime);
                  });
              }

              // Apply custom event filter
              if (options.eventFilter && typeof options.eventFilter === 'function') {
                  filtered = filtered.filter(options.eventFilter);
              }

              return filtered;
          }

          async replayEvent(eventRecord, replayState) {
              if (replayState.options.dryRun) {
                    console.log(`🏃 DRY RUN: Would replay ${eventRecord.event}`);
                  return;
              }

              const replayContext = {
                  ...eventRecord.context,
                  isReplay: true,
                  replayId: replayState.replayId,
                  originalTimestamp: eventRecord.context.timestamp,
                  replayTimestamp: Date.now()
              };

              // Emit the replayed event
              if (window.__globalSubscriberManager) {
                  await window.__globalSubscriberManager.emit(
                      eventRecord.event,
                      this.deserializeEventData(eventRecord.data),
                      replayContext
                  );
              }
          }

          // ===== UTILITY METHODS =====
          serializeEventData(data) {
              try {
                  return JSON.parse(JSON.stringify(data)); // Deep copy
              } catch (error) {
                  return { __serialization_error: error.message };
              }
          }

          deserializeEventData(serializedData) {
              return serializedData;
          }

          generateEventId() {
              return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          }

          generateReplayId() {
              return `rpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          }

          sleep(ms) {
              return new Promise(resolve => setTimeout(resolve, ms));
          }

          cleanupOldHistory() {
              const cutoffTime = Date.now() - this.retentionPeriod;

              // Cleanup old sessions
              for (const [sessionId, session] of this.sessionHistory.entries()) {
                  if (session.lastActivity < cutoffTime) {
                      this.sessionHistory.delete(sessionId);
                      this.sessionMetadata.delete(sessionId);
                  }
              }

              // Cleanup old context history
              for (const [contextPair, contextEvents] of this.contextHistory.entries()) {
                  if (contextEvents.lastEvent < cutoffTime) {
                      this.contextHistory.delete(contextPair);
                  }
              }

              // Cleanup completed replays
              for (const [replayId, replayState] of this.activeReplays.entries()) {
                  if (replayState.completedAt && replayState.completedAt < cutoffTime) {
                      this.activeReplays.delete(replayId);
                  }
              }

              console.log(`🧹 Cleaned old replay history (${this.origin}): ${this.sessionHistory.size} sessions remaining`);
          }

          // ===== PUBLIC API =====
          getSessionHistory(sessionId) {
              const session = this.sessionHistory.get(sessionId);
              const metadata = this.sessionMetadata.get(sessionId);

              return session ? {
                  ...session,
                  metadata: metadata ? {
                      ...metadata,
                      eventTypes: Array.from(metadata.eventTypes),
                      contexts: Array.from(metadata.contexts)
                  } : null
              } : null;
          }

          getContextHistory(contextPair) {
              return this.contextHistory.get(contextPair) || null;
          }

          getAllSessions() {
              return Array.from(this.sessionHistory.keys());
          }

          getReplayStatus(replayId) {
              return this.activeReplays.get(replayId) || null;
          }

          getAllActiveReplays() {
              return Array.from(this.activeReplays.values());
          }

          async pauseReplay(replayId) {
              const replayState = this.activeReplays.get(replayId);
              if (replayState && replayState.status === 'running') {
                  replayState.status = 'paused';
                  return true;
              }
              return false;
          }

          async resumeReplay(replayId) {
              const replayState = this.activeReplays.get(replayId);
              if (replayState && replayState.status === 'paused') {
                  replayState.status = 'running';
                  this.queueReplay(replayId);
                  return true;
              }
              return false;
          }

          async cancelReplay(replayId) {
              const replayState = this.activeReplays.get(replayId);
              if (replayState) {
                  replayState.status = 'cancelled';
                  this.replayQueue.delete(replayId);
                  return true;
              }
              return false;
          }

          getReplayStats() {
              return {
                  origin: this.origin,
                  sessionsRecorded: this.sessionHistory.size,
                  contextPairsRecorded: this.contextHistory.size,
                  activeReplays: this.activeReplays.size,
                  queuedReplays: this.replayQueue.size,
                  replayableEventTypes: Array.from(this.replayableEvents),
                  totalEventsRecorded: Array.from(this.sessionHistory.values())
                      .reduce((sum, session) => sum + session.totalEvents, 0)
              };
          }
      }

        // ===== ADVANCED DEBUG MIDDLEWARE =====
class DebugMiddleware extends SubscriberMiddleware {
          constructor() {
              super('AdvancedDebug', 0.5); // Very high priority - runs early

              this.origin = this.detectOrigin();
              this.debugSettings = new Map();
              this.eventFilters = new Map();
              this.terminalRouting = new Map();
              this.debugSessionId = `debug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

              // Debug categories
              this.debugCategories = {
                  'events': 'EVENT_DEBUG',
                  'messaging': 'MESSAGE_DEBUG',
                  'injection': 'INJECTION_DEBUG',
                  'extraction': 'EXTRACTION_DEBUG',
                  'performance': 'PERFORMANCE_DEBUG',
                  'errors': 'ERROR_DEBUG',
                  'lifecycle': 'LIFECYCLE_DEBUG',
                  'storage': 'STORAGE_DEBUG',
                  'ui': 'UI_DEBUG',
                  'cross-context': 'CROSS_CONTEXT_DEBUG'
              };

              this.initializeDebugMiddleware();
          }

          detectOrigin() {
              if (typeof window === "undefined") return "background";
              if (window.__vibeReaderProxyController) return "proxy";
              if (window.__vibeReaderStealthExtractor) return "extractor";
              if (window.location?.href?.includes("popup.html")) return "popup";
              return "unknown";
          }

          async initializeDebugMiddleware() {
              // Load debug settings from storage
              await this.loadDebugSettings();

              // Setup storage listeners
              this.setupStorageListeners();

              // Setup debug routing
              this.setupDebugRouting();

              // Periodic refresh of settings
              setInterval(() => {
                  this.loadDebugSettings();
              }, 30000); // Every 30 seconds

                console.log(`🐛 Advanced Debug Middleware initialized in ${this.origin} context`);
          }

          async loadDebugSettings() {
              try {
                  if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
                      const settings = await browser.storage.sync.get([
                          'vibeDebugEnabled',
                          'vibeDebugCategories',
                          'vibeDebugEventFilter',
                          'vibeDebugPerformance',
                          'vibeDebugVerbosity',
                          'vibeDebugContexts',
                          'vibeDebugAutoRoute',
                          'vibeDebugStorage'
                      ]);

                      // Update debug settings
                      this.debugSettings.set('enabled', settings.vibeDebugEnabled || false);
                      this.debugSettings.set('categories', settings.vibeDebugCategories || ['events', 'errors']);
                      this.debugSettings.set('eventFilter', settings.vibeDebugEventFilter || []);
                      this.debugSettings.set('performance', settings.vibeDebugPerformance || false);
                      this.debugSettings.set('verbosity', settings.vibeDebugVerbosity || 'normal');
                      this.debugSettings.set('contexts', settings.vibeDebugContexts || ['all']);
                      this.debugSettings.set('autoRoute', settings.vibeDebugAutoRoute !== false); // Default true
                      this.debugSettings.set('storageDebug', settings.vibeDebugStorage || false);

                      // Apply filters
                      this.applyDebugFilters();

                      console.log(`🔧 Debug settings loaded:`, Object.fromEntries(this.debugSettings));

                  } else {
                      // Fallback to localStorage
                      this.loadDebugSettingsFromLocal();
                  }
              } catch (error) {
                  console.warn('Failed to load debug settings:', error);
                  this.setDefaultDebugSettings();
              }
          }

          loadDebugSettingsFromLocal() {
              try {
                  const localSettings = JSON.parse(localStorage.getItem('vibeDebugSettings') || '{}');

                  this.debugSettings.set('enabled', localSettings.enabled || false);
                  this.debugSettings.set('categories', localSettings.categories || ['events', 'errors']);
                  this.debugSettings.set('eventFilter', localSettings.eventFilter || []);
                  this.debugSettings.set('performance', localSettings.performance || false);
                  this.debugSettings.set('verbosity', localSettings.verbosity || 'normal');
                  this.debugSettings.set('contexts', localSettings.contexts || ['all']);
                  this.debugSettings.set('autoRoute', localSettings.autoRoute !== false);

                  this.applyDebugFilters();

                  console.log('🔧 Debug settings loaded from localStorage');

              } catch (error) {
                  console.warn('Failed to load debug settings from localStorage:', error);
                  this.setDefaultDebugSettings();
              }
          }

          setDefaultDebugSettings() {
              this.debugSettings.set('enabled', false);
              this.debugSettings.set('categories', ['errors']);
              this.debugSettings.set('eventFilter', []);
              this.debugSettings.set('performance', false);
              this.debugSettings.set('verbosity', 'normal');
              this.debugSettings.set('contexts', ['all']);
              this.debugSettings.set('autoRoute', true);
          }

          applyDebugFilters() {
              const categories = this.debugSettings.get('categories') || [];
              const eventFilter = this.debugSettings.get('eventFilter') || [];

              // Build event filters based on categories
              this.eventFilters.clear();

              categories.forEach(category => {
                  switch (category) {
                      case 'events':
                          this.eventFilters.set('all-events', { route: true, category: 'EVENT_DEBUG' });
                          break;
                      case 'messaging':
                          this.eventFilters.set(/handle-|cross-context|message/i, { route: true, category: 'MESSAGE_DEBUG' });
                          break;
                      case 'injection':
                          this.eventFilters.set(/inject|script/i, { route: true, category: 'INJECTION_DEBUG' });
                          break;
                      case 'extraction':
                          this.eventFilters.set(/extract|content|media/i, { route: true, category: 'EXTRACTION_DEBUG' });
                          break;
                      case 'performance':
                          this.eventFilters.set(/performance|metric|timing/i, { route: true, category: 'PERFORMANCE_DEBUG' });
                          break;
                      case 'errors':
                          this.eventFilters.set(/error|failed|exception/i, { route: true, category: 'ERROR_DEBUG' });
                          break;
                      case 'lifecycle':
                          this.eventFilters.set(/init|destroy|cleanup|lifecycle/i, { route: true, category: 'LIFECYCLE_DEBUG' });
                          break;
                      case 'ui':
                          this.eventFilters.set(/ui-|display|theme|terminal/i, { route: true, category: 'UI_DEBUG' });
                          break;
                      case 'cross-context':
                          this.eventFilters.set(/cross-context|route|announcement/i, { route: true, category: 'CROSS_CONTEXT_DEBUG' });
                          break;
                  }
              });

              // Add specific event filters
              eventFilter.forEach(eventPattern => {
                  try {
                      const regex = new RegExp(eventPattern, 'i');
                      this.eventFilters.set(regex, { route: true, category: 'CUSTOM_DEBUG' });
                  } catch (error) {
                      // Exact match fallback
                      this.eventFilters.set(eventPattern, { route: true, category: 'CUSTOM_DEBUG' });
                  }
              });
          }

          setupStorageListeners() {
              if (typeof browser !== 'undefined' && browser.storage && browser.storage.onChanged) {
                  browser.storage.onChanged.addListener((changes, area) => {
                      if (area === 'sync') {
                          const debugKeys = Object.keys(changes).filter(key => key.startsWith('vibeDebug'));

                          if (debugKeys.length > 0) {
                              console.log('🔧 Debug settings changed:', debugKeys);
                              this.loadDebugSettings();

                              // Route storage debug event if enabled
                              if (this.debugSettings.get('storageDebug')) {
                                  this.routeToTerminal('STORAGE_DEBUG',
                                      `Debug settings updated: ${debugKeys.join(', ')}`,
                                      'storage-change'
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
                  case 'background':
                      // Background can route to all visible tabs
                      this.terminalRouting.set('method', 'broadcast-to-visible');
                      break;

                  case 'proxy':
                      // Proxy has direct terminal access
                      this.terminalRouting.set('method', 'direct-terminal');
                      break;

                  case 'extractor':
                  case 'popup':
                      // Send to proxy via cross-context
                      this.terminalRouting.set('method', 'cross-context');
                      this.terminalRouting.set('target', 'proxy');
                      break;

                  default:
                      this.terminalRouting.set('method', 'console-fallback');
              }
          }

          // Main middleware process method
          async process(eventContext) {
              const { event, data, context } = eventContext;

              // Check if debugging is enabled
              if (!this.debugSettings.get('enabled')) {
                  return true; // Continue processing
              }

              // Check if this context should be debugged
              const contexts = this.debugSettings.get('contexts');
              if (!contexts.includes('all') && !contexts.includes(this.origin)) {
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
                      routeInfo.priority
                  );
              }

              // Performance tracking if enabled
              if (this.debugSettings.get('performance')) {
                  this.trackPerformance(eventContext);
              }

              return true; // Always continue processing
          }

          shouldRouteEvent(event, data, context) {
              // Check auto-route setting
              if (!this.debugSettings.get('autoRoute')) {
                  return false;
              }

              // Check against filters
              for (const [pattern, config] of this.eventFilters.entries()) {
                  if (pattern === 'all-events') {
                      return config.route;
                  }

                  if (pattern instanceof RegExp) {
                      if (pattern.test(event)) {
                          return config.route;
                      }
                  } else if (typeof pattern === 'string') {
                      if (event.includes(pattern)) {
                          return config.route;
                      }
                  }
              }

              return false;
          }

          getRouteInfo(event) {
              for (const [pattern, config] of this.eventFilters.entries()) {
                  if (pattern === 'all-events' ||
                      (pattern instanceof RegExp && pattern.test(event)) ||
                      (typeof pattern === 'string' && event.includes(pattern))) {
                      return {
                          category: config.category,
                          priority: config.priority || 'normal'
                      };
                  }
              }

              return { category: 'DEBUG', priority: 'normal' };
          }

          formatDebugMessage(event, data, context) {
              const verbosity = this.debugSettings.get('verbosity');
              const timestamp = new Date().toISOString();

              let message = `[${this.origin.toUpperCase()}] ${event}`;

              if (verbosity === 'verbose') {
                  // Include data and context details
                  const dataStr = this.safeStringify(data);
                  const contextStr = this.safeStringify(context);

                  message += `\n  Data: ${dataStr}`;
                  message += `\n  Context: ${contextStr}`;
                  message += `\n  Session: ${this.debugSessionId}`;
                  message += `\n  Time: ${timestamp}`;
              } else if (verbosity === 'detailed') {
                  // Include limited data
                  message += ` | Data: ${this.safeStringify(data, 100)}`;
                  message += ` | Time: ${timestamp.split('T')[1].split('.')[0]}`;
              }

              return message;
          }

          safeStringify(obj, maxLength = 500) {
              try {
                  let str = JSON.stringify(obj, (key, value) => {
                      // Filter out functions and complex objects
                      if (typeof value === 'function') return '[Function]';
                      if (value instanceof Element) return '[DOM Element]';
                      if (value instanceof Window) return '[Window]';
                      return value;
                  });

                  if (maxLength && str.length > maxLength) {
                      str = str.substring(0, maxLength) + '...';
                  }

                  return str;
              } catch (error) {
                  return `[Stringify Error: ${error.message}]`;
              }
          }

          async routeToTerminal(category, message, eventType, priority = 'normal') {
              const routingMethod = this.terminalRouting.get('method');

              try {
                  switch (routingMethod) {
                      case 'direct-terminal':
                          await this.routeDirectToTerminal(category, message, eventType, priority);
                          break;

                      case 'cross-context':
                          await this.routeCrossContext(category, message, eventType, priority);
                          break;

                      case 'broadcast-to-visible':
                          await this.routeBroadcastToVisible(category, message, eventType, priority);
                          break;

                      case 'console-fallback':
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
                  const level = priority === 'high' ? 'warn' : 'debug';
                  window.__smartTerminal.displayLog(level, message, category, 'debug-middleware');
              } else if (window.__localEventBus) {
                  // Fallback to local event bus
                  window.__localEventBus.emitLocal('debug-terminal-log', {
                      level: 'debug',
                      message,
                      category,
                      source: 'debug-middleware'
                  });
              }
          }

          async routeCrossContext(category, message, eventType, priority) {
              // Send to proxy via cross-context bridge
              if (window.__crossContextBridge) {
                  await window.__crossContextBridge.sendToProxy('logFromBackground', {
                      level: priority === 'high' ? 'warn' : 'debug',
                      message,
                      category,
                      source: `debug-${this.origin}`
                  });
              }
          }

          async routeBroadcastToVisible(category, message, eventType, priority) {
              // Background broadcasting to all visible tabs
              if (window.__enhancedOrchestrator) {
                  const visibleTabs = Array.from(window.__enhancedOrchestrator.smartTabs.values())
                      .filter(tab => tab.type === 'visible');

                  for (const tab of visibleTabs) {
                      try {
                          await tab.sendMessage('logFromBackground', {
                              level: priority === 'high' ? 'warn' : 'debug',
                              message,
                              category,
                              source: 'debug-background'
                          });
                      } catch (error) {
                          // Continue with other tabs
                      }
                  }
              }
          }

          routeToConsole(category, message, eventType, priority) {
              const logMethod = priority === 'high' ? console.warn : console.log;
              logMethod(`[${category}] ${message}`);
          }

          trackPerformance(eventContext) {
              const { event, context } = eventContext;

              if (!context.startTime) {
                  context.startTime = Date.now();
                  return;
              }

              const duration = Date.now() - context.startTime;

              if (duration > 100) { // Log slow events
                  this.routeToTerminal(
                      'PERFORMANCE_DEBUG',
                      `Slow event: ${event} took ${duration}ms`,
                      'performance-warning',
                      'high'
                  );
              }
          }

          // Public API for manual debug routing
          debugEvent(event, data, options = {}) {
              if (this.debugSettings.get('enabled')) {
                  this.routeToTerminal(
                      options.category || 'MANUAL_DEBUG',
                      this.formatDebugMessage(event, data, options),
                      event,
                      options.priority || 'normal'
                  );
              }
          }

          // Configuration methods
          async enableDebug(categories = ['events', 'errors']) {
              await this.updateDebugSettings({
                  vibeDebugEnabled: true,
                  vibeDebugCategories: categories
              });
          }

          async disableDebug() {
              await this.updateDebugSettings({
                  vibeDebugEnabled: false
              });
          }

          async updateDebugSettings(updates) {
              try {
                  if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
                      await browser.storage.sync.set(updates);
                  } else {
                      // Fallback to localStorage
                      const current = JSON.parse(localStorage.getItem('vibeDebugSettings') || '{}');
                      const updated = { ...current, ...updates };
                      localStorage.setItem('vibeDebugSettings', JSON.stringify(updated));
                      this.loadDebugSettingsFromLocal();
                  }
              } catch (error) {
                  console.error('Failed to update debug settings:', error);
              }
          }

          // Status and monitoring
          getDebugStatus() {
              return {
                  enabled: this.debugSettings.get('enabled'),
                  origin: this.origin,
                  settings: Object.fromEntries(this.debugSettings),
                  filters: this.eventFilters.size,
                  routing: Object.fromEntries(this.terminalRouting),
                  sessionId: this.debugSessionId
              };
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

        // Add default global middlewares
        this.crossContextMiddleware = new CrossContextRoutingMiddleware();
        this.terminalMiddleware = new TerminalIntegrationMiddleware();
        this.batchingMiddleware = new BatchingMiddleware();
        this.memoryMiddleware = new MemoryManagementMiddleware();
        this.crossContextSerializationMiddleware= new CrossContextSerializationMiddleware();
                this.rateLimitMiddleware = new RateLimitMiddleware();
                this.crossContextMetricsMiddleware = new CrossContextMetricsMiddleware();
                this.crossContextReplayMiddleware = new CrossContextReplayMiddleware();
        this.debugMiddleware = new DebugMiddleware();

                // Add middlewares in priority order
                this.addGlobalMiddleware(this.debugMiddleware);
        this.addGlobalMiddleware(this.crossContextMiddleware);
        this.addGlobalMiddleware(this.memoryMiddleware);
                this.addGlobalMiddleware(this.crossContextSerializationMiddleware);
                this.addGlobalMiddleware(this.rateLimitMiddleware);
                this.addGlobalMiddleware(this.batchingMiddleware);
                this.addGlobalMiddleware(this.terminalMiddleware);
                this.addGlobalMiddleware(this.crossContextMetricsMiddleware);
                this.addGlobalMiddleware(this.crossContextReplayMiddleware);

        if (typeof unified !== "undefined" && window.__vibeUnified) {
          this.contentTransformer = window.__vibeUnified.ContentTransformer;
          this.pipelineProcessor = new window.__vibeUnified.PipelineProcessor;
        }

        // Setup context info responder
        this.setupContextInfoResponder();

                console.log(`🎯 SubscriberManager initialized in ${this.origin} context`);
      }

      getOrigin() {
        // Check for background context FIRST using API availability
        if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest) {
            try {
                // Background has tabs API but content scripts don't
                if (browser.tabs && browser.tabs.query) {
                    return "background";
                }
            } catch(e) {}
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
                    (a, b) => (b.preferences.priority || 0) - (a.preferences.priority || 0),
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
                        if (subscriber.state === "disabled" && subscriber.lastActivity < cutoffTime) {
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
                        stats.byState[subscriber.state] = (stats.byState[subscriber.state] || 0) + 1;

            if (subscriber.isQuarantined) {
              stats.quarantined++;
            }

                        stats.byEventType[eventType].subscribers.push(subscriber.getStats());
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
                transforms.forEach((transform) => this.pipelineProcessor.use(transform));

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
                    serialization: this.crossContextSerializationMiddleware?.getSerializationStats(),
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

            subscribeWithTransforms(eventType, callback, transforms = [], options = {}) {
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

                return await this.subscriberManager.emit(eventType, data, enhancedContext);
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
                return this.subscriberManager ? this.subscriberManager.getSubscriberStats() : {};
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

      // Middleware exports
            StateValidationMiddleware,
            RateLimitMiddleware,
            EventFilterMiddleware,
            TransformationMiddleware,
        ErrorRecoveryAndDeliveryMiddleware,
      CrossContextRoutingMiddleware,
            CrossContextSerializationMiddleware,
      TerminalIntegrationMiddleware,
      BatchingMiddleware,
            MemoryManagementMiddleware,
            CrossContextMetricsMiddleware,
            CrossContextReplayMiddleware,
            DebugMiddleware
    };

    window.VibeSubscriber = VibeSubscriber;
    window.SubscriberManager = window.__globalSubscriberManager;
    window.SubscriberEnabledComponent = SubscriberEnabledComponent;
        window.SubscriberMiddleware = SubscriberMiddleware;

    console.log("✅ VibeSubscribe v2.5 loaded with cross-context routing");
    console.log(`📡 Global manager at window.__globalSubscriberManager`);
        console.log(`🌐 Active in ${window.__globalSubscriberManager.origin} context`);

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