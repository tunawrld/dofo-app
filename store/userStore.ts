import { create } from 'zustand';

interface UserState {
    userId: string | null;
    isSyncing: boolean;
    setUserId: (id: string | null) => void;
    setIsSyncing: (val: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
    userId: null,
    isSyncing: false,
    setUserId: (id) => set({ userId: id }),
    setIsSyncing: (val) => set({ isSyncing: val }),
}));
