import type { Config } from 'tailwindcss';

const palette = (name: string, shades: number[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) =>
  Object.fromEntries(shades.map((shade) => [shade, `rgb(var(--p-${name}-${shade}) / <alpha-value>)`]));

export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/types/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: palette('gray'),
        slate: palette('gray'),
        green: palette('green'),
        emerald: palette('green'),
        amber: palette('amber'),
        red: palette('red'),
        blue: palette('blue'),
        sky: palette('sky'),
        violet: palette('violet', [50, 100, 200, 700]),
        indigo: palette('indigo', [50, 200, 700]),
        teal: palette('teal', [50, 100, 200, 700, 800]),
        lime: palette('lime', [50, 100, 300, 700]),
        yellow: palette('yellow', [400]),
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-subtle': 'var(--surface-subtle)',
        'surface-raised': 'var(--surface-raised)',
        foreground: 'var(--foreground)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        'accent-soft': 'var(--accent-soft)',
        'accent-foreground': 'var(--accent-foreground)',
        focus: 'var(--focus)',
        warning: 'var(--warning)',
        'warning-foreground': 'var(--warning-foreground)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        'danger-foreground': 'var(--danger-foreground)',
        // Theme-aware agricultural greens
        brand: palette('green'),
        // Earth tones
        earth: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#eab308',
          500: '#a16207',
          600: '#854d0e',
          700: '#78350f',
          800: '#451a03',
        },
        // Warm grays
        cream: {
          50: '#fefdfb',
          100: '#fdf8f0',
          200: '#f9edd6',
          300: '#f3dcb0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
        'premium': '0 4px 20px rgba(22, 101, 52, 0.15)',
        'premium-lg': '0 8px 40px rgba(22, 101, 52, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 4s infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-right': 'slideRight 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
