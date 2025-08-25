/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./*.js",
        "./**/*.js",
        "./popup/**/*.{html,js}",
        "!./node_modules/**/*",
        "!./legacy/**/*"
    ],
    theme: {
        extend: {
            colors: {
                // Primary Colors - Neon Pink Spectrum
                primary: {
                    50: 'rgb(var(--primary-50) / <alpha-value>)',
                    100: 'rgb(var(--primary-100) / <alpha-value>)',
                    200: 'rgb(var(--primary-200) / <alpha-value>)',
                    300: 'rgb(var(--primary-300) / <alpha-value>)',
                    400: 'rgb(var(--primary-400) / <alpha-value>)',
                    500: 'rgb(var(--primary-500) / <alpha-value>)',
                    600: 'rgb(var(--primary-600) / <alpha-value>)',
                    700: 'rgb(var(--primary-700) / <alpha-value>)',
                    800: 'rgb(var(--primary-800) / <alpha-value>)',
                    900: 'rgb(var(--primary-900) / <alpha-value>)',
                },
                // Secondary Colors - Electric Cyan Spectrum
                secondary: {
                    50: 'rgb(var(--secondary-50) / <alpha-value>)',
                    100: 'rgb(var(--secondary-100) / <alpha-value>)',
                    200: 'rgb(var(--secondary-200) / <alpha-value>)',
                    300: 'rgb(var(--secondary-300) / <alpha-value>)',
                    400: 'rgb(var(--secondary-400) / <alpha-value>)',
                    500: 'rgb(var(--secondary-500) / <alpha-value>)',
                    600: 'rgb(var(--secondary-600) / <alpha-value>)',
                    700: 'rgb(var(--secondary-700) / <alpha-value>)',
                    800: 'rgb(var(--secondary-800) / <alpha-value>)',
                    900: 'rgb(var(--secondary-900) / <alpha-value>)',
                },
                // Accent Colors - Golden/Orange Spectrum
                accent: {
                    50: 'rgb(var(--accent-50) / <alpha-value>)',
                    100: 'rgb(var(--accent-100) / <alpha-value>)',
                    200: 'rgb(var(--accent-200) / <alpha-value>)',
                    300: 'rgb(var(--accent-300) / <alpha-value>)',
                    400: 'rgb(var(--accent-400) / <alpha-value>)',
                    500: 'rgb(var(--accent-500) / <alpha-value>)',
                    600: 'rgb(var(--accent-600) / <alpha-value>)',
                    700: 'rgb(var(--accent-700) / <alpha-value>)',
                    800: 'rgb(var(--accent-800) / <alpha-value>)',
                    900: 'rgb(var(--accent-900) / <alpha-value>)',
                },
                // Success Colors - Green Spectrum
                success: {
                    50: 'rgb(var(--success-50) / <alpha-value>)',
                    100: 'rgb(var(--success-100) / <alpha-value>)',
                    200: 'rgb(var(--success-200) / <alpha-value>)',
                    300: 'rgb(var(--success-300) / <alpha-value>)',
                    400: 'rgb(var(--success-400) / <alpha-value>)',
                    500: 'rgb(var(--success-500) / <alpha-value>)',
                    600: 'rgb(var(--success-600) / <alpha-value>)',
                    700: 'rgb(var(--success-700) / <alpha-value>)',
                    800: 'rgb(var(--success-800) / <alpha-value>)',
                    900: 'rgb(var(--success-900) / <alpha-value>)',
                },
                // Warning Colors - Orange Spectrum
                warning: {
                    50: 'rgb(var(--warning-50) / <alpha-value>)',
                    100: 'rgb(var(--warning-100) / <alpha-value>)',
                    200: 'rgb(var(--warning-200) / <alpha-value>)',
                    300: 'rgb(var(--warning-300) / <alpha-value>)',
                    400: 'rgb(var(--warning-400) / <alpha-value>)',
                    500: 'rgb(var(--warning-500) / <alpha-value>)',
                    600: 'rgb(var(--warning-600) / <alpha-value>)',
                    700: 'rgb(var(--warning-700) / <alpha-value>)',
                    800: 'rgb(var(--warning-800) / <alpha-value>)',
                    900: 'rgb(var(--warning-900) / <alpha-value>)',
                },
                // Error Colors - Pink/Red Spectrum
                error: {
                    50: 'rgb(var(--error-50) / <alpha-value>)',
                    100: 'rgb(var(--error-100) / <alpha-value>)',
                    200: 'rgb(var(--error-200) / <alpha-value>)',
                    300: 'rgb(var(--error-300) / <alpha-value>)',
                    400: 'rgb(var(--error-400) / <alpha-value>)',
                    500: 'rgb(var(--error-500) / <alpha-value>)',
                    600: 'rgb(var(--error-600) / <alpha-value>)',
                    700: 'rgb(var(--error-700) / <alpha-value>)',
                    800: 'rgb(var(--error-800) / <alpha-value>)',
                    900: 'rgb(var(--error-900) / <alpha-value>)',
                },
                // Info Colors - Purple Spectrum
                info: {
                    50: 'rgb(var(--info-50) / <alpha-value>)',
                    100: 'rgb(var(--info-100) / <alpha-value>)',
                    200: 'rgb(var(--info-200) / <alpha-value>)',
                    300: 'rgb(var(--info-300) / <alpha-value>)',
                    400: 'rgb(var(--info-400) / <alpha-value>)',
                    500: 'rgb(var(--info-500) / <alpha-value>)',
                    600: 'rgb(var(--info-600) / <alpha-value>)',
                    700: 'rgb(var(--info-700) / <alpha-value>)',
                    800: 'rgb(var(--info-800) / <alpha-value>)',
                    900: 'rgb(var(--info-900) / <alpha-value>)',
                },
                // Neutral Colors - Gray Spectrum
                neutral: {
                    50: 'rgb(var(--neutral-50) / <alpha-value>)',
                    100: 'rgb(var(--neutral-100) / <alpha-value>)',
                    200: 'rgb(var(--neutral-200) / <alpha-value>)',
                    300: 'rgb(var(--neutral-300) / <alpha-value>)',
                    400: 'rgb(var(--neutral-400) / <alpha-value>)',
                    500: 'rgb(var(--neutral-500) / <alpha-value>)',
                    600: 'rgb(var(--neutral-600) / <alpha-value>)',
                    700: 'rgb(var(--neutral-700) / <alpha-value>)',
                    800: 'rgb(var(--neutral-800) / <alpha-value>)',
                    900: 'rgb(var(--neutral-900) / <alpha-value>)',
                },

                // Background colors
                bg: {
                    primary: 'rgb(var(--bg-primary) / <alpha-value>)',
                    secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
                    tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
                    elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
                    surface: 'rgb(var(--bg-surface) / <alpha-value>)',
                    overlay: 'rgb(var(--bg-overlay) / <alpha-value>)',
                },

                // Text colors
                text: {
                    primary: 'rgb(var(--text-primary) / <alpha-value>)',
                    secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
                    muted: 'rgb(var(--text-muted) / <alpha-value>)',
                    disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
                    inverse: 'rgb(var(--text-inverse) / <alpha-value>)',
                },

                // Border colors
                border: {
                    subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
                    default: 'rgb(var(--border-default) / <alpha-value>)',
                    strong: 'rgb(var(--border-strong) / <alpha-value>)',
                    accent: 'rgb(var(--border-accent) / <alpha-value>)',
                }
            },

            fontFamily: {
                'mono': ['"Fira Code"', '"SF Mono"', 'Monaco', 'Inconsolata', '"Roboto Mono"', 'Consolas', '"Courier New"', 'monospace'],
                'synthwave': ['Orbitron', 'Rajdhani', '"Share Tech Mono"', 'monospace'],
            },

            backgroundImage: {
                // Theme-specific gradients using CSS variables
                'nightdrive': 'radial-gradient(ellipse at center, rgb(var(--bg-primary)), rgb(var(--bg-secondary)))',
                'neon-surge': 'radial-gradient(ellipse at 25% 75%, rgb(var(--primary-500) / 0.2) 0%, transparent 50%), radial-gradient(ellipse at 75% 25%, rgb(var(--secondary-500) / 0.15) 0%, transparent 50%), linear-gradient(135deg, rgb(var(--bg-primary)) 0%, rgb(var(--bg-secondary)) 50%, rgb(var(--bg-tertiary)) 100%)',
                'outrun-storm': 'radial-gradient(ellipse at 30% 70%, rgb(var(--primary-500) / 0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgb(var(--secondary-500) / 0.2) 0%, transparent 60%), linear-gradient(45deg, rgb(var(--bg-primary)) 0%, rgb(var(--bg-secondary)) 30%, rgb(var(--bg-tertiary)) 70%, rgb(var(--bg-primary)) 100%)',
                'strange-days': 'radial-gradient(circle at 20% 80%, rgb(var(--accent-500) / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgb(var(--primary-500) / 0.2) 0%, transparent 50%), linear-gradient(135deg, rgb(var(--bg-primary)) 0%, #0d0d0d 50%, rgb(var(--bg-tertiary)) 100%)',

                // Button gradients using CSS variables
                'btn-primary': 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                'btn-secondary': 'linear-gradient(135deg, rgb(var(--secondary-500)), rgb(var(--accent-500)))',
                'btn-error': 'linear-gradient(135deg, rgb(var(--error-500)), rgb(var(--primary-600)))',

                // Hover states
                'btn-primary-hover': 'linear-gradient(135deg, rgb(var(--secondary-500)), rgb(var(--accent-500)))',
                'btn-error-hover': 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--error-500)))',
            },

            boxShadow: {
                // Theme-aware shadows using CSS variables
                'neon': '0 0 20px rgb(var(--glow-primary) / 0.6), inset 0 0 20px rgb(var(--secondary-500) / 0.1)',
                'neon-hover': '0 0 30px rgb(var(--glow-secondary) / 0.8), 0 0 50px rgb(var(--glow-accent) / 0.6)',
                'neon-primary': '0 0 15px rgb(var(--glow-primary) / 0.5), 0 0 30px rgb(var(--glow-primary) / 0.3)',
                'neon-secondary': '0 0 15px rgb(var(--glow-secondary) / 0.5), 0 0 30px rgb(var(--glow-secondary) / 0.3)',
                'neon-accent': '0 0 15px rgb(var(--glow-accent) / 0.5), 0 0 30px rgb(var(--glow-accent) / 0.3)',
                'neon-dual': '0 0 15px rgb(var(--glow-primary) / 0.5), 0 0 30px rgb(var(--glow-secondary) / 0.3)',

                // Theme-specific button shadows
                'button-nightdrive': '0 0 20px rgb(var(--glow-primary) / 0.6), inset 0 0 20px rgb(var(--secondary-500) / 0.1)',
                'button-neon': '0 0 25px rgb(var(--glow-primary) / 0.8), inset 0 0 25px rgb(var(--secondary-500) / 0.15)',
                'button-storm': '0 0 30px rgb(var(--glow-primary) / 0.7), inset 0 0 30px rgb(var(--secondary-500) / 0.2)',
                'button-phantom': '0 0 30px rgb(var(--glow-primary) / 0.6), inset 0 0 20px rgb(var(--secondary-500) / 0.3)',
            },

            animation: {
                // Your existing animations
                'nightdrive-pulse': 'nightdrive-pulse 4s ease-in-out infinite',
                'electric-pulse': 'electric-pulse 3s ease-in-out infinite',
                'storm-pulse': 'storm-pulse 4s ease-in-out infinite',
                'phantom-flicker': 'phantom-flicker 4s ease-in-out infinite',
                'electric-scan': 'electric-scan 2s linear infinite',
                'storm-scan': 'storm-scan 3s linear infinite',
                'underground-scan': 'underground-scan 5s linear infinite',
                'storm-lightning': 'storm-lightning 8s linear infinite',
                'underground-drift': 'underground-drift 20s linear infinite',
                'data-corruption': 'data-corruption 0.2s linear infinite',
                'matrix-fall': 'matrix-fall 5s linear infinite',
                'glitch': 'glitch 2s infinite',
                'scan': 'scan 4s linear infinite',
                'pulse-glow': 'pulse-glow var(--pulse-speed, 2s) ease-in-out infinite',
                'flicker': 'flicker 4s ease-in-out infinite',
            },

            keyframes: {
                'nightdrive-pulse': {
                    '0%, 100%': {
                        boxShadow: '0 0 15px rgb(var(--glow-primary) / 0.3)',
                        borderColor: 'rgb(var(--border-primary) / 0.5)'
                    },
                    '50%': {
                        boxShadow: '0 0 30px rgb(var(--glow-primary) / 0.6), 0 0 45px rgb(var(--glow-secondary) / 0.4)',
                        borderColor: 'rgb(var(--border-primary) / 0.8)'
                    },
                },
                'electric-scan': {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '50%': { opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                'storm-lightning': {
                    '0%, 90%, 100%': { opacity: '0.1' },
                    '5%': { opacity: '1' },
                    '10%': { opacity: '0.2' },
                    '15%': { opacity: '1' },
                    '20%': { opacity: '0.1' },
                    '25%': { opacity: '0.9' },
                    '30%': { opacity: '0.1' },
                },
                'phantom-flicker': {
                    '0%, 100%': {
                        opacity: '1',
                        textShadow: '0 0 25px rgb(var(--glow-primary) / 0.8)'
                    },
                    '3%, 7%, 11%': {
                        opacity: '0.3',
                        textShadow: '0 0 5px rgb(var(--glow-primary) / 0.3)'
                    },
                    '5%, 9%': {
                        opacity: '1',
                        textShadow: '0 0 40px rgb(var(--glow-primary) / 1)'
                    },
                },
                'underground-drift': {
                    '0%': { transform: 'translateX(0) translateY(0)' },
                    '100%': { transform: 'translateX(-100px) translateY(-100px)' },
                },
                'data-corruption': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-2px)' },
                    '75%': { transform: 'translateX(2px)' },
                },
                'scan': {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '50%': { opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                'pulse-glow': {
                    '0%, 100%': {
                        boxShadow: '0 0 15px rgb(var(--glow-primary) / 0.6)',
                        borderColor: 'rgb(var(--border-primary) / 0.8)'
                    },
                    '50%': {
                        boxShadow: '0 0 30px rgb(var(--glow-primary) / 0.8), 0 0 45px rgb(var(--glow-secondary) / 0.6)',
                        borderColor: 'rgb(var(--border-primary))'
                    },
                },
                'flicker': {
                    '0%, 100%': { opacity: '1' },
                    '3%, 7%, 11%': { opacity: '0.3' },
                    '5%, 9%': { opacity: '1' },
                },
                'matrix-fall': {
                    '0%': { transform: 'translateY(-100vh)', opacity: '1' },
                    '100%': { transform: 'translateY(100vh)', opacity: '0' },
                },
            },

            zIndex: {
                'extension': '1000',     // Extension overlay above page content
                'header': '10',          // Header bar (relative to extension)
                'sidebar': '20',         // Terminal panels
                'content': '30',         // Main content area  
                'media': '40',           // Image/video previews
                'modal': '50',           // Modals, popups, terminal overlays
                'dropdown': '60',        // Dropdown menus
                'tooltip': '70',         // Tooltips and hints
                'notification': '80'     // Toast notifications
            }
        },
    },
    plugins: [
    function({ addUtilities, matchUtilities, addBase, addVariant }) {

        // Add variants for clip-path and other utilities
        addVariant('hover', '&:hover')
        addVariant('active', '&:active')
        addVariant('focus', '&:focus')
        addVariant('group-hover', '.group:hover &')

        // Theme-responsive clip-path utilities
        const clipPathUtilities = {
            '.clip-corner': {
                clipPath: 'polygon(var(--clip-size, 15px) 0%, 100% 0%, calc(100% - var(--clip-size, 15px)) 100%, 0% 100%)',
            },
            '.clip-corner-sm': {
                '--clip-size': '10px',
                clipPath: 'polygon(var(--clip-size) 0%, 100% 0%, calc(100% - var(--clip-size)) 100%, 0% 100%)',
            },
            '.clip-corner-lg': {
                '--clip-size': '20px',
                clipPath: 'polygon(var(--clip-size) 0%, 100% 0%, calc(100% - var(--clip-size)) 100%, 0% 100%)',
            },
            '.clip-corner-xl': {
                '--clip-size': '25px',
                clipPath: 'polygon(var(--clip-size) 0%, 100% 0%, calc(100% - var(--clip-size)) 100%, 0% 100%)',
            },
            '.clip-bevel': {
                clipPath: 'polygon(var(--bevel-size, 15px) 0%, 100% 0%, calc(100% - var(--bevel-size, 15px)) 100%, 0% 100%)',
            },
            '.clip-terminal': {
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - var(--terminal-cut, 10px)), calc(100% - var(--terminal-cut, 10px)) 100%, 0 100%)',
            },
            '.clip-none': {
                clipPath: 'none',
            },

            // Hover variants
            '.hover\\:clip-corner-lg:hover': {
                '--clip-size': '20px',
                clipPath: 'polygon(var(--clip-size) 0%, 100% 0%, calc(100% - var(--clip-size)) 100%, 0% 100%)',
            },
            '.hover\\:clip-corner-xl:hover': {
                '--clip-size': '25px',
                clipPath: 'polygon(var(--clip-size) 0%, 100% 0%, calc(100% - var(--clip-size)) 100%, 0% 100%)',
            },
            '.hover\\:clip-bevel:hover': {
                '--bevel-size': '20px',
                clipPath: 'polygon(var(--bevel-size) 0%, 100% 0%, calc(100% - var(--bevel-size)) 100%, 0% 100%)',
            },
            '.hover\\:clip-none:hover': {
                clipPath: 'none',
            },

            // Active variants
            '.active\\:clip-corner-sm:active': {
                '--clip-size': '10px',
                clipPath: 'polygon(var(--clip-size) 0%, 100% 0%, calc(100% - var(--clip-size)) 100%, 0% 100%)',
            },
        }

        addUtilities(clipPathUtilities)

      // Add dynamic clip-path utilities with arbitrary values
      matchUtilities(
        {
          'clip': (value) => ({
            clipPath: value,
          }),
        },
        {
          values: {
            'diamond': 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            'triangle': 'polygon(50% 0%, 100% 100%, 0% 100%)',
            'arrow-left': 'polygon(0% 50%, 40% 0%, 40% 30%, 100% 30%, 100% 70%, 40% 70%, 40% 100%)',
            'arrow-right': 'polygon(0% 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0% 70%)',
    }
        }
      )

      // Add base CSS variables that change per theme
            addBase({
                ':root': {
                    // Default theme (nightdrive) variables
                    '--clip-size': '15px',
                    '--bevel-size': '15px',
                    '--terminal-cut': '10px',
                    '--pulse-speed': '4s',

                    '--primary-50': '255 192 203',
                    '--primary-100': '255 182 193',
                    '--primary-200': '255 148 198',
                    '--primary-300': '255 105 180',
                    '--primary-400': '255 75 156',
                    '--primary-500': '249 38 114',
                    '--primary-600': '224 110 146',
                    '--primary-700': '215 61 133',
                    '--primary-800': '192 58 105',
                    '--primary-900': '164 0 85',

                    '--secondary-50': '224 255 255',
                    '--secondary-100': '179 255 255',
                    '--secondary-200': '136 255 255',
                    '--secondary-300': '0 255 255',
                    '--secondary-400': '0 191 255',
                    '--secondary-500': '102 217 239',
                    '--secondary-600': '126 200 227',
                    '--secondary-700': '90 79 207',
                    '--secondary-800': '74 150 255',
                    '--secondary-900': '0 120 168',

                    '--accent-50': '255 243 160',
                    '--accent-100': '255 234 0',
                    '--accent-200': '255 221 68',
                    '--accent-300': '255 195 0',
                    '--accent-400': '230 219 116',
                    '--accent-500': '255 191 128',
                    '--accent-600': '255 154 96',
                    '--accent-700': '255 140 60',
                    '--accent-800': '255 111 48',
                    '--accent-900': '204 77 0',

                    '--success-500': '166 226 46',
                    '--warning-500': '253 151 31',
                    '--error-500': '249 38 114',
                    '--info-500': '174 129 255',

                    '--bg-primary': '28 28 28',
                    '--bg-secondary': '44 26 41',
                    '--bg-tertiary': '40 27 76',
                    '--bg-surface': '30 30 63',
                    '--bg-overlay': '55 46 99',
                    '--bg-terminal': '13 13 13',

                    '--text-primary-500': '247 247 247',
                    '--text-secondary-500': '224 176 255',
                    '--text-accent-500': '102 217 239',
                    '--text-muted-500': '234 184 228',
                    '--text-bright-500': '255 255 255',
                    '--text-disabled-500': '185 134 193',

                    '--border-primary': '249 38 114',
                    '--border-secondary': '102 217 239',
                    '--border-subtle': '62 62 62',
                    '--border-accent': '255 191 128',
                    '--border-strong': '215 61 133',

                    '--glow-primary': '249 38 114',
                    '--glow-secondary': '102 217 239',
                    '--glow-accent': '255 191 128',
                },

                // Neon Surge theme
                '[data-theme="neon-surge"]': {
                    '--clip-size': '10px',
                    '--bevel-size': '8px',
                    '--terminal-cut': '5px',
                    '--pulse-speed': '2s',

                    '--primary-50': '255 192 203',
                    '--primary-100': '255 128 193',
                    '--primary-200': '255 105 180',
                    '--primary-300': '255 70 184',
                    '--primary-400': '255 63 132',
                    '--primary-500': '255 20 147',
                    '--primary-600': '242 30 148',
                    '--primary-700': '224 110 146',
                    '--primary-800': '213 0 109',
                    '--primary-900': '191 0 72',

                    '--secondary-50': '224 255 255',
                    '--secondary-100': '179 255 255',
                    '--secondary-200': '136 255 255',
                    '--secondary-300': '0 255 255',
                    '--secondary-400': '0 191 255',
                    '--secondary-500': '13 92 255',
                    '--secondary-600': '74 150 255',
                    '--secondary-700': '0 120 168',
                    '--secondary-800': '0 91 153',
                    '--secondary-900': '0 63 103',

                    '--accent-50': '255 243 160',
                    '--accent-100': '255 234 0',
                    '--accent-200': '255 221 68',
                    '--accent-300': '255 195 0',
                    '--accent-400': '255 191 0',
                    '--accent-500': '255 204 0',
                    '--accent-600': '230 230 0',
                    '--accent-700': '255 240 51',
                    '--accent-800': '255 191 128',
                    '--accent-900': '204 77 0',

                    '--bg-primary': '0 0 0',
                    '--bg-secondary': '13 13 42',
                    '--bg-tertiary': '15 11 30',
                    '--bg-surface': '0 17 34',
                    '--bg-overlay': '25 25 112',
                    '--bg-terminal': '0 0 0',

                    '--text-primary-500': '255 255 255',
                    '--text-secondary-500': '0 255 255',
                    '--text-accent-500': '255 20 147',
                    '--text-muted-500': '136 255 255',
                    '--text-bright-500': '255 255 255',
                    '--text-disabled-500': '74 150 255',

                    '--border-primary': '255 20 147',
                    '--border-secondary': '13 92 255',
                    '--border-subtle': '25 25 112',
                    '--border-accent': '255 204 0',
                    '--border-strong': '213 0 109',

                    '--glow-primary': '255 20 147',
                    '--glow-secondary': '13 92 255',
                    '--glow-accent': '255 204 0',
                },

                // Outrun Storm theme
                '[data-theme="outrun-storm"]': {
                    '--clip-size': '20px',
                    '--bevel-size': '18px',
                    '--terminal-cut': '15px',
                    '--pulse-speed': '3s',

                    '--primary-50': '224 176 255',
                    '--primary-100': '218 112 214',
                    '--primary-200': '199 93 225',
                    '--primary-300': '185 134 193',
                    '--primary-400': '155 89 182',
                    '--primary-500': '138 43 226',
                    '--primary-600': '123 80 178',
                    '--primary-700': '106 32 181',
                    '--primary-800': '92 46 145',
                    '--primary-900': '75 0 130',

                    '--secondary-50': '255 224 176',
                    '--secondary-100': '255 191 128',
                    '--secondary-200': '255 154 96',
                    '--secondary-300': '255 140 60',
                    '--secondary-400': '255 111 48',
                    '--secondary-500': '255 111 32',
                    '--secondary-600': '255 111 145',
                    '--secondary-700': '253 151 31',
                    '--secondary-800': '204 77 0',
                    '--secondary-900': '168 43 43',

                    '--accent-50': '224 255 255',
                    '--accent-100': '173 216 230',
                    '--accent-200': '135 206 250',
                    '--accent-300': '126 200 227',
                    '--accent-400': '106 141 182',
                    '--accent-500': '90 79 207',
                    '--accent-600': '75 98 176',
                    '--accent-700': '70 130 180',
                    '--accent-800': '88 104 153',
                    '--accent-900': '75 44 142',

                    '--bg-primary': '15 11 30',
                    '--bg-secondary': '30 26 120',
                    '--bg-tertiary': '40 27 76',
                    '--bg-surface': '43 28 84',
                    '--bg-overlay': '60 42 120',
                    '--bg-terminal': '15 11 30',

                    '--text-primary-500': '224 176 255',
                    '--text-secondary-500': '218 112 214',
                    '--text-accent-500': '255 111 32',
                    '--text-muted-500': '199 93 225',
                    '--text-bright-500': '255 255 255',
                    '--text-disabled-500': '155 89 182',

                    '--border-primary': '138 43 226',
                    '--border-secondary': '255 111 32',
                    '--border-subtle': '92 46 145',
                    '--border-accent': '90 79 207',
                    '--border-strong': '106 32 181',

                    '--glow-primary': '138 43 226',
                    '--glow-secondary': '255 111 32',
                    '--glow-accent': '90 79 207',
                },

                // Strange Days theme
                '[data-theme="strange-days"]': {
                    '--clip-size': '25px',
                    '--bevel-size': '22px',
                    '--terminal-cut': '20px',
                    '--pulse-speed': '5s',

                    '--primary-50': '255 192 203',
                    '--primary-100': '255 182 193',
                    '--primary-200': '255 128 193',
                    '--primary-300': '255 104 163',
                    '--primary-400': '255 76 143',
                    '--primary-500': '255 70 184',
                    '--primary-600': '224 110 146',
                    '--primary-700': '218 59 106',
                    '--primary-800': '192 58 105',
                    '--primary-900': '155 0 67',

                    '--secondary-50': '204 255 204',
                    '--secondary-100': '152 255 152',
                    '--secondary-200': '0 255 127',
                    '--secondary-300': '50 205 50',
                    '--secondary-400': '166 226 46',
                    '--secondary-500': '32 178 170',
                    '--secondary-600': '0 178 169',
                    '--secondary-700': '0 133 122',
                    '--secondary-800': '0 92 0',
                    '--secondary-900': '0 50 0',

                    '--accent-50': '224 176 255',
                    '--accent-100': '218 112 214',
                    '--accent-200': '199 93 225',
                    '--accent-300': '185 134 193',
                    '--accent-400': '165 76 147',
                    '--accent-500': '147 27 133',
                    '--accent-600': '138 63 150',
                    '--accent-700': '110 64 130',
                    '--accent-800': '95 75 140',
                    '--accent-900': '75 0 63',

                    '--bg-primary': '26 26 26',
                    '--bg-secondary': '44 26 41',
                    '--bg-tertiary': '46 46 52',
                    '--bg-surface': '40 27 76',
                    '--bg-overlay': '55 46 99',
                    '--bg-terminal': '26 26 26',

                    '--text-primary-500': '224 176 255',
                    '--text-secondary-500': '152 255 152',
                    '--text-accent-500': '255 70 184',
                    '--text-muted-500': '218 112 214',
                    '--text-bright-500': '255 255 255',
                    '--text-disabled-500': '185 134 193',

                    '--border-primary': '255 70 184',
                    '--border-secondary': '32 178 170',
                    '--border-subtle': '95 75 140',
                    '--border-accent': '147 27 133',
                    '--border-strong': '218 59 106',

                    '--glow-primary': '255 70 184',
                    '--glow-secondary': '32 178 170',
                    '--glow-accent': '147 27 133',
                },
            })
        },
    ],
}