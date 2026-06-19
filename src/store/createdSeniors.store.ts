import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NsrCode } from '../services/types';

const KEY = 'neovot.createdSeniors';

export interface CreatedSenior {
  nsr: NsrCode;
  name: string;
  createdAt: string;
}

export interface LinkRequest {
  nsr: NsrCode;
  requestedAt: string;
}

/**
 * Locally-tracked NeoCare "pending" items the backend can't list for us:
 * - `created`: seniors this NeoCare created who haven't activated yet (share the code).
 * - `linkRequests`: existing seniors this NeoCare sent a link request to (awaiting their consent).
 * Both are reconciled away once the NSR shows up in linked-profiles (i.e. active).
 */
interface CreatedSeniorsState {
  created: CreatedSenior[];
  linkRequests: LinkRequest[];
  add: (senior: { nsr: NsrCode; name: string }) => void;
  addLinkRequest: (nsr: NsrCode) => void;
  reconcile: (linkedNsrCodes: string[]) => void;
  hydrate: () => Promise<void>;
  clear: () => void;
}

function persist(state: { created: CreatedSenior[]; linkRequests: LinkRequest[] }) {
  void AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export const useCreatedSeniors = create<CreatedSeniorsState>((set, get) => ({
  created: [],
  linkRequests: [],

  add: ({ nsr, name }) => {
    if (get().created.some((c) => c.nsr === nsr)) return;
    const created = [...get().created, { nsr, name, createdAt: new Date().toISOString() }];
    set({ created });
    persist({ created, linkRequests: get().linkRequests });
  },

  addLinkRequest: (nsr) => {
    if (get().linkRequests.some((l) => l.nsr === nsr)) return;
    const linkRequests = [...get().linkRequests, { nsr, requestedAt: new Date().toISOString() }];
    set({ linkRequests });
    persist({ created: get().created, linkRequests });
  },

  reconcile: (linkedNsrCodes) => {
    const linked = new Set(linkedNsrCodes);
    const created = get().created.filter((c) => !linked.has(c.nsr));
    const linkRequests = get().linkRequests.filter((l) => !linked.has(l.nsr));
    if (created.length !== get().created.length || linkRequests.length !== get().linkRequests.length) {
      set({ created, linkRequests });
      persist({ created, linkRequests });
    }
  },

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<CreatedSeniorsState>;
        set({ created: parsed.created ?? [], linkRequests: parsed.linkRequests ?? [] });
      } catch {
        /* ignore corrupt cache */
      }
    }
  },

  clear: () => {
    set({ created: [], linkRequests: [] });
    void AsyncStorage.removeItem(KEY);
  },
}));
