// Web-ext configuration for VibeReader extension development
module.exports = {
  // Source configuration
  sourceDir: process.cwd(),
  artifactsDir: './web-ext-artifacts',
  
  // Ignore patterns - comprehensive list for clean builds
  ignoreFiles: [
    // Development files
    '*.py', '*.log', '*.md',
    'package.json', 'package-lock.json',
    'web-ext-config.js',
    'eslint.config.js',
    'postcss.config.js',
    'tailwind.config.js',
    
    // Build directories and artifacts
    'node_modules/**',
    'web-ext-artifacts/**',
    '.git/**',
    '.vscode/**',
    
    // Legacy and scripts
    'legacy/**',
    'scripts/**',
    'test-exports/**',
    
    // Tailwind source (keep compiled version)
    'src/styles/**',
    
    // Development utilities
    'dump.log',
    'webgl-crt.js',
    
    // Documentation
    '*.md',
    'DEBUG.md',
    'method-flow.md',
    'messaging-logging-API.md',
    'CSS-API.md',
    'terminal-log-API.md'
  ],
  
  // Build configuration
  build: {
    filename: 'vibe-reader-{version}.zip',
    overwriteDest: true
  },
  
  // Run configuration for development
  run: {
    // Target Firefox Developer Edition
    firefox: 'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
    
    // Auto-reload on changes
    reload: false,
    
    // Development preferences
    pref: [
      // Enable extension debugging
      'extensions.logging.enabled=true',
      'devtools.chrome.enabled=true',
      
      // Enable WebExtensions debugging
      'extensions.webextensions.remote=true',
      'extensions.webextensions.keepStorageOnUninstall=true',
      
      // Console debugging
      'browser.dom.window.dump.enabled=true',
      'devtools.console.stdout.chrome=true'
    ],
    
    // Auto-open development tools
    devtools: true,
    browserConsole: true,
    
    // Start URLs for testing
    startUrl: [
      'https://en.wikipedia.org/wiki/Cyberpunk',
      'about:debugging'
    ],
    
    // Keep profile changes during development
    keepProfileChanges: false, // Set to true if you want persistent profile
    
    // Additional Firefox arguments
    args: [
      '--new-instance',
      '--no-remote',
      '--devtools'
    ]
  },
  
  // Lint configuration
  lint: {
    // Uses ignoreFiles above
  }
};