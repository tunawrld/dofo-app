import { scopedStorage } from './scopedStorage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Task, TaskCategory } from '../types';

interface TaskState {
    tasks: Task[];
    lastDeletedTask: Task | null;
    addTask: (text: string, date: string, category?: TaskCategory) => string;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    restoreLastDeletedTask: () => void;
    updateTask: (id: string, text: string) => void;
    setReminderId: (id: string, reminderId: string | undefined, reminderDate: number | undefined) => void;
    updateCategory: (id: string, category: TaskCategory) => void;
    moveTaskToDate: (id: string, newDate: string) => void;
    reorderTasks: (date: string, orderedTasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            lastDeletedTask: null,
            addTask: (text: string, date: string, category: TaskCategory = 'none') => {
                const id = uuidv4();
                set((state: TaskState) => ({
                    tasks: [
                        ...state.tasks,
                        {
                            id,
                            text,
                            date,
                            status: 'pending',
                            createdAt: Date.now(),
                            order: Date.now(),
                            category,
                        },
                    ],
                }));
                return id;
            },
            toggleTask: (id: string) =>
                set((state: TaskState) => {
                    const taskIndex = state.tasks.findIndex((t: Task) => t.id === id);
                    if (taskIndex === -1) return { tasks: state.tasks };

                    const task = state.tasks[taskIndex];
                    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
                    const newTasks = [...state.tasks];

                    // Update status
                    newTasks[taskIndex] = { ...task, status: newStatus };

                    return { tasks: newTasks };
                }),
            deleteTask: (id: string) =>
                set((state: TaskState) => {
                    const taskToDelete = state.tasks.find((t: Task) => t.id === id);
                    if (!taskToDelete) return {};
                    return {
                        tasks: state.tasks.filter((task: Task) => task.id !== id),
                        lastDeletedTask: taskToDelete,
                    };
                }),
            restoreLastDeletedTask: () =>
                set((state: TaskState) => {
                    if (!state.lastDeletedTask) return {};
                    return {
                        tasks: [...state.tasks, state.lastDeletedTask],
                        lastDeletedTask: null,
                    };
                }),
            updateTask: (id: string, text: string) =>
                set((state: TaskState) => ({
                    tasks: state.tasks.map((task: Task) =>
                        task.id === id ? { ...task, text } : task
                    ),
                })),
            setReminderId: (id: string, reminderId: string | undefined, reminderDate: number | undefined) =>
                set((state: TaskState) => ({
                    tasks: state.tasks.map((task: Task) =>
                        task.id === id ? { ...task, reminderId, reminderDate } : task
                    ),
                })),
            updateCategory: (id: string, category: TaskCategory) =>
                set((state: TaskState) => ({
                    tasks: state.tasks.map((task: Task) =>
                        task.id === id ? { ...task, category } : task
                    ),
                })),

            moveTaskToDate: (id: string, newDate: string) =>
                set((state: TaskState) => ({
                    tasks: state.tasks.map((task: Task) =>
                        task.id === id ? { ...task, date: newDate } : task
                    ),
                })),
            reorderTasks: (date: string, orderedTasks: Task[]) =>
                set((state: TaskState) => {
                    // Assign sequential order values — do NOT touch createdAt
                    const updatedOrderedTasks = orderedTasks.map((task: Task, index: number) => ({
                        ...task,
                        order: index,
                    }));
                    const otherTasks = state.tasks.filter((t: Task) => t.date !== date);
                    return {
                        tasks: [...otherTasks, ...updatedOrderedTasks],
                    };
                }),
        }),
        {
            name: 'dofo-storage',
            storage: createJSONStorage(() => scopedStorage),
            merge: (persistedState: any, currentState: any) => {
                if (!persistedState) return { ...currentState, tasks: [], lastDeletedTask: null };
                return { ...currentState, ...persistedState };
            }
        }
    )
);
