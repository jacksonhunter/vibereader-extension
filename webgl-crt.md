Looking at your setup, a hybrid WebGL approach makes sense here. Your Tailwind themes are sophisticated and the proxy-controller architecture is well-suited for WebGL injection. Here's my approach:Here's how to integrate this WebGL CRT module with your VibeReader setup:

## Integration Points

### 1. **Add to proxy-controller.js**
```javascript
// In ProxyController class constructor
this.crtEffect = null;

// In activate() method, after creating interface
if (this.settings.crtEnabled) {
    this.initCRTEffect();
}

// New method
initCRTEffect() {
    if (!window.WebGLCRT) {
        // Inject the WebGL script first
        const script = document.createElement('script');
        script.src = browser.runtime.getURL('webgl-crt.js');
        script.onload = () => {
            this.crtEffect = new WebGLCRT({
                colorDepth: this.settings.crtColorDepth || 16,
                curvature: this.settings.crtCurvature || 0.15,
                bezelStrength: this.settings.crtBezel || 0.4,
                targetSelectors: [
                    '.terminal-window',
                    '.vibe-brand',
                    '.vibe-btn:not(.media-btn)', // Exclude media buttons
                    '.vibe-header',
                    '.terminal-content'
                ],
                excludeSelectors: [
                    '.vibe-article',
                    '.article-content',
                    '.media-wrapper'
                ],
                enabled: true
            });
            this.crtEffect.init();
        };
        document.head.appendChild(script);
    }
}

// In cycleTheme() or button handlers
toggleCRT() {
    if (this.crtEffect) {
        this.crtEffect.toggle();
    } else {
        this.initCRTEffect();
    }
}
```

### 2. **Popup Controls**
```html
<!-- Add to popup.html after media mode -->
<div class="setting-group">
    <label class="setting-label">
        <span class="label-text">📺 CRT Effect</span>
        <div class="toggle-switch">
            <input type="checkbox" id="crt-effect" class="toggle-input">
            <span class="toggle-slider"></span>
        </div>
    </label>
</div>

<!-- CRT sub-settings (show when enabled) -->
<div class="crt-settings" id="crt-settings" style="display: none;">
    <label class="setting-label">
        <span class="label-text">Color Depth</span>
        <select class="setting-select" id="crt-color-depth">
            <option value="8">8-bit (256 colors)</option>
            <option value="16" selected>16-bit (65K colors)</option>
        </select>
    </label>
    
    <label class="setting-label">
        <span class="label-text">Screen Curve</span>
        <input type="range" id="crt-curvature" min="0" max="0.3" step="0.01" value="0.15">
    </label>
</div>
```

### 3. **Tailwind Integration for Scanlines**

Since WebGL handles the heavy lifting, use Tailwind for lightweight effects:

```css
/* Add to your tailwind.css @layer utilities */
.crt-scanlines {
    @apply relative;
    &::after {
        content: '';
        @apply absolute inset-0 pointer-events-none;
        background: repeating-linear-gradient(
            0deg,
            transparent 0,
            transparent 2px,
            rgba(0, 255, 0, 0.03) 2px,
            rgba(0, 255, 0, 0.03) 4px
        );
        animation: scanline-move 8s linear infinite;
    }
}

@keyframes scanline-move {
    0% { transform: translateY(0); }
    100% { transform: translateY(4px); }
}

/* Phosphor glow for terminals - lighter weight than WebGL */
.crt-glow {
    text-shadow: 
        0 0 2px currentColor,
        0 0 5px rgba(var(--primary-500), 0.5);
}
```

## Performance Optimizations

### For Better Performance:
1. **Use CSS for simple effects**, WebGL for complex distortion
2. **Throttle WebGL rendering** to 30fps for terminals:
```javascript
// In renderFrame()
if (Date.now() - this.lastRender < 33) return; // 30fps cap
this.lastRender = Date.now();
```

3. **Cache element captures** - Don't recapture static terminals every frame

### Alternative: Canvas2D + CSS Hybrid

If WebGL is too heavy, here's a lighter approach using Canvas2D + CSS:

```javascript
class LightweightCRT {
    applyToElement(element) {
        // CSS for curve illusion
        element.style.transform = 'perspective(800px) rotateX(2deg)';
        element.style.borderRadius = '0.5% / 2%';
        
        // Canvas overlay for color reduction
        const canvas = document.createElement('canvas');
        canvas.className = 'crt-overlay';
        canvas.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            pointer-events: none;
            mix-blend-mode: color;
            opacity: 0.3;
        `;
        
        // Draw color banding pattern
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 3, 3);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.33, '#00ff00');
        gradient.addColorStop(0.66, '#0000ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        element.appendChild(canvas);
    }
}
```

## Recommended Approach

Given your architecture, I'd suggest:

1. **WebGL for terminals only** (they're small, benefit most from distortion)
2. **CSS animations for scanlines** (Tailwind utilities)
3. **CSS filters for color reduction** on buttons/brand:
```css
.crt-8bit {
    filter: contrast(1.2) saturate(1.5) url(#posterize);
}
```

4. **Skip CRT on main content** as you requested

This hybrid gives you the CRT aesthetic without killing performance on article content. The TV button in popup controls the whole effect suite.