/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron','ui-sans-serif','system-ui'],
        body: ['Inter','ui-sans-serif','system-ui']
      },
      colors: {
        forum: { bg:'#0b1420', bg2:'#132133', neon:'#00d4ff', pink:'#ff4fa3', gold:'#ffd36e' }
      },
      boxShadow: {
        glow: '0 0 30px rgba(0,212,255,.45)',
        innerGlow: 'inset 0 0 24px rgba(0,212,255,.15)',
      },
      borderRadius: { '2xl':'1rem', '3xl':'1.25rem' },
      backgroundImage: {
        starfield: 'radial-gradient(1200px 600px at 80% 10%, rgba(0,212,255,.15), transparent), radial-gradient(1000px 500px at 20% 90%, rgba(255,79,163,.12), transparent)'
      }
    },
  },
  plugins: [],
}
