/**
 * Chatify — Design Tokens (single source of truth)
 *
 * Aesthetic: "Emerald minimal" (Notion / Stripe inspired)
 *   - Warm off-white light surfaces, soft charcoal dark surfaces
 *   - Emerald primary accent (#10B981 family)
 *   - Generous spacing, editorial typography, restrained shadows
 *
 * RULES (enforced — see src/styles/AGENTS.md):
 *   1. UI may only consume tokens via Tailwind classes (bg-primary, text-foreground,
 *      border-border, etc.) or `var(--token-name)`. Never hex/rgb/hsl/oklch in JSX/CSS.
 *   2. To add a new color, add it here AND to globals.css CSS variables for both
 *      light (:root) and dark (.dark) modes. Tailwind will pick it up via @theme.
 *   3. Light and dark are two views of the SAME token set — never duplicate values.
 *   4. HSL channel strings ("142 71% 45%") are stored so they can be composed with
 *      hsl() and alpha in CSS (e.g. `hsl(var(--primary) / 0.1)`).
 */

export const tokens = {
  // ---- COLOR (HSL channels — feed into CSS vars in globals.css) ---------------
  color: {
    light: {
      background: '60 9% 98%',          // #FAFAF7 warm off-white canvas
      foreground: '160 14% 10%',        // #161E1B near-black with green tint
      card: '0 0% 100%',                // #FFFFFF
      cardForeground: '160 14% 10%',
      popover: '0 0% 100%',
      popoverForeground: '160 14% 10%',
      primary: '160 84% 39%',           // #10B981 emerald
      primaryForeground: '0 0% 100%',
      primaryHover: '160 84% 34%',
      secondary: '150 10% 96%',         // subtle green-tinted grey
      secondaryForeground: '160 14% 10%',
      muted: '150 10% 96%',
      mutedForeground: '160 6% 42%',
      accent: '150 50% 94%',            // pale emerald wash
      accentForeground: '160 70% 22%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 100%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      border: '150 8% 90%',             // #E5E5E0
      input: '150 8% 90%',
      ring: '160 84% 39%',
    },
    dark: {
      background: '156 18% 6%',         // #0E1410 soft charcoal w/ green tint
      foreground: '60 9% 96%',          // warm off-white text
      card: '156 16% 9%',                // #1A201D
      cardForeground: '60 9% 96%',
      popover: '156 16% 9%',
      popoverForeground: '60 9% 96%',
      primary: '160 84% 45%',           // brighter emerald for dark contrast
      primaryForeground: '156 18% 6%',
      primaryHover: '160 84% 52%',
      secondary: '156 12% 14%',
      secondaryForeground: '60 9% 96%',
      muted: '156 12% 14%',
      mutedForeground: '155 6% 62%',
      accent: '160 40% 16%',            // deep emerald wash
      accentForeground: '160 84% 70%',
      destructive: '0 65% 55%',
      destructiveForeground: '0 0% 100%',
      success: '160 84% 45%',
      warning: '38 92% 55%',
      border: '156 14% 16%',             // #1F2A24
      input: '156 14% 18%',
      ring: '160 84% 45%',
    },
  },

  // ---- SPACING (4px base) -----------------------------------------------------
  spacing: {
    '3xs': '0.125rem', // 2px
    xxs:  '0.25rem',   // 4px
    xs:   '0.375rem',  // 6px
    sm:   '0.5rem',    // 8px
    md:   '0.75rem',   // 12px
    lg:   '1rem',      // 16px
    xl:   '1.5rem',    // 24px
    '2xl':'2rem',      // 32px
    '3xl':'3rem',      // 48px
    '4xl':'4.5rem',    // 72px
  },

  // ---- RADII ------------------------------------------------------------------
  radius: {
    none: '0',
    sm:   '0.375rem',  // 6px — chips, tags
    md:   '0.5rem',    // 8px — inputs, small buttons
    lg:   '0.75rem',   // 12px — cards, primary buttons
    xl:   '1rem',      // 16px — modals, large surfaces
    '2xl':'1.5rem',    // 24px — feature cards
    full: '9999px',
  },

  // ---- TYPOGRAPHY -------------------------------------------------------------
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
      mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
    },
    fontSize: {
      xs:    '0.75rem',   // 12 / 16
      sm:    '0.8125rem', // 13 / 18 — editorial body small
      base:  '0.9375rem', // 15 / 22 — editorial body
      md:    '1rem',      // 16 / 24
      lg:    '1.125rem',  // 18 / 26
      xl:    '1.375rem',  // 22 / 30
      '2xl': '1.75rem',   // 28 / 36
      '3xl': '2.25rem',   // 36 / 42 — display
      '4xl': '3rem',      // 48 / 52 — hero
    },
    fontWeight: {
      regular: '400',
      medium:  '500',
      semibold:'600',
      bold:    '700',
    },
    letterSpacing: {
      tight:  '-0.02em',  // headings
      normal: '0',
      relaxed:'0.01em',   // body
      wide:   '0.08em',   // small caps / eyebrows
    },
    lineHeight: {
      tight:   '1.15',
      snug:    '1.35',
      normal:  '1.55',  // editorial body
      relaxed: '1.7',
    },
  },

  // ---- ELEVATION / SHADOWS ----------------------------------------------------
  // Restrained, layered. Light mode uses soft greys; dark mode uses pure black at low alpha.
  shadow: {
    none: 'none',
    xs:   '0 1px 2px 0 hsl(160 14% 10% / 0.04)',
    sm:   '0 1px 3px 0 hsl(160 14% 10% / 0.06), 0 1px 2px -1px hsl(160 14% 10% / 0.06)',
    md:   '0 4px 12px -2px hsl(160 14% 10% / 0.08), 0 2px 4px -2px hsl(160 14% 10% / 0.06)',
    lg:   '0 12px 28px -6px hsl(160 14% 10% / 0.12), 0 4px 8px -4px hsl(160 14% 10% / 0.08)',
    xl:   '0 24px 48px -12px hsl(160 14% 10% / 0.18)',
    glow: '0 0 0 1px hsl(var(--primary) / 0.15), 0 8px 32px -8px hsl(var(--primary) / 0.28)',
  },

  // ---- MOTION -----------------------------------------------------------------
  motion: {
    duration: {
      instant: '80ms',
      fast:    '160ms',
      normal:  '240ms',
      slow:    '380ms',
      slower:  '600ms',
    },
    easing: {
      standard: 'cubic-bezier(0.2, 0, 0, 1)',     // material standard
      decel:    'cubic-bezier(0, 0, 0.2, 1)',
      accel:    'cubic-bezier(0.4, 0, 1, 1)',
      spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // ---- LAYOUT -----------------------------------------------------------------
  zIndex: {
    base:    0,
    raised:  10,
    sticky:  20,
    overlay: 40,
    modal:   50,
    popover: 60,
    toast:   70,
    tooltip: 80,
  },
  breakpoint: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl':'1536px',
  },
} as const;

export type DesignTokens = typeof tokens;
export type ThemeMode = 'light' | 'dark';
