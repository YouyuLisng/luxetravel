// stores/useGlobalLoading.ts
import { create } from 'zustand';

interface GlobalLoadingState {
    loading: boolean;
    show: () => void;
    hide: () => void;
}

export const useLoadingStore = create<GlobalLoadingState>((set) => ({
    loading: false,
    show: () => set({ loading: true }),
    hide: () => set({ loading: false }),
}));
