import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        newsprint: '#FAF8F2',
        cream: '#F0ECE2',
        'press-black': '#0D0D0D',
        'crash-red': '#FF2020',
        'crash-red-dark': '#CC0000',
        'volt-green': '#5DC900',
        'volt-green-dark': '#3D9900',
        coral: '#FF6B2B',
        'ink-gray': '#C8C4BA',
        muted: '#888880',
      },
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        epilogue: ['Epilogue', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        brutal: '4px 4px 0 #0D0D0D',
        'brutal-lg': '6px 6px 0 #0D0D0D',
        'brutal-hover': '2px 2px 0 #0D0D0D',
      },
    },
  },
  plugins: [],
};

export default config;
