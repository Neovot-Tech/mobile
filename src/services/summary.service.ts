// STUB

export interface DoctorSummary {
  neoSeniorId: string;
  generatedAt: string;
  content: string;
}

export async function getDoctorSummary(
  neoSeniorId: string,
): Promise<DoctorSummary> {
  return {
    neoSeniorId,
    generatedAt: '2026-06-06T10:00:00Z',
    content:
      'Patient reports intermittent tingling in feet. Blood pressure elevated at 140/90. Medication adherence 70% this week.',
  };
}

export async function getSummaryPdfUrl(neoSeniorId: string): Promise<string> {
  // GET /summary/{neoSeniorId}/pdf
  return 'https://example.com/mock-summary.pdf';
}
