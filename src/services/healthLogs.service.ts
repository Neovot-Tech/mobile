// STUB

export interface HealthLog {
  id: string;
  loggedAt: string;
  transcription: string;
  symptoms: string[];
}

export async function getHealthLogs(neoSeniorId: string): Promise<HealthLog[]> {
  return [
    {
      id: '1',
      loggedAt: '2:30 PM',
      transcription: '"Noticed a funny tingling in my feet again today."',
      symptoms: ['tingling', 'feet'],
    },
  ];
}

export async function getLatestHealthLog(
  neoSeniorId: string,
): Promise<HealthLog | null> {
  return {
    id: '1',
    loggedAt: '2:30 PM',
    transcription: '"Noticed a funny tingling in my feet again today."',
    symptoms: ['tingling', 'feet'],
  };
}
