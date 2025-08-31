// VibeReader v2.0 - Utility Classes with Injection Guards

// Prevent multiple injections with simple guard
if (window.__vibeUnified) {
  console.log("⚠️ VibeUnified already exists, skipping");
  false;
} else {
  try {
// Import the essentials
      import { unified } from 'unified';
      import rehypeParse from 'rehype-parse';
      import rehypeStringify from 'rehype-stringify';
      import rehypeFormat from 'rehype-format';
      import rehypeRemark from 'rehype-remark';
      import remarkStringify from 'remark-stringify';
      import remarkGfm from 'remark-gfm';
      import { visit } from 'unist-util-visit';
      import { select, selectAll } from 'unist-util-select';

// Your content extraction pipeline
      const extractionPipeline = unified()
          .use(rehypeParse, { fragment: true })
          .use(scoreContent)  // Your custom scoring plugin
          .use(segmentContent) // Your segmentation plugin
          .use(rehypeFormat, { indent: 2, blanks: [] })
          .use(rehypeStringify);

// Your export pipeline (HTML to Markdown)
      const exportPipeline = unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeRemark)
          .use(remarkGfm)  // Enables tables, strikethrough, etc.
          .use(remarkStringify, {
              bullet: '-',
              fence: '`',
              fences: true,
              strong: '*',
              emphasis: '_'
          });

      class ContentTransformer {
          constructor() {
              this.unified = null; // Will be set when unified loads
          }

          htmlToHast(html) {
              // Convert HTML string to HAST
              const temp = document.createElement('div');
              // eslint-disable-next-line no-unsanitized/property
              temp.innerHTML = DOMPurify.sanitize(html);
              return this.domToHast(temp);
          }

          domToHast(node) {
              if (node.nodeType === 3) { // Text
                  return { type: 'text', value: node.textContent };
              }

              if (node.nodeType === 1) { // Element
                  const hast = {
                      type: 'element',
                      tagName: node.tagName.toLowerCase(),
                      properties: {},
                      children: []
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

          hastToHtml(hast) {
              // Convert back to HTML
              return this.renderHast(hast);
          }

          renderHast(node) {
              if (node.type === 'text') {
                  return node.value;
              }

              if (node.type === 'element') {
                  const attrs = Object.entries(node.properties || {})
                      .map(([k, v]) => `${k}="${v}"`)
                      .join(' ');

                  const children = (node.children || [])
                      .map(child => this.renderHast(child))
                      .join('');

                  return attrs
                      ? `<${node.tagName} ${attrs}>${children}</${node.tagName}>`
                      : `<${node.tagName}>${children}</${node.tagName}>`;
              }

              return '';
          }
      }

      class PipelineProcessor {
          constructor(bridge) {
              this.bridge = bridge;
              this.transforms = [];
              this.middleware = [];
          }

          use(plugin, options = {}) {
              if (typeof plugin === 'function') {
                  this.transforms.push({ fn: plugin, options });
              }
              return this;
          }

          async process(ast) {
              let tree = ast;
              const context = {
                  messages: [],
                  data: {},
                  history: []
              };

              for (const { fn, options } of this.transforms) {
                  try {
                      const startTime = performance.now();

                      tree = await fn(tree, options, context);

                      context.history.push({
                          transform: fn.name,
                          duration: performance.now() - startTime,
                          nodeCount: this.countNodes(tree)
                      });

                  } catch (error) {
                      this.bridge.send(null, 'pipelineError', {
                          transform: fn.name,
                          error: MessageSerializer.serialize(error)
                      });
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


      // Create singleton VibeLogger instance
    const contentTransformer = new ContentTransformer();

    window.__vibeUnified = {
      ContentTransformer: contentTransformer,
      PipelineProcessor,
      };
    // Expose commonly used classes as globals for easier access
    window.ContentTransformer = contentTransformer;
    window.PipelineProcessor = PipelineProcessor;

    console.log("✅ UnifiedVibe v1.0 loaded");

    true;
  } catch (error) {
    delete window.__vibeUnified; // Clean up on failure
    throw error;
  }
}
