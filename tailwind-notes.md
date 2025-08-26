## Tailwind's Data Attribute Syntax

Tailwind v3.2+ introduced powerful data attribute selectors that work like this:

```css
/* Basic syntax: data-[attribute=value]: */
<div data-status="loading" class="data-[status=loading]:animate-pulse">

/* Boolean attributes: data-[attribute]: */
<div data-active class="data-[active]:bg-primary-500">

/* Arbitrary values with spaces need quotes: */
<div data-size="extra large" class="data-[size='extra large']:text-2xl">

/* Can check partial values with ~= */
<div data-categories="tech science" class="data-[categories~=tech]:text-blue-500">
```

## Group and Peer Mechanics

**Group**: Applies styles to children based on parent state
**Peer**: Applies styles to siblings based on adjacent element state

```css
/* GROUP: Parent → Children */
<div class="group hover:bg-primary-500" data-status="active">
  <span class="group-hover:text-white group-data-[status=active]:font-bold">
    I respond to my parent's state
  </span>
</div>

/* PEER: Sibling → Sibling */
<input type="checkbox" class="peer" checked>
<label class="peer-checked:text-primary-500 peer-hover:underline">
  I respond to my sibling input's state
</label>
```

## Creating Automatic Relationships with Helper Classes

Here's how to build a system where data attributes automatically cascade behaviors:

### 1. State Management Pattern

```css
@layer components {
  /* Define a component that automatically handles all states */
  .state-aware {
    @apply transition-all duration-200
    
    /* Loading states */
    data-[state=loading]:opacity-50
    data-[state=loading]:pointer-events-none
    data-[state=loading]:animate-pulse
    
    /* Success states */
    data-[state=success]:border-success-500
    data-[state=success]:bg-success-500/10
    
    /* Error states */
    data-[state=error]:border-error-500
    data-[state=error]:bg-error-500/10
    data-[state=error]:animate-shake
    
    /* Active states */
    data-[state=active]:ring-2
    data-[state=active]:ring-primary-500
    data-[state=active]:shadow-neon-primary;
  }

  /* Children automatically respond to parent state */
  .state-aware-child {
    @apply group-data-[state=loading]:animate-pulse
    group-data-[state=error]:text-error-500
    group-data-[state=success]:text-success-500;
  }
}
```

Usage:

```html
<div class="group state-aware" data-state="loading">
  <h2 class="state-aware-child">Auto-responds to parent</h2>
  <p class="state-aware-child">Me too!</p>
</div>
```

### 2. Progressive Enhancement Pattern

Build components that get richer with more data attributes:

```css
@layer components {
  .terminal {
    /* Base terminal */
    @apply bg-bg-surface border border-border-default rounded-lg;

    /* Side positioning - automatic */
    @apply data-[side=left]:rounded-l-none
    data-[side=left]:border-l-4
    data-[side=left]:border-l-primary-500
    
    data-[side=right]:rounded-r-none
    data-[side=right]:border-r-4
    data-[side=right]:border-r-secondary-500;

    /* Mode variations - stack automatically */
    @apply data-[mode=minimal]:p-2
    data-[mode=minimal]:text-xs
    
    data-[mode=normal]:p-4
    data-[mode=normal]:text-sm
    
    data-[mode=expanded]:p-6
    data-[mode=expanded]:text-base;

    /* Status indicators - visual feedback */
    @apply data-[connected=true]:shadow-neon-primary
    data-[connected=false]:opacity-50
    
    data-[streaming=true]:after:content-['']
    data-[streaming=true]:after:absolute
    data-[streaming=true]:after:bottom-2
    data-[streaming=true]:after:right-2
    data-[streaming=true]:after:w-2
    data-[streaming=true]:after:h-2
    data-[streaming=true]:after:bg-success-500
    data-[streaming=true]:after:rounded-full
    data-[streaming=true]:after:animate-pulse;
  }
}
```

Usage gets really clean:

```html
<div
  class="terminal"
  data-side="left"
  data-mode="expanded"
  data-connected="true"
  data-streaming="true"
>
  <!-- All styles automatically applied based on data attributes -->
</div>
```

### 3. Relationship Chains

Create complex relationships between elements:

```css
@layer components {
  /* Parent defines context */
  .workspace {
    @apply relative
    data-[theme=dark]:bg-black
    data-[theme=light]:bg-white
    data-[layout=grid]:grid
    data-[layout=flex]:flex;
  }

  /* Children adapt to parent context */
  .workspace-panel {
    @apply /* Respond to parent theme */
    group-data-[theme=dark]:bg-neutral-800
    group-data-[theme=light]:bg-neutral-100
    
    /* Respond to parent layout */
    group-data-[layout=grid]:col-span-1
    group-data-[layout=flex]:flex-1
    
    /* Own states */
    data-[active=true]:ring-2
    data-[active=true]:ring-primary-500
    data-[collapsed=true]:h-12
    data-[collapsed=true]:overflow-hidden;
  }

  /* Grandchildren can respond to both */
  .workspace-content {
    @apply /* Respond to grandparent theme */
    group-data-[theme=dark]:text-white
    group-data-[theme=light]:text-black
    
    /* Respond to parent panel state */
    group-data-[collapsed=true]:hidden;
  }
}
```

### 4. Peer Relationships for Forms

Automatic form validation styling:

```css
@layer components {
  .form-input {
    @apply peer border-2 px-4 py-2
    
    /* Invalid states */
    invalid:border-error-500
    invalid:bg-error-500/5
    
    /* Valid states */
    valid:border-success-500
    valid:bg-success-500/5
    
    /* Focus states */
    focus:outline-none
    focus:ring-2
    focus:ring-primary-500
    
    /* Disabled states */
    disabled:opacity-50
    disabled:cursor-not-allowed;
  }

  .form-error {
    @apply hidden text-error-500 text-sm mt-1
    peer-invalid:block
    peer-data-[touched=true]:peer-invalid:animate-shake;
  }

  .form-success {
    @apply hidden text-success-500 text-sm mt-1
    peer-valid:block;
  }

  .form-label {
    @apply text-sm font-medium
    peer-invalid:text-error-500
    peer-valid:text-success-500
    peer-focus:text-primary-500
    peer-disabled:opacity-50;
  }
}
```

Usage:

```html
<label class="form-label">Email</label>
<input type="email" class="form-input" required data-touched="true" />
<span class="form-error">Invalid email</span>
<span class="form-success">✓ Valid</span>
```

### 5. Theme-Aware Components

Make components automatically adapt to theme:

```css
@layer utilities {
  /* Create theme-aware utility classes */
  .theme-glow {
    @apply [data-theme=nightdrive_&]:shadow-button-nightdrive
    [data-theme=neon-surge_&]:shadow-button-neon
    [data-theme=outrun-storm_&]:shadow-button-storm
    [data-theme=strange-days_&]:shadow-button-phantom;
  }

  .theme-animate {
    @apply [data-theme=nightdrive_&]:animate-nightdrive-pulse
    [data-theme=neon-surge_&]:animate-electric-pulse
    [data-theme=outrun-storm_&]:animate-storm-pulse
    [data-theme=strange-days_&]:animate-phantom-flicker;
  }

  .theme-text {
    @apply [data-theme=nightdrive_&]:text-primary-500
    [data-theme=neon-surge_&]:text-secondary-500
    [data-theme=outrun-storm_&]:text-accent-500
    [data-theme=strange-days_&]:bg-gradient-to-r
    [data-theme=strange-days_&]:from-primary-500
    [data-theme=strange-days_&]:to-secondary-500
    [data-theme=strange-days_&]:bg-clip-text
    [data-theme=strange-days_&]:text-transparent;
  }
}
```

### 6. Advanced Group Modifiers

Combine group with other modifiers:

```css
@layer components {
  .interactive-card {
    @apply relative overflow-hidden;
  }

  .interactive-overlay {
    @apply absolute inset-0 bg-primary-500/20 -translate-y-full
    
    /* Multiple group states */
    group-hover:translate-y-0
    group-focus-within:translate-y-0
    group-data-[selected=true]:translate-y-0
    
    /* Combine with media queries */
    md:group-hover:backdrop-blur-sm
    
    /* Dark mode group variants */
    dark:group-hover:bg-primary-500/40
    
    transition-transform duration-300;
  }
}
```

### 7. Named Groups and Peers

For complex components with multiple interactive areas:

```css
/* HTML structure with named groups */
<div class="group/card">
  <div class="group/header">
    <button class="group-hover/header:text-primary-500">
      Hovering header affects me
    </button>
  </div>
  <div class="group-hover/card:bg-neutral-100">
    Hovering anywhere on card affects me
  </div>
</div>

/* You can also name peers */
<input class="peer/email" type="email">
<input class="peer/password" type="password">
<button class="peer-invalid/email:opacity-50 peer-invalid/password:opacity-50">
  Disabled unless both valid
</button>
```

The power comes from combining these patterns. Your extension could have terminals that automatically adapt to theme, state, position, and mode all through data attributes, keeping your JavaScript clean and your styles predictable!
Looking at your code, here are the top 3 priorities I see:

## 1. **Terminal System - Fix Group Patterns & Scan Effects**

Your `terminals.css` has incomplete implementations. Here's a better version:

```css
/* terminals.css - ENHANCED */

/* Base Terminal with proper group patterns */
.terminal-window {
  @apply relative bg-bg-surface border border-border-accent rounded-lg 
    shadow-lg z-sidebar overflow-hidden
    transition-all duration-300 ease-cyber
    
    /* Use Tailwind's data-* variants directly */
    data-[active=true]:shadow-neon-primary data-[active=true]:border-primary-500
    data-[error=true]:shadow-neon-accent data-[error=true]:border-error-500
    data-[scanning=true]:animate-pulse
    
    /* Group hover effects */
    group-hover:shadow-neon-dual group-hover:border-primary-400
    
    /* Add scan line that actually works */
    before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[2px]
    before:bg-gradient-to-r before:from-transparent before:via-secondary-500 before:to-transparent
    before:opacity-0 before:-translate-y-full
    before:transition-all before:duration-1000
    
    hover:before:opacity-100 hover:before:translate-y-[400px];
}

/* LED array that cascades properly */
.terminal-led-array {
  @apply flex gap-1;
}

.terminal-led {
  @apply w-2 h-2 rounded-full bg-neutral-600 transition-all duration-300
    
    /* Parent state awareness using group */
    group-hover:bg-success-500 group-hover:animate-pulse
    group-hover:shadow-[0_0_12px_rgb(var(--success-500))]
    
    group-data-[active=true]:bg-success-500 
    group-data-[active=true]:shadow-[0_0_8px_rgb(var(--success-500))]
    
    group-data-[error=true]:bg-error-500 
    group-data-[error=true]:animate-neon-flicker
    
    group-data-[scanning=true]:bg-accent-500 
    group-data-[scanning=true]:animate-electric-scan;
}

/* Cascade animation delays using nth-child */
.terminal-led-array .terminal-led:nth-child(1) {
  @apply group-hover:animation-delay-[0ms];
}
.terminal-led-array .terminal-led:nth-child(2) {
  @apply group-hover:animation-delay-[100ms];
}
.terminal-led-array .terminal-led:nth-child(3) {
  @apply group-hover:animation-delay-[200ms];
}
```

## 2. **Animation System - Missing Keyframes & Broken References**

Your `animations.css` is missing the glitch animation that `buttons.css` references. Add these:

```css
/* animations.css - ADD THESE MISSING ANIMATIONS */

@keyframes glitch {
  0%,
  100% {
    transform: translate(0);
    filter: hue-rotate(0deg);
  }
  20% {
    transform: translate(-2px, 2px);
    filter: hue-rotate(90deg);
  }
  40% {
    transform: translate(-2px, -2px);
    filter: hue-rotate(180deg);
  }
  60% {
    transform: translate(2px, 2px);
    filter: hue-rotate(270deg);
  }
  80% {
    transform: translate(2px, -2px);
    filter: hue-rotate(360deg);
  }
}

@keyframes electric-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2) saturate(1.2);
  }
}

@keyframes storm-pulse {
  0% {
    box-shadow: 0 0 20px rgb(var(--primary-500) / 0.5);
  }
  33% {
    box-shadow: 0 0 40px rgb(var(--secondary-500) / 0.7);
  }
  66% {
    box-shadow: 0 0 40px rgb(var(--accent-500) / 0.7);
  }
  100% {
    box-shadow: 0 0 20px rgb(var(--primary-500) / 0.5);
  }
}

@keyframes phantom-flicker {
  /* Your existing one is good but add this for variety */
  0%,
  100% {
    opacity: 1;
    filter: brightness(1);
  }
  10% {
    opacity: 0.8;
    filter: brightness(1.5) contrast(2);
  }
  20% {
    opacity: 1;
    filter: brightness(0.8) contrast(1.2);
  }
  30% {
    opacity: 0.9;
    filter: brightness(1.2) saturate(0);
  }
}
```

## 3. **Data Attribute Consistency - Standardize Your State System**

Create a new file `src/styles/utilities/states.css`:

```css
/* states.css - Unified state management system */

/* Universal state-aware component */
.state-aware {
  @apply transition-all duration-200
    
    /* Status states (for async operations) */
    data-[status=idle]:opacity-100
    data-[status=loading]:opacity-50 data-[status=loading]:pointer-events-none data-[status=loading]:animate-pulse
    data-[status=success]:border-success-500 data-[status=success]:bg-success-500/10
    data-[status=error]:border-error-500 data-[status=error]:bg-error-500/10 data-[status=error]:animate-shake
    
    /* Interactive states */
    data-[state=active]:ring-2 data-[state=active]:ring-primary-500 data-[state=active]:shadow-neon-primary
    data-[state=inactive]:opacity-60
    data-[state=disabled]:opacity-30 data-[state=disabled]:pointer-events-none
    
    /* Visual modes */
    data-[mode=compact]:p-2 data-[mode=compact]:text-xs
    data-[mode=normal]:p-4 data-[mode=normal]:text-sm
    data-[mode=expanded]:p-6 data-[mode=expanded]:text-base
    
    /* Position variants */
    data-[position=left]:rounded-l-none data-[position=left]:border-l-4
    data-[position=right]:rounded-r-none data-[position=right]:border-r-4
    data-[position=center]:rounded-none data-[position=center]:border-x-4;
}

/* Children automatically respond */
.state-aware-child {
  @apply transition-all duration-200
    group-data-[status=loading]:animate-pulse
    group-data-[status=error]:text-error-500
    group-data-[status=success]:text-success-500
    group-data-[state=active]:font-bold
    group-data-[state=inactive]:opacity-50;
}

/* Theme-aware state patterns */
.theme-state {
  @apply [data-theme=nightdrive_&]:data-[state=active]:shadow-button-nightdrive
    [data-theme=neon-surge_&]:data-[state=active]:shadow-button-neon
    [data-theme=outrun-storm_&]:data-[state=active]:shadow-button-storm
    [data-theme=strange-days_&]:data-[state=active]:shadow-button-phantom;
}
```

Then update your HTML usage to be consistent:

```html
<!-- Terminal with consistent data attributes -->
<div
  class="terminal-window group state-aware"
  data-status="loading"
  data-state="active"
  data-position="left"
>
  <div class="terminal-led-array">
    <div class="terminal-led"></div>
    <div class="terminal-led"></div>
    <div class="terminal-led"></div>
  </div>
  <div class="terminal-content state-aware-child">
    <!-- Content responds to parent state -->
  </div>
</div>
```

The key issues were:

1. **Terminals** weren't using Tailwind's `group-data-[attribute=value]:` syntax properly
2. **Animations** had broken references between files
3. **State management** was inconsistent (status vs state vs mode)

These fixes will make your themes actually feel different and your components more reactive!

The plan has the right core ideas but needs refinement in several areas:

## Critical Issues to Address

### 1. Tailwind Config Syntax is Wrong

Your `matchUtilities` syntax won't work. The selector should be:

```javascript
matchUtilities(
  {
    "terminal-border": (value) => ({
      '&[data-side="left"]': {
        // & comes FIRST
        borderLeftWidth: "4px",
        borderLeftColor: `rgb(var(--${value}) / 1)`,
        boxShadow: `inset 4px 0 10px rgb(var(--${value}) / 0.3)`,
      },
      '&[data-side="right"]': {
        borderRightWidth: "4px",
        borderRightColor: `rgb(var(--${value}) / 1)`,
        boxShadow: `inset -4px 0 10px rgb(var(--${value}) / 0.3)`,
      },
    }),
  },
  {
    values: {
      primary: "primary-500",
      secondary: "secondary-500",
      // etc
    },
  }
);
```

### 2. Collapsed State Management Missing

You need to track collapsed state with data attributes:

```javascript
// Add to your event handler
const header = e.target.closest(".category-header");
const content = header.nextElementSibling;
const isCollapsed = header.dataset.collapsed === "true";

header.dataset.collapsed = !isCollapsed;
content.style.maxHeight = isCollapsed ? content.scrollHeight + "px" : "0";
```

### 3. Append-Only Memory Issues

Long-running terminals will accumulate thousands of DOM nodes. Add a rolling buffer:

```javascript
const MAX_LOG_ENTRIES = 500;

function appendLog(terminal, entry) {
  terminal.appendChild(entry);

  // Remove old entries
  while (terminal.children.length > MAX_LOG_ENTRIES) {
    terminal.removeChild(terminal.firstChild);
  }

  // Maintain scroll position if at bottom
  if (
    terminal.scrollHeight - terminal.scrollTop <=
    terminal.clientHeight + 50
  ) {
    terminal.scrollTop = terminal.scrollHeight;
  }
}
```

### 4. DOS Popup CSS Won't Work

CSS content with Unicode box characters is unreliable. Use this instead:

```css
.dos-popup {
  @apply bg-black text-green-400 p-4 font-mono text-xs;
  border: 2px solid #00ff00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1);
  position: relative;
}

.dos-popup::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 1px solid #00ff00;
  opacity: 0.5;
}
```

### 5. Event System Needs Structure

Instead of custom events everywhere, create a centralized logger:

```javascript
class TerminalLogger {
  constructor() {
    this.leftTerminal = document.querySelector(
      '[data-side="left"] .terminal-content'
    );
    this.rightTerminal = document.querySelector(
      '[data-side="right"] .terminal-content'
    );
  }

  log(side, category, message, status = "info") {
    const entry = this.createLogEntry(category, message, status);
    const terminal = side === "left" ? this.leftTerminal : this.rightTerminal;

    this.appendLog(terminal, entry);
    this.updateStatus(terminal.closest(".terminal-window"), status);
  }

  updateStatus(terminal, status) {
    terminal.dataset.status = status;

    if (status === "error" || status === "warning") {
      terminal.dataset.previousStatus = terminal.dataset.status;
      setTimeout(() => {
        terminal.dataset.status = terminal.dataset.previousStatus || "idle";
      }, 5000);
    }
  }
}
```

### 6. Terminal Screen Layout Needs Flexibility

Fixed positioning might conflict with your header. Use CSS Grid:

```css
.vibe-container {
  @apply grid grid-rows-[auto_1fr];
}

.terminal-screen {
  @apply grid grid-cols-2 gap-2 p-2 overflow-hidden;
}

.terminal-window {
  @apply flex flex-col min-h-0; /* min-h-0 is crucial for overflow */
}
```

---

# FINAL IMPLEMENTATION PLAN - VERIFIED & READY

## Phase 1: CSS Selector Fix (Root Cause)
**Problem**: Generated CSS has `.vibe-container [data-theme="..."]` but JS sets `data-theme` on `.vibe-container` itself

**Solution**: Update theme files to use explicit selector that compiles correctly:
```css
/* Change ALL theme files from: */
[data-theme="nightdrive"] .vibe-container { }
/* To: */
.vibe-container[data-theme="nightdrive"] { }
```

## Phase 2: Add Missing Animations  
**Add to `src/styles/utilities/animations.css`:**
```css
@keyframes glitch {
  0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
  20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
  40% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
  60% { transform: translate(2px, 2px); filter: hue-rotate(270deg); }
  80% { transform: translate(2px, -2px); filter: hue-rotate(360deg); }
}

@keyframes electric-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.2) saturate(1.2); }
}
```

## Phase 3: Fix Terminal Group Patterns
**Update `src/styles/components/terminals.css`:**
```css
.terminal-window {
  @apply data-[active=true]:shadow-neon-primary 
    data-[error=true]:shadow-neon-accent 
    before:content-[''] before:absolute before:inset-x-0 before:top-0 
    before:h-[2px] before:bg-gradient-to-r before:from-transparent 
    before:via-secondary-500 before:to-transparent
    hover:before:opacity-100 hover:before:translate-y-[400px];
}

.terminal-led {
  @apply group-data-[active=true]:bg-success-500 
    group-data-[error=true]:bg-error-500 
    group-data-[scanning=true]:bg-accent-500;
}
```

## Phase 4: Implement TerminalLogger
**Replace polling with event-driven append-only logging in `proxy-controller.js`:**
- Remove `updateLiveTerminals()` and `setInterval`
- Add TerminalLogger class with 500-entry rolling buffer
- Implement proper event delegation for click-to-expand

## Phase 5: Fix Tailwind Config
**Update `tailwind.config.js` with correct ampersand-first syntax:**
```javascript
matchUtilities({
  'terminal-border': (value) => ({
    '&[data-side="left"]': { /* & comes FIRST */ }
  })
})
```

## Phase 6: Rebuild & Test
```bash
npm run build:css:prod
```

**Expected Results:**
✅ Theme switching works across all 4 themes  
✅ Click-to-expand categories functional  
✅ No more CSS variable errors  
✅ Memory-safe rolling buffer  
✅ Event-driven real-time logging  
✅ Status-based terminal border colors

The core architecture is solid - event-driven updates, data attributes for state, and removing polling. These implementation details will complete the system.
