import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // This is the key fix - use class strategy instead of media
  theme: {
    extend: {
      fontFamily: {
        'doran': ['DoranFaNum', 'sans-serif'],
        'estedad': ['Estedad', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
