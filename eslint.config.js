// ESLint configuration for VibeReader browser extension
import js from '@eslint/js';
import globals from 'globals';
import mozilla from 'eslint-plugin-mozilla';
import security from 'eslint-plugin-security';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

export default [
    // Base JavaScript recommended rules
    js.configs.recommended,
    
    // Mozilla WebExtensions configuration (spread the array)
    ...mozilla.configs["flat/recommended"],
    
    // Security plugin (check if it needs spreading)
    ...(Array.isArray(security.configs.recommended) 
        ? security.configs.recommended 
        : [security.configs.recommended]),
    
    // Main configuration for your extension
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                // Custom globals for your libraries
                Readability: 'readonly',
                Rx: 'readonly',
                aalib: 'readonly',
                dump: 'readonly',
                // VibeReader utility classes
                MessageBroker: 'readonly',
                MessageSerializer: 'readonly',
                VibeLogger: 'readonly',
                ThrottledEmitter: 'readonly'
            }
        },
        plugins: {
            security,
            'no-unsanitized': noUnsanitized,
            mozilla
        },
        rules: {
            // Security rules
            'no-unsanitized/method': 'error',
            'no-unsanitized/property': 'error',
            
            // Code quality
            'no-unused-vars': ['error', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrors: 'none'
            }],
            'no-console': 'off',
            'no-debugger': 'error',
            
            // Async best practices
            'require-await': 'warn',
            'no-return-await': 'warn',
            
            // Security
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            
            // Style
            'prefer-const': 'warn',
            'no-var': 'error',
            
            // Extension specific
            'no-empty': ['error', { allowEmptyCatch: true }]
        }
    },
    
    // File-specific overrides for background scripts
    {
        files: ['src/background-enhanced.js'],
        languageOptions: {
            globals: {
                // Background scripts have additional APIs (already covered by webextensions globals)
            }
        }
    },
    
    // File-specific overrides for content scripts
    {
        files: ['src/proxy-controller.js', 'src/stealth-extractor.js'],
        languageOptions: {
            globals: {
                // Content scripts have additional DOM access (mostly covered by browser globals)
                MutationObserver: 'readonly',
                Element: 'readonly',
                HTMLElement: 'readonly',
                Node: 'readonly',
                NodeList: 'readonly',
                HTMLCollection: 'readonly'
            }
        }
    },
    
    // Ignore patterns
    {
        ignores: [
            'lib/**',
            'node_modules/**',
            'web-ext-artifacts/**',
            'styles/generated.css',
            'legacy/**',
            'scripts/**',
            '*.min.js'
        ]
    }
];