import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Brand, Fonts, FontSize, Spacing } from '../theme';

export interface BrandAlertButton {
  label: string;
  onPress: () => void;
  /** Renders the button in red. Use for irreversible actions. */
  destructive?: boolean;
  /** 'filled' (default for primary action) or 'ghost' (for cancel/secondary). */
  variant?: 'filled' | 'ghost';
}

interface BrandAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  /**
   * Buttons rendered bottom-to-top, right-to-left (primary action last / rightmost).
   * Omit to get a single "Got it" dismiss button automatically.
   */
  buttons?: BrandAlertButton[];
  onDismiss: () => void;
}

export default function BrandAlert({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}: BrandAlertProps) {
  const resolvedButtons: BrandAlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ label: 'Got it', onPress: onDismiss, variant: 'filled' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Stop touches on the card from closing the modal */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View
            style={[
              styles.buttonRow,
              resolvedButtons.length === 1 && styles.buttonRowSingle,
              resolvedButtons.length >= 3 && styles.buttonRowStacked,
            ]}
          >
            {resolvedButtons.map((btn, i) => {
              const isFilled = btn.variant !== 'ghost';
              const isMultiRow = resolvedButtons.length !== 2;
              return (
                <Pressable
                  key={i}
                  onPress={btn.onPress}
                  style={({ pressed }) => [
                    styles.btn,
                    isMultiRow && styles.btnFull,
                    isFilled
                      ? [styles.btnFilled, btn.destructive && styles.btnDestructive]
                      : styles.btnGhost,
                    pressed && { opacity: 0.75 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isFilled
                        ? styles.btnTextFilled
                        : [styles.btnTextGhost, btn.destructive && styles.btnTextDestructive],
                    ]}
                  >
                    {btn.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 30, 35, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE6D5',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#001A1F',
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
    }),
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    color: Brand.primary,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.bodyText,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    justifyContent: 'flex-end',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  buttonRowStacked: {
    flexDirection: 'column',
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: {
    flex: 1,
  },
  btnFilled: {
    backgroundColor: Brand.primary,
  },
  btnDestructive: {
    backgroundColor: '#C0392B',
  },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: '#DCE4E6',
  },
  btnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  btnTextFilled: {
    color: '#FFFFFF',
  },
  btnTextGhost: {
    color: Brand.mutedTeal,
  },
  btnTextDestructive: {
    color: '#C0392B',
  },
});
