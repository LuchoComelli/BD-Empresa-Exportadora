/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores originales primary (mantenidos)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Colores específicos del proyecto (matching Next.js)
        'ministerio-navy': '#222A59',
        'ministerio-blue': '#3259B5',
        'ministerio-yellow': '#C3C840',
        'ministerio-light-blue': '#629BD2',
        'ministerio-purple': '#807DA1',
        'ministerio-gray': '#6B7280',
        'ministerio-light-gray': '#F3F4F6',
      },
    },
  },
  plugins: [],
}