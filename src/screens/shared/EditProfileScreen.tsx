import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

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

// ─── Design tokens ────────────────────────────────────────────────────────────

const CARD_BORDER = '#FFE6D5';
const ROW_DIVIDER = '#EFEBE4';
const INPUT_BG = '#FFF6E6';
const INPUT_BORDER = '#FFE6D5';

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

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

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
  const insets = useSafeAreaInsets();
  const { nsrId } = useRoute<RouteProp<{ EditProfile: Params }, 'EditProfile'>>().params;
  const navigation = useNavigation();

  const authUser = useAuthStore(s => s.user);
  const isNeoSenior = authUser?.role === 'neo_senior';
  const displayName = authUser?.displayName ?? '';

  const [form, setForm] = useState<FormState>(() =>
    authSeedForm(displayName, authUser?.phone ?? '', authUser?.language ?? 'en'),
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={Brand.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarInitials}>
            {displayName ? getInitials(displayName) : '?'}
          </Text>
        </View>
      </View>

      {profileQ.isLoading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={Brand.primary} />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* ── 1. Basic Info ──────────────────────────────────────────────── */}
        <SectionHeader number={1} label={t('editProfile.sectionBasic')} />
        <View style={styles.card}>
          <FieldGroup label={t('onboarding.fullName')}>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={v => upd('fullName', v)}
              placeholderTextColor={Colors.textMuted}
            />
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('onboarding.phone')}>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={v => upd('phone', v)}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textMuted}
            />
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('onboarding.dateOfBirth')}>
            <DateInput value={form.dob} onChange={v => upd('dob', v)} />
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('onboarding.language')}>
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
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('onboarding.conditions')}>
            <ConditionMultiSelect
              hint={t('onboarding.conditionsHint')}
              selected={form.conditions}
              onChange={v => upd('conditions', v)}
            />
          </FieldGroup>
        </View>

        {/* ── 2. Alert Thresholds ────────────────────────────────────────── */}
        <View style={styles.thresholdsPanel}>
          <SectionHeader number={2} label={t('editProfile.sectionThresholds')} accent />
          <Text style={styles.thresholdsHint}>{t('onboarding.thresholdsHint')}</Text>
          <View style={styles.thresholdGrid}>
            {[
              { label: t('editProfile.bpHighThreshold'), key: 'bpHigh' },
              { label: t('editProfile.sugarHighMmol'), key: 'sugarHigh' },
              { label: t('editProfile.spo2LowThreshold'), key: 'spo2Low' },
              { label: t('editProfile.heartRateHigh'), key: 'hrHigh' },
              { label: t('editProfile.heartRateLow'), key: 'hrLow' },
              { label: t('editProfile.weightAlertDelta'), key: 'weightDelta' },
            ].map(({ label, key }) => (
              <View key={key} style={styles.thresholdGridItem}>
                <Text style={styles.thresholdGridLabel}>{label}</Text>
                <TextInput
                  style={styles.thresholdInput}
                  value={form[key as keyof FormState] as string}
                  onChangeText={v => upd(key as keyof FormState, v as any)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. Medical Details ─────────────────────────────────────────── */}
        <SectionHeader number={3} label={t('editProfile.sectionMedical')} />
        <View style={styles.card}>
          <FieldGroup label={t('editProfile.bloodGroup')}>
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
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('editProfile.nhisNumber')}>
            <TextInput
              style={styles.input}
              value={form.nhis}
              onChangeText={v => upd('nhis', v)}
              placeholder={t('editProfile.nhisPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('editProfile.allergies')}>
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
          </FieldGroup>
        </View>

        {/* ── 4. Medical History ─────────────────────────────────────────── */}
        <SectionHeader number={4} label={t('editProfile.sectionHistory')} />
        <View style={styles.card}>
          <View style={[styles.switchRow]}>
            <Text style={styles.switchLabel}>{t('editProfile.strokeHistory')}</Text>
            <Switch
              value={form.strokeHistory}
              onValueChange={v => upd('strokeHistory', v)}
              trackColor={{ true: Brand.primary, false: ROW_DIVIDER }}
              thumbColor={Colors.white}
            />
          </View>
          {form.strokeHistory && (
            <View style={styles.conditionalField}>
              <DateInput
                label={t('editProfile.strokeLastDate')}
                value={form.strokeLastDate}
                onChange={v => upd('strokeLastDate', v)}
              />
            </View>
          )}

          <View style={styles.cardDivider} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('editProfile.fallHistory')}</Text>
            <Switch
              value={form.fallHistory}
              onValueChange={v => upd('fallHistory', v)}
              trackColor={{ true: Brand.primary, false: ROW_DIVIDER }}
              thumbColor={Colors.white}
            />
          </View>
          {form.fallHistory && (
            <View style={styles.conditionalField}>
              <DateInput
                label={t('editProfile.fallLastDate')}
                value={form.fallLastDate}
                onChange={v => upd('fallLastDate', v)}
              />
            </View>
          )}

          <View style={styles.cardDivider} />

          <FieldGroup label={t('editProfile.pastSurgeries')}>
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
              <Ionicons name="add" size={18} color={Brand.primary} />
              <Text style={styles.addSurgeryText}>{t('editProfile.addSurgery')}</Text>
            </Pressable>
          </FieldGroup>
        </View>

        {/* ── 5. Care Team ───────────────────────────────────────────────── */}
        <SectionHeader number={5} label={t('editProfile.sectionCareTeam')} />
        <View style={styles.card}>
          <FieldGroup label={t('editProfile.preferredHospital')}>
            <TextInput
              style={styles.input}
              value={form.hospital}
              onChangeText={v => upd('hospital', v)}
              placeholder={t('editProfile.hospitalPlaceholder')}
              placeholderTextColor={Colors.textMuted}
            />
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('editProfile.primaryDoctorName')}>
            <TextInput
              style={styles.input}
              value={form.doctorName}
              onChangeText={v => upd('doctorName', v)}
              placeholder={t('editProfile.doctorNamePlaceholder')}
              placeholderTextColor={Colors.textMuted}
            />
          </FieldGroup>

          <View style={styles.cardDivider} />

          <FieldGroup label={t('editProfile.primaryDoctorPhone')}>
            <TextInput
              style={styles.input}
              value={form.doctorPhone}
              onChangeText={v => upd('doctorPhone', v)}
              placeholder={t('editProfile.doctorPhonePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </FieldGroup>
        </View>

        {/* ── Save ───────────────────────────────────────────────────────── */}
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
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ number, label, accent }: { number: number; label: string; accent?: boolean }) {
  return (
    <View style={sc.row}>
      <View style={[sc.badge, accent && sc.badgeAccent]}>
        <Text style={sc.badgeNum}>{number}</Text>
      </View>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fg.wrapper}>
      <Text style={fg.label}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 64,
    backgroundColor: '#F5F1E5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: Brand.primary,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: Fonts.heading, fontSize: 13, color: Brand.primary },

  loadingBar: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Brand.bgCream,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: ROW_DIVIDER,
    marginHorizontal: -Spacing.base,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Brand.primary,
    backgroundColor: INPUT_BG,
    marginBottom: 4,
  },

  // Language
  langRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  langChip: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INPUT_BG,
  },
  langChipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  langChipText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primary,
  },
  langChipTextActive: { color: '#fff' },

  // Thresholds panel
  thresholdsPanel: {
    backgroundColor: '#FFF8EC',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: Spacing.xl,
  },
  thresholdsHint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#7a6230',
    marginBottom: 16,
    marginTop: -4,
  },
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thresholdGridItem: { width: '47%' },
  thresholdGridLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Brand.primary,
    marginBottom: 6,
  },
  thresholdInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e3cfa0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Brand.primary,
    backgroundColor: Colors.surface,
  },

  // Blood group grid
  bgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  bgCell: {
    width: '22%',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCellActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  bgCellText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Brand.primary,
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
    gap: 6,
    backgroundColor: '#EEF5F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  allergyChipText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Brand.primary,
  },
  addAllergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  addAllergyInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 56,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Brand.primary,
    backgroundColor: INPUT_BG,
  },
  addAllergyBtn: {
    position: 'absolute',
    right: 6,
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllergyBtnDisabled: { opacity: 0.35 },

  // Toggles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: MinTapTarget.neoCare,
  },
  switchLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Brand.primary,
    flex: 1,
    marginRight: Spacing.base,
  },
  conditionalField: {
    paddingBottom: 10,
  },

  // Surgeries
  surgeryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  surgeryDescInput: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primary,
    paddingVertical: 2,
  },
  surgeryYearInput: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Brand.mutedTeal,
    paddingVertical: 2,
    marginTop: 2,
  },
  addSurgeryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.primary,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 6,
    opacity: 0.7,
  },
  addSurgeryText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Brand.primary,
  },

  // Save button
  saveBtn: {
    height: 56,
    backgroundColor: Brand.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 17,
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

const sc = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAccent: {
    backgroundColor: '#9a5b14',
  },
  badgeNum: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: '#fff',
  },
  label: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: Brand.primary,
  },
});

const fg = StyleSheet.create({
  wrapper: {
    paddingVertical: Spacing.base,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: Brand.mutedTeal,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
});
