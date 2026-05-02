import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'page-glow':
          'linear-gradient(135deg, hsl(var(--app-canvas)), hsl(var(--app-canvas-strong)))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 14px 30px -24px rgba(15, 23, 42, 0.55)',
        shell: '0 22px 56px -34px rgba(15, 23, 42, 0.72)',
      },
      colors: {
        canvas: {
          DEFAULT: 'hsl(var(--app-canvas))',
          strong: 'hsl(var(--app-canvas-strong))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          raised: 'hsl(var(--surface-raised))',
          muted: 'hsl(var(--surface-muted))',
          sidebar: 'hsl(var(--surface-sidebar))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        status: {
          success: 'hsl(var(--status-success))',
          successSoft: 'hsl(var(--status-success-soft))',
          warning: 'hsl(var(--status-warning))',
          warningSoft: 'hsl(var(--status-warning-soft))',
          danger: 'hsl(var(--status-danger))',
          dangerSoft: 'hsl(var(--status-danger-soft))',
          info: 'hsl(var(--status-info))',
          infoSoft: 'hsl(var(--status-info-soft))',
        },
        chart: {
          blue: 'hsl(var(--chart-blue))',
          teal: 'hsl(var(--chart-teal))',
          amber: 'hsl(var(--chart-amber))',
          rose: 'hsl(var(--chart-rose))',
          indigo: 'hsl(var(--chart-indigo))',
          slate: 'hsl(var(--chart-slate))',
          revenue: 'hsl(var(--chart-revenue))',
          expense: 'hsl(var(--chart-expense))',
          balance: 'hsl(var(--chart-balance))',
          warning: 'hsl(var(--chart-warning))',
          sales: 'hsl(var(--chart-sales))',
          property: 'hsl(var(--chart-property))',
          hr: 'hsl(var(--chart-hr))',
          payroll: 'hsl(var(--chart-payroll))',
          audit: 'hsl(var(--chart-audit))',
          documents: 'hsl(var(--chart-documents))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [animate],
};

export default config;
