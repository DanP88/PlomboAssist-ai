export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: { bg: '#1e2433', hover: '#2a3347', active: '#2d3a54', border: '#2a3347' },
        brand: { primary: '#3b82f6', secondary: '#1d4ed8' }
      }
    }
  },
  plugins: []
}
