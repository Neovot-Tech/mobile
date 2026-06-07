import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import ScreenShell from './ScreenShell';
import StepDots from './StepDots';
import FormCard from './FormCard';
import LabeledInput from './LabeledInput';
import PhoneInput from './PhoneInput';
import Select from './Select';
import PrimaryButton from './PrimaryButton';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';
import { NeoSeniorProfilePayload } from '../services/onboarding.service';
import { MOCK_FLOW, MockValues } from '../config/mockFlow';

// TODO: Twi — condition list copy needs locale entries when finalised
const CONDITION_OPTIONS = [
  'Hypertention',
  'Diabetes',
  'Arthritis',
  'Heart condition',
  'Other',
];

type Phase = 'form' | 'comments' | 'review';

interface ElderlyProfileFlowProps {
  /** Headers shown on the form/comments phases */
  title: string;
  greeting?: React.ReactNode;
  subtitle: string;
  onSubmit: (data: NeoSeniorProfilePayload) => Promise<void>;
  submitting: boolean;
}

export default function ElderlyProfileFlow({
  title,
  greeting,
  subtitle,
  onSubmit,
  submitting,
}: ElderlyProfileFlowProps) {
  const { t } = useTranslation();

  const [phase, setPhase] = useState<Phase>('form');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0]);
  const [comments, setComments] = useState('');

  const formValid = fullName.trim() && phone.trim() && address.trim();

  // MOCK_FLOW: fill empty fields before advancing so review + pairing card render real copy
  const handleNext = () => {
    if (MOCK_FLOW) {
      if (!fullName.trim()) setFullName(MockValues.seniorName);
      if (!phone.trim()) setPhone(MockValues.phone);
      if (!address.trim()) setAddress(MockValues.address);
    }
    setPhase('comments');
  };

  const handleSubmit = () =>
    onSubmit({
      fullName,
      phone,
      residentialAddress: address,
      primaryCondition: condition,
      otherComments: comments,
    });

  if (phase === 'review') {
    return (
      <ScreenShell headerRight={<StepDots current={2} total={3} />}>
        <Pressable
          style={styles.editRow}
          onPress={() => setPhase('form')}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}
          hitSlop={8}
        >
          <Text style={styles.editLabel}>{t('common.edit')}</Text>
          <Ionicons name="pencil-outline" size={14} color={Colors.textPrimary} />
        </Pressable>
        <FormCard>
          <LabeledInput
            label={t('neoCareOnboarding.elderlyFullName')}
            value={fullName}
            readOnly
          />
          <PhoneInput
            label={t('neoCareOnboarding.phoneNumber')}
            value={phone}
            onChangeText={setPhone}
            readOnly
          />
          <LabeledInput
            label={t('neoCareOnboarding.residentialAddress')}
            value={address}
            readOnly
          />
          <Select
            label={t('neoCareOnboarding.primaryMedicalCondition')}
            value={condition}
            options={CONDITION_OPTIONS}
            onChange={setCondition}
            readOnly
          />
          <Text style={styles.commentsLabel}>{t('neoCareOnboarding.otherComments')}</Text>
          <View style={styles.commentsBox}>
            <Text style={styles.commentsText}>{comments}</Text>
          </View>
          <PrimaryButton
            label={t('common.submit')}
            loading={submitting}
            onPress={handleSubmit}
          />
        </FormCard>
      </ScreenShell>
    );
  }

  if (phase === 'comments') {
    return (
      <ScreenShell
        headerRight={<StepDots current={2} total={3} />}
        title={title}
        greeting={greeting}
        subtitle={subtitle}
      >
        <FormCard>
          <Text style={styles.commentsLabel}>{t('neoCareOnboarding.otherComments')}</Text>
          <TextInput
            value={comments}
            onChangeText={setComments}
            placeholder={t('neoCareOnboarding.commentsPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.commentsInput}
            accessibilityLabel={t('neoCareOnboarding.otherComments')}
          />
          <Pressable
            style={styles.recordButton}
            onPress={() => {
              // TODO Phase 3: wire expo-audio recording + jobs service
            }}
            accessibilityRole="button"
            accessibilityLabel={t('neoCareOnboarding.tapToRecord')}
          >
            <View style={styles.micCircle}>
              <Ionicons name="mic-outline" size={22} color={Colors.neoSeniorMicIcon} />
            </View>
            <Text style={styles.recordLabel}>{t('neoCareOnboarding.tapToRecord')}</Text>
          </Pressable>
          <View style={styles.buttonRow}>
            <PrimaryButton
              label={t('common.previous')}
              variant="secondary"
              onPress={() => setPhase('form')}
              style={styles.rowButton}
            />
            <PrimaryButton
              label={t('common.review')}
              onPress={() => setPhase('review')}
              style={styles.rowButton}
            />
          </View>
        </FormCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      headerRight={<StepDots current={2} total={3} />}
      title={title}
      greeting={greeting}
      subtitle={subtitle}
    >
      <FormCard>
        <LabeledInput
          label={t('neoCareOnboarding.elderlyFullName')}
          placeholder={t('neoCareOnboarding.elderlyNamePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
        />
        <PhoneInput
          label={t('neoCareOnboarding.phoneNumber')}
          value={phone}
          onChangeText={setPhone}
        />
        <LabeledInput
          label={t('neoCareOnboarding.residentialAddress')}
          placeholder={t('neoCareOnboarding.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
        />
        <Select
          label={t('neoCareOnboarding.primaryMedicalCondition')}
          value={condition}
          options={CONDITION_OPTIONS}
          onChange={setCondition}
        />
        <PrimaryButton
          label={t('common.next')}
          disabled={!MOCK_FLOW && !formValid}
          onPress={handleNext}
        />
      </FormCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginBottom: Spacing.md,
  },
  editLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  commentsLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  commentsBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.base,
    minHeight: 120,
    marginBottom: Spacing.lg,
  },
  commentsText: { color: Colors.textPrimary, fontSize: FontSize.base, lineHeight: 24 },
  commentsInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.base,
    minHeight: 140,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: '#FDF6E3',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: MinTapTarget.neoSenior,
  },
  micCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neoSeniorMic,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  buttonRow: { flexDirection: 'row', gap: Spacing.base },
  rowButton: { flex: 1 },
});
