// webgl-crt.js - WebGL CRT Effect Module for VibeReader
// Selective 8/16-bit color CRT simulation with barrel distortion

class WebGLCRT {
    constructor(options = {}) {
        this.options = {
            colorDepth: options.colorDepth || 16, // 8 or 16 bit
            curvature: options.curvature || 0.15,
            bezelStrength: options.bezelStrength || 0.4,
            scanlineOpacity: options.scanlineOpacity || 0.05,
            targetSelectors: options.targetSelectors || [
                '.terminal-window',
                '.terminal-content',
                '.vibe-brand',
                '.vibe-btn',
                '.vibe-header',
                '.cyber-heading'
            ],
            excludeSelectors: options.excludeSelectors || [
                '.vibe-article',
                '.article-content',
                '.media-wrapper',
                'img',
                'video'
            ],
            enabled: options.enabled || false
        };

        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.framebuffer = null;
        this.texture = null;
        this.animationFrame = null;
        this.targetElements = [];
    }

    init() {
        if (!this.options.enabled) return;

        this.createCanvas();
        this.initWebGL();
        this.findTargetElements();
        this.startRendering();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'webgl-crt-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999999;
            mix-blend-mode: normal;
        `;
        document.body.appendChild(this.canvas);
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }

    initWebGL() {
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        });

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.getVertexShader());
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.getFragmentShader());

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Shader program failed to link');
            return;
        }

        // Set up geometry
        const vertices = new Float32Array([
            -1, -1, 0, 0,
            1, -1, 1, 0,
            -1,  1, 0, 1,
            1,  1, 1, 1
        ]);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLoc = this.gl.getAttribLocation(this.program, 'a_position');
        const texCoordLoc = this.gl.getAttribLocation(this.program, 'a_texCoord');

        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 16, 0);

        this.gl.enableVertexAttribArray(texCoordLoc);
        this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, 16, 8);

        this.gl.useProgram(this.program);

        // Set uniforms
        this.updateUniforms();
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    getVertexShader() {
        return `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
    }

    getFragmentShader() {
        const colorLevels = this.options.colorDepth === 8 ? 8.0 : 32.0;

        return `
            precision mediump float;
            
            varying vec2 v_texCoord;
            uniform sampler2D u_texture;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_curvature;
            uniform float u_bezelStrength;
            uniform float u_scanlineOpacity;
            uniform float u_colorLevels;
            
            // Barrel distortion
            vec2 barrelDistortion(vec2 coord, float amount) {
                vec2 center = vec2(0.5, 0.5);
                vec2 dist = coord - center;
                float r2 = dot(dist, dist);
                float factor = 1.0 + amount * r2;
                return center + dist * factor;
            }
            
            // Color quantization for retro effect
            vec3 quantizeColor(vec3 color, float levels) {
                return floor(color * levels) / levels;
            }
            
            // Phosphor RGB mask simulation
            vec3 phosphorMask(vec2 coord) {
                float x = coord.x * u_resolution.x;
                float mask = 1.0;
                
                // RGB phosphor stripes
                if (mod(floor(x), 3.0) == 0.0) {
                    return vec3(1.2, 0.8, 0.8); // Red emphasis
                } else if (mod(floor(x), 3.0) == 1.0) {
                    return vec3(0.8, 1.2, 0.8); // Green emphasis
                } else {
                    return vec3(0.8, 0.8, 1.2); // Blue emphasis
                }
            }
            
            void main() {
                // Apply barrel distortion
                vec2 distorted = barrelDistortion(v_texCoord, u_curvature);
                
                // Check if we're outside the screen bounds
                if (distorted.x < 0.0 || distorted.x > 1.0 || 
                    distorted.y < 0.0 || distorted.y > 1.0) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    return;
                }
                
                // Sample the texture
                vec4 color = texture2D(u_texture, distorted);
                
                // Skip transparent pixels
                if (color.a < 0.01) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    return;
                }
                
                // Apply color quantization
                color.rgb = quantizeColor(color.rgb, u_colorLevels);
                
                // Apply phosphor mask
                color.rgb *= phosphorMask(distorted);
                
                // Scanlines
                float scanline = sin(distorted.y * u_resolution.y * 3.14159) * 0.04;
                color.rgb -= scanline * u_scanlineOpacity;
                
                // Bezel edge darkening
                vec2 fromCenter = abs(v_texCoord - vec2(0.5, 0.5)) * 2.0;
                float edgeDist = max(fromCenter.x, fromCenter.y);
                float bezel = 1.0 - smoothstep(0.5, 1.0, edgeDist) * u_bezelStrength;
                color.rgb *= bezel;
                
                // Subtle flicker
                color.rgb *= 0.98 + 0.02 * sin(u_time * 60.0);
                
                gl_FragColor = color;
            }
        `;
    }

    updateUniforms() {
        const gl = this.gl;
        const program = this.program;

        // Resolution
        const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
        gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);

        // CRT parameters
        const curvatureLoc = gl.getUniformLocation(program, 'u_curvature');
        gl.uniform1f(curvatureLoc, this.options.curvature);

        const bezelLoc = gl.getUniformLocation(program, 'u_bezelStrength');
        gl.uniform1f(bezelLoc, this.options.bezelStrength);

        const scanlineLoc = gl.getUniformLocation(program, 'u_scanlineOpacity');
        gl.uniform1f(scanlineLoc, this.options.scanlineOpacity);

        const colorLevelsLoc = gl.getUniformLocation(program, 'u_colorLevels');
        const levels = this.options.colorDepth === 8 ? 8.0 : 32.0;
        gl.uniform1f(colorLevelsLoc, levels);
    }

    findTargetElements() {
        this.targetElements = [];

        // Find elements that should have CRT effect
        this.options.targetSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Check if element is not in exclude list
                let excluded = false;
                this.options.excludeSelectors.forEach(excludeSelector => {
                    if (el.matches(excludeSelector) || el.querySelector(excludeSelector)) {
                        excluded = true;
                    }
                });

                if (!excluded && this.isVisible(el)) {
                    this.targetElements.push(el);
                }
            });
        });
    }

    isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 &&
            rect.bottom > 0 && rect.right > 0 &&
            rect.top < window.innerHeight && rect.left < window.innerWidth;
    }

    captureElementToTexture(element) {
        // Use html2canvas or similar for element capture
        // For now, we'll use a canvas2D approach
        const rect = element.getBoundingClientRect();
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = rect.width;
        tempCanvas.height = rect.height;

        const ctx = tempCanvas.getContext('2d');

        // This is simplified - in production you'd use html2canvas or similar
        // For terminals and simple styled elements, we can approximate
        ctx.fillStyle = getComputedStyle(element).backgroundColor || '#000';
        ctx.fillRect(0, 0, rect.width, rect.height);

        ctx.fillStyle = getComputedStyle(element).color || '#0f0';
        ctx.font = getComputedStyle(element).font || '12px monospace';

        // Capture text content for terminals
        if (element.classList.contains('terminal-content')) {
            const lines = element.innerText.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, 10, 20 + i * 14);
            });
        }

        return tempCanvas;
    }

    startRendering() {
        const render = () => {
            if (!this.options.enabled) {
                cancelAnimationFrame(this.animationFrame);
                return;
            }

            this.findTargetElements();
            this.renderFrame();
            this.animationFrame = requestAnimationFrame(render);
        };

        render();
    }

    renderFrame() {
        const gl = this.gl;

        // Clear canvas
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Update time uniform
        const timeLoc = gl.getUniformLocation(this.program, 'u_time');
        gl.uniform1f(timeLoc, performance.now() / 1000);

        // Render each target element with CRT effect
        this.targetElements.forEach(element => {
            this.renderElement(element);
        });
    }

    renderElement(element) {
        const rect = element.getBoundingClientRect();

        // Skip if element is not visible
        if (rect.width === 0 || rect.height === 0) return;

        // Capture element to texture
        const elementCanvas = this.captureElementToTexture(element);

        // Create WebGL texture from canvas
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, elementCanvas
        );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        // Set viewport to element position
        const x = rect.left * window.devicePixelRatio;
        const y = (window.innerHeight - rect.bottom) * window.devicePixelRatio;
        const width = rect.width * window.devicePixelRatio;
        const height = rect.height * window.devicePixelRatio;

        this.gl.viewport(x, y, width, height);

        // Draw with CRT shader
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // Cleanup
        this.gl.deleteTexture(texture);
    }

    updateSettings(newOptions) {
        Object.assign(this.options, newOptions);
        this.updateUniforms();
    }

    destroy() {
        this.options.enabled = false;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.canvas) {
            this.canvas.remove();
        }

        if (this.gl) {
            // Cleanup WebGL resources
            if (this.program) {
                this.gl.deleteProgram(this.program);
            }
        }
    }

    toggle() {
        this.options.enabled = !this.options.enabled;

        if (this.options.enabled) {
            this.init();
        } else {
            this.destroy();
        }
    }
}

// Export for use in proxy-controller.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebGLCRT;
} else {
    window.WebGLCRT = WebGLCRT;
}