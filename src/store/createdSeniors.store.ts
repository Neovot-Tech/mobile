import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NsrCode } from '../services/types';

const KEY = 'neovot.createdSeniors';

export interface CreatedSenior {
  nsr: NsrCode;
  name: string;
  createdAt: string;
}

interface CreatedSeniorsState {
  created: CreatedSenior[];
  add: (senior: { nsr: NsrCode; name: string }) => void;
  /** Drop entries whose NSR now appears among the NeoCare's linked profiles
   *  (i.e. the senior has activated), so the "share this code" card disappears. */
  reconcile: (linkedNsrCodes: string[]) => void;
  hydrate: () => Promise<void>;
  clear: () => void;
}

function persist(created: CreatedSenior[]) {
  void AsyncStorage.setItem(KEY, JSON.stringify(created));
}

export const useCreatedSeniors = create<CreatedSeniorsState>((set, get) => ({
  created: [],

  add: ({ nsr, name }) => {
    if (get().created.some((c) => c.nsr === nsr)) return;
    const next = [...get().created, { nsr, name, createdAt: new Date().toISOString() }];
    set({ created: next });
    persist(next);
  },

  reconcile: (linkedNsrCodes) => {
    const linked = new Set(linkedNsrCodes);
    const next = get().created.filter((c) => !linked.has(c.nsr));
    if (next.length !== get().created.length) {
      set({ created: next });
      persist(next);
    }
  },

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      try {
        set({ created: JSON.parse(raw) as CreatedSenior[] });
      } catch {
        /* ignore corrupt cache */
      }
    }
  },

  clear: () => {
    set({ created: [] });
    void AsyncStorage.removeItem(KEY);
  },
}));
