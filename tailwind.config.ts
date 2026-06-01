import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* shadcn/ui semantic tokens */
        border:      "hsl(var(--tw-border))",
        input:       "hsl(var(--tw-input))",
        ring:        "hsl(var(--tw-ring))",
        background:  "hsl(var(--tw-background))",
        foreground:  "hsl(var(--tw-foreground))",
        primary: {
          DEFAULT:    "hsl(var(--tw-primary))",
          foreground: "hsl(var(--tw-primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--tw-secondary))",
          foreground: "hsl(var(--tw-secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--tw-destructive))",
          foreground: "hsl(var(--tw-destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--tw-muted))",
          foreground: "hsl(var(--tw-muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--tw-accent))",
          foreground: "hsl(var(--tw-accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--tw-card))",
          foreground: "hsl(var(--tw-card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--tw-popover))",
          foreground: "hsl(var(--tw-popover-foreground))",
        },
        /* Arsenal brand */
        arsenal: {
          red:          "#EF0107",
          "red-dark":   "#C8001A",
          "red-deep":   "#9B0000",
          gold:         "#C6A84B",
          "gold-light": "#E8C97A",
          "gold-dark":  "#9B7E2A",
          navy:         "#063672",
        },
        membership: {
          platinum: "#E8E8E8",
          gold:     "#C6A84B",
          silver:   "#A8A9AD",
          bronze:   "#CD7F32",
          abusua:   "#2ECC71",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body:    ["var(--font-body)",    "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)",    "monospace"],
      },
      animation: {
        "fade-in":      "fadeIn 0.5s ease forwards",
        "slide-up":     "slideUp 0.5s ease forwards",
        "pulse-red":    "pulseRed 2s infinite",
        "shimmer":      "shimmer 1.5s linear infinite",
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-in",
      },
      keyframes: {
        fadeIn:  { from:{ opacity:"0" },              to:{ opacity:"1" } },
        slideUp: { from:{ opacity:"0", transform:"translateY(16px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        pulseRed: {
          "0%, 100%": { boxShadow:"0 0 0 0 rgba(239,1,7,0.35)" },
          "70%":      { boxShadow:"0 0 0 12px rgba(239,1,7,0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition:"-200% 0" },
          "100%": { backgroundPosition:"200% 0" },
        },
        "accordion-down": { from:{ height:"0" }, to:{ height:"var(--radix-accordion-content-height)" } },
        "accordion-up":   { from:{ height:"var(--radix-accordion-content-height)" }, to:{ height:"0" } },
      },
    },
  },
  plugins: [],
};
export default config;
