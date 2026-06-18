// Health log feed (symptoms) — LIVE (FRONTEND_HANDOVER.md §5). Requires
// `symptoms` consent for NeoCare. Path param is the NeoSenior **user UUID**.
import { http } from './http';
import { Endpoints } from '../constants/api';
import { NeoSeniorUserId } from './types';

export type LogType = 'symptom' | 'vitals' | 'medication' | 'prescription';
export type EscalationTier = 'none' | 'info' | 'warning' | 'urgent';

export interface HealthLogSummary {
  id: string;
  logType: LogType;
  aiSummary: string;
  escalationTier: EscalationTier;
  escalationReason?: string;
  loggedAt: string;
}

export interface HealthLogEntry extends HealthLogSummary {
  rawTranscript?: string;
  rawFileUrl?: string;
  extractedEntities?: Record<string, unknown>;
}

export interface HealthLogPage {
  logs: HealthLogSummary[];
  nextCursor: string | null;
}

interface LogDto {
  id: string;
  log_type: LogType;
  ai_summary: string;
  escalation_tier: EscalationTier;
  escalation_reason?: string | null;
  logged_at: string;
}

interface EntryDto extends LogDto {
  raw_transcript?: string | null;
  raw_file_url?: string | null;
  extracted_entities?: Record<string, unknown> | null;
}

function toSummary(l: LogDto): HealthLogSummary {
  return {
    id: l.id,
    logType: l.log_type,
    aiSummary: l.ai_summary,
    escalationTier: l.escalation_tier,
    escalationReason: l.escalation_reason ?? undefined,
    loggedAt: l.logged_at,
  };
}

/** Cursor-paginated, newest first. */
export async function getHealthLogs(
  userId: NeoSeniorUserId,
  opts: { before?: string; limit?: number } = {},
): Promise<HealthLogPage> {
  const { data } = await http.get<{ logs: LogDto[]; next_cursor: string | null }>(
    Endpoints.healthLogs.feed(userId),
    { params: { before: opts.before, limit: opts.limit ?? 50 } },
  );
  return { logs: data.logs.map(toSummary), nextCursor: data.next_cursor };
}

/** Most recent log per type. */
export async function getLatestHealthLogs(
  userId: NeoSeniorUserId,
): Promise<HealthLogSummary[]> {
  const { data } = await http.get<{ latest: LogDto[] }>(
    Endpoints.healthLogs.latest(userId),
  );
  return data.latest.map(toSummary);
}

export async function getHealthLogEntry(logId: string): Promise<HealthLogEntry> {
  const { data } = await http.get<EntryDto>(Endpoints.healthLogs.entry(logId));
  return {
    ...toSummary(data),
    rawTranscript: data.raw_transcript ?? undefined,
    rawFileUrl: data.raw_file_url ?? undefined,
    extractedEntities: data.extracted_entities ?? undefined,
  };
}

export async function deleteHealthLogEntry(logId: string): Promise<void> {
  await http.delete(Endpoints.healthLogs.entry(logId));
}
