import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        imperial: '#202020',
        saber: '#22c55e',
        signal: '#0f766e',
        alert: '#dc2626',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
