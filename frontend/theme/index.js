// PingMe — Midnight Dark Theme with Warm Brown Gradient Accents
import { Platform } from 'react-native';

export const Colors = {
  // Deep Midnight Dark Backgrounds (neutral obsidian/slate)
  bg: '#090A0F',
  bgDark: '#050609',
  surface: '#11141E',
  surfaceHover: '#181C2B',
  surfaceElevated: '#1D2235',

  // Subtle Dark Borders
  border: '#1F2538',
  borderLight: '#2C344E',

  // Touch of Warm Brown / Bronze Gradient Accents
  accent: '#9C6644',           // Warm Chestnut Brown
  accentEnd: '#C68B59',        // Caramel Bronze
  accentLight: '#DDB892',      // Soft Sand highlight
  accentDim: 'rgba(156, 102, 68, 0.16)',
  accentGlow: 'rgba(198, 139, 89, 0.25)',

  // Status Colors
  success: '#D4A373',
  coral: '#FF4D6D',
  coralDim: 'rgba(255, 77, 109, 0.15)',
  amber: '#D99B4E',

  // Crisp Neutral Typography
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  white: '#FFFFFF',
};

export const Typography = {
  sans: Platform.select({ web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', default: 'System' }),
  sansMedium: Platform.select({ web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', default: 'System' }),
  sansSemiBold: Platform.select({ web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', default: 'System' }),
  sansBold: Platform.select({ web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', default: 'System' }),

  xs: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  hero: 34,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
};
