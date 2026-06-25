import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import NeoCareShell from '../../components/NeoCareShell';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { createLink } from '../../services/onboarding.service';
import { getApiErrorMessage } from '../../services/http';
import { useCreatedSeniors } from '../../store/createdSeniors.store';
import { NsrCode } from '../../services/types';
import { Brand, Fonts, FontSize, Spacing } from '../../theme';

const BOX_SIZE = 62;

export default function AddSeniorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();
  const qc = useQueryClient();
  const addLinkRequest = useCreatedSeniors((s) => s.addLinkRequest);

  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  const nsr = `NSR-${code}` as NsrCode;

  const { mutate: pair, isPending, isError, error, reset } = useMutation({
    mutationFn: () => createLink(nsr),
    onSuccess: () => {
      addLinkRequest(nsr);
      qc.invalidateQueries({ queryKey: ['linkedProfiles'] });
      navigation.navigate('AwaitingConfirmation', { pendingUserName: code });
    },
  });

  function handleChange(text: string) {
    const sanitized = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setCode(sanitized);
    // Clear previous mutation error when user edits the code
    if (isError) reset();
  }

  const canPair = code.length === 5 && !isPending;

  return (
    <NeoCareShell activeTab="Dashboard">
      <View style={styles.body}>
        <View style={styles.card}>
          {/* ── Title divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.rule} />
            <Text style={styles.cardTitle}>Enter the Neosenior ID to Pair</Text>
            <View style={styles.rule} />
          </View>

          {/* ── 5-box code input ── */}
          <View style={styles.boxesWrapper}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleChange}
              maxLength={5}
              autoCapitalize="characters"
              keyboardType="default"
              autoCorrect={false}
              style={styles.hiddenInput}
              accessibilityLabel="Enter 5-character pairing code"
            />
            <Pressable
              style={styles.boxRow}
              onPress={() => inputRef.current?.focus()}
              accessibilityRole="none"
            >
              {[0, 1, 2, 3, 4].map((i) => {
                const char = code[i] ?? '';
                const isActive = i === code.length && code.length < 5;
                return (
                  <View
                    key={i}
                    style={[
                      styles.box,
                      isActive && styles.boxActive,
                      code.length === 5 && styles.boxFilled,
                      isError && styles.boxError,
                    ]}
                  >
                    <Text style={styles.boxChar}>{char}</Text>
                  </View>
                );
              })}
            </Pressable>
          </View>

          {/* ── Validation row ── */}
          <View style={styles.validationRow}>
            {code.length < 5 ? (
              <Text style={styles.validationPlaceholder}>— — —</Text>
            ) : isError ? (
              <View style={styles.validationError}>
                <Ionicons name="alert-circle-outline" size={16} color="#D64545" />
                <Text style={styles.errorText}>
                  {getApiErrorMessage(error, 'No account found for this code')}
                </Text>
              </View>
            ) : (
              <View style={styles.validationReady}>
                <Ionicons name="arrow-down-circle-outline" size={16} color={Brand.mutedTeal} />
                <Text style={styles.readyText}>Tap below to send a pairing request</Text>
              </View>
            )}
          </View>

          {/* ── Pair button ── */}
          <Pressable
            onPress={() => pair()}
            disabled={!canPair}
            style={({ pressed }) => [
              styles.pairButton,
              !canPair && styles.pairButtonDisabled,
              pressed && canPair && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Pair Account"
            accessibilityState={{ disabled: !canPair }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.pairButtonText}>Pair Account</Text>
            )}
          </Pressable>
        </View>
      </View>
    </NeoCareShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#FFE6D5',
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    gap: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D5',
  },
  cardTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.xs,
    color: Brand.mutedTeal,
    textAlign: 'center',
    flexShrink: 1,
  },

  boxesWrapper: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 1.5,
    borderColor: '#DCE4E6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFCFC',
  },
  boxActive: {
    borderColor: Brand.primary,
    backgroundColor: '#FFFFFF',
  },
  boxFilled: {
    borderColor: '#A8C4C8',
  },
  boxError: {
    borderColor: '#D64545',
    backgroundColor: '#FFF8F8',
  },
  boxChar: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Brand.primary,
    letterSpacing: 1,
  },

  validationRow: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validationPlaceholder: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: '#B0BEC5',
    letterSpacing: 4,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.xs,
    color: '#D64545',
    flexShrink: 1,
  },
  validationReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readyText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.xs,
    color: Brand.mutedTeal,
  },

  pairButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#00333A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairButtonDisabled: {
    opacity: 0.45,
  },
  pairButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
