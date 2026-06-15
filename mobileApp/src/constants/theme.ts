import '@/global.css';

import { Platform } from 'react-native';

/**
 * Neo-brutalist "Sunset on Charcoal" palette — single source of truth.
 * Dark-only by design; light scheme mirrors dark so the aesthetic is consistent.
 */
export const Palette = {
  ink: '#0A0A0A',
  charcoal: '#1A1A1A',
  surface: '#242424',
  surfaceRaised: '#2E2E2E',
  bone: '#F5F1E8',
  boneMuted: '#A8A29A',
  boneFaint: '#6B6760',
  tangerine: '#FF6B35',
  tangerineDeep: '#E5552A',
  butter: '#FBBF24',
  cherry: '#EF4444',
  mint: '#34D399',
} as const;

export const Colors = {
  light: {
    text: Palette.bone,
    background: Palette.charcoal,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.surfaceRaised,
    textSecondary: Palette.boneMuted,
  },
  dark: {
    text: Palette.bone,
    background: Palette.charcoal,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.surfaceRaised,
    textSecondary: Palette.boneMuted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 22,
  pill: 999,
} as const;

export const BorderWidths = {
  hair: 1,
  thick: 2.5,
  heavy: 3,
} as const;

/**
 * Hard offset shadows — the signature of neo-brutalism.
 * No blur. Solid color, displaced by a fixed amount.
 */
export const BrutalShadow = {
  sm: Platform.select({
    ios: { shadowColor: Palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
    android: { elevation: 0 },
    web: { boxShadow: `3px 3px 0 ${Palette.ink}` },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: Palette.ink, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 },
    android: { elevation: 0 },
    web: { boxShadow: `5px 5px 0 ${Palette.ink}` },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: Palette.ink, shadowOffset: { width: 7, height: 7 }, shadowOpacity: 1, shadowRadius: 0 },
    android: { elevation: 0 },
    web: { boxShadow: `7px 7px 0 ${Palette.ink}` },
    default: {},
  }),
  accent: Platform.select({
    ios: { shadowColor: Palette.tangerine, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 },
    android: { elevation: 0 },
    web: { boxShadow: `5px 5px 0 ${Palette.tangerine}` },
    default: {},
  }),
} as const;

export const Typography = {
  display: { fontSize: 44, lineHeight: 46, fontWeight: '900' as const, letterSpacing: -1.5 },
  title: { fontSize: 28, lineHeight: 32, fontWeight: '900' as const, letterSpacing: -0.8 },
  heading: { fontSize: 20, lineHeight: 24, fontWeight: '800' as const, letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500' as const },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;

/**
 * Refined dark elevation — soft, blurred shadows for the chat surface.
 * Used by the "WhatsApp-hybrid" surfaces (chat list, settings, conversation).
 * Brutal screens (auth, welcome) keep using BrutalShadow.
 */
export const Elevation = {
  hair: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 2 },
    android: { elevation: 1 },
    web: { boxShadow: '0 1px 2px rgba(0,0,0,0.18)' },
    default: {},
  }),
  low: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 6 },
    android: { elevation: 3 },
    web: { boxShadow: '0 2px 6px rgba(0,0,0,0.22)' },
    default: {},
  }),
  high: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 16 },
    android: { elevation: 8 },
    web: { boxShadow: '0 8px 16px rgba(0,0,0,0.32)' },
    default: {},
  }),
} as const;

/**
 * Refined surface palette — used by the WhatsApp-hybrid screens.
 * Tangerine is kept as the brand accent; greys are slightly cooler/softer
 * than the brutal `surface` tones so the chat UI reads as calm.
 */
export const ChatSurface = {
  background: '#0F1419',
  surface: '#1E242B',
  surfaceRaised: '#2A313A',
  divider: '#262C35',
  inputBg: '#1A1F25',
  bubbleOwn: Palette.tangerine,
  bubbleOther: '#2A313A',
  textPrimary: Palette.bone,
  textSecondary: '#8B95A1',
  textFaint: '#5D6770',
  accent: Palette.tangerine,
  accentDeep: Palette.tangerineDeep,
  danger: Palette.cherry,
  success: Palette.mint,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
