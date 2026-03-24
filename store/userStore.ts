import { create } from 'zustand';

interface UserState {
    userId: string | null;
    isSyncing: boolean;
    isSignedIn: boolean;
    setUserId: (id: string | null) => void;
    setIsSyncing: (val: boolean) => void;
    setIsSignedIn: (val: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
    userId: null,
    isSyncing: false,
    isSignedIn: false,
    setUserId: (id) => set({ userId: id }),
    setIsSyncing: (val) => set({ isSyncing: val }),
    setIsSignedIn: (val) => set({ isSignedIn: val }),
}));
