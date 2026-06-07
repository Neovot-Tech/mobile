// STUB

export interface DashboardSummary {
  daysLoggedThisWeek: number;
  highBpDays: number;
  missedMedsDays: number;
  neoSeniorName: string;
}

export interface Alert {
  id: string;
  severity: 'urgent' | 'warning' | 'info';
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export async function getDashboardSummary(
  neoSeniorId: string,
): Promise<DashboardSummary> {
  return {
    daysLoggedThisWeek: 0,
    highBpDays: 0,
    missedMedsDays: 0,
    neoSeniorName: 'Jessica Adamah',
  };
}

export async function getAlerts(neoSeniorId: string): Promise<Alert[]> {
  return [];
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  // POST /dashboard/alerts/{alertId}/acknowledge
}

export async function getLinkedProfiles(): Promise<
  { id: string; name: string; neoSeniorId: string }[]
> {
  return [];
}
