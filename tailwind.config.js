/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        sidebar: '#111111',
        panel: '#151515',
        editor: '#0d1117',
        hover: '#1e1e1e',
        active: '#252526',
        
        primary: '#e6edf3',
        secondary: '#9da1a6',
        muted: '#6e7681',
        
        accent: '#3b82f6', // Cursor blue
        'accent-hover': '#60a5fa',

        success: '#34d399',
        danger: '#f87171',
        warning: '#fbbf24',
        info: '#60a5fa',

        'border-subtle': 'rgba(255,255,255,0.06)',
        'border-default': 'rgba(255,255,255,0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}