// stores/useSheetStore.ts
import { create } from 'zustand';

interface SheetStore {
    open: boolean;
    openSheet: () => void;
    closeSheet: () => void;
}

export const useSheetStore = create<SheetStore>((set) => ({
    open: false,
    openSheet: () => set({ open: true }),
    closeSheet: () => set({ open: false }),
}));
