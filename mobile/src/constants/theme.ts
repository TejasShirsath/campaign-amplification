import { Platform } from 'react-native';

/**
 * RippleUp Light Theme Design Tokens
 * Strictly enforces Light Mode across the entire application matching the design reference.
 */
export const Colors = {
  // Brand Emerald Accents
  primary: '#059669',        // Primary emerald
  primaryLight: '#10B981',   // Bright emerald accent
  primaryDark: '#047857',    // Deep emerald hover/pressed
  primaryBg: '#ECFDF5',      // Soft mint background for badges & tips
  primaryBorder: '#A7F3D0',  // Subtle emerald border

  // Dark Actions & Headings (Design Reference primary button)
  darkPrimary: '#111827',     // Dark near-black for primary buttons and main headings
  darkPrimaryPressed: '#1F2937',

  // Surfaces & Backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F9FAFB',
  surfaceAlt: '#F3F4F6',
  
  // Text Colors
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',
  textEmerald: '#059669',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#10B981',

  // Status & Feedback
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  // Compatibility for older components (strictly light values)
  light: {
    text: '#111827',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6B7280',
  },
  dark: {
    text: '#111827', // force light mode
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6B7280',
  },

  // Category Color Mappings
  categories: {
    ENVIRONMENT: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', label: 'Environment' },
    EDUCATION: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA', label: 'Education' },
    HEALTH: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', label: 'Healthcare' },
    SCIENCE: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', label: 'Science' },
    PUBLIC_POLICY: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', label: 'Public Policy' },
    COMMUNITY: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', label: 'Community' },
    BUSINESS: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', label: 'Business' },
    ARTS_CULTURE: { bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8', label: 'Arts & Culture' },
    ECONOMIC_POLICY: { bg: '#ECFEFF', text: '#155E75', border: '#A5F3FC', label: 'Economic' },
    OTHER: { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB', label: 'Other' },
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

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

export const Typography = {
  sizes: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    hero: 32,
    heroLg: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
