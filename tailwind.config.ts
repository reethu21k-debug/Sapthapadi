import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Saptapadi Luxury Palette — Royal Maroon & Gold (Indian Wedding Inspired)
        gold: {
          50: "#FFFDF5",
          100: "#FFF8E1",
          200: "#F4D78C", // Light Gold (secondary gold)
          300: "#EAC766",
          400: "#DFBB4E",
          500: "#D4AF37", // Royal Gold
          600: "#B8860B", // hover / dark gold
          700: "#96690A",
          800: "#745108",
          900: "#523A06",
          DEFAULT: "#D4AF37",
          light: "#F4D78C",
          dark: "#B8860B",
        },
        // "navy" token retained for backwards compatibility with existing
        // classNames (bg-navy-dark, text-navy, etc.) but repurposed to hold
        // the Royal Maroon brand palette. Use "maroon" for new code.
        navy: {
          50: "#FDF2F4",
          100: "#FBE4E8",
          200: "#F5C6CE",
          300: "#E89AA8",
          400: "#D66478",
          500: "#B8384F",
          600: "#96233A",
          700: "#7A1E2C", // Deep Burgundy
          800: "#5A0F1D", // Royal Maroon
          900: "#2A0A0F", // Dark Maroon
          DEFAULT: "#5A0F1D",
          light: "#7A1E2C",
          dark: "#2A0A0F",
        },
        maroon: {
          50: "#FDF2F4",
          100: "#FBE4E8",
          200: "#F5C6CE",
          300: "#E89AA8",
          400: "#D66478",
          500: "#B8384F",
          600: "#96233A",
          700: "#7A1E2C",
          800: "#5A0F1D",
          900: "#2A0A0F",
          DEFAULT: "#5A0F1D",
          light: "#7A1E2C",
          dark: "#2A0A0F",
        },
        cream: {
          50: "#FFFFFF",
          100: "#FAF6EF", // Warm Ivory (main background)
          200: "#F8EBD5",
          300: "#F4E4C4",
          400: "#E9DAC6", // Soft Beige (borders)
          500: "#DFCBA8",
          DEFAULT: "#FAF6EF",
          warm: "#F8EBD5",
        },
        ivory: "#FAF6EF",
        charcoal: "#5F5F5F",
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
        destructive: {
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F7E39C 0%, #D4AF37 50%, #B8860B 100%)",
        "navy-gradient": "linear-gradient(135deg, #2A0A0F 0%, #5A0F1D 50%, #7A1E2C 100%)",
        "maroon-gradient": "linear-gradient(135deg, #2A0A0F 0%, #5A0F1D 50%, #7A1E2C 100%)",
        "luxury-gradient": "linear-gradient(135deg, #2A0A0F 0%, #5A0F1D 40%, #D4AF37 100%)",
        "hero-gradient": "linear-gradient(135deg, #FAF6EF 0%, #F8EBD5 50%, #FFFFFF 100%)",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        "gold": "0 4px 20px rgba(212, 175, 55, 0.3)",
        "gold-lg": "0 8px 40px rgba(212, 175, 55, 0.4)",
        "navy": "0 4px 20px rgba(90, 15, 29, 0.3)",
        "maroon": "0 4px 20px rgba(90, 15, 29, 0.3)",
        "luxury": "0 20px 60px rgba(42, 10, 15, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.15)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
        "card": "0 2px 20px rgba(90, 15, 29, 0.08)",
        "card-hover": "0 8px 40px rgba(90, 15, 29, 0.15)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.4)" },
          "70%": { boxShadow: "0 0 0 10px rgba(212, 175, 55, 0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s infinite linear",
        "float": "float 6s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [animate],
};

export default config;
