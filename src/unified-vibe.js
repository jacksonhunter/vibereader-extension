// VibeReader v2.0 - Unified Content Processing Pipeline
// Uses global UnifiedLib object loaded from unified-bundle.js

// Prevent multiple injections with simple guard
if (window.__vibeUnified) {
  console.log("VibeUnified already exists, skipping");
  false;
} else {
  try {
    try {
      detectVibeContext = window.detectVibeContext;
    } catch (e) {
      console.log(
        `WARNING: detectVibeContext is not available in context\n ${e}`,
      );
      detectVibeContext = () => "giving unknown vibes";
    }

    // Check that UnifiedLib is loaded
    if (typeof window.UnifiedLib === "undefined") {
      throw new Error(
        "UnifiedLib not loaded - unified-bundle.js must be loaded first",
      );
    }

    // Extract modules from global UnifiedLib
    const {
      unified,
      rehypeParse,
      rehypeStringify,
      rehypeFormat,
      rehypeRemark,
      remarkStringify,
      remarkGfm,
      visit,
      select,
      selectAll,
    } = window.UnifiedLib;

    // Plugin: Score content nodes
    function scoreContent() {
      return (tree, file) => {
        visit(tree, "element", (node) => {
          // Add scoring metadata to each node
          node.data = node.data || {};
          node.data.contentScore = calculateScore(node);

          // Mark segments
          if (node.data.contentScore > 100) {
            node.data.segment = "main";
          } else if (node.data.contentScore > 50) {
            node.data.segment = "secondary";
          }
        });
      };
    }

    // Plugin: Segment content into categories
    function segmentContent() {
      return (tree, file) => {
        const segments = {
          main: [],
          secondary: [],
          navigation: [],
          sidebar: [],
          metadata: [],
          comments: [],
        };

        // First pass: collect and classify nodes
        visit(tree, "element", (node, index, parent) => {
          const score = node.data?.contentScore || 0;
          const className = node.properties?.className?.join(" ") || "";
          const id = node.properties?.id || "";
          const tagName = node.tagName;

          // Skip if already processed
          if (node.data?.segmented) return;

          // Classify based on semantic indicators
          if (
            /nav|menu|breadcrumb/i.test(className + " " + id) ||
            tagName === "nav"
          ) {
            segments.navigation.push(node);
            node.data.segment = "navigation";
          } else if (
            /sidebar|aside|widget/i.test(className + " " + id) ||
            tagName === "aside"
          ) {
            segments.sidebar.push(node);
            node.data.segment = "sidebar";
          } else if (/comment|discuss|reply/i.test(className + " " + id)) {
            segments.comments.push(node);
            node.data.segment = "comments";
          } else if (
            /author|byline|dateline|publish|meta/i.test(className + " " + id)
          ) {
            segments.metadata.push(node);
            node.data.segment = "metadata";
          }
          // Score-based classification
          else if (score > 200) {
            segments.main.push(node);
            node.data.segment = "main";
          } else if (score > 50) {
            segments.secondary.push(node);
            node.data.segment = "secondary";
          }

          node.data.segmented = true;
        });

        // Second pass: group adjacent related content
        visit(tree, "element", (node, index, parent) => {
          if (!parent || !node.data?.segment) return;

          // Look for adjacent siblings with same segment type
          const siblings = parent.children || [];
          const currentSegment = node.data.segment;

          // Find consecutive nodes of the same segment type
          let groupStart = index;
          let groupEnd = index;

          // Look backwards
          while (
            groupStart > 0 &&
            siblings[groupStart - 1]?.data?.segment === currentSegment
          ) {
            groupStart--;
          }

          // Look forwards
          while (
            groupEnd < siblings.length - 1 &&
            siblings[groupEnd + 1]?.data?.segment === currentSegment
          ) {
            groupEnd++;
          }

          // Mark groups for potential wrapping
          if (groupEnd - groupStart > 0) {
            node.data.segmentGroup = {
              start: groupStart,
              end: groupEnd,
              type: currentSegment,
            };
          }
        });

        // Third pass: calculate relationships between segments
        const mainContent = segments.main[0];
        if (mainContent) {
          // Find related secondary content based on proximity
          segments.secondary.forEach((node) => {
            const distance = calculateNodeDistance(mainContent, node);
            node.data.relationToMain =
              distance < 3 ? "closely-related" : "distant";
          });

          // Identify potential "related articles" or "read more" sections
          segments.secondary.forEach((node) => {
            const text = getTextContent(node).toLowerCase();
            if (/related|more|also|similar/i.test(text)) {
              node.data.segment = "related";
              node.data.segmentSubtype = "related-content";
            }
          });
        }

        // Store segment summary in file data for downstream processing
        file.data = file.data || {};
        file.data.segments = {
          counts: {
            main: segments.main.length,
            secondary: segments.secondary.length,
            navigation: segments.navigation.length,
            sidebar: segments.sidebar.length,
            metadata: segments.metadata.length,
            comments: segments.comments.length,
          },
          mainContentScore: segments.main[0]?.data?.contentScore || 0,
          hasMultipleColumns:
            segments.sidebar.length > 0 && segments.main.length > 0,
          layout: detectLayout(segments),
        };

        // Add segment markers as data attributes for CSS styling
        visit(tree, "element", (node) => {
          if (node.data?.segment) {
            node.properties = node.properties || {};
            node.properties.dataVibeSegment = node.data.segment;

            // Add confidence score as attribute
            if (node.data.contentScore) {
              node.properties.dataVibeScore = Math.round(
                node.data.contentScore,
              );
            }
          }
        });

        return tree;
      };
    }

    // Helper: Calculate content score for a node
    function calculateScore(node) {
      let score = 0;

      // Tag-based scoring
      const tagScores = {
        article: 50,
        main: 40,
        section: 20,
        div: 5,
        p: 10,
        h1: 15,
        h2: 12,
        h3: 10,
        nav: -20,
        aside: -10,
        footer: -30,
        header: -10,
      };

      score += tagScores[node.tagName] || 0;

      // Class/ID scoring
      const className = node.properties?.className?.join(" ") || "";
      const id = node.properties?.id || "";
      const combined = className + " " + id;

      // Positive indicators
      if (/article|content|main|post|text|body|entry/i.test(combined))
        score += 25;
      if (/story|para|description/i.test(combined)) score += 15;

      // Negative indicators
      if (
        /comment|sidebar|footer|header|nav|menu|related|share|social/i.test(
          combined,
        )
      )
        score -= 25;
      if (/ad|banner|sponsor|widget/i.test(combined)) score -= 30;

      // Text content scoring
      const textLength = getTextContent(node).length;
      if (textLength > 500) score += 20;
      if (textLength > 1000) score += 30;
      if (textLength < 50) score -= 10;

      // Link density penalty
      const links = countElements(node, "a");
      const words = textLength / 5; // Rough word count
      const linkDensity = links / (words || 1);
      if (linkDensity > 0.3) score -= 20;

      return Math.max(0, score);
    }

    // Helper: Count specific elements within a node
    function countElements(node, tagName) {
      let count = 0;
      visit(node, "element", (child) => {
        if (child.tagName === tagName) count++;
      });
      return count;
    }

    // Helper: Calculate distance between nodes
    function calculateNodeDistance(node1, node2) {
      // Quick hash-based similarity check
      const hash1 = generateNodeHash(node1);
      const hash2 = generateNodeHash(node2);

      // If hashes match, nodes are identical
      if (hash1 === hash2) return 0;

      // Calculate positional distance
      const pos1 = getNodePosition(node1);
      const pos2 = getNodePosition(node2);

      return (
        Math.abs(pos1.depth - pos2.depth) + Math.abs(pos1.index - pos2.index)
      );
    }

    // Helper: Generate hash for a node
    function generateNodeHash(node) {
      // Simple content hash
      const content = [
        node.tagName,
        node.properties?.className?.join(" ") || "",
        getTextContent(node).substring(0, 100), // First 100 chars
        node.children?.length || 0,
      ].join("|");

      return simpleHash(content);
    }

    // Helper: Simple hash function
    function simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    }

    // Helper: Get node position (simplified)
    function getNodePosition(node) {
      // This is a simplified version - in reality you'd traverse the tree
      return {
        depth: node.data?.depth || 0,
        index: node.data?.index || 0,
      };
    }

    // Helper: Extract text content from node
    function getTextContent(node) {
      let text = "";
      visit(node, "text", (textNode) => {
        text += textNode.value + " ";
      });
      return text.trim();
    }

    // Helper: Detect layout type
    function detectLayout(segments) {
      if (segments.sidebar.length >= 2) return "three-column";
      if (segments.sidebar.length === 1) return "two-column";
      if (segments.main.length > 1) return "multi-article";
      return "single-column";
    }

    // SimHash implementation for content similarity
    function simHash(text) {
      const shingles = createShingles(text, 2); // 2-gram shingles
      const hashVector = new Array(32).fill(0);

      shingles.forEach((shingle) => {
        const hash = simpleHash(shingle);
        for (let i = 0; i < 32; i++) {
          if (hash & (1 << i)) {
            hashVector[i]++;
          } else {
            hashVector[i]--;
          }
        }
      });

      // Convert to binary hash
      let finalHash = 0;
      for (let i = 0; i < 32; i++) {
        if (hashVector[i] > 0) {
          finalHash |= 1 << i;
        }
      }
      return finalHash;
    }

    // Helper: Create shingles for SimHash
    function createShingles(text, n = 2) {
      const words = text.toLowerCase().split(/\s+/);
      const shingles = [];
      for (let i = 0; i <= words.length - n; i++) {
        shingles.push(words.slice(i, i + n).join(" "));
      }
      return shingles;
    }

    // Helper: Calculate Hamming distance between hashes
    function hammingDistance(hash1, hash2) {
      let xor = hash1 ^ hash2;
      let distance = 0;
      while (xor) {
        distance += xor & 1;
        xor >>= 1;
      }
      return distance;
    }

    // Plugin: Extract only specific segments
    function extractSegment(segmentType = "main") {
      return (tree, file) => {
        const extracted = {
          type: "root",
          children: [],
        };

        visit(tree, "element", (node) => {
          if (node.data?.segment === segmentType) {
            extracted.children.push(node);
          }
        });

        // Return new tree with only extracted segments
        return extracted;
      };
    }

    // Plugin: Merge related segments
    function mergeRelatedSegments() {
      return (tree, file) => {
        visit(tree, "element", (node, index, parent) => {
          if (!node.data?.segmentGroup || !parent) return;

          const group = node.data.segmentGroup;
          if (index === group.start) {
            // Create wrapper for the group
            const wrapper = {
              type: "element",
              tagName: "section",
              properties: {
                className: [`vibe-segment-${group.type}`],
                dataVibeSegment: group.type,
              },
              children: parent.children.slice(group.start, group.end + 1),
            };

            // Replace the group with the wrapper
            parent.children.splice(
              group.start,
              group.end - group.start + 1,
              wrapper,
            );
          }
        });
      };
    }

    // Plugin: Segment content with hashing for duplicate detection
    function segmentContentWithHashing() {
      return (tree, file) => {
        const nodeHashes = new Map();
        const contentFingerprints = new Map();

        // First pass: generate hashes for all nodes
        visit(tree, "element", (node) => {
          const hash = generateNodeHash(node);
          const simhash = simHash(getTextContent(node));

          nodeHashes.set(node, hash);
          contentFingerprints.set(node, simhash);

          node.data = node.data || {};
          node.data.contentHash = hash;
          node.data.simHash = simhash;
        });

        // Second pass: find similar/duplicate content
        visit(tree, "element", (node) => {
          const currentHash = contentFingerprints.get(node);

          // Find nodes with similar content
          const similar = [];
          contentFingerprints.forEach((hash, otherNode) => {
            if (node !== otherNode) {
              const distance = hammingDistance(currentHash, hash);
              if (distance < 5) {
                // Threshold for similarity
                similar.push({
                  node: otherNode,
                  distance,
                });
              }
            }
          });

          // Mark duplicate/boilerplate content
          if (similar.length > 3) {
            node.data.likelyBoilerplate = true;
            node.data.segment = "boilerplate";
          }
        });

        // Use hashes for stability detection across mutations
        file.data = file.data || {};
        file.data.contentSignature = Array.from(nodeHashes.values())
          .sort()
          .join(":");
      };
    }

    // Main content transformer class
    class ContentTransformer {
      constructor() {
        this.unified = unified;
        this.visit = visit;
        this.select = select;
        this.selectAll = selectAll;
      }

      // Create extraction pipeline
      createExtractionPipeline() {
        return unified()
          .use(rehypeParse, { fragment: true })
          .use(scoreContent)
          .use(segmentContent)
          .use(rehypeFormat, { indent: 2, blanks: [] })
          .use(rehypeStringify);
      }

      // Create export pipeline (HTML to Markdown)
      createExportPipeline() {
        return unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeRemark)
          .use(remarkGfm)
          .use(remarkStringify, {
            bullet: "-",
            fence: "`",
            fences: true,
            strong: "*",
            emphasis: "_",
          });
      }

      // Create hashing pipeline for duplicate detection
      createHashingPipeline() {
        return unified()
          .use(rehypeParse, { fragment: true })
          .use(segmentContentWithHashing)
          .use(rehypeStringify);
      }

      // Convert HTML to HAST
      htmlToHast(html) {
        const temp = document.createElement("div");
        temp.innerHTML =
          typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(html) : html;
        return this.domToHast(temp);
      }

      // Convert DOM to HAST
      domToHast(node) {
        if (node.nodeType === 3) {
          // Text
          return { type: "text", value: node.textContent };
        }

        if (node.nodeType === 1) {
          // Element
          const hast = {
            type: "element",
            tagName: node.tagName.toLowerCase(),
            properties: {},
            children: [],
          };

          // Convert attributes
          for (const attr of node.attributes) {
            hast.properties[attr.name] = attr.value;
          }

          // Convert children
          for (const child of node.childNodes) {
            const hastChild = this.domToHast(child);
            if (hastChild) hast.children.push(hastChild);
          }

          return hast;
        }

        return null;
      }

      // Convert HAST back to HTML
      hastToHtml(hast) {
        return this.renderHast(hast);
      }

      renderHast(node) {
        if (node.type === "text") {
          return node.value;
        }

        if (node.type === "element") {
          const attrs = Object.entries(node.properties || {})
            .map(([k, v]) => `${k}="${v}"`)
            .join(" ");

          const children = (node.children || [])
            .map((child) => this.renderHast(child))
            .join("");

          return attrs
            ? `<${node.tagName} ${attrs}>${children}</${node.tagName}>`
            : `<${node.tagName}>${children}</${node.tagName}>`;
        }

        return "";
      }
    }

    // Pipeline processor for custom transforms
    class PipelineProcessor {
      constructor(bridge) {
        this.bridge = bridge;
        this.transforms = [];
        this.middleware = [];
      }

      use(plugin, options = {}) {
        if (typeof plugin === "function") {
          this.transforms.push({ fn: plugin, options });
        }
        return this;
      }

      async process(ast) {
        let tree = ast;
        const context = {
          messages: [],
          data: {},
          history: [],
        };

        for (const { fn, options } of this.transforms) {
          try {
            const startTime = performance.now();

            tree = await fn(tree, options, context);

            context.history.push({
              transform: fn.name,
              duration: performance.now() - startTime,
              nodeCount: this.countNodes(tree),
            });
          } catch (error) {
            if (this.bridge) {
              this.bridge.sendToBackground(null, "pipelineError", {
                transform: fn.name,
                error:
                  typeof MessageSerializer !== "undefined"
                    ? MessageSerializer.serialize(error)
                    : error.toString(),
              });
            }
            throw error;
          }
        }

        return { tree, context };
      }

      countNodes(node) {
        if (!node) return 0;
        let count = 1;
        if (node.children) {
          for (const child of node.children) {
            count += this.countNodes(child);
          }
        }
        return count;
      }
    }

    // Create singleton instances
    const contentTransformer = new ContentTransformer();

    // Export to global scope
    window.__vibeUnified = {
      ContentTransformer: contentTransformer,
      PipelineProcessor,
      // Export individual plugins for direct use
      plugins: {
        scoreContent,
        segmentContent,
        extractSegment,
        mergeRelatedSegments,
        segmentContentWithHashing,
      },
      // Export helper functions
      helpers: {
        calculateScore,
        getTextContent,
        generateNodeHash,
        simHash,
        hammingDistance,
        createShingles,
      },
    };

    // Expose commonly used classes as globals
    window.ContentTransformer = contentTransformer;
    window.PipelineProcessor = PipelineProcessor;

    console.log("UnifiedVibe v2.0 loaded with global UnifiedLib");

    true;
  } catch (error) {
    console.error("Failed to initialize UnifiedVibe:", error);
    delete window.__vibeUnified;
    throw error;
  }
}
