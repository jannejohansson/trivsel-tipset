/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        'primary-container': 'rgb(6 95 24 / 1)',
        'on-primary-container': 'rgb(134 216 129 / 1)',
        'surface': '#131313',
        'surface-container-low': '#1c1b1b',
        'surface-container-lowest': '#0e0e0e',
        'surface-tone': '#0f1f42',
        'text': '#e5e2e1',
        'secondary': '#e9c349',
        'primary': '#88d982'
      },
    },
  },
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },  
};
