// Design spec: headings/cards use "Circular Std" (commercial, no licence file in repo).
// DM Sans is the substitute until the licensed OTFs are supplied in assets/fonts/.
export const Fonts = {
  /** Circular Std Medium substitute */
  heading: 'DMSans_500Medium',
  /** Circular Std Bold substitute */
  headingBold: 'DMSans_700Bold',
  /** Circular Std Book substitute */
  headingBook: 'DMSans_400Regular',
  body: 'Montserrat_400Regular',
  bodyMedium: 'Montserrat_500Medium',
  bodySemiBold: 'Montserrat_600SemiBold',
  bodyBold: 'Montserrat_700Bold',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Minimum font sizes per role — enforced at component level
export const MinFontSize = {
  neoSenior: 18,
  neoCare: 16,
} as const;
