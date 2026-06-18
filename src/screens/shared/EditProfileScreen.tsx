import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import DateInput from '../../components/DateInput';
import ConditionMultiSelect from '../../components/ConditionMultiSelect';
import {
  getNeoSeniorProfile,
  getNeoSeniorOwnProfile,
  updateNeoSeniorProfile,
  updateNeoSeniorOwnProfile,
  NeoSeniorProfile,
  UpdateNeoSeniorProfileRequest,
} from '../../services/onboarding.service';
import { getApiErrorMessage } from '../../services/http';
import { NsrCode, PreferredLang } from '../../services/types';
import { useAuthStore } from '../../store/auth.store';
import { Brand, Colors, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Params = { nsrId: string };

interface FormState {
  fullName: string;
  phone: string;
  dob: string;
  lang: PreferredLang;
  conditions: string[];
  bpHigh: string;
  sugarHigh: string;
  spo2Low: string;
  hrHigh: string;
  hrLow: string;
  weightDelta: string;
  bloodGroup: string;
  nhis: string;
  allergies: string[];
  strokeHistory: boolean;
  strokeLastDate: string;
  fallHistory: boolean;
  fallLastDate: string;
  surgeries: Array<{ description: string; year: string }>;
  hospital: string;
  doctorName: string;
  doctorPhone: string;
}

const EMPTY_FORM: FormState = {
  fullName: '', phone: '', dob: '', lang: 'en', conditions: [],
  bpHigh: '', sugarHigh: '', spo2Low: '', hrHigh: '', hrLow: '', weightDelta: '',
  bloodGroup: '', nhis: '', allergies: [],
  strokeHistory: false, strokeLastDate: '',
  fallHistory: false, fallLastDate: '',
  surgeries: [],
  hospital: '', doctorName: '', doctorPhone: '',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authSeedForm(displayName: string, phone: string, lang: PreferredLang): FormState {
  return { ...EMPTY_FORM, fullName: displayName, phone, lang };
}

function profileToForm(p: NeoSeniorProfile): FormState {
  return {
    fullName: p.fullName ?? '',
    phone: p.phoneNumber ?? '',
    dob: p.dateOfBirth ?? '',
    lang: p.preferredLang ?? 'en',
    conditions: p.conditions ?? [],
    bpHigh: p.bpHighThreshold?.toString() ?? '',
    sugarHigh: p.sugarHighMmol?.toString() ?? '',
    spo2Low: p.spo2LowThreshold?.toString() ?? '',
    hrHigh: p.heartRateHigh?.toString() ?? '',
    hrLow: p.heartRateLow?.toString() ?? '',
    weightDelta: p.weightAlertDeltaKg?.toString() ?? '',
    bloodGroup: p.bloodGroup ?? '',
    nhis: p.nhisNumber ?? '',
    allergies: p.allergies ?? [],
    strokeHistory: p.strokeHistory ?? false,
    strokeLastDate: p.strokeLastDate ?? '',
    fallHistory: p.fallHistory ?? false,
    fallLastDate: p.fallLastDate ?? '',
    surgeries: (p.pastSurgeries ?? []).map(s => ({
      description: s.description,
      year: s.year.toString(),
    })),
    hospital: p.preferredHospital ?? '',
    doctorName: p.primaryDoctorName ?? '',
    doctorPhone: p.primaryDoctorPhone ?? '',
  };
}

function formToRequest(f: FormState): UpdateNeoSeniorProfileRequest {
  const num = (s: string) => (s.trim() ? parseFloat(s) : undefined);
  return {
    fullName: f.fullName || undefined,
    phoneNumber: f.phone || undefined,
    dateOfBirth: f.dob || undefined,
    preferredLang: f.lang,
    conditions: f.conditions,
    bpHighThreshold: num(f.bpHigh),
    sugarHighMmol: num(f.sugarHigh),
    spo2LowThreshold: num(f.spo2Low),
    heartRateHigh: num(f.hrHigh),
    heartRateLow: num(f.hrLow),
    weightAlertDeltaKg: num(f.weightDelta),
    bloodGroup: f.bloodGroup || undefined,
    nhisNumber: f.nhis || undefined,
    allergies: f.allergies.filter(a => a.trim()),
    strokeHistory: f.strokeHistory,
    strokeLastDate: f.strokeHistory && f.strokeLastDate ? f.strokeLastDate : undefined,
    fallHistory: f.fallHistory,
    fallLastDate: f.fallHistory && f.fallLastDate ? f.fallLastDate : undefined,
    pastSurgeries: f.surgeries
      .filter(s => s.description.trim() && s.year.trim())
      .map(s => ({ description: s.description.trim(), year: parseInt(s.year, 10) })),
    preferredHospital: f.hospital || undefined,
    primaryDoctorName: f.doctorName || undefined,
    primaryDoctorPhone: f.doctorPhone || undefined,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { nsrId } = useRoute<RouteProp<{ EditProfile: Params }, 'EditProfile'>>().params;
  const navigation = useNavigation();

  const authUser = useAuthStore(s => s.user);
  const isNeoSenior = authUser?.role === 'neo_senior';

  const [form, setForm] = useState<FormState>(() =>
    authSeedForm(authUser?.displayName ?? '', authUser?.phone ?? '', authUser?.language ?? 'en'),
  );
  const [initialized, setInitialized] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');

  const profileQ = useQuery({
    queryKey: isNeoSenior ? ['ownProfile'] : ['profile', nsrId],
    queryFn: isNeoSenior ? getNeoSeniorOwnProfile : () => getNeoSeniorProfile(nsrId as NsrCode),
    retry: false,
  });

  useEffect(() => {
    if (profileQ.data && !initialized) {
      setForm(profileToForm(profileQ.data));
      setInitialized(true);
    }
  }, [profileQ.data, initialized]);

  const saveMut = useMutation({
    mutationFn: () =>
      isNeoSenior
        ? updateNeoSeniorOwnProfile(formToRequest(form))
        : updateNeoSeniorProfile(nsrId as NsrCode, formToRequest(form)),
    onSuccess: () => navigation.goBack(),
  });

  function upd<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function addAllergy() {
    const v = newAllergy.trim();
    if (v && !form.allergies.includes(v)) {
      upd('allergies', [...form.allergies, v]);
      setNewAllergy('');
    }
  }

  function removeAllergy(i: number) {
    upd('allergies', form.allergies.filter((_, idx) => idx !== i));
  }

  function patchSurgery(i: number, field: 'description' | 'year', val: string) {
    const next = [...form.surgeries];
    next[i] = { ...next[i], [field]: val };
    upd('surgeries', next);
  }

  function removeSurgery(i: number) {
    upd('surgeries', form.surgeries.filter((_, idx) => idx !== i));
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <BackHeader title={t('editProfile.title')} bordered />
      {profileQ.isLoading && (
        <ActivityIndicator color={Brand.primary} style={styles.loadingIndicator} />
      )}

      {/* ── Section 1: Basic Info ─────────────────────────────────────── */}
      <SectionHeader number={1} label={t('editProfile.sectionBasic')} />

      <FieldLabel label={t('onboarding.fullName')} />
      <TextInput
        style={styles.input}
        value={form.fullName}
        onChangeText={v => upd('fullName', v)}
        placeholderTextColor={Colors.textMuted}
      />

      <FieldLabel label={t('onboarding.phone')} />
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={v => upd('phone', v)}
        keyboardType="phone-pad"
        placeholderTextColor={Colors.textMuted}
      />

      <DateInput
        label={t('onboarding.dateOfBirth')}
        value={form.dob}
        onChange={v => upd('dob', v)}
      />

      <FieldLabel label={t('onboarding.language')} />
      <View style={styles.langRow}>
        {(['en', 'tw'] as PreferredLang[]).map(l => (
          <Pressable
            key={l}
            onPress={() => upd('lang', l)}
            style={[styles.langChip, form.lang === l && styles.langChipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: form.lang === l }}
          >
            <Text style={[styles.langChipText, form.lang === l && styles.langChipTextActive]}>
              {l === 'en' ? 'English' : 'Twi'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ConditionMultiSelect
        label={t('onboarding.conditions')}
        hint={t('onboarding.conditionsHint')}
        selected={form.conditions}
        onChange={v => upd('conditions', v)}
      />

      {/* ── Section 2: Alert Thresholds (warm panel) ─────────────────── */}
      <View style={styles.thresholdsPanel}>
        <SectionHeader number={2} label={t('editProfile.sectionThresholds')} accent />
        <Text style={styles.thresholdsHint}>{t('onboarding.thresholdsHint')}</Text>
        <View style={styles.thresholdGrid}>
          <ThresholdGridField
            label={t('editProfile.bpHighThreshold')}
            value={form.bpHigh}
            onChange={v => upd('bpHigh', v)}
          />
          <ThresholdGridField
            label={t('editProfile.sugarHighMmol')}
            value={form.sugarHigh}
            onChange={v => upd('sugarHigh', v)}
          />
          <ThresholdGridField
            label={t('editProfile.spo2LowThreshold')}
            value={form.spo2Low}
            onChange={v => upd('spo2Low', v)}
          />
          <ThresholdGridField
            label={t('editProfile.heartRateHigh')}
            value={form.hrHigh}
            onChange={v => upd('hrHigh', v)}
          />
          <ThresholdGridField
            label={t('editProfile.heartRateLow')}
            value={form.hrLow}
            onChange={v => upd('hrLow', v)}
          />
          <ThresholdGridField
            label={t('editProfile.weightAlertDelta')}
            value={form.weightDelta}
            onChange={v => upd('weightDelta', v)}
          />
        </View>
      </View>

      {/* ── Section 3: Medical Details ────────────────────────────────── */}
      <SectionHeader number={3} label={t('editProfile.sectionMedical')} />

      <FieldLabel label={t('editProfile.bloodGroup')} />
      <View style={styles.bgGrid}>
        {BLOOD_GROUPS.map(bg => (
          <Pressable
            key={bg}
            onPress={() => upd('bloodGroup', form.bloodGroup === bg ? '' : bg)}
            style={[styles.bgCell, form.bloodGroup === bg && styles.bgCellActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: form.bloodGroup === bg }}
          >
            <Text style={[styles.bgCellText, form.bloodGroup === bg && styles.bgCellTextActive]}>
              {bg}
            </Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel label={t('editProfile.nhisNumber')} />
      <TextInput
        style={styles.input}
        value={form.nhis}
        onChangeText={v => upd('nhis', v)}
        placeholder={t('editProfile.nhisPlaceholder')}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="characters"
      />

      <FieldLabel label={t('editProfile.allergies')} />
      {form.allergies.length > 0 && (
        <View style={styles.allergyList}>
          {form.allergies.map((a, i) => (
            <View key={i} style={styles.allergyChip}>
              <Text style={styles.allergyChipText}>{a}</Text>
              <Pressable onPress={() => removeAllergy(i)} hitSlop={8} accessibilityRole="button">
                <Ionicons name="close" size={15} color={Brand.mutedTeal} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={styles.addAllergyRow}>
        <TextInput
          style={styles.addAllergyInput}
          value={newAllergy}
          onChangeText={setNewAllergy}
          placeholder={t('editProfile.allergyPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={addAllergy}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addAllergyBtn, !newAllergy.trim() && styles.addAllergyBtnDisabled]}
          onPress={addAllergy}
          disabled={!newAllergy.trim()}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* ── Section 4: Medical History ────────────────────────────────── */}
      <SectionHeader number={4} label={t('editProfile.sectionHistory')} />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('editProfile.strokeHistory')}</Text>
        <Switch
          value={form.strokeHistory}
          onValueChange={v => upd('strokeHistory', v)}
          trackColor={{ true: Brand.primaryForm, false: Brand.borderForm }}
          thumbColor={Colors.white}
        />
      </View>
      {form.strokeHistory && (
        <DateInput
          label={t('editProfile.strokeLastDate')}
          value={form.strokeLastDate}
          onChange={v => upd('strokeLastDate', v)}
        />
      )}

      <View style={[styles.switchRow, styles.switchRowDivider]}>
        <Text style={styles.switchLabel}>{t('editProfile.fallHistory')}</Text>
        <Switch
          value={form.fallHistory}
          onValueChange={v => upd('fallHistory', v)}
          trackColor={{ true: Brand.primaryForm, false: Brand.borderForm }}
          thumbColor={Colors.white}
        />
      </View>
      {form.fallHistory && (
        <DateInput
          label={t('editProfile.fallLastDate')}
          value={form.fallLastDate}
          onChange={v => upd('fallLastDate', v)}
        />
      )}

      <FieldLabel label={t('editProfile.pastSurgeries')} />
      {form.surgeries.length === 0 && (
        <Text style={styles.muted}>{t('editProfile.noSurgeries')}</Text>
      )}
      {form.surgeries.map((s, i) => (
        <View key={i} style={styles.surgeryCard}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.surgeryDescInput}
              value={s.description}
              onChangeText={v => patchSurgery(i, 'description', v)}
              placeholder={t('editProfile.surgeryDescription')}
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.surgeryYearInput}
              value={s.year}
              onChangeText={v => patchSurgery(i, 'year', v)}
              placeholder={t('editProfile.surgeryYear')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          <Pressable onPress={() => removeSurgery(i)} hitSlop={8} accessibilityRole="button">
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </Pressable>
        </View>
      ))}
      <Pressable
        style={styles.addSurgeryBtn}
        onPress={() => upd('surgeries', [...form.surgeries, { description: '', year: '' }])}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={18} color={Brand.primaryForm} />
        <Text style={styles.addSurgeryText}>{t('editProfile.addSurgery')}</Text>
      </Pressable>

      {/* ── Section 5: Care Team ──────────────────────────────────────── */}
      <SectionHeader number={5} label={t('editProfile.sectionCareTeam')} />

      <FieldLabel label={t('editProfile.preferredHospital')} />
      <TextInput
        style={styles.input}
        value={form.hospital}
        onChangeText={v => upd('hospital', v)}
        placeholder={t('editProfile.hospitalPlaceholder')}
        placeholderTextColor={Colors.textMuted}
      />

      <FieldLabel label={t('editProfile.primaryDoctorName')} />
      <TextInput
        style={styles.input}
        value={form.doctorName}
        onChangeText={v => upd('doctorName', v)}
        placeholder={t('editProfile.doctorNamePlaceholder')}
        placeholderTextColor={Colors.textMuted}
      />

      <FieldLabel label={t('editProfile.primaryDoctorPhone')} />
      <TextInput
        style={styles.input}
        value={form.doctorPhone}
        onChangeText={v => upd('doctorPhone', v)}
        placeholder={t('editProfile.doctorPhonePlaceholder')}
        placeholderTextColor={Colors.textMuted}
        keyboardType="phone-pad"
      />

      {/* ── Save ──────────────────────────────────────────────────────── */}
      {saveMut.isError && (
        <Text style={styles.errorTxt}>{getApiErrorMessage(saveMut.error)}</Text>
      )}
      <Pressable
        style={[styles.saveBtn, saveMut.isPending && styles.saveBtnDisabled]}
        onPress={() => saveMut.mutate()}
        disabled={saveMut.isPending}
        accessibilityRole="button"
      >
        {saveMut.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{t('editProfile.saveChanges')}</Text>
          </>
        )}
      </Pressable>
    </Screen>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ number, label, accent }: { number: number; label: string; accent?: boolean }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionBadge, accent && styles.sectionBadgeAccent]}>
        <Text style={styles.sectionBadgeNum}>{number}</Text>
      </View>
      <Text style={styles.sectionHeaderLabel}>{label}</Text>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function ThresholdGridField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.thresholdGridItem}>
      <Text style={styles.thresholdGridLabel}>{label}</Text>
      <TextInput
        style={styles.thresholdInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  loadingIndicator: { alignSelf: 'flex-start', marginBottom: Spacing.sm },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 26,
    marginBottom: 16,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeAccent: {
    backgroundColor: '#9a5b14',
  },
  sectionBadgeNum: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: '#fff',
  },
  sectionHeaderLabel: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    color: Brand.primary,
  },

  fieldLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: 15,
    color: Brand.primaryText,
    marginTop: Spacing.md,
    marginBottom: 7,
  },

  // Inputs
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: Fonts.body,
    color: Brand.inputText,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },

  // Language
  langRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.sm },
  langChip: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  langChipActive: {
    backgroundColor: Brand.primaryForm,
    borderColor: Brand.primaryForm,
  },
  langChipText: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Brand.primaryForm,
  },
  langChipTextActive: { color: '#fff' },

  // Thresholds panel
  thresholdsPanel: {
    backgroundColor: Brand.bgWarmCard,
    borderWidth: 1,
    borderColor: Brand.borderCard,
    borderRadius: 18,
    padding: 20,
    marginTop: 26,
  },
  thresholdsHint: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#7a6230',
    marginBottom: 16,
    marginTop: -8,
  },
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thresholdGridItem: { width: '47%' },
  thresholdGridLabel: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: 13,
    color: Brand.primaryText,
    marginBottom: 6,
  },
  thresholdInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e3cfa0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 17,
    fontFamily: Fonts.body,
    color: Brand.inputText,
    backgroundColor: Colors.surface,
  },

  // Blood group grid
  bgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: Spacing.sm,
  },
  bgCell: {
    width: '22%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCellActive: {
    backgroundColor: Brand.primaryForm,
    borderColor: Brand.primaryForm,
  },
  bgCellText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primaryForm,
  },
  bgCellTextActive: { color: '#fff' },

  // Allergies
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef5f6',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  allergyChipText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Brand.primary,
  },
  addAllergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  addAllergyInput: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 60,
    fontSize: 17,
    fontFamily: Fonts.body,
    color: Brand.inputText,
    backgroundColor: Colors.surface,
  },
  addAllergyBtn: {
    position: 'absolute',
    right: 8,
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: Brand.primaryForm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllergyBtnDisabled: { opacity: 0.4 },

  // Toggles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: MinTapTarget.neoCare,
  },
  switchRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f3ead6',
  },
  switchLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Brand.primary,
    flex: 1,
    marginRight: Spacing.base,
  },

  // Surgeries
  surgeryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  surgeryDescInput: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Brand.primary,
    paddingVertical: 2,
  },
  surgeryYearInput: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Brand.mutedTeal,
    paddingVertical: 2,
    marginTop: 2,
  },
  addSurgeryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.borderForm,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  addSurgeryText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primaryForm,
  },

  // Save button
  saveBtn: {
    height: 58,
    backgroundColor: Brand.primaryForm,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing['2xl'],
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: '#fff',
  },

  muted: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  errorTxt: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
