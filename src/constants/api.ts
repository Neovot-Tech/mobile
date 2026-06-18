// Live backend (Cloud Run, africa-south1). A device on Expo can't reach a dev
// machine's localhost, so we point at the deployed API in both dev and prod.
const HOST = 'https://neovot-api-39833267488.africa-south1.run.app';

/** Prefix for all standard endpoints. */
export const API_BASE = `${HOST}/api/v1`;
/** Root-mounted endpoints (public emergency profile, health check) — no `/api/v1`. */
export const ROOT_BASE = HOST;

/**
 * Endpoint registry mirroring FRONTEND_HANDOVER.md. Paths needing an id use a
 * builder fn. Data endpoints take the NeoSenior **user UUID**, not the NSR code.
 */
export const Endpoints = {
  auth: {
    neoCareRegister: '/auth/neo-care/register',
    neoCareLogin: '/auth/neo-care/login',
    seniorRequestOtp: '/auth/neo-senior/request-otp',
    seniorVerifyOtp: '/auth/neo-senior/verify-otp',
    seniorSession: '/auth/neo-senior/session',
    biometricToken: '/auth/neo-senior/biometric-token',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  onboarding: {
    createProfile: '/onboarding/neo-senior/profile',
    profile: (nsr: string) => `/onboarding/neo-senior/profile/${nsr}`,
    selfRegister: '/onboarding/neo-senior/self-register',
    activate: '/onboarding/activate',
    inviteNeoCare: '/onboarding/neo-senior/invite-neo-care',
    confirmLink: '/onboarding/confirm-link',
    secondaryContacts: (nsr: string) =>
      `/onboarding/neo-senior/${nsr}/secondary-contacts`,
    secondaryContact: (contactId: string) =>
      `/onboarding/neo-senior/secondary-contacts/${contactId}`,
  },
  links: {
    create: '/neo-care-links',
    remove: (linkId: string) => `/neo-care-links/${linkId}`,
  },
  uploads: { signedUrl: '/uploads/signed-url' },
  jobs: { submit: '/jobs', status: (jobId: string) => `/jobs/${jobId}` },
  healthLogs: {
    feed: (userId: string) => `/health-logs/${userId}`,
    latest: (userId: string) => `/health-logs/${userId}/latest`,
    entry: (logId: string) => `/health-logs/entry/${logId}`,
  },
  vitals: {
    list: (userId: string) => `/vitals/${userId}`,
    summary: (userId: string) => `/vitals/${userId}/summary`,
    trend: (userId: string) => `/vitals/${userId}/trend`,
  },
  medications: {
    list: (userId: string) => `/medications/${userId}`,
    drafts: (userId: string) => `/medications/${userId}/drafts`,
    confirmDrafts: (userId: string) => `/medications/${userId}/confirm-drafts`,
    adherence: (userId: string) => `/medications/${userId}/adherence`,
    item: (userId: string, medId: string) => `/medications/${userId}/${medId}`,
  },
  dashboard: {
    linkedProfiles: '/dashboard/linked-profiles',
    summary: (userId: string) => `/dashboard/${userId}/summary`,
    alerts: (userId: string) => `/dashboard/${userId}/alerts`,
    acknowledgeAlert: (alertId: string) =>
      `/dashboard/alerts/${alertId}/acknowledge`,
  },
  summary: {
    json: (userId: string) => `/summary/${userId}`,
    pdf: (userId: string) => `/summary/${userId}/pdf`,
  },
  emergency: {
    /** Root-mounted, public — use ROOT_BASE. */
    publicProfile: (token: string) => `/emergency/${token}`,
    qr: '/neo-senior/emergency-qr',
    toggle: '/neo-senior/emergency-profile/toggle',
  },
  users: {
    fcmToken: '/users/me/fcm-token',
    data: '/users/me/data',
    delete: '/users/me',
  },
  neoSenior: {
    ownProfile: '/neo-senior/profile',
  },
} as const;
