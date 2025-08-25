
# VibeReader CSS Protocol v1.0
** Core Architecture **

The extension expects a specific CSS structure with three main stylesheets:
styles/
├── popup.css           # Popup interface styles
├── retrofuture-theme.css  # Main vibe reader theme
└── matrix-theme.css    # Additional effects layer

Required CSS Classes by Component
1. Container Structure
css/* Primary containers - MUST exist */
.vibe-reader-container    /* Root container for entire UI */
.vibe-reader-proxy        /* Modifier class for proxy mode */
.vibe-reader-overlay      /* Full-screen overlay wrapper */

/* Layout structure - MUST exist */
.vibe-layout              /* Main layout grid/flex container */
.vibe-content             /* Central content area */
.vibe-sidebar             /* Side panel base class */
.vibe-sidebar-spacer      /* Empty spacer when sidebars disabled */
.left-panel               /* Left terminal modifier */
.right-panel              /* Right terminal modifier */
2. Header Components
css/* Header structure - MUST exist */
.vibe-header              /* Top header bar */
.vibe-header-left         /* Left header section */
.vibe-header-right        /* Right header section */
.vibe-brand               /* Brand/logo text */
.vibe-status              /* Status indicator text */

/* Button system - MUST exist */
.vibe-btn                 /* Base button class */
.media-btn                /* Media mode toggle */
.theme-btn                /* Theme cycle button */
.disconnect-btn           /* Deactivate button */
3. Article/Content Display
css/* Article structure - MUST exist */
.vibe-article             /* Article container */
.article-header           /* Article header section */
.article-title            /* Main title */
.article-byline           /* Author byline */
.article-meta             /* Metadata container */
.meta-item                /* Individual meta items */
.article-content          /* Main content area */
.article-footer           /* Footer section */
.footer-info              /* Footer info container */

/* Content modifiers - MUST exist */
.cyber-heading            /* Enhanced headings */
.cyber-link               /* Styled links */
.cyber-code               /* Code block styling */
.cyber-table              /* Table styling */
.cyber-media              /* Media element styling */
.cyber-frame              /* Media frame wrapper */
4. Terminal Components
css/* Terminal system - MUST exist */
.terminal-window          /* Terminal container */
.terminal-header          /* Terminal title bar */
.terminal-title           /* Terminal title text */
.terminal-controls        /* Control buttons area */
.terminal-content         /* Terminal body */
.terminal-line            /* Individual terminal line */
.led-indicator            /* Status LED */

/* Enhanced Diagnostic Dropdown System - NEW v2.1 */
.diagnostic-category      /* Collapsible category container */
.category-header          /* Clickable category header with icon + count */
.category-content         /* Expandable log content area */
5. Media Display System
css/* Media wrappers - MUST exist */
.media-wrapper            /* Universal media container */

/* Emoji mode - MUST exist when mediaMode='emoji' */
.media-emoji-display      /* Emoji display container */
.emoji-icon               /* Emoji icon element */
.media-label              /* Media type label */
.mode-hint                /* User instruction text */

/* ASCII mode - MUST exist when mediaMode='ascii' */
.media-ascii-display      /* ASCII display container - DYNAMICALLY SIZED by JavaScript */
.ascii-art                /* ASCII art pre element - contains rendered aalib.js HTML output */
.ascii-canvas             /* Canvas element - contains aalib.js canvas output */


/* Normal mode - MUST exist when mediaMode='normal' */
.media-normal-display     /* Normal display wrapper */
6. Progress/Loading States
css/* Extraction progress - MUST exist during loading */
.extraction-progress      /* Progress container */
.progress-bar             /* Progress bar track */
.progress-fill            /* Progress bar fill */
.extraction-status        /* Status text */
7. Error States
css/* Error display - MUST exist for error handling */
.error-display            /* Error container */
.error-icon               /* Error icon */
.error-title              /* Error title */
.error-message            /* Error message text */
.retry-btn                /* Retry button */
8. Effects Classes
css/* Visual effects - MUST support these states */
.glitch                   /* Elements with glitch effect */
.glitching                /* Active glitch state */
.neon-pulse               /* Neon pulse animation */
.active                   /* Active state modifier */
.loading                  /* Loading state */
9. Special Effects Containers
css/* Optional effects - conditionally rendered */
.vibe-rain-container      /* Matrix rain container */
.matrix-drop              /* Individual rain drop */
Required Data Attributes
css/* Theme system - MUST handle these values */
[data-theme="nightdrive"]
[data-theme="neon-surge"]
[data-theme="outrun-storm"]
[data-theme="strange-days"]

/* Media display modes - MUST handle these values */
[data-mode="emoji"]
[data-mode="ascii"]
[data-mode="normal"]

/* Glitch effect text */
[data-text]               /* Contains glitch text for pseudo-elements */
Required CSS Custom Properties (Enhanced v2.0)

## Core Architecture Requirements

### RGB Color System (MANDATORY)
All colors must be defined as RGB triplets for transparency support:
```css
:root {
  /* RGB format enables rgba() usage: rgba(var(--primary-500), 0.5) */
  --primary-500: 249 38 114;    /* Use RGB triplets, not hex values */
  --secondary-500: 102 217 239; /* Enables dynamic transparency */
  --accent-500: 255 191 128;    /* Better browser compatibility */
}
```

### Semantic Color Scales (MANDATORY)
Each theme MUST implement full 50-900 color scales:
```css
[data-theme="nightdrive"] {
  /* Primary - Neon Pink Spectrum (EXACT MATCH REQUIRED) */
  --primary-50: 255 192 203; --primary-100: 255 182 193; --primary-200: 255 148 198;
  --primary-300: 255 105 180; --primary-400: 255 75 156; --primary-500: 249 38 114;
  --primary-600: 224 110 146; --primary-700: 215 61 133; --primary-800: 192 58 105; --primary-900: 164 0 85;

  /* Secondary - Electric Cyan Spectrum (EXACT MATCH REQUIRED) */
  --secondary-50: 224 255 255; --secondary-100: 179 255 255; --secondary-200: 136 255 255;
  --secondary-300: 0 255 255; --secondary-400: 0 191 255; --secondary-500: 102 217 239;
  --secondary-600: 126 200 227; --secondary-700: 90 79 207; --secondary-800: 74 150 255; --secondary-900: 0 120 168;

  /* Accent - Golden/Orange Spectrum (EXACT MATCH REQUIRED) */
  --accent-50: 255 243 160; --accent-100: 255 234 0; --accent-200: 255 221 68;
  --accent-300: 255 195 0; --accent-400: 230 219 116; --accent-500: 255 191 128;
  --accent-600: 255 154 96; --accent-700: 255 140 60; --accent-800: 255 111 48; --accent-900: 204 77 0;

  /* Background System */
  --bg-primary: 28 28 28; --bg-secondary: 44 26 41; --bg-tertiary: 40 27 76;
  --bg-surface: 30 30 63; --bg-overlay: 55 46 99; --bg-terminal: 13 13 13;
  
  /* Text System */
  --text-primary: 247 247 247; --text-secondary: 224 176 255; --text-accent: 102 217 239;
  --text-muted: 234 184 228; --text-bright: 255 255 255; --text-disabled: 185 134 193;
  
  /* Border System */
  --border-primary: 249 38 114; --border-secondary: 102 217 239; --border-subtle: 62 62 62;
  --border-accent: 255 191 128; --border-strong: 215 61 133;
  
  /* Glow Effects */
  --glow-primary: 249 38 114; --glow-secondary: 102 217 239; --glow-accent: 255 191 128;
}
```

## Component Overlay System (NEW - v2.0)

### Glass Morphism Requirements
All containers MUST support layered transparency:
```css
.container-class {
  background: rgba(var(--bg-surface), 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--border-primary), 0.3);
  box-shadow: 
    0 8px 32px rgba(var(--glow-primary), 0.15),
    inset 0 1px 0 rgba(255 255 255, 0.1);
}
```

### Component Scanning Effects (Neon Surge Inspired)
Interactive elements MUST include scanning overlays:
```css
.component::before {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(var(--glow-secondary), 0.4), 
    transparent);
  animation: component-scan 3s linear infinite;
}

@keyframes component-scan {
  0% { left: -100%; opacity: 0; }
  50% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
```

### Advanced Button System
Buttons MUST use clip-path for cyberpunk aesthetics:
```css
.vibe-btn {
  clip-path: polygon(15px 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%);
  background: linear-gradient(135deg, 
    rgba(var(--primary-500), 1), 
    rgba(var(--primary-600), 1));
  box-shadow: 
    0 0 20px rgba(var(--glow-primary), 0.6),
    inset 0 0 20px rgba(var(--secondary-500), 0.1);
}
```

### Multi-Layer Background System
Theme backgrounds MUST support complex gradients:
```css
.vibe-reader-container {
  background: 
    radial-gradient(ellipse at 20% 80%, rgba(var(--primary-500), 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(var(--secondary-500), 0.1) 0%, transparent 50%),
    linear-gradient(135deg, 
      rgba(var(--bg-primary), 1) 0%, 
      rgba(var(--bg-secondary), 1) 50%, 
      rgba(var(--bg-tertiary), 1) 100%);
}
```

## Enhanced Animation Requirements

### Glow Pulse System
```css
@keyframes enhanced-glow-pulse {
  0% { 
    box-shadow: 0 0 10px rgba(var(--glow-primary), 0.5);
    text-shadow: 0 0 10px rgba(var(--glow-primary), 0.5);
  }
  50% { 
    box-shadow: 
      0 0 20px rgba(var(--glow-primary), 0.8),
      0 0 40px rgba(var(--glow-secondary), 0.6),
      0 0 60px rgba(var(--glow-accent), 0.4);
    text-shadow: 
      0 0 20px rgba(var(--glow-primary), 0.8),
      0 0 40px rgba(var(--glow-secondary), 0.6);
  }
  100% { 
    box-shadow: 0 0 10px rgba(var(--glow-primary), 0.5);
    text-shadow: 0 0 10px rgba(var(--glow-primary), 0.5);
  }
}
```

### Theme-Specific Effect Requirements
Each theme MUST implement unique signature effects:

**Nightdrive**: Classic neon pulse with pink/cyan alternation + Orbitron font
**Neon Surge**: Electric scanning lines with pure black contrast + Fira Code font  
**Outrun Storm**: Lightning flash effects with dramatic weather overlays + Fira Code font
**Strange Days**: Phantom glitch effects with underground data corruption + Orbitron font

### Font System by Theme
```css
/* Nightdrive & Strange Days - Orbitron for classic synthwave aesthetic */
:root, [data-theme="strange-days"] {
  font-family: 'Orbitron', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
}

/* Neon Surge & Outrun Storm - Fira Code for technical/electric aesthetic */
[data-theme="neon-surge"], [data-theme="outrun-storm"] {
  font-family: 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
}
```

## Dynamic ASCII Container Sizing (NEW - v2.1)

### JavaScript-Controlled Sizing System
ASCII containers are **dynamically sized by JavaScript** based on rendered content dimensions:

```javascript
// ASCII conversion process:
// 1. Extract original image dimensions (naturalWidth/naturalHeight)
// 2. Calculate optimal ASCII character dimensions maintaining aspect ratio
// 3. Render ASCII with aalib.js using calculated dimensions
// 4. Measure actual rendered HTML element (offsetWidth/offsetHeight)
// 5. Size .media-ascii-display wrapper to match exactly
```

### CSS Implementation Requirements
```css
.media-ascii-display {
  /* DO NOT set fixed width/height - JavaScript will set these */
  /* Container must be flexible for dynamic sizing */
  display: block;
  overflow: auto;
  
  /* Styling properties only - dimensions handled by JavaScript */
  background: rgba(var(--bg-terminal), 0.9);
  border: 2px solid rgba(var(--border-secondary), 0.6);
  border-radius: 8px;
  padding: 1rem;
}

.ascii-art {
  /* Inherit theme font instead of forcing Fira Code */
  font-family: inherit;
  white-space: pre;
  overflow: hidden;
  line-height: 1.1;
  letter-spacing: 0.5px;
}

.ascii-canvas {
  image-rendering: pixelated;
  width: 100%;
  height: auto;
  display: block;
  max-width: 600px;  /*Prevent it from getting too large */
}

.media-ascii-display {
  width: fit-content;
  max-width: 100%;
}
```

### Dynamic Sizing Process
1. **Aspect Ratio Calculation**: Original image dimensions determine ASCII character grid size
2. **aalib.js Rendering**: Outputs actual HTML element with exact rendered dimensions  
3. **Direct DOM Measurement**: JavaScript measures `renderedElement.offsetWidth/offsetHeight`
4. **Wrapper Sizing**: Container styled with exact pixel dimensions: `wrapper.style.width = actualWidth + 'px'`
5. **Padding Compensation**: Additional padding offset applied for visual spacing

### Benefits of This Approach
- ✅ **Pixel-perfect sizing** - No CSS estimation errors
- ✅ **Aspect ratio preservation** - ASCII matches original image proportions  
- ✅ **Font-agnostic** - Works with any monospace font and size
- ✅ **Responsive** - Adapts to different ASCII character dimensions automatically