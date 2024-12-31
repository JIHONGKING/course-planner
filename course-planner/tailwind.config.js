/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // app 디렉토리의 모든 js, ts, jsx, tsx 파일
    './pages/**/*.{js,ts,jsx,tsx}', // pages 디렉토리의 모든 js, ts, jsx, tsx 파일
    './components/**/*.{js,ts,jsx,tsx}', // components 디렉토리의 모든 js, ts, jsx, tsx 파일

    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx}', // src 디렉토리의 모든 js, ts, jsx, tsx 파일
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}