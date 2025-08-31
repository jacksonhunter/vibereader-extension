Yes, unified has several formatting options:

## Core Formatting:

**`rehype-format`** - The main HTML formatter:

```javascript
import rehypeFormat from "rehype-format";

unified()
  .use(rehypeParse)
  .use(rehypeFormat, {
    indent: 2, // spaces per indent
    indentInitial: true, // indent first level
    blanks: ["head", "body"], // elements to add blank lines around
  })
  .use(rehypeStringify);
```

## Stringify Options:

Most unified stringifiers have built-in formatting:

```javascript
// HTML formatting via rehype-stringify
.use(rehypeStringify, {
  allowDangerousHtml: true,
  closeSelfClosing: true,
  omitOptionalTags: false,
  preferUnquoted: false,
  quoteSmart: true,
  space: 'html',
  entities: { useNamedReferences: true }
})

// Markdown formatting via remark-stringify
.use(remarkStringify, {
  bullet: '-',
  fence: '`',
  fences: true,
  incrementListMarker: true,
  rule: '-',
  ruleRepetition: 3,
  ruleSpaces: false,
  strong: '*',
  emphasis: '_'
})
```

## For VibeReader:

You probably want **`rehype-format`** after extraction to clean up Readability's output:

```javascript
async postProcessContent(result) {
    // After DOMPurify sanitization
    const formatted = await unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeFormat, {
            indent: 2,
            blanks: []  // No extra blank lines for compact reading
        })
        .use(rehypeStringify)
        .process(result.content);

    result.content = String(formatted);
    return result;
}
```

This would give you consistently formatted HTML regardless of the source site's formatting chaos. Though honestly, for reading mode, minified HTML might be better for performance - formatting mainly helps debugging.

The `scoreContent` I mentioned was a conceptual example - not an existing module. But you're right that Readability's single-segment extraction is limiting. Here's what a multi-segment scoring system would look like:

## Multi-Segment Content Scoring:

```javascript
class ContentScorer {
  scoreSegments(doc) {
    const segments = [];
    const candidates = doc.querySelectorAll(
      "article, section, div, main, aside"
    );

    for (const element of candidates) {
      const score = this.calculateScore(element);

      if (score > 50) {
        // Threshold for content
        segments.push({
          element,
          score,
          type: this.classifySegment(element, score),
          metadata: this.extractMetadata(element),
        });
      }
    }

    // Sort by score but maintain DOM order for related segments
    return this.groupRelatedSegments(segments);
  }

  calculateScore(element) {
    let score = 0;

    // Text density
    const text = element.textContent.length;
    const html = element.innerHTML.length;
    score += (text / html) * 100;

    // Structural indicators
    score += element.querySelectorAll("p").length * 3;
    score += element.querySelectorAll("h1,h2,h3").length * 4;
    score += element.querySelectorAll("li").length * 1;

    // Penalize navigation/advertising patterns
    const className = element.className.toLowerCase();
    if (/nav|menu|sidebar|advert|banner/.test(className)) {
      score *= 0.3;
    }

    // Boost content indicators
    if (/article|content|main|body|text/.test(className)) {
      score *= 1.5;
    }

    return score;
  }

  classifySegment(element, score) {
    // Determine segment type based on position, score, and content
    if (score > 200 && element.querySelector("h1")) return "main";
    if (element.tagName === "ASIDE") return "sidebar";
    if (element.querySelector("nav")) return "navigation";
    if (score > 100) return "secondary";
    return "auxiliary";
  }
}
```

## Alternatives to Readability:

### 1. **Mozilla's Readability Algorithm Adapted**

Fork Readability but modify it to return multiple candidates instead of merging them:

```javascript
// Modified Readability that preserves segments
const segments = reader.parseSegments(); // Returns array of scored content blocks
```

### 2. **Trafilatura** (Python, but has the right idea)

Extracts main content, comments, and metadata separately. You could implement similar heuristics in JS.

### 3. **Custom Heuristic Extractor**

Build on your existing `scoreContentElement` but keep segments separate:

```javascript
async extractSegments(doc) {
    const segments = {
        main: null,
        secondary: [],
        metadata: {},
        navigation: [],
        related: []
    };

    // Score all potential content blocks
    const scored = Array.from(doc.querySelectorAll('*'))
        .filter(el => el.textContent.length > 100)
        .map(el => ({
            element: el,
            score: this.scoreContentElement(el),
            bounds: el.getBoundingClientRect()
        }))
        .sort((a, b) => b.score - a.score);

    // Take top scoring as main
    segments.main = scored[0];

    // Classify others by position and content
    for (const item of scored.slice(1)) {
        if (this.isRelatedContent(item.element)) {
            segments.related.push(item);
        } else if (item.score > 50) {
            segments.secondary.push(item);
        }
    }

    return segments;
}
```

### 4. **Unified-based Extraction**

Use rehype to traverse and score the AST:

```javascript
import { visit } from "unist-util-visit";

function rehypeScoreContent() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      node.data = node.data || {};
      node.data.contentScore = calculateNodeScore(node);
    });

    // Group into segments based on scores and structure
    return groupIntoSegments(tree);
  };
}
```

The key advantage of moving away from Readability is you can preserve document structure, extract multiple content regions, and maintain relationships between segments. This is especially useful for documentation sites, multi-column layouts, and articles with important sidebars or related content sections.
