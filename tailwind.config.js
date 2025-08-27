// tailwind.config.js (edit: extend colors as object for utilities like bg-muted/50)
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'var(--border)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      animation: {
        wiggle: 'var(--animate-wiggle)',
        'fade-in-down': 'var(--animate-fade-in-down)',
        'fade-out-down': 'var(--animate-fade-out-down)',
        'fade-in-up': 'var(--animate-fade-in-up)',
        'fade-out-up': 'var(--animate-fade-out-up)',
      },
      boxShadow: {
        custom: 'var(--shadow-custom)',
      },
    },
  },
  plugins: [],
};