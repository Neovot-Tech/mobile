// Medications — LIVE (FRONTEND_HANDOVER.md §7). Requires `medications` consent
// for NeoCare. Path param is the NeoSenior **user UUID**.
import { http } from './http';
import { Endpoints } from '../constants/api';
import { NeoSeniorUserId } from './types';

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  scheduledTimes?: string[]; // e.g. ["08:00","20:00"]
  prescribedBy?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

/** A medication parsed from a prescription scan, awaiting confirmation (C-08). */
export interface MedicationDraft {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  scheduledTimes?: string[];
  prescribedBy?: string;
  notes?: string;
}

export interface AdherenceRow {
  id: string;
  name: string;
  taken: number;
  missed: number;
}

export interface CreateMedicationInput {
  name: string;
  dosage?: string;
  frequency?: string;
  scheduledTimes?: string[];
  prescribedBy?: string;
  notes?: string;
}

interface MedicationDto {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  scheduled_times?: string[] | null;
  prescribed_by?: string | null;
  notes?: string | null;
  active: boolean;
  created_at: string;
}

interface DraftDto {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  scheduled_times?: string[] | null;
  prescribed_by?: string | null;
  notes?: string | null;
}

function toMedication(m: MedicationDto): Medication {
  return {
    id: m.id,
    name: m.name,
    dosage: m.dosage ?? undefined,
    frequency: m.frequency ?? undefined,
    scheduledTimes: m.scheduled_times ?? undefined,
    prescribedBy: m.prescribed_by ?? undefined,
    notes: m.notes ?? undefined,
    active: m.active,
    createdAt: m.created_at,
  };
}

function toCreateBody(input: Partial<CreateMedicationInput> & { active?: boolean }) {
  return {
    name: input.name,
    dosage: input.dosage,
    frequency: input.frequency,
    scheduled_times: input.scheduledTimes,
    prescribed_by: input.prescribedBy,
    notes: input.notes,
    active: input.active,
  };
}

export async function getMedications(userId: NeoSeniorUserId): Promise<Medication[]> {
  const { data } = await http.get<{ medications: MedicationDto[] }>(
    Endpoints.medications.list(userId),
  );
  return data.medications.map(toMedication);
}

export async function createMedication(
  userId: NeoSeniorUserId,
  input: CreateMedicationInput,
): Promise<{ medicationId: string }> {
  const { data } = await http.post<{ medication_id: string }>(
    Endpoints.medications.list(userId),
    toCreateBody(input),
  );
  return { medicationId: data.medication_id };
}

export async function getMedicationDrafts(
  userId: NeoSeniorUserId,
): Promise<MedicationDraft[]> {
  const { data } = await http.get<{ drafts: DraftDto[] }>(
    Endpoints.medications.drafts(userId),
  );
  return data.drafts.map((d) => ({
    id: d.id,
    name: d.name,
    dosage: d.dosage ?? undefined,
    frequency: d.frequency ?? undefined,
    scheduledTimes: d.scheduled_times ?? undefined,
    prescribedBy: d.prescribed_by ?? undefined,
    notes: d.notes ?? undefined,
  }));
}

export async function confirmDrafts(
  userId: NeoSeniorUserId,
  params: { confirm: string[]; discard: string[] },
): Promise<{ confirmed: number; discarded: number }> {
  const { data } = await http.post<{ confirmed: number; discarded: number }>(
    Endpoints.medications.confirmDrafts(userId),
    { confirm: params.confirm, discard: params.discard },
  );
  return data;
}

export async function getAdherence(
  userId: NeoSeniorUserId,
  days = 30,
): Promise<{ windowDays: number; adherence: AdherenceRow[] }> {
  const { data } = await http.get<{
    window_days: number;
    adherence: { id: string; name: string; taken: number; missed: number }[];
  }>(Endpoints.medications.adherence(userId), { params: { days } });
  return { windowDays: data.window_days, adherence: data.adherence };
}

export async function updateMedication(
  userId: NeoSeniorUserId,
  medId: string,
  patch: Partial<CreateMedicationInput> & { active?: boolean },
): Promise<{ message: string }> {
  const { data } = await http.put<{ message: string }>(
    Endpoints.medications.item(userId, medId),
    toCreateBody(patch),
  );
  return data;
}

export async function deleteMedication(
  userId: NeoSeniorUserId,
  medId: string,
): Promise<void> {
  await http.delete(Endpoints.medications.item(userId, medId));
}
