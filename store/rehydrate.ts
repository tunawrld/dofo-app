import { useTaskStore } from './taskStore';
import { useNotesStore } from './notesStore';
import { useMoodStore } from './moodStore';
import { useStreakStore } from './streakStore';

// Rehydrate all local stores from AsyncStorage.
// No cloud sync, no user scoping — pure local.
export const rehydrateAllStores = async () => {
    useTaskStore.setState({ tasks: [], lastDeletedTask: null });
    useNotesStore.setState({ note: '' });
    useMoodStore.setState({ moods: [] });
    useStreakStore.setState({ streakData: { currentStreak: 0, longestStreak: 0, lastCompletionDate: '' } });

    await Promise.all([
        useTaskStore.persist.rehydrate(),
        useNotesStore.persist.rehydrate(),
        useMoodStore.persist.rehydrate(),
        useStreakStore.persist.rehydrate(),
    ]);
};
