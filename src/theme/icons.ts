import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * design.md specifies Phosphor Icons (web CDN). On native we render the same
 * concepts via @expo/vector-icons (Ionicons). This maps the Phosphor names used
 * in the design system to their Ionicons equivalents so feature screens stay
 * visually consistent. Extend as new icons are needed in Phase 4+.
 */
export const PhosphorToIonicons: Record<string, IoniconName> = {
  'ph-users': 'people',
  'ph-user': 'person',
  'ph-arrow-right': 'arrow-forward',
  'ph-envelope': 'mail-outline',
  'ph-caret-down': 'chevron-down',
};
