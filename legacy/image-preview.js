// Image Preview System - Imagus-style functionality
// Hover over images/links to get instant previews

class ImagePreview {
    constructor() {
        this.previewContainer = null;
        this.currentImage = null;
        this.isShowing = false;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.settings = {
            delay: 500,        // ms before showing preview
            fadeSpeed: 200,    // fade animation speed
            maxWidth: 600,     // max preview width
            maxHeight: 400,    // max preview height
            offset: 20,        // cursor offset
            supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
        };
        
        this.init();
    }
    
    init() {
        this.createPreviewContainer();
        this.attachEventListeners();
        this.injectStyles();
    }
    
    createPreviewContainer() {
        this.previewContainer = document.createElement('div');
        this.previewContainer.id = 'matrix-image-preview';
        this.previewContainer.innerHTML = `
            <div class="preview-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">LOADING IMAGE...</div>
            </div>
            <img class="preview-image" style="display: none;">
            <div class="preview-info">
                <div class="preview-filename"></div>
                <div class="preview-dimensions"></div>
            </div>
        `;
        
        document.body.appendChild(this.previewContainer);
    }
    
    attachEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Handle keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hidePreview();
            }
        });
        
        // Handle scroll to hide preview
        document.addEventListener('scroll', () => {
            if (this.isShowing) {
                this.hidePreview();
            }
        }, true);
    }
    
    handleMouseOver(e) {
        const target = e.target;
        const imageUrl = this.getImageUrl(target);
        
        if (imageUrl && this.isImageSupported(imageUrl)) {
            this.clearTimeouts();
            
            this.hoverTimeout = setTimeout(() => {
                this.showPreview(imageUrl, e);
            }, this.settings.delay);
        }
    }
    
    handleMouseOut(e) {
        const target = e.target;
        const relatedTarget = e.relatedTarget;
        
        // Don't hide if moving to preview container or its children
        if (relatedTarget && 
            (relatedTarget === this.previewContainer || 
             this.previewContainer.contains(relatedTarget))) {
            return;
        }
        
        // Don't hide if moving within the same image element
        if (relatedTarget && target.contains && target.contains(relatedTarget)) {
            return;
        }
        
        this.clearTimeouts();
        
        this.hideTimeout = setTimeout(() => {
            this.hidePreview();
        }, 100);
    }
    
    handleMouseMove(e) {
        if (this.isShowing) {
            this.updatePreviewPosition(e);
        }
    }
    
    getImageUrl(element) {
        // Direct image element
        if (element.tagName === 'IMG') {
            return element.src || element.getAttribute('data-src');
        }
        
        // Link to image
        if (element.tagName === 'A') {
            const href = element.href;
            if (href && this.isImageSupported(href)) {
                return href;
            }
            
            // Check if link contains an image
            const img = element.querySelector('img');
            if (img) {
                return img.src || img.getAttribute('data-src');
            }
        }
        
        // Element with background image
        const bgImage = window.getComputedStyle(element).backgroundImage;
        if (bgImage && bgImage !== 'none') {
            const urlMatch = bgImage.match(/url\\(['"]?(.+?)['"]?\\)/);
            if (urlMatch) {
                return urlMatch[1];
            }
        }
        
        // Data attributes
        const dataSrc = element.getAttribute('data-original') ||
                       element.getAttribute('data-lazy-src') ||
                       element.getAttribute('data-src');
        
        if (dataSrc && this.isImageSupported(dataSrc)) {
            return dataSrc;
        }
        
        return null;
    }
    
    isImageSupported(url) {
        if (!url) return false;
        
        // Remove query parameters and fragments
        const cleanUrl = url.split('?')[0].split('#')[0];
        const extension = cleanUrl.split('.').pop().toLowerCase();
        
        return this.settings.supportedFormats.includes(extension);
    }
    
    async showPreview(imageUrl, mouseEvent) {
        if (this.isShowing && this.currentImage === imageUrl) {
            return;
        }
        
        this.currentImage = imageUrl;
        this.isShowing = true;
        
        // Show loading state
        this.previewContainer.className = 'showing loading';
        this.updatePreviewPosition(mouseEvent);
        
        try {
            await this.loadImage(imageUrl);
        } catch (error) {
            console.error('Failed to load preview image:', error);
            this.hidePreview();
        }
    }
    
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = this.previewContainer.querySelector('.preview-image');
            const loadingDiv = this.previewContainer.querySelector('.preview-loading');
            
            img.onload = () => {
                // Calculate display dimensions
                const { displayWidth, displayHeight } = this.calculateDisplaySize(
                    img.naturalWidth, 
                    img.naturalHeight
                );
                
                img.style.width = displayWidth + 'px';
                img.style.height = displayHeight + 'px';
                
                // Update info
                this.updatePreviewInfo(url, img.naturalWidth, img.naturalHeight);
                
                // Show image, hide loading
                loadingDiv.style.display = 'none';
                img.style.display = 'block';
                
                this.previewContainer.className = 'showing loaded';
                
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }
    
    calculateDisplaySize(naturalWidth, naturalHeight) {
        const { maxWidth, maxHeight } = this.settings;
        
        let displayWidth = naturalWidth;
        let displayHeight = naturalHeight;
        
        // Scale down if too large
        if (displayWidth > maxWidth) {
            displayHeight = (displayHeight * maxWidth) / displayWidth;
            displayWidth = maxWidth;
        }
        
        if (displayHeight > maxHeight) {
            displayWidth = (displayWidth * maxHeight) / displayHeight;
            displayHeight = maxHeight;
        }
        
        return { displayWidth, displayHeight };
    }
    
    updatePreviewInfo(url, width, height) {
        const filename = url.split('/').pop().split('?')[0];
        const dimensions = `${width} × ${height}`;
        
        this.previewContainer.querySelector('.preview-filename').textContent = filename;
        this.previewContainer.querySelector('.preview-dimensions').textContent = dimensions;
    }
    
    updatePreviewPosition(mouseEvent) {
        if (!this.previewContainer || !this.isShowing) return;
        
        const { clientX, clientY } = mouseEvent;
        const { offset } = this.settings;
        const containerRect = this.previewContainer.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = clientX + offset;
        let top = clientY + offset;
        
        // Adjust if preview would go off-screen
        if (left + containerRect.width > viewportWidth) {
            left = clientX - containerRect.width - offset;
        }
        
        if (top + containerRect.height > viewportHeight) {
            top = clientY - containerRect.height - offset;
        }
        
        // Ensure preview stays within viewport
        left = Math.max(10, Math.min(left, viewportWidth - containerRect.width - 10));
        top = Math.max(10, Math.min(top, viewportHeight - containerRect.height - 10));
        
        this.previewContainer.style.left = left + 'px';
        this.previewContainer.style.top = top + 'px';
    }
    
    hidePreview() {
        if (!this.isShowing) return;
        
        this.isShowing = false;
        this.currentImage = null;
        
        this.previewContainer.className = 'hiding';
        
        setTimeout(() => {
            this.previewContainer.className = '';
            this.previewContainer.querySelector('.preview-image').style.display = 'none';
            this.previewContainer.querySelector('.preview-loading').style.display = 'block';
        }, this.settings.fadeSpeed);
    }
    
    clearTimeouts() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.id = 'matrix-image-preview-styles';
        style.textContent = `
            #matrix-image-preview {
                position: fixed;
                z-index: 999999;
                pointer-events: none;
                opacity: 0;
                transform: scale(0.8);
                transition: all ${this.settings.fadeSpeed}ms ease;
                background: linear-gradient(135deg, 
                    rgba(0, 0, 0, 0.95) 0%, 
                    rgba(26, 13, 26, 0.9) 100%);
                border: 2px solid #ff1493;
                border-radius: 8px;
                box-shadow: 
                    0 0 30px rgba(255, 20, 147, 0.8),
                    0 0 60px rgba(0, 255, 255, 0.4);
                backdrop-filter: blur(10px);
                font-family: 'Share Tech Mono', monospace;
                max-width: ${this.settings.maxWidth}px;
                max-height: ${this.settings.maxHeight + 80}px;
            }
            
            #matrix-image-preview.showing {
                opacity: 1;
                transform: scale(1);
                pointer-events: auto;
            }
            
            #matrix-image-preview.hiding {
                opacity: 0;
                transform: scale(0.8);
            }
            
            #matrix-image-preview.loaded {
                animation: neon-pulse-preview 2s ease-in-out infinite alternate;
            }
            
            @keyframes neon-pulse-preview {
                0% { box-shadow: 0 0 20px rgba(255, 20, 147, 0.6), 0 0 40px rgba(0, 255, 255, 0.3); }
                100% { box-shadow: 0 0 40px rgba(255, 20, 147, 1), 0 0 80px rgba(0, 255, 255, 0.6); }
            }
            
            .preview-loading {
                padding: 40px;
                text-align: center;
                color: #00ffff;
            }
            
            .loading-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid rgba(0, 255, 255, 0.3);
                border-top: 3px solid #00ffff;
                border-radius: 50%;
                margin: 0 auto 15px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-text {
                font-size: 12px;
                text-shadow: 0 0 10px #00ffff;
                letter-spacing: 2px;
            }
            
            .preview-image {
                display: block;
                border-radius: 6px 6px 0 0;
                object-fit: contain;
            }
            
            .preview-info {
                padding: 10px;
                background: rgba(0, 0, 0, 0.8);
                border-top: 1px solid #ff1493;
                border-radius: 0 0 6px 6px;
            }
            
            .preview-filename {
                color: #ff1493;
                font-size: 11px;
                text-shadow: 0 0 8px #ff1493;
                margin-bottom: 5px;
                word-break: break-all;
            }
            
            .preview-dimensions {
                color: #00ffff;
                font-size: 10px;
                text-shadow: 0 0 8px #00ffff;
                opacity: 0.8;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    destroy() {
        this.clearTimeouts();
        
        if (this.previewContainer) {
            this.previewContainer.remove();
        }
        
        const styles = document.getElementById('matrix-image-preview-styles');
        if (styles) {
            styles.remove();
        }
        
        document.removeEventListener('mouseover', this.handleMouseOver, true);
        document.removeEventListener('mouseout', this.handleMouseOut, true);
        document.removeEventListener('mousemove', this.handleMouseMove);
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImagePreview;
}