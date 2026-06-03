import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          secondary: 'hsl(var(--surface-secondary))',
          tertiary: 'hsl(var(--surface-tertiary))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light: 'hsl(var(--primary-light))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          soft: 'hsl(var(--gold-soft))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          soft: 'hsl(var(--destructive-soft))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          soft: 'hsl(var(--success-soft))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          soft: 'hsl(var(--warning-soft))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontSize: {
        'display': ['1.5rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.035em' }],
        'display-sm': ['1.125rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.03em' }],
        'heading': ['0.875rem', { lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.02em' }],
        'title': ['0.8125rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '-0.005em' }],
        'caption': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0em' }],
        'micro': ['0.625rem', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '0.01em' }],
        'financial': ['1.375rem', { lineHeight: '1.0', fontWeight: '800', letterSpacing: '-0.035em' }],
        'financial-sm': ['1.0625rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }],
        'financial-xs': ['0.875rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '12px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '22px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 1px 4px rgba(0,0,0,0.04), 0 2px 8px -2px rgba(0,0,0,0.04)',
        'elevated': '0 4px 12px -2px rgba(0,0,0,0.1), 0 1px 4px -1px rgba(0,0,0,0.04)',
        'float': '0 8px 32px -6px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.06)',
        'hero': '0 8px 24px -6px rgba(0,0,0,0.25)',
        'glow-primary': '0 4px 16px -3px hsl(var(--primary) / 0.25)',
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom, 0px)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-up': 'fadeUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-up': 'sheetUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
