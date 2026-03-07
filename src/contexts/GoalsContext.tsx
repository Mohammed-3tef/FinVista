import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, SavingsEntry, generateId, getTotalSaved } from '../utils/calculations';
import { clearGoalMilestones, checkAndFireMilestones } from '../services/notifications';

interface GoalsContextType {
  goals: Goal[];
  entries: SavingsEntry[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addEntry: (entry: Omit<SavingsEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, updates: Partial<SavingsEntry>) => void;
  deleteEntry: (id: string) => void;
  /** Remove all savings entries that were created by the given SMS transaction */
  deleteEntriesByTransactionId: (smsTransactionId: string) => void;
  /** Re-read goals and entries from AsyncStorage (used by pull-to-refresh) */
  reload: () => Promise<void>;
}
const GoalsContext = createContext<GoalsContextType>({} as GoalsContextType);

const GOALS_KEY = 'finvista_goals';
const ENTRIES_KEY = 'finvista_entries';

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(GOALS_KEY).then(v => { if (v) setGoals(JSON.parse(v)); });
    AsyncStorage.getItem(ENTRIES_KEY).then(v => { if (v) setEntries(JSON.parse(v)); });
  }, []);

  const saveGoals = async (data: Goal[]) => {
    setGoals(data);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(data));
  };
  const saveEntries = async (data: SavingsEntry[]) => {
    setEntries(data);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(data));
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = { ...goal, id: generateId(), createdAt: new Date().toISOString() };
    saveGoals([...goals, newGoal]);
  };
  const updateGoal = (id: string, updates: Partial<Goal>) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };
  const deleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
    saveEntries(entries.filter(e => e.goalId !== id));
    clearGoalMilestones(id); // fire-and-forget: clean up persisted milestone state
  };
  const toggleFavorite = (id: string) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
  };
  const addEntry = (entry: Omit<SavingsEntry, 'id' | 'createdAt'>) => {
    const newEntry: SavingsEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
    // Use functional updater so concurrent calls within the same render cycle
    // each append to the LATEST state, not a stale closure snapshot.
    setEntries(prev => {
      const next = [...prev, newEntry];
      AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
      return next;
    });

    // Fire milestone notifications for manual saves only.
    // SMS-originated entries (smsTransactionId set) are already handled in SmsContext.
    if (!entry.smsTransactionId) {
      const goal = goals.find(g => g.id === entry.goalId);
      if (goal) {
        const oldTotal = getTotalSaved(entries, entry.goalId);
        checkAndFireMilestones(
          goal.id,
          goal.name,
          oldTotal,
          oldTotal + entry.amount,
          goal.targetAmount,
        );
      }
    }
  };
  const updateEntry = (id: string, updates: Partial<SavingsEntry>) => {
    saveEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };
  const deleteEntry = (id: string) => {
    saveEntries(entries.filter(e => e.id !== id));
  };
  const deleteEntriesByTransactionId = (smsTransactionId: string) => {
    saveEntries(entries.filter(e => e.smsTransactionId !== smsTransactionId));
  };

  const reload = async () => {
    const [goalsVal, entriesVal] = await Promise.all([
      AsyncStorage.getItem(GOALS_KEY),
      AsyncStorage.getItem(ENTRIES_KEY),
    ]);
    if (goalsVal) setGoals(JSON.parse(goalsVal));
    if (entriesVal) setEntries(JSON.parse(entriesVal));
  };

  return (
    <GoalsContext.Provider value={{ goals, entries, addGoal, updateGoal, deleteGoal, toggleFavorite, addEntry, updateEntry, deleteEntry, deleteEntriesByTransactionId, reload }}>
      {children}
    </GoalsContext.Provider>
  );
}
export const useGoals = () => useContext(GoalsContext);
