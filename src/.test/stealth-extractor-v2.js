// VibeReader v2.0 - Enhanced Stealth Content Extractor
// Modular extraction pipeline with DOMPurify integration

if (window.__vibeReaderStealthExtractor) {
  console.log("⚠️ StealthExtractor already exists, skipping");
} else {
  try {
    // Get bypass symbol from utils if available
    const BYPASS_LOGGING =
      window.__vibeReaderUtils?.BYPASS_LOGGING || Symbol("bypass");

    class StealthExtractor {
      constructor() {
        this.broker = new MessageBroker();
        this.progressEmitter = new ThrottledEmitter(this.broker, 100);
        this.extractionPipeline = [];
        this.defaultPipeline = [];
        this.mediaStats = { images: 0, videos: 0, iframes: 0, tables: 0 };
        this.extractionMetrics = {};
        this.frameworkDetected = null;

        // State management
        this.state = {
          extraction: "idle", // idle, running, complete, error
          lastExtraction: null,
          errorCount: 0,
          successCount: 0,
          history: [],
        };

        // Extraction state
        this.extractionInProgress = false;
        this.currentDocument = null;
        this.extractionId = null;

        // Logger integration
        if (window.VibeLogger) {
          this.logger = window.VibeLogger;
          this.setupLoggerIntegration();
        }

        // Setup middleware
        this.setupMiddleware();

        // Register message handlers
        this.broker.register("extractContent", (config) =>
          this.startExtraction(config)
        );
        this.broker.register("executeProxyCommand", (data) =>
          this.executeCommand(data)
        );
        this.broker.register("getExtractionMetrics", () => this.getMetrics());
        this.broker.register("getExtractionState", () => this.state);
        this.broker.register("configurePipeline", (config) =>
          this.configurePipeline(config)
        );

        this.init();
      }

      init() {
        console.log("🕵️ Enhanced StealthExtractor initializing");

        this.detectFramework();
        this.setupExtractionPipeline();

        this.progressEmitter.emit("extractionProgress", {
          status: "initialized",
          progress: 0,
          framework: this.frameworkDetected,
        });

        console.log("✅ StealthExtractor ready");
      }

      setupMiddleware() {
        // Command validation middleware
        this.broker.use(async (request, sender) => {
          if (request.action === "executeProxyCommand") {
            const validCommands = ["scroll", "click", "getState", "reextract"];
            if (!request.command || !validCommands.includes(request.command)) {
              console.error("Invalid command:", request.command);
              return false; // Block invalid commands
            }
          }
          return true;
        });

        // Rate limiting middleware for extraction
        let lastExtractionTime = 0;
        this.broker.use(async (request, sender) => {
          if (request.action === "extractContent") {
            const now = Date.now();
            if (now - lastExtractionTime < 1000) {
              console.warn("Extraction throttled");
              return false;
            }
            lastExtractionTime = now;
          }
          return true;
        });
      }

      setupLoggerIntegration() {
        this.logger.setTerminalHandler((category, level, message) => {
          this.logExtraction(category, level, message);
        });
      }

      logExtraction(category, level, message) {
        const categoryMap = {
          framework: "NETWORK",
          dompurify: "SYSTEM",
          readability: "SYSTEM",
          media: "MEDIA",
          error: "ERRORS",
          metrics: "SYSTEM",
          pipeline: "NETWORK",
        };

        const diagnosticCategory = categoryMap[category] || "SYSTEM";

        // Use bypass flag for terminal logging
        this.broker.send(null, "terminalLog", {
          [BYPASS_LOGGING]: true,
          level,
          message,
          category: diagnosticCategory,
          source: "extractor",
        });
      }

      detectFramework() {
        const detectors = [
          {
            name: "react",
            check: () =>
              window.React ||
              document.querySelector("[data-reactroot], #root, #__next"),
          },
          {
            name: "vue",
            check: () =>
              window.Vue ||
              document.querySelector("#app[data-v-], [data-server-rendered]"),
          },
          {
            name: "angular",
            check: () =>
              window.angular ||
              document.querySelector("[ng-app], [ng-version]"),
          },
          {
            name: "svelte",
            check: () => document.querySelector("[data-svelte]"),
          },
          { name: "nextjs", check: () => document.querySelector("#__next") },
        ];

        for (const detector of detectors) {
          if (detector.check()) {
            this.frameworkDetected = detector.name;
            break;
          }
        }

        this.frameworkDetected = this.frameworkDetected || "vanilla";
        console.log("🔍 Framework detected:", this.frameworkDetected);

        if (this.logger) {
          this.logExtraction(
            "framework",
            "INFO",
            `Framework detected: ${this.frameworkDetected}`
          );
        }
      }

      setupExtractionPipeline() {
        this.defaultPipeline = [
          this.waitForFramework.bind(this),
          this.preprocessDocument.bind(this),
          this.extractWithReadability.bind(this),
          this.postProcessContent.bind(this),
          this.calculateMetrics.bind(this),
        ];

        this.extractionPipeline = [...this.defaultPipeline];
      }

      configurePipeline(config) {
        // Dynamic pipeline configuration
        this.extractionPipeline = [...this.defaultPipeline];

        if (config.skipFrameworkWait) {
          this.extractionPipeline = this.extractionPipeline.filter(
            (step) => step !== this.waitForFramework
          );
        }

        if (config.customExtractor) {
          const readabilityIndex = this.extractionPipeline.findIndex(
            (step) => step.name === "extractWithReadability"
          );
          if (readabilityIndex !== -1) {
            this.extractionPipeline.splice(
              readabilityIndex + 1,
              0,
              config.customExtractor.bind(this)
            );
          }
        }

        if (config.additionalSteps) {
          config.additionalSteps.forEach((step) => {
            this.extractionPipeline.push(step.bind(this));
          });
        }

        console.log(
          "📊 Pipeline configured:",
          this.extractionPipeline.map((s) => s.name)
        );
        return {
          success: true,
          pipeline: this.extractionPipeline.map((s) => s.name),
        };
      }

      async startExtraction(config = {}) {
        if (this.extractionInProgress) {
          console.warn("⚠️ Extraction already in progress");
          return { success: false, error: "Extraction in progress" };
        }

        const startTime = performance.now();
        this.extractionInProgress = true;
        this.extractionId = `extraction-${Date.now()}`;
        this.extractionMetrics = { startTime, id: this.extractionId };

        // Update state
        this.state.extraction = "running";
        this.state.lastExtraction = Date.now();

        // Log start in VibeLogger
        if (this.logger) {
          this.logger.logMessage(
            "send",
            "extraction-start",
            {
              id: this.extractionId,
              config,
            },
            { source: "extractor" }
          );
        }

        try {
          console.log("🚀 Starting enhanced extraction:", config);

          let result = {
            config,
            document: document,
            content: null,
            metadata: {},
            metrics: {},
          };

          // Run through pipeline
          let progress = 0;
          const progressStep = 100 / this.extractionPipeline.length;

          for (const [index, step] of this.extractionPipeline.entries()) {
            const stepName = step.name || `Step ${index + 1}`;
            console.log(`📊 Pipeline: ${stepName}`);

            result = await step(result);
            progress += progressStep;

            // Use throttled emitter
            this.progressEmitter.emit("extractionProgress", {
              status: stepName,
              progress: Math.min(progress, 90),
            });
          }

          // Final preparation
          const finalContent = this.prepareFinalOutput(result);

          // Send completion
          this.progressEmitter.flush(); // Ensure last updates sent
          this.broker.send(null, "extractionProgress", {
            status: "complete",
            progress: 100,
          });

          this.broker.send(null, "contentExtracted", finalContent);

          // Update metrics
          this.extractionMetrics.endTime = performance.now();
          this.extractionMetrics.duration =
            this.extractionMetrics.endTime - startTime;

          // Collect VibeLogger metrics
          if (this.logger) {
            const logMetrics = this.logger.messageLog
              .filter(
                (entry) =>
                  entry.context.source === "extractor" &&
                  entry.timestamp >= startTime
              )
              .reduce(
                (acc, entry) => {
                  acc.messageCount++;
                  acc.totalTime += entry.performance.timing;
                  return acc;
                },
                { messageCount: 0, totalTime: 0 }
              );

            this.extractionMetrics.messaging = logMetrics;
          }

          // Update state
          this.state.extraction = "complete";
          this.state.successCount++;
          this.state.history.push({
            id: this.extractionId,
            timestamp: Date.now(),
            duration: this.extractionMetrics.duration,
            success: true,
          });

          // Trim history to last 10
          if (this.state.history.length > 10) {
            this.state.history = this.state.history.slice(-10);
          }

          console.log(
            `✅ Extraction complete in ${this.extractionMetrics.duration.toFixed(
              1
            )}ms`
          );

          return { success: true, metrics: this.extractionMetrics };
        } catch (error) {
          console.error("❌ Extraction failed:", error);

          // Properly serialize the error
          const serializedError = window.MessageSerializer
            ? MessageSerializer.serialize(error)
            : { message: error.message, stack: error.stack };

          this.progressEmitter.flush();
          this.broker.send(null, "extractionProgress", {
            status: "error",
            progress: 0,
            error: serializedError,
          });

          // Update state
          this.state.extraction = "error";
          this.state.errorCount++;
          this.state.history.push({
            id: this.extractionId,
            timestamp: Date.now(),
            duration: performance.now() - startTime,
            success: false,
            error: error.message,
          });

          return { success: false, error: error.message };
        } finally {
          this.extractionInProgress = false;
          DOMPurify.removeAllHooks(); // Clean up any hooks
        }
      }

      async waitForFramework(result) {
        const { config } = result;

        if (!config.waitForFramework) {
          return result;
        }

        const waitTimes = {
          react: 800,
          nextjs: 1000,
          vue: 600,
          angular: 1000,
          svelte: 500,
          vanilla: 300,
        };

        const maxWait = waitTimes[this.frameworkDetected] || 500;
        const startTime = Date.now();

        console.log(
          `⏳ Waiting for ${this.frameworkDetected} (max ${maxWait}ms)`
        );

        await new Promise((resolve) => {
          const checkReady = () => {
            const isReady = this.isFrameworkReady();
            const elapsed = Date.now() - startTime;

            if (isReady || elapsed > maxWait) {
              console.log(`✅ Framework ready after ${elapsed}ms`);
              this.extractionMetrics.frameworkWait = elapsed;
              resolve();
            } else {
              requestAnimationFrame(checkReady);
            }
          };

          checkReady();
        });

        return result;
      }

      isFrameworkReady() {
        switch (this.frameworkDetected) {
          case "react":
          case "nextjs": {
            const root = document.querySelector(
              "[data-reactroot], #root, #__next"
            );
            return root && root.children.length > 0;
          }
          case "vue": {
            const app = document.querySelector("#app");
            return (
              app && (app.hasAttribute("data-v-") || app.children.length > 0)
            );
          }
          case "angular":
            return document.querySelector("[ng-version]") !== null;
          default:
            return document.body.children.length > 0;
        }
      }

      async preprocessDocument(result) {
        console.log("🧹 Preprocessing document with DOMPurify");

        try {
          const documentClone = document.cloneNode(true);
          this.mediaStats = { images: 0, videos: 0, iframes: 0, tables: 0 };

          // Setup preprocessing hooks
          this.setupPreprocessingHooks();

          // Get framework-specific config
          const frameworkConfig = this.getFrameworkConfig();

          // Core sanitization config
          const purifyConfig = {
            WHOLE_DOCUMENT: true,
            RETURN_DOM: true,
            KEEP_CONTENT: true,

            // Remove unwanted tags
            FORBID_TAGS: [
              "script",
              "style",
              "noscript",
              "aside",
              "nav",
              "footer",
              "header",
            ],

            // Remove event handlers
            FORBID_ATTR: [
              "onclick",
              "onload",
              "onerror",
              "onmouseover",
              "onfocus",
              "onblur",
              "onchange",
              "onsubmit",
              "onkeydown",
              "onkeyup",
              "onkeypress",
            ],

            // Preserve useful classes
            KEEP_CLASSES: true,

            // Merge framework config
            ...frameworkConfig,
          };

          // Sanitize
          const cleanedDoc = DOMPurify.sanitize(documentClone, purifyConfig);

          // Store what was removed for debugging
          this.extractionMetrics.removed = DOMPurify.removed;

          result.processedDocument = cleanedDoc;
          result.mediaStats = { ...this.mediaStats };

          console.log("📊 Preprocessing stats:", this.mediaStats);

          return result;
        } catch (error) {
          DOMPurify.removeAllHooks(); // Clean up on error
          throw error;
        } finally {
          DOMPurify.removeAllHooks(); // Always clean up
        }
      }

      setupPreprocessingHooks() {
        // Element removal hook
        DOMPurify.addHook("uponSanitizeElement", (node, data) => {
          if (node.nodeType !== 1) return;

          const tagName = data.tagName;
          const className = node.className || "";
          const id = node.id || "";

          // Remove ads and unwanted content
          const removePatterns = [
            /\bad[\s\-_]/i,
            /advertisement/i,
            /sponsor/i,
            /cookie[\s\-_]?banner/i,
            /popup/i,
            /modal/i,
            /newsletter/i,
            /subscribe/i,
            /social[\s\-_]?share/i,
            /comments?[\s\-_]?section/i,
            /related[\s\-_]?posts?/i,
            /sidebar/i,
          ];

          if (removePatterns.some((p) => p.test(className) || p.test(id))) {
            node.remove();
            return;
          }

          // Keep headers/footers inside articles
          if (tagName === "header" || tagName === "footer") {
            if (!node.closest('article, main, [role="main"]')) {
              node.remove();
              return;
            }
          }

          // Count media elements
          switch (tagName) {
            case "img":
              this.mediaStats.images++;
              break;
            case "video":
              this.mediaStats.videos++;
              break;
            case "iframe":
              // Only count video embeds
              const src = node.src || "";
              if (src.match(/youtube|vimeo|dailymotion/i)) {
                this.mediaStats.iframes++;
              } else {
                node.remove();
              }
              break;
            case "table":
              this.mediaStats.tables++;
              break;
          }
        });

        // Attribute processing hook
        DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
          // Handle lazy-loaded images
          if (node.tagName === "IMG") {
            this.processLazyImage(node);
          }

          // Remove javascript: URLs
          if (
            (data.attrName === "href" || data.attrName === "src") &&
            data.attrValue &&
            data.attrValue.startsWith("javascript:")
          ) {
            data.forceRemoveAttr = true;
          }

          // Fix relative URLs
          if (
            (data.attrName === "href" || data.attrName === "src") &&
            data.attrValue &&
            !data.attrValue.match(/^(https?:|data:|#)/)
          ) {
            try {
              data.attrValue = new URL(
                data.attrValue,
                window.location.href
              ).href;
            } catch (e) {
              // Invalid URL, will be handled by DOMPurify
            }
          }
        });

        // Post-attribute hook
        DOMPurify.addHook("afterSanitizeAttributes", (node) => {
          if (node.nodeType !== 1) return;

          // Reveal hidden content
          if (node.hasAttribute("hidden")) {
            node.removeAttribute("hidden");
          }

          if (node.style) {
            if (
              node.style.display === "none" ||
              node.style.visibility === "hidden"
            ) {
              const text = node.textContent || "";
              // Only reveal if likely content
              if (
                text.length > 50 &&
                !text.match(/cookie|advertisement|subscribe/i)
              ) {
                node.style.display = "";
                node.style.visibility = "";
              }
            }
          }

          // Ensure proper table structure
          if (node.tagName === "TABLE" && !node.querySelector("tbody")) {
            const tbody = document.createElement("tbody");
            node.querySelectorAll("tr").forEach((tr) => tbody.appendChild(tr));
            node.appendChild(tbody);
          }
        });

        // After all elements processed, report media stats
        DOMPurify.addHook("afterSanitizeElements", () => {
          if (this.mediaStats.images > 0 || this.mediaStats.videos > 0) {
            // Use bypass flag to prevent logging recursion
            this.broker.send(null, "terminalLog", {
              [BYPASS_LOGGING]: true,
              action: "mediaStats",
              level: "INFO",
              message: `Found ${this.mediaStats.images} images, ${this.mediaStats.videos} videos, ${this.mediaStats.iframes} iframes, ${this.mediaStats.tables} tables`,
              category: "MEDIA",
              source: "extractor",
            });
          }
        });
      }

      processLazyImage(img) {
        const lazyAttrs = [
          "data-src",
          "data-lazy-src",
          "data-original",
          "data-delayed-src",
          "data-hi-res-src",
          "data-srcset",
          "data-lazy",
          "data-lazyload",
          "data-image",
        ];

        for (const attr of lazyAttrs) {
          const value = img.getAttribute(attr);
          if (value && value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
            img.setAttribute("src", value);

            // Handle srcset
            const srcset =
              img.getAttribute("data-srcset") ||
              img.getAttribute("data-lazy-srcset");
            if (srcset) {
              img.setAttribute("srcset", srcset);
            }

            // Add loading attribute for performance
            img.setAttribute("loading", "lazy");
            break;
          }
        }
      }

      getFrameworkConfig() {
        const configs = {
          react: {
            ALLOWED_ATTR: ["data-reactroot", "data-react-*"],
            CUSTOM_ELEMENT_HANDLING: {
              tagNameCheck: /^[a-z]+-[a-z]+$/,
              attributeNameCheck: /^(data-|aria-)/,
              allowCustomizedBuiltInElements: true,
            },
          },
          vue: {
            ALLOWED_ATTR: ["v-*", ":*", "@*", "data-v-*"],
            ADD_TAGS: ["transition", "transition-group"],
          },
          angular: {
            ALLOWED_ATTR: ["ng-*", "[*]", "(*)", "*ngFor", "*ngIf"],
            SANITIZE_DOM: false,
          },
          nextjs: {
            ALLOWED_ATTR: ["data-reactroot", "data-react-*"],
            ADD_TAGS: ["next-route-announcer"],
          },
        };

        return configs[this.frameworkDetected] || {};
      }

      async extractWithReadability(result) {
        try {
          if (typeof Readability === "undefined") {
            throw new Error("Readability.js not available");
          }

          console.log("📖 Starting Readability extraction");

          const reader = new Readability(result.processedDocument, {
            debug: false,
            maxElemsToParse: 0,
            nbTopCandidates: 5,
            charThreshold: 500,
            classesToPreserve: ["caption", "emoji", "code", "pre"],
            keepClasses: true,
          });

          const article = reader.parse();

          if (!article || !article.content) {
            // Fallback extraction
            console.warn("⚠️ Readability failed, trying fallback");
            article = this.fallbackExtraction(result.processedDocument);
          }

          if (!article || !article.content) {
            throw new Error("No readable content found");
          }

          result.article = article;
          result.content = article.content;
          result.metadata = {
            title: article.title || document.title,
            byline: article.byline,
            excerpt: article.excerpt,
            length: article.length,
            dir: article.dir,
            lang: article.lang,
            siteName: article.siteName || this.extractSiteName(),
          };

          console.log("✅ Content extracted:", {
            title: result.metadata.title,
            length: result.content.length,
          });

          return result;
        } catch (error) {
          console.error("❌ Readability extraction failed:", error);
          throw error;
        }
      }

      fallbackExtraction(doc) {
        console.log("🔄 Attempting fallback extraction");

        const selectors = [
          "main",
          "article",
          '[role="main"]',
          ".main-content",
          "#main-content",
          ".content",
          "#content",
          ".post-content",
          ".entry-content",
          ".article-content",
          ".story-body",
        ];

        let contentEl = null;
        let maxScore = 0;

        for (const selector of selectors) {
          const elements = doc.querySelectorAll(selector);
          elements.forEach((el) => {
            const score = this.scoreContentElement(el);
            if (score > maxScore) {
              maxScore = score;
              contentEl = el;
            }
          });
        }

        if (!contentEl) {
          // Find largest content block
          doc.querySelectorAll("div, section, article").forEach((el) => {
            const score = this.scoreContentElement(el);
            if (score > maxScore) {
              maxScore = score;
              contentEl = el;
            }
          });
        }

        if (contentEl && maxScore > 100) {
          const textContent = contentEl.textContent.trim();
          return {
            title: document.title || "Untitled",
            byline: this.extractByline(doc),
            content: contentEl.innerHTML,
            excerpt: textContent.substring(0, 300),
            length: textContent.split(/\s+/).length,
            siteName: this.extractSiteName(),
          };
        }

        return null;
      }

      scoreContentElement(el) {
        let score = 0;

        const text = el.textContent.trim();
        const words = text.split(/\s+/).length;

        // Basic scoring
        score += words; // Word count
        score += el.querySelectorAll("p").length * 5; // Paragraphs
        score += el.querySelectorAll("h1,h2,h3,h4,h5,h6").length * 3; // Headers
        score += el.querySelectorAll("li").length * 2; // List items

        // DOM depth bonus (content usually deeper)
        let depth = 0;
        let parent = el.parentElement;
        while (parent && depth < 10) {
          depth++;
          parent = parent.parentElement;
        }
        score += depth * 2;

        // Penalize elements near body (likely wrappers)
        if (el.parentElement === document.body) {
          score *= 0.5;
        }

        // Penalize likely non-content
        if (el.className.match(/sidebar|menu|nav|footer|header|comment/i)) {
          score *= 0.3;
        }
        if (el.id && el.id.match(/sidebar|menu|nav|footer|header|comment/i)) {
          score *= 0.3;
        }

        // Boost likely content
        if (el.tagName === "ARTICLE") score *= 2;
        if (el.tagName === "MAIN") score *= 1.5;
        if (el.getAttribute("role") === "main") score *= 1.5;

        // Consider text density
        const htmlLength = el.innerHTML.length;
        if (htmlLength > 0) {
          const textDensity = text.length / htmlLength;
          score *= 1 + textDensity; // Boost high text density
        }

        return score;
      }

      async postProcessContent(result) {
        console.log("🎨 Post-processing content");

        // Final sanitization for safety
        result.content = DOMPurify.sanitize(result.content, {
          ALLOWED_TAGS: [
            "p",
            "div",
            "span",
            "a",
            "img",
            "video",
            "audio",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
            "pre",
            "code",
            "em",
            "strong",
            "b",
            "i",
            "u",
            "ul",
            "ol",
            "li",
            "table",
            "thead",
            "tbody",
            "tr",
            "td",
            "th",
            "figure",
            "figcaption",
            "picture",
            "source",
            "br",
            "hr",
            "time",
            "mark",
            "section",
            "article",
          ],
          ALLOWED_ATTR: [
            "href",
            "src",
            "srcset",
            "alt",
            "title",
            "width",
            "height",
            "loading",
            "class",
            "id",
            "data-*",
            "rel",
            "target",
            "type",
            "media",
            "sizes",
            "datetime",
            "cite",
            "controls",
          ],
          ALLOW_DATA_ATTR: true,
          KEEP_CONTENT: true,
        });

        // Process any remaining structure
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = result.content;

        // Add cyber classes for styling
        tempDiv.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
          h.classList.add("cyber-heading");
        });

        tempDiv.querySelectorAll("a").forEach((link) => {
          link.classList.add("cyber-link");
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        });

        tempDiv.querySelectorAll("pre,code").forEach((code) => {
          code.classList.add("cyber-code");
        });

        tempDiv.querySelectorAll("table").forEach((table) => {
          table.classList.add("cyber-table");
        });

        result.content = tempDiv.innerHTML;

        return result;
      }

      async calculateMetrics(result) {
        console.log("📊 Calculating extraction metrics");

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = result.content;

        // Content metrics
        const textContent = tempDiv.textContent || "";
        const metrics = {
          // Readability score
          readabilityScore: this.calculateReadabilityScore(result),

          // Content stats
          wordCount: textContent.split(/\s+/).filter((w) => w.length > 0)
            .length,
          charCount: textContent.length,
          paragraphCount: tempDiv.querySelectorAll("p").length,
          sentenceCount: (textContent.match(/[.!?]+/g) || []).length,

          // Structure stats
          headingCount: tempDiv.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
          linkCount: tempDiv.querySelectorAll("a").length,
          listCount: tempDiv.querySelectorAll("ul,ol").length,

          // Media stats (from preprocessing)
          ...result.mediaStats,

          // Quality indicators
          avgSentenceLength: 0,
          avgWordLength: 0,
          textDensity: 0,
        };

        // Calculate averages
        if (metrics.sentenceCount > 0) {
          metrics.avgSentenceLength = metrics.wordCount / metrics.sentenceCount;
        }

        const words = textContent.split(/\s+/).filter((w) => w.length > 0);
        if (words.length > 0) {
          const totalWordLength = words.reduce(
            (sum, word) => sum + word.length,
            0
          );
          metrics.avgWordLength = totalWordLength / words.length;
        }

        if (result.content.length > 0) {
          metrics.textDensity = textContent.length / result.content.length;
        }

        // Store in result
        result.metrics = metrics;
        this.extractionMetrics = { ...this.extractionMetrics, ...metrics };

        console.log("📈 Metrics calculated:", metrics);

        // Log metrics to terminal
        if (this.logger) {
          this.logExtraction(
            "metrics",
            "INFO",
            `Extraction metrics: ${metrics.wordCount} words, readability: ${metrics.readabilityScore.grade}`
          );
        }

        return result;
      }

      calculateReadabilityScore(result) {
        const { content, metadata } = result;
        if (!content) return { score: 0, grade: "N/A" };

        const textContent = this.stripHTML(content);
        const sentences = (textContent.match(/[.!?]+/g) || []).length || 1;
        const words =
          textContent.split(/\s+/).filter((w) => w.length > 0).length || 1;
        const syllables = this.countSyllables(textContent);

        // Flesch Reading Ease
        const fleschScore =
          206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

        // Grade level
        let grade;
        if (fleschScore >= 90) grade = "Very Easy";
        else if (fleschScore >= 80) grade = "Easy";
        else if (fleschScore >= 70) grade = "Fairly Easy";
        else if (fleschScore >= 60) grade = "Standard";
        else if (fleschScore >= 50) grade = "Fairly Difficult";
        else if (fleschScore >= 30) grade = "Difficult";
        else grade = "Very Difficult";

        return {
          score: Math.max(0, Math.min(100, fleschScore)),
          grade,
          details: {
            sentences,
            words,
            syllables,
            avgWordsPerSentence: words / sentences,
            avgSyllablesPerWord: syllables / words,
          },
        };
      }

      countSyllables(text) {
        const words = text.toLowerCase().split(/\s+/);
        let totalSyllables = 0;

        words.forEach((word) => {
          word = word.replace(/[^a-z]/g, "");
          if (word.length <= 3) {
            totalSyllables += 1;
          } else {
            // Simple syllable counting
            const vowelGroups = word.match(/[aeiou]+/g) || [];
            totalSyllables += Math.max(1, vowelGroups.length);
          }
        });

        return totalSyllables;
      }

      stripHTML(html) {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return temp.textContent || "";
      }

      prepareFinalOutput(result) {
        const { content, metadata, metrics, mediaStats } = result;

        // Enhanced metadata
        const enhancedMetadata = {
          ...metadata,
          url: window.location.href,
          extractedAt: Date.now(),
          extractionId: this.extractionId,
          framework: this.frameworkDetected,
          metrics,
          mediaStats,
          readabilityScore: metrics.readabilityScore,
          performanceMetrics: {
            extractionDuration: this.extractionMetrics.duration,
            frameworkWait: this.extractionMetrics.frameworkWait,
            messaging: this.extractionMetrics.messaging,
          },
        };

        return {
          content,
          metadata: enhancedMetadata,
        };
      }

      extractByline(doc) {
        const selectors = [
          '[rel="author"]',
          ".author",
          ".byline",
          ".by-line",
          ".writer",
          'meta[name="author"]',
        ];

        for (const selector of selectors) {
          const el = (doc || document).querySelector(selector);
          if (el) {
            const content = el.textContent || el.getAttribute("content");
            if (content) return content.trim();
          }
        }

        return "";
      }

      extractSiteName() {
        const metaSelectors = [
          'meta[property="og:site_name"]',
          'meta[name="application-name"]',
          'meta[name="apple-mobile-web-app-title"]',
        ];

        for (const selector of metaSelectors) {
          const meta = document.querySelector(selector);
          if (meta) {
            const content = meta.getAttribute("content");
            if (content) return content;
          }
        }

        return window.location.hostname;
      }

      async executeCommand(data) {
        const { command, params } = data;

        try {
          switch (command) {
            case "scroll":
              window.scrollTo(0, params.scrollPosition);
              return { success: true };

            case "click": {
              const el = document.querySelector(params.selector);
              if (el) {
                el.click();
                return { success: true };
              }
              return { success: false, error: "Element not found" };
            }

            case "getState":
              return {
                success: true,
                state: {
                  scrollPosition: window.scrollY,
                  documentHeight: document.documentElement.scrollHeight,
                  viewportHeight: window.innerHeight,
                  url: window.location.href,
                  framework: this.frameworkDetected,
                  extractionState: this.state,
                },
              };

            case "reextract":
              return this.startExtraction(params.config);

            default:
              return { success: false, error: "Unknown command" };
          }
        } catch (error) {
          const serializedError = window.MessageSerializer
            ? MessageSerializer.serialize(error)
            : { message: error.message };
          return { success: false, error: serializedError };
        }
      }

      getMetrics() {
        return {
          extraction: this.extractionMetrics,
          media: this.mediaStats,
          framework: this.frameworkDetected,
          state: this.state,
        };
      }
    }

    // Create singleton instance
    window.__vibeReaderStealthExtractor = new StealthExtractor();

    true;
  } catch (error) {
    delete window.__vibeReaderStealthExtractor;
    throw error;
  }
}
