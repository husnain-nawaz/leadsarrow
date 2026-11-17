export const COLORS = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  primaryLight: '#fdba74',
  primaryGlow: 'rgba(249, 115, 22, 0.25)',
  
  bgDark: '#0b0f19',
  cardDark: '#131b2e',
  cardBorderDark: '#1f293d',
  surfaceDark: '#1a233a',
  
  bgLight: '#f8fafc',
  cardLight: '#ffffff',
  cardBorderLight: '#e2e8f0',
  surfaceLight: '#f1f5f9',

  textDark: '#f8fafc',
  textSecondaryDark: '#cbd5e1',
  textMutedDark: '#94a3b8',
  
  textLight: '#0f172a',
  textSecondaryLight: '#475569',
  textMutedLight: '#64748b',

  verified: '#10b981',
  verifiedBg: 'rgba(16, 185, 129, 0.15)',
  
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',

  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.15)',

  accent: '#a855f7',
  accentBg: 'rgba(168, 85, 247, 0.15)'
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  heavy: 'System'
};

export const theme = {
  colors: {
    primary: COLORS.primary,
    primaryDark: COLORS.primaryDark,
    background: COLORS.bgDark,
    surface: COLORS.cardDark,
    surfaceHover: COLORS.surfaceDark,
    border: COLORS.cardBorderDark,
    borderLight: '#334155',
    textPrimary: COLORS.textDark,
    textSecondary: COLORS.textSecondaryDark,
    textMuted: COLORS.textMutedDark,
    success: COLORS.verified,
    danger: COLORS.danger,
    warning: COLORS.warning,
    accent: COLORS.accent,
  },
  fonts: FONTS
};

export default theme;
