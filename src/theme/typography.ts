// Design spec: headings/cards use "Circular Std".
// Circular Std Medium (500) is now licensed in assets/Circular-Std-Font/ and used
// for the primary heading weight. Bold/Book weights aren't supplied yet, so they
// still fall back to DM Sans until those files land.
export const Fonts = {
  /** Circular Std Medium (brand heading font) */
  heading: 'CircularStd-Medium',
  /** Circular Std Bold substitute (DM Sans until the bold weight is licensed) */
  headingBold: 'DMSans_700Bold',
  /** Circular Std Book substitute (DM Sans until the book weight is licensed) */
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
