/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Laboratory aesthetic color palette for Two-Phase Cooling
      colors: {
        // Primary brand colors - inspired by cooling fluids and laboratory equipment
        primary: {
          50: '#f0f9ff',   // Light cooling blue
          100: '#e0f2fe',  // Very light blue
          200: '#bae6fd',  // Light blue
          300: '#7dd3fc',  // Medium light blue
          400: '#38bdf8',  // Medium blue
          500: '#0ea5e9',  // Primary blue (cooling liquid)
          600: '#0284c7',  // Medium dark blue
          700: '#0369a1',  // Dark blue
          800: '#075985',  // Very dark blue
          900: '#0c4a6e',  // Deepest blue
          950: '#082f49',  // Almost black blue
        },

        // Secondary colors - technical/laboratory feel
        secondary: {
          50: '#f8fafc',   // Near white
          100: '#f1f5f9',  // Very light gray
          200: '#e2e8f0',  // Light gray
          300: '#cbd5e1',  // Medium light gray
          400: '#94a3b8',  // Medium gray
          500: '#64748b',  // Base gray
          600: '#475569',  // Medium dark gray
          700: '#334155',  // Dark gray
          800: '#1e293b',  // Very dark gray
          900: '#0f172a',  // Almost black
        },

        // Accent colors for highlights and CTAs
        accent: {
          50: '#fefce8',   // Light yellow
          100: '#fef9c3',  // Very light yellow
          200: '#fef08a',  // Light yellow
          300: '#fde047',  // Medium yellow
          400: '#facc15',  // Bright yellow
          500: '#eab308',  // Primary yellow (warning/attention)
          600: '#ca8a04',  // Dark yellow
          700: '#a16207',  // Very dark yellow
          800: '#854d0e',  // Brown yellow
          900: '#713f12',  // Dark brown
        },

        // Success/cooling active states
        success: {
          50: '#f0fdf4',   // Very light green
          100: '#dcfce7',  // Light green
          200: '#bbf7d0',  // Medium light green
          300: '#86efac',  // Medium green
          400: '#4ade80',  // Bright green
          500: '#22c55e',  // Primary green (cooling active)
          600: '#16a34a',  // Dark green
          700: '#15803d',  // Very dark green
          800: '#166534',  // Deep green
          900: '#14532d',  // Deepest green
        },

        // Error/thermal alert states
        danger: {
          50: '#fef2f2',   // Very light red
          100: '#fee2e2',  // Light red
          200: '#fecaca',  // Medium light red
          300: '#fca5a5',  // Medium red
          400: '#f87171',  // Bright red
          500: '#ef4444',  // Primary red (thermal warning)
          600: '#dc2626',  // Dark red
          700: '#b91c1c',  // Very dark red
          800: '#991b1b',  // Deep red
          900: '#7f1d1d',  // Deepest red
        },
      },

      // Typography for technical documentation and educational content
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Spacing for laboratory-precise layouts
      spacing: {
        '18': '4.5rem',  // 72px
        '88': '22rem',   // 352px
        '100': '25rem',  // 400px
        '112': '28rem',  // 448px
        '128': '32rem',  // 512px
      },

      // Border radius for modern, technical aesthetic
      borderRadius: {
        'technical': '0.375rem', // 6px - consistent technical radius
        'equipment': '0.75rem',  // 12px - larger equipment panels
      },

      // Box shadows for depth and laboratory equipment feel
      boxShadow: {
        'cooling': '0 0 0 1px rgb(14 165 233 / 0.1), 0 4px 6px -1px rgb(14 165 233 / 0.1)',
        'thermal': '0 0 0 1px rgb(239 68 68 / 0.1), 0 4px 6px -1px rgb(239 68 68 / 0.1)',
        'glass': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.1)',
        'equipment': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05), inset 0 1px 0 rgb(255 255 255 / 0.1)',
      },

      // Animation for cooling effects and UI transitions
      animation: {
        'cooling-pulse': 'cooling-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'thermal-glow': 'thermal-glow 3s ease-in-out infinite alternate',
        'data-flow': 'data-flow 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },

      // Custom keyframes for animations
      keyframes: {
        'cooling-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
            filter: 'hue-rotate(0deg)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(1.05)',
            filter: 'hue-rotate(10deg)',
          },
        },
        'thermal-glow': {
          '0%': {
            boxShadow: '0 0 5px rgb(14 165 233 / 0.5)',
            filter: 'brightness(1)',
          },
          '100%': {
            boxShadow: '0 0 20px rgb(14 165 233 / 0.8), 0 0 40px rgb(14 165 233 / 0.3)',
            filter: 'brightness(1.1)',
          },
        },
        'data-flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },

      // Background patterns and gradients
      backgroundImage: {
        'cooling-gradient': 'linear-gradient(135deg, rgb(14 165 233 / 0.1) 0%, rgb(59 130 246 / 0.05) 100%)',
        'thermal-gradient': 'linear-gradient(135deg, rgb(239 68 68 / 0.1) 0%, rgb(220 38 38 / 0.05) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgb(255 255 255 / 0.1) 0%, rgb(255 255 255 / 0.05) 100%)',
        'circuit-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.05'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20z'/%3E%3C/g%3E%3C/svg%3E\")",
      },

      // Custom utilities for video players and technical components
      screens: {
        'xs': '475px',
        '3xl': '1680px',
        '4xl': '2048px',
      },

      // Typography scale for technical documentation
      fontSize: {
        'technical': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'data': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em', fontWeight: '500' }],
        'display-sm': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        'display-md': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        'display-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        'display-xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },

      // Z-index scale for layered UI components
      zIndex: {
        'video-overlay': '10',
        'video-controls': '20',
        'modal-backdrop': '40',
        'modal': '50',
        'toast': '60',
        'tooltip': '70',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}