// Caregiver dashboard — LIVE (FRONTEND_HANDOVER.md §8 [NeoCare]).
// IMPORTANT: linked-profiles returns both the NSR code and the user UUID —
// use `userId` (UUID) as the path param for all data endpoints.
import { http } from './http';
import { Endpoints } from '../constants/api';
import { NsrCode, NeoSeniorUserId, ConsentMap, parseConsent } from './types';

export interface LinkedProfile {
  /** NSR code — shareable, for linking. */
  neoSeniorId: NsrCode;
  /** User UUID — the path param for /health-logs, /vitals, etc. */
  userId: NeoSeniorUserId;
  fullName: string;
  dateOfBirth?: string;
  conditions: string[];
  status: string;
  permissions: ConsentMap;
}

/** 7-day snapshot. */
export interface DashboardSummary {
  daysLogged: number;
  lastLogAt: string | null;
  highBpDays: number;
  highSugarDays: number;
  spo2LowDays: number;
  weightLoggedDays: number;
  medsMissed: number;
}

export interface Alert {
  id: string;
  healthLogId: string;
  tier: string;
  reason: string;
  notifiedAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

interface LinkedProfileDto {
  neo_senior_id: string;
  user_id: string;
  full_name: string;
  date_of_birth?: string | null;
  conditions?: string[] | null;
  status: string;
  permissions: ConsentMap | string | null;
}

interface AlertDto {
  id: string;
  health_log_id: string;
  tier: string;
  reason: string;
  notified_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export async function getLinkedProfiles(): Promise<LinkedProfile[]> {
  const { data } = await http.get<{ linked_profiles: LinkedProfileDto[] }>(
    Endpoints.dashboard.linkedProfiles,
  );
  return data.linked_profiles.map((p) => ({
    neoSeniorId: p.neo_senior_id,
    userId: p.user_id,
    fullName: p.full_name,
    dateOfBirth: p.date_of_birth ?? undefined,
    conditions: p.conditions ?? [],
    status: p.status,
    permissions: parseConsent(p.permissions),
  }));
}

export async function getDashboardSummary(
  userId: NeoSeniorUserId,
): Promise<DashboardSummary> {
  const { data } = await http.get<{
    days_logged: number;
    last_log_at: string | null;
    high_bp_days: number;
    high_sugar_days: number;
    spo2_low_days: number;
    weight_logged_days: number;
    meds_missed: number;
  }>(Endpoints.dashboard.summary(userId));
  return {
    daysLogged: data.days_logged,
    lastLogAt: data.last_log_at,
    highBpDays: data.high_bp_days,
    highSugarDays: data.high_sugar_days,
    spo2LowDays: data.spo2_low_days,
    weightLoggedDays: data.weight_logged_days,
    medsMissed: data.meds_missed,
  };
}

export async function getAlerts(
  userId: NeoSeniorUserId,
  opts: { limit?: number; offset?: number } = {},
): Promise<Alert[]> {
  const { data } = await http.get<{ alerts: AlertDto[] }>(
    Endpoints.dashboard.alerts(userId),
    { params: { limit: opts.limit ?? 50, offset: opts.offset ?? 0 } },
  );
  return data.alerts.map((a) => ({
    id: a.id,
    healthLogId: a.health_log_id,
    tier: a.tier,
    reason: a.reason,
    notifiedAt: a.notified_at,
    acknowledgedAt: a.acknowledged_at,
    createdAt: a.created_at,
  }));
}

export async function acknowledgeAlert(alertId: string): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>(
    Endpoints.dashboard.acknowledgeAlert(alertId),
  );
  return data;
}
