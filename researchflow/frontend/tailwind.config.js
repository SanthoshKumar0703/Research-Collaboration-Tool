/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        'paper-soft': 'rgb(var(--c-paper-soft) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        'card-2': 'rgb(var(--c-card-2) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-2': 'rgb(var(--c-line-2) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--c-ink-2) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        wine: 'rgb(var(--c-wine) / <alpha-value>)',
        'wine-deep': 'rgb(var(--c-wine-deep) / <alpha-value>)',
        'wine-soft': 'rgb(var(--c-wine-soft) / <alpha-value>)',
        copper: 'rgb(var(--c-copper) / <alpha-value>)',
        'copper-soft': 'rgb(var(--c-copper-soft) / <alpha-value>)',
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        'gold-soft': 'rgb(var(--c-gold-soft) / <alpha-value>)',
        moss: 'rgb(var(--c-moss) / <alpha-value>)',
        amber: 'rgb(var(--c-amber) / <alpha-value>)',
        rust: 'rgb(var(--c-rust) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        floaty: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        marquee: 'marquee 36s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 70s linear infinite',
      },
    },
  },
  plugins: [],
};
