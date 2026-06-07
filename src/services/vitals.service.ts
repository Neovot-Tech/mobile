// STUB

export interface VitalsSummary {
  bloodPressure: { systolic: number; diastolic: number; date: string };
  bloodSugar: { value: number; unit: string; date: string };
}

export async function getVitalsSummary(
  neoSeniorId: string,
): Promise<VitalsSummary> {
  return {
    bloodPressure: { systolic: 140, diastolic: 90, date: '2026-06-05' },
    bloodSugar: { value: 7.2, unit: 'mmol/L', date: '2026-06-05' },
  };
}

export async function getVitalsTrend(neoSeniorId: string): Promise<unknown[]> {
  return [];
}
