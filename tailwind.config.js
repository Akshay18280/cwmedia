/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.tsx'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'high-contrast': 'rgb(var(--semantic-bg-high) / <alpha-value>)',
        'medium-contrast': 'rgb(var(--semantic-bg-medium) / <alpha-value>)',
        'low-contrast': 'rgb(var(--semantic-bg-low) / <alpha-value>)',
        'accent-primary': 'rgb(var(--semantic-accent-primary) / <alpha-value>)',
      },
      textColor: {
        'high-contrast': 'rgb(var(--semantic-text-high) / <alpha-value>)',
        'medium-contrast': 'rgb(var(--semantic-text-medium) / <alpha-value>)',
        'low-contrast': 'rgb(var(--semantic-text-low) / <alpha-value>)',
        'accent-primary': 'rgb(var(--semantic-accent-primary) / <alpha-value>)',
      },
      borderColor: {
        'high-contrast': 'rgb(var(--semantic-border-high) / <alpha-value>)',
        'medium-contrast': 'rgb(var(--semantic-border-medium) / <alpha-value>)',
        'low-contrast': 'rgb(var(--semantic-border-low) / <alpha-value>)',
      },
      animation: {
        'count-up': 'count-up 0.5s ease-out forwards',
        'skeleton-shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
        'message-enter': 'message-enter 0.3s cubic-bezier(0.25, 0.4, 0.25, 1) forwards',
      },
      keyframes: {
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'message-enter': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'inherit',
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};