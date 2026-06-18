import { create } from 'zustand';
import { LinkedProfile } from '../services/dashboard.service';

/** Which linked NeoSenior the NeoCare is currently viewing — shared across the
 *  Dashboard / Health / Summary tabs so the selection stays consistent. */
interface SelectedSeniorState {
  senior: LinkedProfile | null;
  setSenior: (senior: LinkedProfile | null) => void;
}

export const useSelectedSenior = create<SelectedSeniorState>((set) => ({
  senior: null,
  setSenior: (senior) => set({ senior }),
}));
