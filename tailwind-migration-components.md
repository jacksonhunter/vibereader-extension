# Tailwind Migration - Component List

## JavaScript Class References (62 total)

### Layout Components (8)

- `.vibe-reader-container` - Main overlay container
- `.vibe-reader-overlay` - Fullscreen overlay
- `.vibe-reader-proxy` - Proxy interface
- `.vibe-layout` - Main layout wrapper
- `.vibe-header` - Header container
- `.vibe-content` - Content area
- `.vibe-sidebar` - Sidebar panels
- `.vibe-sidebar-spacer` - Sidebar spacing

### Terminal Components (10)

- `.terminal-window` - Terminal container
- `.terminal-header` - Terminal title bar
- `.terminal-content` - Terminal scrollable content
- `.terminal-line` - Individual terminal lines
- `.terminal-title` - Terminal window title
- `.left-panel` - Left terminal panel
- `.right-panel` - Right terminal panel
- `.led-indicator` - Status LED lights
- `.diagnostic-category` - Diagnostic message categories
- `.vibe-status` - Status indicators

### Article Content (8)

- `.vibe-article` - Article wrapper
- `.article-content` - Main article text
- `.article-header` - Article header section
- `.article-title` - Article title
- `.article-byline` - Author/date info
- `.article-meta` - Metadata display
- `.meta-item` - Individual meta items
- `.vibe-brand` - Branding elements

### Media Components (10)

- `.media-wrapper` - Media container
- `.ascii-art` - ASCII art display
- `.ascii-canvas` - ASCII rendering area
- `.cyber-media` - Cyberpunk-styled media
- `.media-ascii-display` - ASCII media mode
- `.media-emoji-display` - Emoji media mode
- `.emoji-icon` - Emoji display
- `.media-label` - Media labels
- `.media-btn` - Media action buttons
- `.mode-hint` - Mode indicator hints

### Interactive Elements (12)

- `.vibe-btn` - Primary buttons
- `.theme-btn` - Theme switcher
- `.media-btn` - Media controls
- `.retry-btn` - Retry actions
- `.disconnect-btn` - Disconnect controls
- `.cyber-link` - Cyberpunk links
- `.cyber-heading` - Enhanced headings
- `.cyber-code` - Code styling
- `.cyber-table` - Table styling
- `.category-header` - Category headers
- `.category-content` - Category content
- `.vibe-header-left` - Left header section
- `.vibe-header-right` - Right header section

### Visual Effects (8)

- `.glitch` - Glitch text effect
- `.glitching` - Active glitch state
- `.matrix-drop` - Matrix rain drops
- `.retrofuture-bg-effects` - Background effects
- `.vibe-rain-container` - Rain effect container
- `.progress-bar` - Progress indicators
- `.progress-fill` - Progress fill
- `.extraction-progress` - Extraction progress

### Status & Error (6)

- `.extraction-status` - Extraction state
- `.error-display` - Error container
- `.error-message` - Error text
- `.error-title` - Error heading
- `.error-details` - Error details
- `.error-icon` - Error icons

## Component Grouping for Tailwind Migration

### Priority 1: Core Layout

```
vibe-reader-container, vibe-layout, vibe-header, vibe-content
```

### Priority 2: Terminal System

```
terminal-window, terminal-header, terminal-content, left-panel, right-panel
```

### Priority 3: Article Content

```
vibe-article, article-content, article-title, article-header
```

### Priority 4: Interactive Elements

```
vibe-btn, theme-btn, media-btn, cyber-link
```

### Priority 5: Effects & Media

```
glitch, matrix-drop, ascii-art, media-wrapper
```

## Future UI Components (Optional/Hidden by Default)

### Header Extensions

- `.navigation-bar` - Top navigation bar (hidden by default)
- `.nav-back-btn` - Back navigation button
- `.nav-forward-btn` - Forward navigation button
- `.search-bar` - Search input field
- `.search-btn` - Search action button
- `.masthead` - Site information masthead (hidden by default)
- `.masthead-toggle` - Toggle masthead visibility

### Terminal Enhancements

- `.terminal-container` - Multiple containers within terminal panels (wraps terminal header, content, title, etc)
- `.terminal-popup` - Popup terminal window
- `.terminal-popup-header` - Popup header with controls
- `.terminal-popup-content` - Popup scrollable content
- `.terminal-popup-close` - Close popup button

### Control Panels

- `.control-panel` - Left terminal slide-out controls
- `.control-panel-toggle` - Panel toggle buttons
- `.control-panel-header` - Control panel headers
- `.control-panel-content` - Control panel button areas
- `.control-clear-log` - Clear log button
- `.control-export-log` - Export log button
- `.control-filter-messages` - Filter messages button

### Component Relationships

```
Header Group:
- vibe-header (existing)
  └── navigation-bar (optional)
      ├── nav-back-btn
      ├── nav-forward-btn
      └── search-bar
  └── masthead (optional)

Terminal Group:
- terminal-window (existing)
  ├── terminal-container (multiple)
  └── terminal-popup (optional)
  └── control-panel (slide-out)
```
