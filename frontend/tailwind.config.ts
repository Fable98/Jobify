import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Soft mint primary tokens matching Product UI Styleguide (#9EBCEEC / #9FE3C8)
        mint: {
          50: '#F2FAF6',
          100: '#E1F5EC',
          200: '#C3EBDA',
          300: '#9FE3C8', // Primary styleguide token
          400: '#74D4B1',
          500: '#42C093',
          600: '#289E73',
          700: '#1F7D5C',
          800: '#1A634B',
          900: '#134F3C',
          950: '#0B2D22',
        },
        brand: {
          50: '#F2FAF6',
          100: '#E1F5EC',
          200: '#C3EBDA',
          300: '#9FE3C8',
          400: '#74D4B1',
          500: '#42C093',
          600: '#289E73',
          700: '#1F7D5C',
          800: '#1A634B',
          900: '#134F3C',
          950: '#0B2D22',
        },
        surface: {
          DEFAULT: '#F7F8FA', // Porcelain background
          card: '#FFFFFF',
          inset: '#EFF1F5',
          border: '#E2E6EC',
        },
      },
      boxShadow: {
        // Multi-level tactile elevation shadows matching Styleguide
        'clay-1': '0 2px 4px rgba(0,0,0,0.02), 0 4px 10px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
        'clay-2': '0 4px 8px rgba(0,0,0,0.03), 0 10px 22px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
        'clay-3': '0 8px 16px rgba(0,0,0,0.04), 0 18px 36px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,1)',
        'clay-4': '0 12px 24px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.08)',
        'clay-5': '0 16px 32px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.1)',
        'clay-btn': '0 4px 14px -2px rgba(40, 158, 115, 0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
        'clay-btn-hover': '0 6px 20px -2px rgba(40, 158, 115, 0.45), inset 0 1px 0 rgba(255,255,255,0.95)',
        'clay-inset': 'inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.9)',
        'focus-ring': '0 0 0 3px rgba(0, 207, 204, 0.45)',
        'focus-mint': '0 0 0 3px rgba(159, 227, 200, 0.55)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
