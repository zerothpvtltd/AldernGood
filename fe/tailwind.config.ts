import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F7',
        surface: '#FFFFFF',
        border: '#E7E5E0',
        ink: '#1F2328',
        muted: '#6B7078',
        accent: {
          DEFAULT: '#3E6B5E',
          hover: '#335A4F',
        },
        danger: '#B4483D',
        success: '#3E7D5A',
        warning: '#A87A2A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        container: '1120px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;