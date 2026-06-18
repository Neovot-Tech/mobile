// Vitals — LIVE (FRONTEND_HANDOVER.md §6). Requires `vitals` consent for NeoCare.
// Vitals are written by the AI worker from device-photo jobs (no direct POST).
// Path param is the NeoSenior **user UUID**.
import { http } from './http';
import { Endpoints } from '../constants/api';
import { NeoSeniorUserId, VitalType } from './types';

export interface VitalReading {
  id: string;
  vitalType: VitalType;
  value: number;
  unit: string;
  source: string;
  loggedAt: string;
}

export interface VitalSummaryRow {
  vitalType: VitalType;
  count: number;
  avg: number;
  min: number;
  max: number;
  outOfRange: number;
}

/** Trend points keyed by vital type, for charts. */
export type VitalTrend = Partial<Record<VitalType, { value: number; loggedAt: string }[]>>;

interface VitalDto {
  id: string;
  vital_type: VitalType;
  value: number;
  unit: string;
  source: string;
  logged_at: string;
}

export async function getVitals(
  userId: NeoSeniorUserId,
  opts: { vitalType?: VitalType; start?: string; end?: string; limit?: number; offset?: number } = {},
): Promise<{ vitals: VitalReading[]; limit: number; offset: number }> {
  const { data } = await http.get<{ vitals: VitalDto[]; limit: number; offset: number }>(
    Endpoints.vitals.list(userId),
    {
      params: {
        vital_type: opts.vitalType,
        start: opts.start,
        end: opts.end,
        limit: opts.limit ?? 100,
        offset: opts.offset ?? 0,
      },
    },
  );
  return {
    vitals: data.vitals.map((v) => ({
      id: v.id,
      vitalType: v.vital_type,
      value: v.value,
      unit: v.unit,
      source: v.source,
      loggedAt: v.logged_at,
    })),
    limit: data.limit,
    offset: data.offset,
  };
}

export async function getVitalsSummary(
  userId: NeoSeniorUserId,
  days = 30,
): Promise<{ windowDays: number; summary: VitalSummaryRow[] }> {
  const { data } = await http.get<{
    window_days: number;
    summary: {
      vital_type: VitalType;
      count: number;
      avg: number;
      min: number;
      max: number;
      out_of_range: number;
    }[];
  }>(Endpoints.vitals.summary(userId), { params: { days } });
  return {
    windowDays: data.window_days,
    summary: data.summary.map((r) => ({
      vitalType: r.vital_type,
      count: r.count,
      avg: r.avg,
      min: r.min,
      max: r.max,
      outOfRange: r.out_of_range,
    })),
  };
}

export async function getVitalsTrend(
  userId: NeoSeniorUserId,
  opts: { vitalType?: VitalType; days?: number } = {},
): Promise<{ windowDays: number; trend: VitalTrend }> {
  const { data } = await http.get<{
    window_days: number;
    trend: Record<string, { value: number; logged_at: string }[]>;
  }>(Endpoints.vitals.trend(userId), {
    params: { vital_type: opts.vitalType, days: opts.days ?? 30 },
  });
  const trend: VitalTrend = {};
  for (const [type, points] of Object.entries(data.trend)) {
    trend[type as VitalType] = points.map((p) => ({ value: p.value, loggedAt: p.logged_at }));
  }
  return { windowDays: data.window_days, trend };
}
