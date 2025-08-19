// Readability.js - Simplified version for Matrix Reader
// Based on Mozilla's Readability.js but streamlined for our needs

class Readability {
    constructor(doc) {
        this.doc = doc;
        this.articleTitle = '';
        this.articleByline = '';
        this.articleDir = '';
    }
    
    parse() {
        // Find the main content
        const content = this.grabArticle();
        
        if (!content) {
            return null;
        }
        
        return {
            title: this.getArticleTitle(),
            byline: this.getArticleByline(),
            dir: this.articleDir,
            content: content.innerHTML,
            textContent: content.textContent || content.innerText || '',
            length: (content.textContent || content.innerText || '').length,
            excerpt: this.getExcerpt(content)
        };
    }
    
    getArticleTitle() {
        let title = '';
        
        // Try to get title from various sources
        const titleElement = this.doc.querySelector('h1') || 
                           this.doc.querySelector('[class*="title"]') ||
                           this.doc.querySelector('[id*="title"]');
        
        if (titleElement) {
            title = titleElement.textContent.trim();
        }
        
        // Fallback to document title
        if (!title) {
            title = this.doc.title || 'Unknown Article';
        }
        
        return title;
    }
    
    getArticleByline() {
        const bylineSelectors = [
            '[class*="author"]',
            '[class*="byline"]',
            '[rel="author"]',
            '[itemprop="author"]'
        ];
        
        for (const selector of bylineSelectors) {
            const element = this.doc.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }
    
    grabArticle() {
        // Look for main content containers
        const contentSelectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.post',
            '.entry',
            '.article',
            '#content',
            '#main'
        ];
        
        let bestCandidate = null;
        let bestScore = 0;
        
        for (const selector of contentSelectors) {
            const elements = this.doc.querySelectorAll(selector);
            
            for (const element of elements) {
                const score = this.scoreElement(element);
                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = element;
                }
            }
        }
        
        // If we didn't find a good candidate, try to find the best paragraph container
        if (!bestCandidate || bestScore < 20) {
            const paragraphs = this.doc.querySelectorAll('p');
            const containers = new Map();
            
            paragraphs.forEach(p => {
                let parent = p.parentNode;
                while (parent && parent !== this.doc.body) {
                    if (!containers.has(parent)) {
                        containers.set(parent, 0);
                    }
                    containers.set(parent, containers.get(parent) + 1);
                    parent = parent.parentNode;
                }
            });
            
            // Find container with most paragraphs
            let maxParagraphs = 0;
            containers.forEach((count, container) => {
                if (count > maxParagraphs) {
                    maxParagraphs = count;
                    bestCandidate = container;
                }
            });
        }
        
        return bestCandidate || this.doc.body;
    }
    
    scoreElement(element) {
        let score = 0;
        
        // Score based on text length
        const textLength = element.textContent.length;
        score += Math.min(textLength / 100, 25);
        
        // Score based on paragraph count
        const paragraphCount = element.querySelectorAll('p').length;
        score += paragraphCount * 3;
        
        // Positive indicators
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();
        
        if (/article|content|entry|hentry|main|page|post|text|blog|story/.test(className + ' ' + id)) {
            score += 25;
        }
        
        if (/and|article|body|column|main|shadow/.test(className + ' ' + id)) {
            score += 5;
        }
        
        // Negative indicators
        if (/combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget/.test(className + ' ' + id)) {
            score -= 3;
        }
        
        if (/hidden|invisible/.test(element.style.visibility + ' ' + element.style.display)) {
            score -= 5;
        }
        
        return score;
    }
    
    getExcerpt(content) {
        const text = content.textContent || content.innerText || '';
        const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
        
        if (sentences.length === 0) {
            return text.substring(0, 200) + '...';
        }
        
        let excerpt = '';
        let length = 0;
        
        for (const sentence of sentences) {
            if (length + sentence.length > 300) {
                break;
            }
            excerpt += sentence;
            length += sentence.length;
        }
        
        return excerpt.trim() || text.substring(0, 200) + '...';
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Readability;
}