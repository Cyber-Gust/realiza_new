/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  extend: {
   colors: {
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: {
     DEFAULT: "hsl(var(--primary))",
     foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
     DEFAULT: "hsl(var(--secondary))",
     foreground: "hsl(var(--secondary-foreground))",
    },
    destructive: { // <-- ADICIONADO: Estava faltando
     DEFAULT: "hsl(var(--destructive))",
     foreground: "hsl(var(--destructive-foreground))",
    },
    muted: {
     DEFAULT: "hsl(var(--muted))",
     foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
     DEFAULT: "hsl(var(--accent))",
     foreground: "hsl(var(--accent-foreground))",
    },
    card: {
     DEFAULT: "hsl(var(--card))",
     foreground: "hsl(var(--card-foreground))",
    },
    popover: { // <-- ADICIONADO: Este é o que resolve o erro `bg-popover`
     DEFAULT: "hsl(var(--popover))",
     foreground: "hsl(var(--popover-foreground))",
    },
    // === ADICIONADO PARA O PAINEL ADMIN ===
    panel: {
     bg: "hsl(var(--panel-bg))",
     card: "hsl(var(--panel-card))",
     foreground: "hsl(var(--panel-card-foreground))",
     active: "hsl(var(--panel-active))",
     "active-foreground": "hsl(var(--panel-active-foreground))",
    },
    // ======================================
   },
   borderRadius: {
    lg: "**var(--radius)**", // <-- (OPCIONAL) Ajuste para usar a variável do globals.css
    md: "calc(var(--radius) - 2px)",
    sm: "calc(var(--radius) - 4px)",
   },
  },
 },
 plugins: [],
};