// STUB

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
}

export interface AdherenceRecord {
  date: string;
  taken: boolean;
  medicationId: string;
}

export async function getMedications(
  neoSeniorId: string,
): Promise<Medication[]> {
  return [
    {
      id: '1',
      name: 'Amlodipine',
      dosage: '5mg',
      frequency: 'Once daily',
      times: ['08:00'],
    },
  ];
}

export async function getAdherence(
  neoSeniorId: string,
): Promise<AdherenceRecord[]> {
  return [];
}
