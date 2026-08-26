/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f3ee',
        'canvas-alt': '#ece9e2',
        ink: '#141311',
        'ink-fog': '#6f6c64',
        rule: '#ddd9d0',

        black: '#0a0a0a',
        panel: '#141414',
        'panel-light': '#1c1c1c',
        line: '#272727',
        bone: '#f2f0ea',
        fog: '#a6a49e',
        mute: '#6f6e69',
      },
      fontFamily: {
        display: ['var(--font-manrope)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        rise: {
          '0%': { transform: 'translateY(18px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blink: {
          '0%, 45%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 34s linear infinite',
        rise: 'rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        blink: 'blink 1.1s step-end infinite',
      },
    },
  },
  plugins: [],
};
