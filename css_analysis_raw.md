# CSS References Analysis for Tailwind Migration

## Summary
- JavaScript files analyzed: 3
- CSS files analyzed: 2
- Total CSS class references in JS: 182
- Total CSS ID references in JS: 4
- Total CSS variable references in JS: 0
- Total CSS class definitions: 211
- Total CSS ID definitions: 17
- Total CSS variable definitions: 74

## JavaScript CSS References

### background-enhanced.js

### stealth-extractor.js

#### Inline_Styles

**display**
- Line 315: style property assignment
  ```javascript
  el.style.display = '';
  ```

#### Selectors

**#__next**
- Line 102: querySelector
  ```javascript
  } else if (document.querySelector('#__next')) {
  ```
- Line 639: querySelector
  ```javascript
  if (document.querySelector('#__next')) frameworks.push('Next.js');
  ```

**#app**
- Line 178: querySelector
  ```javascript
  const vueApp = document.querySelector('#app');
  ```

**#app[data-v-]**
- Line 96: querySelector
  ```javascript
  } else if (window.Vue || document.querySelector('#app[data-v-]') || document.querySelector('[data-server-rendered]')) {
  ```

**#root**
- Line 94: querySelector
  ```javascript
  if (window.React || document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
  ```

*****
- Line 623: querySelectorAll
  ```javascript
  totalElements: document.querySelectorAll('*').length,
  ```

**[data-reactroot]**
- Line 94: querySelector
  ```javascript
  if (window.React || document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
  ```

**[data-reactroot], #root, #__next**
- Line 173: querySelector
  ```javascript
  const reactRoot = document.querySelector('[data-reactroot], #root, #__next');
  ```

**[data-server-rendered]**
- Line 96: querySelector
  ```javascript
  } else if (window.Vue || document.querySelector('#app[data-v-]') || document.querySelector('[data-server-rendered]')) {
  ```

**[data-svelte]**
- Line 100: querySelector
  ```javascript
  } else if (document.querySelector('[data-svelte]')) {
  ```
- Line 640: querySelector
  ```javascript
  if (document.querySelector('[data-svelte]')) frameworks.push('Svelte');
  ```

**[hidden]**
- Line 318: querySelectorAll
  ```javascript
  doc.querySelectorAll('[hidden]').forEach(el => {
  ```

**[ng-app]**
- Line 98: querySelector
  ```javascript
  } else if (window.angular || document.querySelector('[ng-app]') || document.querySelector('[ng-version]')) {
  ```

**[ng-app], [ng-version]**
- Line 183: querySelector
  ```javascript
  const ngApp = document.querySelector('[ng-app], [ng-version]');
  ```

**[ng-version]**
- Line 98: querySelector
  ```javascript
  } else if (window.angular || document.querySelector('[ng-app]') || document.querySelector('[ng-version]')) {
  ```

**div, section, article**
- Line 387: querySelectorAll
  ```javascript
  document.querySelectorAll('div, section, article').forEach(el => {
  ```

**img, a**
- Line 342: querySelectorAll
  ```javascript
  tempDiv.querySelectorAll('img, a').forEach(el => {
  ```

**img[data-src], img[data-lazy-src]**
- Line 322: querySelectorAll
  ```javascript
  doc.querySelectorAll('img[data-src], img[data-lazy-src]').forEach(img => {
  ```

**p**
- Line 336: querySelectorAll
  ```javascript
  tempDiv.querySelectorAll('p').forEach(p => {
  ```

### proxy-controller.js

#### Classes

**article-byline**
- Line 671: HTML class attribute
  ```javascript
  ${metadata?.byline ? `<div class="article-byline">BY: ${this.escapeHtml(metadata.byline)}</div>` : ''}
  ```
- Line 671: Template literal class
  ```javascript
  ${metadata?.byline ? `<div class="article-byline">BY: ${this.escapeHtml(metadata.byline)}</div>` : ''}
  ```

**article-content**
- Line 558: HTML class attribute
  ```javascript
  <div class="article-content">
  ```
- Line 558: Template literal class
  ```javascript
  <div class="article-content">
  ```
- Line 679: HTML class attribute
  ```javascript
  <div class="article-content">
  ```
- Line 679: Template literal class
  ```javascript
  <div class="article-content">
  ```

**article-header**
- Line 548: HTML class attribute
  ```javascript
  <header class="article-header">
  ```
- Line 548: Template literal class
  ```javascript
  <header class="article-header">
  ```
- Line 667: HTML class attribute
  ```javascript
  <header class="article-header">
  ```
- Line 667: Template literal class
  ```javascript
  <header class="article-header">
  ```

**article-meta**
- Line 552: HTML class attribute
  ```javascript
  <div class="article-meta">
  ```
- Line 552: Template literal class
  ```javascript
  <div class="article-meta">
  ```
- Line 672: HTML class attribute
  ```javascript
  <div class="article-meta">
  ```
- Line 672: Template literal class
  ```javascript
  <div class="article-meta">
  ```

**article-title**
- Line 549: HTML class attribute
  ```javascript
  <h1 class="article-title glitch" data-text="INITIALIZING">
  ```
- Line 549: Template literal class
  ```javascript
  <h1 class="article-title glitch" data-text="INITIALIZING">
  ```
- Line 668: HTML class attribute
  ```javascript
  <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata?.title || 'UNTITLED')}">
  ```
- Line 668: Template literal class
  ```javascript
  <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata?.title || 'UNTITLED')}">
  ```

**ascii-art**
- Line 47: className assignment
  ```javascript
  tester.className = 'ascii-art';
  ```
- Line 836: HTML class attribute
  ```javascript
  <pre class="ascii-art">${label}</pre>
  ```
- Line 836: Template literal class
  ```javascript
  <pre class="ascii-art">${label}</pre>
  ```

**ascii-canvas**
- Line 837: HTML class attribute
  ```javascript
  <canvas class="ascii-canvas"></canvas>
  ```
- Line 837: Template literal class
  ```javascript
  <canvas class="ascii-canvas"></canvas>
  ```
- Line 953: className assignment
  ```javascript
  canvas.className = 'ascii-canvas';
  ```

**category-content**
- Line 1511: HTML class attribute
  ```javascript
  html += '<div class="category-content">';
  ```
- Line 1511: Template literal class
  ```javascript
  html += '<div class="category-content">';
  ```
- Line 1518: HTML class attribute
  ```javascript
  html += '<div class="category-content"><div class="terminal-line">  [No activity]</div></div>';
  ```
- Line 1518: Template literal class
  ```javascript
  html += '<div class="category-content"><div class="terminal-line">  [No activity]</div></div>';
  ```

**category-header**
- Line 1505: HTML class attribute
  ```javascript
  <div class="category-header" data-category="${categoryName}">
  ```
- Line 1505: Template literal class
  ```javascript
  <div class="category-header" data-category="${categoryName}">
  ```

**cyber-code**
- Line 722: classList.add
  ```javascript
  code.classList.add('cyber-code');
  ```

**cyber-heading**
- Line 712: classList.add
  ```javascript
  heading.classList.add('cyber-heading');
  ```

**cyber-link**
- Line 716: classList.add
  ```javascript
  link.classList.add('cyber-link');
  ```

**cyber-media**
- Line 788: classList.add
  ```javascript
  clone.classList.add('cyber-media');
  ```

**cyber-table**
- Line 1179: classList.add
  ```javascript
  table.classList.add('cyber-table');
  ```

**diagnostic-category**
- Line 1504: HTML class attribute
  ```javascript
  <div class="diagnostic-category" data-category="${categoryName}">
  ```
- Line 1504: Template literal class
  ```javascript
  <div class="diagnostic-category" data-category="${categoryName}">
  ```

**disconnect-btn**
- Line 539: HTML class attribute
  ```javascript
  <button class="vibe-btn disconnect-btn" title="Disconnect">🌑</button>
  ```
- Line 539: Template literal class
  ```javascript
  <button class="vibe-btn disconnect-btn" title="Disconnect">🌑</button>
  ```
- Line 618: classList.contains
  ```javascript
  } else if (target.classList.contains('disconnect-btn')) {
  ```

**emoji-icon**
- Line 802: HTML class attribute
  ```javascript
  <div class="emoji-icon">${emoji}</div>
  ```
- Line 802: Template literal class
  ```javascript
  <div class="emoji-icon">${emoji}</div>
  ```

**error-details**
- Line 1349: HTML class attribute
  ```javascript
  <div class="error-details">
  ```
- Line 1349: Template literal class
  ```javascript
  <div class="error-details">
  ```

**error-display**
- Line 1345: HTML class attribute
  ```javascript
  <div class="error-display">
  ```
- Line 1345: Template literal class
  ```javascript
  <div class="error-display">
  ```

**error-icon**
- Line 1346: HTML class attribute
  ```javascript
  <div class="error-icon">⚠️</div>
  ```
- Line 1346: Template literal class
  ```javascript
  <div class="error-icon">⚠️</div>
  ```

**error-message**
- Line 1348: HTML class attribute
  ```javascript
  <div class="error-message">${this.escapeHtml(detailedError)}</div>
  ```
- Line 1348: Template literal class
  ```javascript
  <div class="error-message">${this.escapeHtml(detailedError)}</div>
  ```

**error-title**
- Line 1347: HTML class attribute
  ```javascript
  <div class="error-title">EXTRACTION FAILED</div>
  ```
- Line 1347: Template literal class
  ```javascript
  <div class="error-title">EXTRACTION FAILED</div>
  ```

**extraction-progress**
- Line 559: HTML class attribute
  ```javascript
  <div class="extraction-progress">
  ```
- Line 559: Template literal class
  ```javascript
  <div class="extraction-progress">
  ```

**extraction-status**
- Line 563: HTML class attribute
  ```javascript
  <p class="extraction-status">Initializing extraction...</p>
  ```
- Line 563: Template literal class
  ```javascript
  <p class="extraction-status">Initializing extraction...</p>
  ```

**glitch**
- Line 549: HTML class attribute
  ```javascript
  <h1 class="article-title glitch" data-text="INITIALIZING">
  ```
- Line 549: Template literal class
  ```javascript
  <h1 class="article-title glitch" data-text="INITIALIZING">
  ```
- Line 668: HTML class attribute
  ```javascript
  <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata?.title || 'UNTITLED')}">
  ```
- Line 668: Template literal class
  ```javascript
  <h1 class="article-title glitch" data-text="${this.escapeHtml(metadata?.title || 'UNTITLED')}">
  ```

**glitching**
- Line 1423: classList.add
  ```javascript
  el.classList.add('glitching');
  ```
- Line 1425: classList.remove
  ```javascript
  el.classList.remove('glitching');
  ```

**led-indicator**
- Line 584: HTML class attribute
  ```javascript
  <div class="led-indicator"></div>
  ```
- Line 584: Template literal class
  ```javascript
  <div class="led-indicator"></div>
  ```
- Line 600: HTML class attribute
  ```javascript
  <div class="led-indicator"></div>
  ```
- Line 600: Template literal class
  ```javascript
  <div class="led-indicator"></div>
  ```

**left-panel**
- Line 580: HTML class attribute
  ```javascript
  <aside class="vibe-sidebar left-panel">
  ```
- Line 580: Template literal class
  ```javascript
  <aside class="vibe-sidebar left-panel">
  ```

**matrix-drop**
- Line 1448: className assignment
  ```javascript
  drop.className = 'matrix-drop';
  ```

**media-ascii-display**
- Line 835: HTML class attribute
  ```javascript
  <div class="media-ascii-display">
  ```
- Line 835: Template literal class
  ```javascript
  <div class="media-ascii-display">
  ```

**media-btn**
- Line 537: HTML class attribute
  ```javascript
  <button class="vibe-btn media-btn" title="Toggle Media Mode">🌌</button>
  ```
- Line 537: Template literal class
  ```javascript
  <button class="vibe-btn media-btn" title="Toggle Media Mode">🌌</button>
  ```
- Line 614: classList.contains
  ```javascript
  if (target.classList.contains('media-btn')) {
  ```

**media-emoji-display**
- Line 801: HTML class attribute
  ```javascript
  <div class="media-emoji-display">
  ```
- Line 801: Template literal class
  ```javascript
  <div class="media-emoji-display">
  ```

**media-label**
- Line 803: HTML class attribute
  ```javascript
  <div class="media-label">${label}</div>
  ```
- Line 803: Template literal class
  ```javascript
  <div class="media-label">${label}</div>
  ```

**media-wrapper**
- Line 747: className assignment
  ```javascript
  wrapper.className = 'media-wrapper';
  ```

**meta-item**
- Line 553: HTML class attribute
  ```javascript
  <span class="meta-item">🔥 VIBE MODE ENGAGED</span>
  ```
- Line 553: Template literal class
  ```javascript
  <span class="meta-item">🔥 VIBE MODE ENGAGED</span>
  ```
- Line 554: HTML class attribute
  ```javascript
  <span class="meta-item">⚡ EXTRACTING CONTENT</span>
  ```
- Line 554: Template literal class
  ```javascript
  <span class="meta-item">⚡ EXTRACTING CONTENT</span>
  ```
- Line 673: HTML class attribute
  ```javascript
  <span class="meta-item">📍 ${metadata?.siteName || 'Unknown'}</span>
  ```
- Line 673: Template literal class
  ```javascript
  <span class="meta-item">📍 ${metadata?.siteName || 'Unknown'}</span>
  ```
- Line 674: HTML class attribute
  ```javascript
  <span class="meta-item">📝 ${this.formatWordCount(metadata?.length || 0)}</span>
  ```
- Line 674: Template literal class
  ```javascript
  <span class="meta-item">📝 ${this.formatWordCount(metadata?.length || 0)}</span>
  ```
- Line 675: HTML class attribute
  ```javascript
  <span class="meta-item">⏱️ ${this.calculateReadingTime(metadata?.length || 0)} min</span>
  ```
- Line 675: Template literal class
  ```javascript
  <span class="meta-item">⏱️ ${this.calculateReadingTime(metadata?.length || 0)} min</span>
  ```

**mode-hint**
- Line 804: HTML class attribute
  ```javascript
  <div class="mode-hint">Click to cycle</div>
  ```
- Line 804: Template literal class
  ```javascript
  <div class="mode-hint">Click to cycle</div>
  ```

**progress-bar**
- Line 560: HTML class attribute
  ```javascript
  <div class="progress-bar">
  ```
- Line 560: Template literal class
  ```javascript
  <div class="progress-bar">
  ```

**progress-fill**
- Line 561: HTML class attribute
  ```javascript
  <div class="progress-fill" style="width: 0%"></div>
  ```
- Line 561: Template literal class
  ```javascript
  <div class="progress-fill" style="width: 0%"></div>
  ```

**retrofuture-bg-effects**
- Line 573: HTML class attribute
  ```javascript
  <div class="retrofuture-bg-effects"></div>
  ```
- Line 573: Template literal class
  ```javascript
  <div class="retrofuture-bg-effects"></div>
  ```

**retry-btn**
- Line 1353: HTML class attribute
  ```javascript
  <button class="vibe-btn retry-btn">RETRY EXTRACTION</button>
  ```
- Line 1353: Template literal class
  ```javascript
  <button class="vibe-btn retry-btn">RETRY EXTRACTION</button>
  ```

**right-panel**
- Line 596: HTML class attribute
  ```javascript
  <aside class="vibe-sidebar right-panel">
  ```
- Line 596: Template literal class
  ```javascript
  <aside class="vibe-sidebar right-panel">
  ```

**terminal-content**
- Line 586: HTML class attribute
  ```javascript
  <div class="terminal-content" id="left-terminal">
  ```
- Line 586: Template literal class
  ```javascript
  <div class="terminal-content" id="left-terminal">
  ```
- Line 602: HTML class attribute
  ```javascript
  <div class="terminal-content" id="right-terminal">
  ```
- Line 602: Template literal class
  ```javascript
  <div class="terminal-content" id="right-terminal">
  ```

**terminal-header**
- Line 582: HTML class attribute
  ```javascript
  <div class="terminal-header">
  ```
- Line 582: Template literal class
  ```javascript
  <div class="terminal-header">
  ```
- Line 598: HTML class attribute
  ```javascript
  <div class="terminal-header">
  ```
- Line 598: Template literal class
  ```javascript
  <div class="terminal-header">
  ```

**terminal-line**
- Line 587: HTML class attribute
  ```javascript
  <div class="terminal-line">> SYSADMIN INIT...</div>
  ```
- Line 587: Template literal class
  ```javascript
  <div class="terminal-line">> SYSADMIN INIT...</div>
  ```
- Line 603: HTML class attribute
  ```javascript
  <div class="terminal-line">> NETWORK INIT...</div>
  ```
- Line 603: Template literal class
  ```javascript
  <div class="terminal-line">> NETWORK INIT...</div>
  ```
- Line 1188: HTML class attribute
  ```javascript
  leftTerminal.innerHTML = [`> STATUS: ${status}`, `> PROGRESS: ${progress}%`, `> TIME: ${new Date().toLocaleTimeString()}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1188: Template literal class
  ```javascript
  leftTerminal.innerHTML = [`> STATUS: ${status}`, `> PROGRESS: ${progress}%`, `> TIME: ${new Date().toLocaleTimeString()}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1192: HTML class attribute
  ```javascript
  rightTerminal.innerHTML = [`> PROXY: ACTIVE`, `> EXTRACTION: ${progress}%`, `> MODE: ${this.currentTheme}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1192: Template literal class
  ```javascript
  rightTerminal.innerHTML = [`> PROXY: ACTIVE`, `> EXTRACTION: ${progress}%`, `> MODE: ${this.currentTheme}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1201: HTML class attribute
  ```javascript
  leftTerminal.innerHTML = ['> EXTRACTION: COMPLETE', `> TITLE: ${(metadata?.title || 'UNTITLED').substring(0, 30)}`, `> WORDS: ${metadata?.length || 0}`, `> TIME: ${new Date().toLocaleTimeString()}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1201: Template literal class
  ```javascript
  leftTerminal.innerHTML = ['> EXTRACTION: COMPLETE', `> TITLE: ${(metadata?.title || 'UNTITLED').substring(0, 30)}`, `> WORDS: ${metadata?.length || 0}`, `> TIME: ${new Date().toLocaleTimeString()}`].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1205: HTML class attribute
  ```javascript
  rightTerminal.innerHTML = ['> PROXY: CONNECTED', `> SOURCE: ${metadata?.siteName || 'Unknown'}`, `> FRAMEWORK: ${metadata?.framework || 'vanilla'}`, '> STATUS: ACTIVE'].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1205: Template literal class
  ```javascript
  rightTerminal.innerHTML = ['> PROXY: CONNECTED', `> SOURCE: ${metadata?.siteName || 'Unknown'}`, `> FRAMEWORK: ${metadata?.framework || 'vanilla'}`, '> STATUS: ACTIVE'].map(line => `<div class="terminal-line">${line}</div>`).join('');
  ```
- Line 1514: HTML class attribute
  ```javascript
  html += `<div class="terminal-line">  ${log.level}: ${log.message}${countDisplay}</div>`;
  ```
- Line 1514: Template literal class
  ```javascript
  html += `<div class="terminal-line">  ${log.level}: ${log.message}${countDisplay}</div>`;
  ```
- Line 1518: HTML class attribute
  ```javascript
  html += '<div class="category-content"><div class="terminal-line">  [No activity]</div></div>';
  ```
- Line 1518: Template literal class
  ```javascript
  html += '<div class="category-content"><div class="terminal-line">  [No activity]</div></div>';
  ```
- Line 1566: HTML class attribute
  ```javascript
  html = '<div class="terminal-line">> [Waiting for events...]</div>';
  ```
- Line 1566: Template literal class
  ```javascript
  html = '<div class="terminal-line">> [Waiting for events...]</div>';
  ```
- Line 1593: HTML class attribute
  ```javascript
  html = '<div class="terminal-line">> [Monitoring network...]</div>';
  ```
- Line 1593: Template literal class
  ```javascript
  html = '<div class="terminal-line">> [Monitoring network...]</div>';
  ```

**terminal-title**
- Line 583: HTML class attribute
  ```javascript
  <span class="terminal-title">▓ SYSADMIN ▓</span>
  ```
- Line 583: Template literal class
  ```javascript
  <span class="terminal-title">▓ SYSADMIN ▓</span>
  ```
- Line 599: HTML class attribute
  ```javascript
  <span class="terminal-title">▓ NETMON ▓</span>
  ```
- Line 599: Template literal class
  ```javascript
  <span class="terminal-title">▓ NETMON ▓</span>
  ```

**terminal-window**
- Line 581: HTML class attribute
  ```javascript
  <div class="terminal-window">
  ```
- Line 581: Template literal class
  ```javascript
  <div class="terminal-window">
  ```
- Line 597: HTML class attribute
  ```javascript
  <div class="terminal-window">
  ```
- Line 597: Template literal class
  ```javascript
  <div class="terminal-window">
  ```

**theme-btn**
- Line 538: HTML class attribute
  ```javascript
  <button class="vibe-btn theme-btn" title="Cycle Theme">🌆</button>
  ```
- Line 538: Template literal class
  ```javascript
  <button class="vibe-btn theme-btn" title="Cycle Theme">🌆</button>
  ```
- Line 616: classList.contains
  ```javascript
  } else if (target.classList.contains('theme-btn')) {
  ```

**vibe-article**
- Line 547: HTML class attribute
  ```javascript
  <article class="vibe-article">
  ```
- Line 547: Template literal class
  ```javascript
  <article class="vibe-article">
  ```
- Line 666: HTML class attribute
  ```javascript
  <article class="vibe-article">
  ```
- Line 666: Template literal class
  ```javascript
  <article class="vibe-article">
  ```

**vibe-brand**
- Line 533: HTML class attribute
  ```javascript
  <span class="vibe-brand">▓▓ VIBE READER v2.0 ▓▓</span>
  ```
- Line 533: Template literal class
  ```javascript
  <span class="vibe-brand">▓▓ VIBE READER v2.0 ▓▓</span>
  ```

**vibe-btn**
- Line 537: HTML class attribute
  ```javascript
  <button class="vibe-btn media-btn" title="Toggle Media Mode">🌌</button>
  ```
- Line 537: Template literal class
  ```javascript
  <button class="vibe-btn media-btn" title="Toggle Media Mode">🌌</button>
  ```
- Line 538: HTML class attribute
  ```javascript
  <button class="vibe-btn theme-btn" title="Cycle Theme">🌆</button>
  ```
- Line 538: Template literal class
  ```javascript
  <button class="vibe-btn theme-btn" title="Cycle Theme">🌆</button>
  ```
- Line 539: HTML class attribute
  ```javascript
  <button class="vibe-btn disconnect-btn" title="Disconnect">🌑</button>
  ```
- Line 539: Template literal class
  ```javascript
  <button class="vibe-btn disconnect-btn" title="Disconnect">🌑</button>
  ```
- Line 1353: HTML class attribute
  ```javascript
  <button class="vibe-btn retry-btn">RETRY EXTRACTION</button>
  ```
- Line 1353: Template literal class
  ```javascript
  <button class="vibe-btn retry-btn">RETRY EXTRACTION</button>
  ```

**vibe-content**
- Line 546: HTML class attribute
  ```javascript
  <main class="vibe-content">
  ```
- Line 546: Template literal class
  ```javascript
  <main class="vibe-content">
  ```

**vibe-header**
- Line 531: HTML class attribute
  ```javascript
  <div class="vibe-header">
  ```
- Line 531: Template literal class
  ```javascript
  <div class="vibe-header">
  ```

**vibe-header-left**
- Line 532: HTML class attribute
  ```javascript
  <div class="vibe-header-left">
  ```
- Line 532: Template literal class
  ```javascript
  <div class="vibe-header-left">
  ```

**vibe-header-right**
- Line 536: HTML class attribute
  ```javascript
  <div class="vibe-header-right">
  ```
- Line 536: Template literal class
  ```javascript
  <div class="vibe-header-right">
  ```

**vibe-layout**
- Line 543: HTML class attribute
  ```javascript
  <div class="vibe-layout">
  ```
- Line 543: Template literal class
  ```javascript
  <div class="vibe-layout">
  ```

**vibe-rain-container**
- Line 572: HTML class attribute
  ```javascript
  ${this.settings.vibeRain ? '<div class="vibe-rain-container"></div>' : ''}
  ```
- Line 572: Template literal class
  ```javascript
  ${this.settings.vibeRain ? '<div class="vibe-rain-container"></div>' : ''}
  ```
- Line 1437: className assignment
  ```javascript
  rainContainer.className = 'vibe-rain-container';
  ```

**vibe-reader-container**
- Line 499: classList.contains
  ```javascript
  if (!el.classList.contains('vibe-reader-container')) {
  ```
- Line 516: className assignment
  ```javascript
  this.container.className = 'vibe-reader-container vibe-reader-proxy';
  ```

**vibe-reader-overlay**
- Line 530: HTML class attribute
  ```javascript
  <div class="vibe-reader-overlay">
  ```
- Line 530: Template literal class
  ```javascript
  <div class="vibe-reader-overlay">
  ```

**vibe-reader-proxy**
- Line 516: className assignment
  ```javascript
  this.container.className = 'vibe-reader-container vibe-reader-proxy';
  ```

**vibe-sidebar**
- Line 580: HTML class attribute
  ```javascript
  <aside class="vibe-sidebar left-panel">
  ```
- Line 580: Template literal class
  ```javascript
  <aside class="vibe-sidebar left-panel">
  ```
- Line 596: HTML class attribute
  ```javascript
  <aside class="vibe-sidebar right-panel">
  ```
- Line 596: Template literal class
  ```javascript
  <aside class="vibe-sidebar right-panel">
  ```

**vibe-sidebar-spacer**
- Line 544: HTML class attribute
  ```javascript
  ${this.settings.sideScrolls ? this.createLeftPanel() : '<div class="vibe-sidebar-spacer"></div>'}
  ```
- Line 544: Template literal class
  ```javascript
  ${this.settings.sideScrolls ? this.createLeftPanel() : '<div class="vibe-sidebar-spacer"></div>'}
  ```
- Line 569: HTML class attribute
  ```javascript
  ${this.settings.sideScrolls ? this.createRightPanel() : '<div class="vibe-sidebar-spacer"></div>'}
  ```
- Line 569: Template literal class
  ```javascript
  ${this.settings.sideScrolls ? this.createRightPanel() : '<div class="vibe-sidebar-spacer"></div>'}
  ```

**vibe-status**
- Line 534: HTML class attribute
  ```javascript
  <span class="vibe-status">[ EXTRACTING ]</span>
  ```
- Line 534: Template literal class
  ```javascript
  <span class="vibe-status">[ EXTRACTING ]</span>
  ```

#### Ids

**left-terminal**
- Line 586: HTML id attribute
  ```javascript
  <div class="terminal-content" id="left-terminal">
  ```
- Line 586: Template literal id
  ```javascript
  <div class="terminal-content" id="left-terminal">
  ```

**right-terminal**
- Line 602: HTML id attribute
  ```javascript
  <div class="terminal-content" id="right-terminal">
  ```
- Line 602: Template literal id
  ```javascript
  <div class="terminal-content" id="right-terminal">
  ```

#### Inline_Styles

**animationDelay**
- Line 1451: style property assignment
  ```javascript
  drop.style.animationDelay = `${Math.random() * 2}s`;  // Fixed
  ```

**animationDuration**
- Line 1450: style property assignment
  ```javascript
  drop.style.animationDuration = `${Math.random() * 3 + 1}s`;  // Fixed
  ```

**display**
- Line 501: style property assignment
  ```javascript
  el.style.display = 'none';
  ```
- Line 1323: style property assignment
  ```javascript
  element.style.display = display || '';
  ```

**height**
- Line 51: style property assignment
  ```javascript
  tester.style.height = 'auto';
  ```
- Line 957: style property assignment
  ```javascript
  canvas.style.height = `${displayHeight}px`;
  ```
- Line 1026: style property assignment
  ```javascript
  asciiDisplayWrapper.style.height = `${constrainedHeight}px`;
  ```

**left**
- Line 1449: style property assignment
  ```javascript
  drop.style.left = `${i * 20}px`;  // Fixed: added * operator
  ```

**overflow**
- Line 494: style property assignment
  ```javascript
  document.body.style.overflow = 'hidden';
  ```
- Line 495: style property assignment
  ```javascript
  document.documentElement.style.overflow = 'hidden';
  ```
- Line 1316: style property assignment
  ```javascript
  document.body.style.overflow = this.originalState.bodyOverflow || '';
  ```
- Line 1317: style property assignment
  ```javascript
  document.documentElement.style.overflow = this.originalState.htmlOverflow || '';
  ```

**position**
- Line 48: style property assignment
  ```javascript
  tester.style.position = 'absolute';
  ```

**visibility**
- Line 49: style property assignment
  ```javascript
  tester.style.visibility = 'hidden';
  ```

**width**
- Line 50: style property assignment
  ```javascript
  tester.style.width = 'auto';
  ```
- Line 631: style property assignment
  ```javascript
  progressFill.style.width = `${progress}%`;
  ```
- Line 956: style property assignment
  ```javascript
  canvas.style.width = `${displayWidth}px`;
  ```
- Line 1025: style property assignment
  ```javascript
  asciiDisplayWrapper.style.width = `${constrainedWidth}px`;
  ```

#### Selectors

**#left-terminal**
- Line 1184: querySelector
  ```javascript
  const leftTerminal = this.container?.querySelector('#left-terminal');
  ```
- Line 1197: querySelector
  ```javascript
  const leftTerminal = this.container?.querySelector('#left-terminal');
  ```
- Line 1551: querySelector
  ```javascript
  const leftTerminal = this.container?.querySelector('#left-terminal');
  ```

**#right-terminal**
- Line 1185: querySelector
  ```javascript
  const rightTerminal = this.container?.querySelector('#right-terminal');
  ```
- Line 1198: querySelector
  ```javascript
  const rightTerminal = this.container?.querySelector('#right-terminal');
  ```
- Line 1552: querySelector
  ```javascript
  const rightTerminal = this.container?.querySelector('#right-terminal');
  ```

*****
- Line 698: querySelectorAll
  ```javascript
  this._elementCount = this.container ? this.container.querySelectorAll('*').length : 0;
  ```

**.article-content img**
- Line 729: querySelectorAll
  ```javascript
  const images = this.container?.querySelectorAll('.article-content img') || [];
  ```

**.article-content table**
- Line 1177: querySelectorAll
  ```javascript
  const tables = this.container?.querySelectorAll('.article-content table') || [];
  ```

**.article-content video**
- Line 737: querySelectorAll
  ```javascript
  const videos = this.container?.querySelectorAll('.article-content video') || [];
  ```

**.ascii-art**
- Line 884: querySelector
  ```javascript
  const asciiContainer = wrapper.querySelector('.ascii-art');
  ```
- Line 1007: querySelector
  ```javascript
  const asciiEl = wrapper.querySelector('.ascii-art');
  ```

**.disconnect-btn**
- Line 1243: querySelector
  ```javascript
  const disconnectBtn = this.container?.querySelector('.disconnect-btn');
  ```

**.extraction-status**
- Line 628: querySelector
  ```javascript
  const statusText = this.container?.querySelector('.extraction-status');
  ```

**.glitch**
- Line 1420: querySelectorAll
  ```javascript
  const glitchElements = this.container?.querySelectorAll('.glitch') || [];
  ```

**.media-ascii-display**
- Line 1018: querySelector
  ```javascript
  const asciiDisplayWrapper = wrapper.querySelector('.media-ascii-display');
  ```

**.media-btn**
- Line 1242: querySelector
  ```javascript
  const mediaBtn = this.container?.querySelector('.media-btn');
  ```

**.media-wrapper**
- Line 1166: querySelectorAll
  ```javascript
  const wrappers = this.container?.querySelectorAll('.media-wrapper') || [];
  ```

**.progress-fill**
- Line 627: querySelector
  ```javascript
  const progressFill = this.container?.querySelector('.progress-fill');
  ```

**.retry-btn**
- Line 1357: querySelector
  ```javascript
  const retryBtn = content.querySelector('.retry-btn');
  ```

**.theme-btn**
- Line 1241: querySelector
  ```javascript
  const themeBtn = this.container?.querySelector('.theme-btn');
  ```

**.vibe-content**
- Line 659: querySelector
  ```javascript
  const mainContent = this.container?.querySelector('.vibe-content');
  ```
- Line 1340: querySelector
  ```javascript
  const content = this.container?.querySelector('.vibe-content');
  ```

**.vibe-rain-container**
- Line 451: querySelector
  ```javascript
  const rainContainer = this.container.querySelector('.vibe-rain-container');
  ```
- Line 1433: querySelector
  ```javascript
  let rainContainer = this.container?.querySelector('.vibe-rain-container');
  ```

**.vibe-reader-container**
- Line 510: querySelector
  ```javascript
  const existing = document.querySelector('.vibe-reader-container');
  ```

**.vibe-status**
- Line 688: querySelector
  ```javascript
  const statusEl = this.container?.querySelector('.vibe-status');
  ```

**a**
- Line 715: querySelectorAll
  ```javascript
  tempDiv.querySelectorAll('a').forEach(link => {
  ```

**h1, h2, h3, h4, h5, h6**
- Line 711: querySelectorAll
  ```javascript
  tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
  ```

**pre, code**
- Line 721: querySelectorAll
  ```javascript
  tempDiv.querySelectorAll('pre, code').forEach(code => {
  ```

## CSS Definitions

### styles\matrix-theme.css

#### Classes

**vibe-reader-container** (Line 75)
```css
.vibe-reader-container {
```

**vibe-rain-container** (Line 101)
```css
.vibe-rain-container {
```

**vibe-rain-column** (Line 113)
```css
.vibe-rain-column {
```

**vibe-sidebar** (Line 145)
```css
.vibe-sidebar {
```

**left-panel** (Line 160)
```css
.vibe-sidebar.left-panel {
```

**right-panel** (Line 165)
```css
.vibe-sidebar.right-panel {
```

**vibe-sidebar-spacer** (Line 181)
```css
.vibe-sidebar-spacer {
```

**vibe-layout** (Line 191)
```css
.vibe-layout {
```

**terminal-content** (Line 218)
```css
.terminal-content {
```

**terminal-line** (Line 225)
```css
.terminal-line {
```

**side-scroller** (Line 231)
```css
.side-scroller {
```

**scroller-content** (Line 236)
```css
.side-scroller .scroller-content {
```

**left-scroller** (Line 259)
```css
.left-scroller {
```

**right-scroller** (Line 264)
```css
.right-scroller {
```

**scroll-title** (Line 293)
```css
.scroll-title {
```

**metadata-line** (Line 308)
```css
.metadata-line,
```

**log-line** (Line 309)
```css
.log-line {
```

**log-prefix** (Line 329)
```css
.log-prefix {
```

**vibe-content** (Line 372)
```css
.vibe-content {
```

**vibe-header** (Line 428)
```css
.vibe-header {
```

**vibe-header-left** (Line 444)
```css
.vibe-header-left {
```

**vibe-header-right** (Line 450)
```css
.vibe-header-right {
```

**vibe-brand** (Line 456)
```css
.vibe-brand {
```

**vibe-status** (Line 467)
```css
.vibe-status {
```

**article-header** (Line 476)
```css
.article-header {
```

**vibe-title** (Line 517)
```css
.vibe-title {
```

**vibe-meta** (Line 538)
```css
.vibe-meta {
```

**vibe-article** (Line 574)
```css
.vibe-article {
```

**vibe-heading** (Line 582)
```css
.vibe-heading {
```

**vibe-paragraph** (Line 631)
```css
.vibe-paragraph {
```

**vibe-link** (Line 649)
```css
.vibe-link {
```

**link-preview** (Line 669)
```css
.link-preview {
```

**vibe-list** (Line 676)
```css
.vibe-list {
```

**vibe-code** (Line 693)
```css
.vibe-code {
```

**ascii-image-placeholder** (Line 722)
```css
.ascii-image-placeholder,
```

**ascii-image** (Line 723)
```css
.ascii-image {
```

**ascii-converting** (Line 738)
```css
.ascii-converting {
```

**loading-bar** (Line 759)
```css
.loading-bar {
```

**loading-progress** (Line 768)
```css
.loading-progress {
```

**emoji-ascii** (Line 789)
```css
.emoji-ascii {
```

**large** (Line 795)
```css
.emoji-ascii.large {
```

**medium** (Line 799)
```css
.emoji-ascii.medium {
```

**ascii-text** (Line 803)
```css
.ascii-text {
```

**ascii-caption** (Line 812)
```css
.ascii-caption {
```

**ascii-source** (Line 819)
```css
.ascii-source {
```

**ascii-error** (Line 826)
```css
.ascii-error {
```

**vibe-footer** (Line 837)
```css
.vibe-footer {
```

**signature-text** (Line 850)
```css
.signature-text {
```

**signature-visual** (Line 860)
```css
.signature-visual {
```

**vibe-btn** (Line 884)
```css
.vibe-btn {
```

**vibe-controls** (Line 925)
```css
.vibe-controls {
```

**control-btn** (Line 935)
```css
.control-btn {
```

**glitch** (Line 971)
```css
.glitch {
```

**glitching** (Line 975)
```css
.glitch.glitching::before,
```

**cyber-scan** (Line 1174)
```css
.cyber-scan::before {
```

**neon-flicker** (Line 1190)
```css
.neon-flicker {
```

**data-stream** (Line 1194)
```css
.data-stream {
```

**article-title** (Line 1230)
```css
.article-title {
```

**article-byline** (Line 1242)
```css
.article-byline {
```

**article-meta** (Line 1251)
```css
.article-meta {
```

**meta-item** (Line 1259)
```css
.meta-item {
```

**retrofuture-heading** (Line 1270)
```css
.retrofuture-heading {
```

**cyber-link** (Line 1281)
```css
.cyber-link {
```

**cyber-code** (Line 1295)
```css
.cyber-code {
```

**cyber-table** (Line 1305)
```css
.cyber-table {
```

**media-wrapper** (Line 1324)
```css
.media-wrapper {
```

**media-normal-display** (Line 1356)
```css
.media-normal-display img,
```

**media-transition** (Line 1390)
```css
.media-transition {
```

**media-emoji-display** (Line 1422)
```css
.media-emoji-display {
```

**emoji-icon** (Line 1427)
```css
.emoji-icon {
```

**cyber-glow** (Line 1434)
```css
.cyber-glow {
```

**media-label** (Line 1450)
```css
.media-label {
```

**mode-hint** (Line 1459)
```css
.mode-hint {
```

**media-ascii-display** (Line 1467)
```css
.media-ascii-display {
```

**ascii-content** (Line 1472)
```css
.ascii-content {
```

**ascii-art** (Line 1481)
```css
.ascii-art {
```

**loading** (Line 1491)
```css
.ascii-art.loading {
```

**cyber-frame** (Line 1511)
```css
.cyber-frame {
```

**cyber-media** (Line 1522)
```css
.cyber-media {
```

**loaded** (Line 1529)
```css
.cyber-media.loaded {
```

**extraction-progress** (Line 1551)
```css
.extraction-progress {
```

**cyber-loader** (Line 1556)
```css
.cyber-loader {
```

**cyber-loader-bar** (Line 1568)
```css
.cyber-loader-bar {
```

**extraction-status** (Line 1593)
```css
.extraction-status {
```

**extraction-details** (Line 1602)
```css
.extraction-details {
```

**progress-percent** (Line 1609)
```css
.progress-percent {
```

**progress-stage** (Line 1618)
```css
.progress-stage {
```

**terminal-window** (Line 1629)
```css
.terminal-window {
```

**terminal-header** (Line 1642)
```css
.terminal-header {
```

**terminal-title** (Line 1655)
```css
.terminal-title {
```

**terminal-controls** (Line 1665)
```css
.terminal-controls {
```

**led-indicator** (Line 1670)
```css
.led-indicator {
```

**active** (Line 1679)
```css
.led-indicator.active {
```

**matrix-drop** (Line 1730)
```css
.matrix-drop {
```

**error-details** (Line 1763)
```css
.error-details {
```

**article-footer** (Line 1790)
```css
.article-footer {
```

**footer-info** (Line 1798)
```css
.footer-info {
```

**close-btn** (Line 1826)
```css
.terminal-controls .close-btn {
```

**minimize-btn** (Line 1830)
```css
.terminal-controls .minimize-btn {
```

**maximize-btn** (Line 1834)
```css
.terminal-controls .maximize-btn {
```

#### Ids

**f92672** (Line 12)
```css
--primary: #f92672;
```

**ffbf80** (Line 14)
```css
--accent: #ffbf80;
```

**f7f7f7** (Line 18)
```css
--text-primary: #f7f7f7;
```

**e0b0ff** (Line 19)
```css
--text-secondary: #e0b0ff;
```

**ff1493** (Line 27)
```css
--primary: #ff1493;
```

**ffcc00** (Line 29)
```css
--accent: #ffcc00;
```

**ffffff** (Line 33)
```css
--text-primary: #ffffff;
```

**ff6f20** (Line 43)
```css
--secondary: #ff6f20;
```

**da70d6** (Line 49)
```css
--text-secondary: #da70d6;
```

**ff46b8** (Line 57)
```css
--primary: #ff46b8;
```

**ff0080** (Line 1219)
```css
--primary: #ff0080;
```

**ff5f56** (Line 1827)
```css
background: #ff5f56;
```

**ffbd2e** (Line 1831)
```css
background: #ffbd2e;
```

#### Variables

**--primary** (Line 12)
```css
--primary: #f92672;
```

**--secondary** (Line 13)
```css
--secondary: #66d9ef;
```

**--accent** (Line 14)
```css
--accent: #ffbf80;
```

**--bg-primary** (Line 15)
```css
--bg-primary: #0d0d0d;
```

**--bg-secondary** (Line 16)
```css
--bg-secondary: #1a1a1a;
```

**--bg-tertiary** (Line 17)
```css
--bg-tertiary: #2c1a29;
```

**--text-primary** (Line 18)
```css
--text-primary: #f7f7f7;
```

**--text-secondary** (Line 19)
```css
--text-secondary: #e0b0ff;
```

**--text-accent** (Line 20)
```css
--text-accent: #66d9ef;
```

**--border-color** (Line 21)
```css
--border-color: #f92672;
```

**--glow-primary** (Line 22)
```css
--glow-primary: rgba(249, 38, 114, 0.8);
```

**--glow-secondary** (Line 23)
```css
--glow-secondary: rgba(102, 217, 239, 0.6);
```

**--error-rgb** (Line 1766)
```css
background: rgba(var(--error-rgb, 249, 38, 114), 0.1);
```

**--error** (Line 1767)
```css
border: 1px solid var(--error);
```

**--border-primary** (Line 1783)
```css
border: 2px solid var(--border-primary);
```

**--border-subtle** (Line 1793)
```css
border-top: 1px solid var(--border-subtle);
```

#### Animations

**matrix-fall** (Line 131)
```css
@keyframes matrix-fall {
```

**slide-in-left** (Line 334)
```css
@keyframes slide-in-left {
```

**slide-in-right** (Line 346)
```css
@keyframes slide-in-right {
```

**pulse-glow** (Line 358)
```css
@keyframes pulse-glow {
```

**header-scan** (Line 507)
```css
@keyframes header-scan {
```

**meta-pulse** (Line 559)
```css
@keyframes meta-pulse {
```

**heading-pulse** (Line 619)
```css
@keyframes heading-pulse {
```

**converting-pulse** (Line 746)
```css
@keyframes converting-pulse {
```

**loading-progress** (Line 775)
```css
@keyframes loading-progress {
```

**signature-glow** (Line 869)
```css
@keyframes signature-glow {
```

**glitch-1** (Line 1002)
```css
@keyframes glitch-1 {
```

**glitch-2** (Line 1029)
```css
@keyframes glitch-2 {
```

**cyber-scan** (Line 1122)
```css
@keyframes cyber-scan {
```

**neon-flicker** (Line 1138)
```css
@keyframes neon-flicker {
```

**data-stream** (Line 1156)
```css
@keyframes data-stream {
```

**cyber-glitch** (Line 1394)
```css
@keyframes cyber-glitch {
```

**emoji-pulse** (Line 1438)
```css
@keyframes emoji-pulse {
```

**ascii-loading** (Line 1495)
```css
@keyframes ascii-loading {
```

**media-materialize** (Line 1533)
```css
@keyframes media-materialize {
```

**cyber-pulse** (Line 1582)
```css
@keyframes cyber-pulse {
```

**led-pulse** (Line 1684)
```css
@keyframes led-pulse {
```

**matrix-fall** (Line 1746)
```css
@keyframes matrix-fall {
```

#### Media_Queries

**@media (max-width: 1200px) {** (Line 201)
```css
@media (max-width: 1200px) {
```

**@media (max-width: 900px) {** (Line 207)
```css
@media (max-width: 900px) {
```

**@media (max-width: 768px) {** (Line 1060)
```css
@media (max-width: 768px) {
```

**@media (max-width: 600px) {** (Line 1096)
```css
@media (max-width: 600px) {
```

**@media (prefers-reduced-motion: reduce) {** (Line 1202)
```css
@media (prefers-reduced-motion: reduce) {
```

**@media (prefers-contrast: high) {** (Line 1217)
```css
@media (prefers-contrast: high) {
```

### styles\retrofuture-theme.css

#### Classes

**vibe-reader-container** (Line 288)
```css
.vibe-reader-container {
```

**retrofuture-bg-effects** (Line 328)
```css
.retrofuture-bg-effects {
```

**matrix-drop** (Line 347)
```css
.matrix-drop {
```

**vibe-header** (Line 375)
```css
.vibe-header {
```

**vibe-header-bar** (Line 389)
```css
.vibe-header-bar {
```

**vibe-header-left** (Line 400)
```css
.vibe-header-left {
```

**vibe-brand** (Line 406)
```css
.vibe-brand {
```

**vibe-separator** (Line 414)
```css
.vibe-separator {
```

**protocol** (Line 419)
```css
.protocol {
```

**vibe-header-right** (Line 424)
```css
.vibe-header-right {
```

**timestamp** (Line 430)
```css
.timestamp {
```

**vibe-status** (Line 438)
```css
.vibe-status {
```

**article-header** (Line 459)
```css
.article-header {
```

**article-title** (Line 465)
```css
.article-title {
```

**title-underline** (Line 479)
```css
.title-underline {
```

**article-meta** (Line 509)
```css
.article-meta {
```

**meta-item** (Line 523)
```css
.meta-item.domain {
```

**domain** (Line 523)
```css
.meta-item.domain {
```

**reading-stats** (Line 529)
```css
.meta-item.reading-stats {
```

**date** (Line 535)
```css
.meta-item.date {
```

**vibe-layout** (Line 544)
```css
.vibe-layout {
```

**vibe-sidebar** (Line 566)
```css
.vibe-sidebar {
```

**terminal-content** (Line 570)
```css
.terminal-content {
```

**left-panel** (Line 592)
```css
.left-panel {
```

**right-panel** (Line 597)
```css
.right-panel {
```

**terminal-header** (Line 602)
```css
.terminal-header {
```

**terminal-title** (Line 612)
```css
.terminal-title {
```

**terminal-controls** (Line 621)
```css
.terminal-controls {
```

**led** (Line 626)
```css
.led {
```

**green** (Line 633)
```css
.led.green {
```

**yellow** (Line 639)
```css
.led.yellow {
```

**red** (Line 644)
```css
.led.red {
```

**terminal-output** (Line 681)
```css
.terminal-output {
```

**vibe-content** (Line 717)
```css
.vibe-content {
```

**vibe-article** (Line 749)
```css
.vibe-article {
```

**cyber-heading** (Line 762)
```css
.cyber-heading {
```

**heading-decorator** (Line 778)
```css
.heading-decorator {
```

**article-content** (Line 815)
```css
.article-content p {
```

**cyber-link** (Line 831)
```css
.cyber-link {
```

**link-bracket** (Line 849)
```css
.link-bracket {
```

**cyber-code** (Line 873)
```css
.cyber-code {
```

**media-wrapper** (Line 903)
```css
.media-wrapper {
```

**media-emoji-display** (Line 930)
```css
.media-emoji-display {
```

**emoji-icon** (Line 935)
```css
.emoji-icon {
```

**media-label** (Line 942)
```css
.media-label {
```

**mode-hint** (Line 950)
```css
.mode-hint {
```

**media-ascii-display** (Line 958)
```css
.media-ascii-display {
```

**ascii-art** (Line 974)
```css
.ascii-art {
```

**media-normal-display** (Line 985)
```css
.media-normal-display {
```

**vibe-btn** (Line 1001)
```css
.vibe-btn,
```

**control-btn** (Line 1002)
```css
.control-btn {
```

**exit-btn** (Line 1101)
```css
.exit-btn,
```

**disconnect-btn** (Line 1102)
```css
.disconnect-btn {
```

**media-btn** (Line 1122)
```css
.media-btn,
```

**theme-btn** (Line 1123)
```css
.theme-btn {
```

**btn-icon** (Line 1141)
```css
.btn-icon {
```

**btn-text** (Line 1146)
```css
.btn-text {
```

**retrofuture-main** (Line 1155)
```css
.retrofuture-main {
```

**retrofuture-controls** (Line 1174)
```css
.retrofuture-controls {
```

**header-bar** (Line 1195)
```css
.header-bar {
```

**retro-glow** (Line 1241)
```css
.retro-glow {
```

**retrofuture-reader-container** (Line 1264)
```css
.retrofuture-reader-container {
```

**cyber-table-placeholder** (Line 1275)
```css
.cyber-table-placeholder {
```

**cyber-table-icon** (Line 1300)
```css
.cyber-table-icon {
```

**cyber-table-info** (Line 1305)
```css
.cyber-table-info {
```

**cyber-table-title** (Line 1309)
```css
.cyber-table-title {
```

**cyber-table-stats** (Line 1319)
```css
.cyber-table-stats {
```

**cyber-table-hint** (Line 1329)
```css
.cyber-table-hint {
```

**cyber-table-expanded-container** (Line 1340)
```css
.cyber-table-expanded-container {
```

**cyber-table-header** (Line 1349)
```css
.cyber-table-header {
```

**cyber-table-header-title** (Line 1358)
```css
.cyber-table-header-title {
```

**cyber-table-close-btn** (Line 1367)
```css
.cyber-table-close-btn {
```

**cyber-table-content** (Line 1386)
```css
.cyber-table-content {
```

**cyber-table** (Line 1392)
```css
.cyber-table {
```

**expanded-table** (Line 1401)
```css
.cyber-table.expanded-table {
```

**simple-table** (Line 1433)
```css
.cyber-table.simple-table {
```

**neon-pulse** (Line 1496)
```css
.neon-pulse {
```

**nightdrive-pulse** (Line 1500)
```css
.nightdrive-pulse {
```

**glass-shimmer** (Line 1504)
```css
.glass-shimmer::before {
```

**retrofuture-link** (Line 1529)
```css
.retrofuture-link:focus,
```

**image-placeholder** (Line 1530)
```css
.image-placeholder:focus,
```

**table-placeholder** (Line 1531)
```css
.table-placeholder:focus,
```

**terminal-window** (Line 1551)
```css
:root .terminal-window {
```

**vibe-reader-overlay** (Line 2159)
```css
.vibe-reader-overlay {
```

**vibe-reader-proxy** (Line 2171)
```css
.vibe-reader-proxy {
```

**vibe-sidebar-spacer** (Line 2201)
```css
.vibe-sidebar-spacer {
```

**article-byline** (Line 2270)
```css
.article-byline {
```

**article-footer** (Line 2296)
```css
.article-footer {
```

**footer-info** (Line 2302)
```css
.footer-info {
```

**cyber-media** (Line 2382)
```css
.cyber-media {
```

**cyber-frame** (Line 2389)
```css
.cyber-frame {
```

**terminal-line** (Line 2432)
```css
.terminal-line {
```

**diagnostic-category** (Line 2438)
```css
.diagnostic-category {
```

**category-header** (Line 2442)
```css
.category-header {
```

**category-content** (Line 2461)
```css
.category-content {
```

**led-indicator** (Line 2486)
```css
.led-indicator {
```

**error-display** (Line 2507)
```css
.error-display {
```

**error-icon** (Line 2519)
```css
.error-icon {
```

**error-title** (Line 2526)
```css
.error-title {
```

**error-message** (Line 2535)
```css
.error-message {
```

**retry-btn** (Line 2541)
```css
.retry-btn {
```

**extraction-progress** (Line 2571)
```css
.extraction-progress {
```

**progress-bar** (Line 2579)
```css
.progress-bar {
```

**progress-fill** (Line 2589)
```css
.progress-fill {
```

**extraction-status** (Line 2622)
```css
.extraction-status {
```

**vibe-rain-container** (Line 2695)
```css
.vibe-rain-container {
```

**loading** (Line 2727)
```css
.loading {
```

**glitching** (Line 2758)
```css
.glitching {
```

**ascii-canvas** (Line 2872)
```css
.ascii-canvas {
```

**glitch** (Line 2923)
```css
.glitch {
```

**active** (Line 2955)
```css
.active {
```

#### Ids

**ffff00** (Line 640)
```css
background: #ffff00;
```

**ff0000** (Line 645)
```css
background: #ff0000;
```

**ff0080** (Line 1265)
```css
--primary: #ff0080;
```

**ffffff** (Line 1267)
```css
--text-primary: #ffffff;
```

#### Variables

**--primary-50** (Line 15)
```css
--primary-50: 255 192 203;
```

**--primary-100** (Line 16)
```css
--primary-100: 255 182 193;
```

**--primary-200** (Line 17)
```css
--primary-200: 255 148 198;
```

**--primary-300** (Line 18)
```css
--primary-300: 255 105 180;
```

**--primary-400** (Line 19)
```css
--primary-400: 255 75 156;
```

**--primary-500** (Line 20)
```css
--primary-500: 249 38 114;
```

**--primary-600** (Line 21)
```css
--primary-600: 224 110 146;
```

**--primary-700** (Line 22)
```css
--primary-700: 215 61 133;
```

**--primary-800** (Line 23)
```css
--primary-800: 192 58 105;
```

**--primary-900** (Line 24)
```css
--primary-900: 164 0 85;
```

**--secondary-50** (Line 27)
```css
--secondary-50: 224 255 255;
```

**--secondary-100** (Line 28)
```css
--secondary-100: 179 255 255;
```

**--secondary-200** (Line 29)
```css
--secondary-200: 136 255 255;
```

**--secondary-300** (Line 30)
```css
--secondary-300: 0 255 255;
```

**--secondary-400** (Line 31)
```css
--secondary-400: 0 191 255;
```

**--secondary-500** (Line 32)
```css
--secondary-500: 102 217 239;
```

**--secondary-600** (Line 33)
```css
--secondary-600: 126 200 227;
```

**--secondary-700** (Line 34)
```css
--secondary-700: 90 79 207;
```

**--secondary-800** (Line 35)
```css
--secondary-800: 74 150 255;
```

**--secondary-900** (Line 36)
```css
--secondary-900: 0 120 168;
```

**--accent-50** (Line 39)
```css
--accent-50: 255 243 160;
```

**--accent-100** (Line 40)
```css
--accent-100: 255 234 0;
```

**--accent-200** (Line 41)
```css
--accent-200: 255 221 68;
```

**--accent-300** (Line 42)
```css
--accent-300: 255 195 0;
```

**--accent-400** (Line 43)
```css
--accent-400: 230 219 116;
```

**--accent-500** (Line 44)
```css
--accent-500: 255 191 128;
```

**--accent-600** (Line 45)
```css
--accent-600: 255 154 96;
```

**--accent-700** (Line 46)
```css
--accent-700: 255 140 60;
```

**--accent-800** (Line 47)
```css
--accent-800: 255 111 48;
```

**--accent-900** (Line 48)
```css
--accent-900: 204 77 0;
```

**--success-500** (Line 51)
```css
--success-500: 166 226 46;
```

**--warning-500** (Line 52)
```css
--warning-500: 253 151 31;
```

**--error-500** (Line 53)
```css
--error-500: 249 38 114;
```

**--info-500** (Line 54)
```css
--info-500: 174 129 255;
```

**--bg-primary** (Line 57)
```css
--bg-primary: 28 28 28;
```

**--bg-secondary** (Line 58)
```css
--bg-secondary: 44 26 41;
```

**--bg-tertiary** (Line 59)
```css
--bg-tertiary: 40 27 76;
```

**--bg-surface** (Line 60)
```css
--bg-surface: 30 30 63;
```

**--bg-overlay** (Line 61)
```css
--bg-overlay: 55 46 99;
```

**--bg-terminal** (Line 62)
```css
--bg-terminal: 13 13 13;
```

**--text-primary** (Line 65)
```css
--text-primary: 247 247 247;
```

**--text-secondary** (Line 66)
```css
--text-secondary: 224 176 255;
```

**--text-accent** (Line 67)
```css
--text-accent: 102 217 239;
```

**--text-muted** (Line 68)
```css
--text-muted: 234 184 228;
```

**--text-bright** (Line 69)
```css
--text-bright: 255 255 255;
```

**--text-disabled** (Line 70)
```css
--text-disabled: 185 134 193;
```

**--border-primary** (Line 73)
```css
--border-primary: 249 38 114;
```

**--border-secondary** (Line 74)
```css
--border-secondary: 102 217 239;
```

**--border-subtle** (Line 75)
```css
--border-subtle: 62 62 62;
```

**--border-accent** (Line 76)
```css
--border-accent: 255 191 128;
```

**--border-strong** (Line 77)
```css
--border-strong: 215 61 133;
```

**--glow-primary** (Line 80)
```css
--glow-primary: 249 38 114;
```

**--glow-secondary** (Line 81)
```css
--glow-secondary: 102 217 239;
```

**--glow-accent** (Line 82)
```css
--glow-accent: 255 191 128;
```

**--primary** (Line 383)
```css
border-bottom: 3px solid var(--primary);
```

**--secondary** (Line 384)
```css
box-shadow: 0 0 20px var(--glow-primary), inset 0 -2px 0 var(--secondary);
```

**--accent** (Line 431)
```css
color: var(--accent);
```

**--success** (Line 875)
```css
color: var(--success) !important;
```

#### Animations

**scanlines** (Line 361)
```css
@keyframes scanlines {
```

**status-blink** (Line 448)
```css
@keyframes status-blink {
```

**title-pulse** (Line 496)
```css
@keyframes title-pulse {
```

**led-pulse-green** (Line 649)
```css
@keyframes led-pulse-green {
```

**cursor-blink** (Line 701)
```css
@keyframes cursor-blink {
```

**decorator-pulse** (Line 785)
```css
@keyframes decorator-pulse {
```

**component-scan** (Line 1084)
```css
@keyframes component-scan {
```

**retro-glow** (Line 1228)
```css
@keyframes retro-glow {
```

**enhanced-glow-pulse** (Line 1444)
```css
@keyframes enhanced-glow-pulse {
```

**nightdrive-pulse** (Line 1465)
```css
@keyframes nightdrive-pulse {
```

**glass-shimmer** (Line 1485)
```css
@keyframes glass-shimmer {
```

**electric-scan** (Line 1577)
```css
@keyframes electric-scan {
```

**electric-pulse** (Line 1593)
```css
@keyframes electric-pulse {
```

**storm-lightning** (Line 1703)
```css
@keyframes storm-lightning {
```

**storm-pulse** (Line 1735)
```css
@keyframes storm-pulse {
```

**storm-scan** (Line 1755)
```css
@keyframes storm-scan {
```

**phantom-flicker** (Line 1886)
```css
@keyframes phantom-flicker {
```

**underground-pulse** (Line 1910)
```css
@keyframes underground-pulse {
```

**underground-scan** (Line 1926)
```css
@keyframes underground-scan {
```

**data-corruption** (Line 1942)
```css
@keyframes data-corruption {
```

**underground-drift** (Line 2005)
```css
@keyframes underground-drift {
```

**categoryExpand** (Line 2468)
```css
@keyframes categoryExpand {
```

**led-pulse** (Line 2495)
```css
@keyframes led-pulse {
```

**progress-shine** (Line 2612)
```css
@keyframes progress-shine {
```

**matrix-fall** (Line 2714)
```css
@keyframes matrix-fall {
```

**loading-sweep** (Line 2748)
```css
@keyframes loading-sweep {
```

**glitch-1** (Line 2785)
```css
@keyframes glitch-1 {
```

**glitch-2** (Line 2812)
```css
@keyframes glitch-2 {
```

**ascii-fade-in** (Line 2890)
```css
@keyframes ascii-fade-in {
```

#### Media_Queries

**@media (max-width: 1200px) {** (Line 553)
```css
@media (max-width: 1200px) {
```

**@media (max-width: 900px) {** (Line 559)
```css
@media (max-width: 900px) {
```

**@media (max-width: 768px) {** (Line 1154)
```css
@media (max-width: 768px) {
```

**@media (max-width: 600px) {** (Line 1194)
```css
@media (max-width: 600px) {
```

**@media (prefers-reduced-motion: reduce) {** (Line 1249)
```css
@media (prefers-reduced-motion: reduce) {
```

**@media (prefers-contrast: high) {** (Line 1263)
```css
@media (prefers-contrast: high) {
```
