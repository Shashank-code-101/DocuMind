/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          hover: 'var(--bg-surface-hover)',
          alt: 'var(--bg-surface-alt)',
        },
        bento: {
          1: 'var(--bg-bento-1)',
          2: 'var(--bg-bento-2)',
          3: 'var(--bg-bento-3)',
          4: 'var(--bg-bento-4)',
        },
        main: {
          DEFAULT: 'var(--text-main)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        edge: {
          DEFAULT: 'var(--border-main)',
          accent: 'var(--border-accent)',
        },
        brand: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          contrast: 'var(--primary-contrast)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        bento: 'var(--shadow-card)',
        'bento-hover': 'var(--shadow-lift)',
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
