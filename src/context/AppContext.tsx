import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { Goal, ThemeMode, Language, ReminderSettings } from '../constants/types';
import { Colors } from '../constants/theme';
import { translations } from '../constants/translations';

const STORAGE_KEYS = {
  GOALS: '@finvista_goals',
  THEME: '@finvista_theme',
  LANGUAGE: '@finvista_language',
  REMINDERS: '@finvista_reminders',
};

interface AppContextType {
  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'savings'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addSaving: (goalId: string, amount: number, date: string, note?: string) => void;
  deleteSaving: (goalId: string, savingId: string) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  colors: typeof Colors.light;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  isRTL: boolean;

  // Reminders
  reminderSettings: ReminderSettings;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '💍', '📱', '🎓', '💰', '🏋️', '🌴', '🏦', '🎮', '💼'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguageState] = useState<Language>('en');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    frequency: 'daily',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsData, themeData, langData, reminderData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.THEME),
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.REMINDERS),
      ]);

      if (goalsData) setGoals(JSON.parse(goalsData));
      if (themeData) setTheme(themeData as ThemeMode);
      if (langData) {
        const lang = langData as Language;
        setLanguageState(lang);
        I18nManager.forceRTL(lang === 'ar');
      }
      if (reminderData) setReminderSettings(JSON.parse(reminderData));
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const saveGoals = async (newGoals: Goal[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(newGoals));
  };

  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'savings'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      savings: [],
      emoji: GOAL_EMOJIS[Math.floor(Math.random() * GOAL_EMOJIS.length)],
    };
    setGoals(prev => {
      const updated = [newGoal, ...prev];
      saveGoals(updated);
      return updated;
    });
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals(prev => {
      const updated = prev.map(g => (g.id === id ? { ...g, ...updates } : g));
      saveGoals(updated);
      return updated;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== id);
      saveGoals(updated);
      return updated;
    });
  }, []);

  const addSaving = useCallback((goalId: string, amount: number, date: string, note?: string) => {
    const entry = {
      id: Date.now().toString(),
      amount,
      date,
      note,
    };
    setGoals(prev => {
      const updated = prev.map(g =>
        g.id === goalId ? { ...g, savings: [entry, ...g.savings] } : g,
      );
      saveGoals(updated);
      return updated;
    });
  }, []);

  const deleteSaving = useCallback((goalId: string, savingId: string) => {
    setGoals(prev => {
      const updated = prev.map(g =>
        g.id === goalId
          ? { ...g, savings: g.savings.filter(s => s.id !== savingId) }
          : g,
      );
      saveGoals(updated);
      return updated;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEYS.THEME, next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    I18nManager.forceRTL(lang === 'ar');
    AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }, []);

  const updateReminderSettings = useCallback((settings: Partial<ReminderSettings>) => {
    setReminderSettings(prev => {
      const updated = { ...prev, ...settings };
      AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const colors = theme === 'light' ? Colors.light : Colors.dark;
  const t = translations[language];
  const isRTL = language === 'ar';

  return (
    <AppContext.Provider
      value={{
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addSaving,
        deleteSaving,
        theme,
        toggleTheme,
        colors,
        language,
        setLanguage,
        t,
        isRTL,
        reminderSettings,
        updateReminderSettings,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
