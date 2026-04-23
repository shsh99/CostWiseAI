/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cw: {
          nav0: '#1e1b4b',
          nav1: '#312e81',
          page: '#eef2f8',
          cardBorder: '#e2e8f0',
          muted: '#62759a',
          text: '#182844',
          primary: '#2666e2',
          primary2: '#1ab3dc'
        }
      },
      boxShadow: {
        'cw-sidebar': '2px 0 20px rgba(0, 0, 0, 0.1)'
      }
    }
  },
  plugins: []
};
