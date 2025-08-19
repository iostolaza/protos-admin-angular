/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: '#E2E8F0',  // --border
        background: '#FFFFFF',  // --background
        foreground: '#0C1420',  // --foreground
        primary: '#E11D48',  // --primary
        'primary-foreground': '#FFFFFF',
        destructive: '#CC0033',
        'destructive-foreground': '#FAFAFA',
        muted: '#CFD9E5',
        'muted-foreground': '#64748B',
        card: '#F1F5F9',
        'card-foreground': '#000000',
        // Dark mode extends
        'dark-border': '#262626',
        'dark-background': '#1E293B',
        // Add more as needed (e.g., themes like violet)
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
        'fade-in-down': 'fade-in-down 0.3s ease-out',
        'fade-out-down': 'fade-out-down 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'fade-out-up': 'fade-out-up 0.3s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Add others similarly
      },
      boxShadow: {
        custom: '0px 0px 50px 0px rgb(82 63 105 / 15%)',
      },
    },
  },
  plugins: [],
};