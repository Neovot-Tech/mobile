export const Colors = {
  background: '#FAF8F1',
  surface: '#FFFFFF',
  // Figma token "Custom Style/Color 4"
  primary: '#003B46',
  primaryDark: '#002A32',
  accent: '#E8442E',
  textPrimary: '#003B46',
  textSecondary: '#1D4550',
  textMuted: '#8A9AA0',
  border: '#DCE2E0',
  formCardBorder: '#F2DCAE',
  gold: '#EFD9A7',
  goldLight: '#F6E9C9',
  goldDark: '#D9B96A',
  success: '#2E7D52',
  warning: '#F0A500',
  error: '#E8442E',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.4)',

  neoSeniorMic: '#F8C8CB',
  neoSeniorMicIcon: '#E8442E',
} as const;

/**
 * Brand design-system tokens lifted verbatim from designs/design.md (the
 * landing-page system). Use these when building the not-yet-Figma'd feature
 * screens so they stay on-brand. Kept separate from the semantic Colors above
 * so the existing pixel-faithful auth/onboarding screens don't shift.
 */
export const Brand = {
  primary: '#003B46',
  primaryHover: '#022e38',
  primaryForm: '#033f4c',
  primaryText: '#06404b',
  primaryContent: '#0b4149',
  mutedTeal: '#4a6d73',
  bgCream: '#FCFBF5',
  bgWarmCard: '#fdf5e6',
  bodyText: '#4A5568',
  inputText: '#3b5f65',
  accentPeach: '#FFD1BB',
  borderWarm: '#FCDEA7',
  borderCard: '#f8e1bc',
  borderForm: '#bdcdd0',
  gridLine: 'rgba(0, 59, 70, 0.03)',
} as const;
