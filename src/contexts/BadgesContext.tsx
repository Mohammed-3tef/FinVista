import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  BADGE_DEFINITIONS,
  BadgeDefinition,
  EarnedBadge,
  BadgeCheckInput,
  loadEarnedBadges,
  awardBadge,
  computeEligibleBadges,
} from '../services/badges';
import { useLanguage } from './LanguageContext';
import { useGoals } from './GoalsContext';
import { getTotalSaved } from '../utils/calculations';

// ─── Context shape ────────────────────────────────────────────────────────────

interface BadgesContextType {
  /** Static metadata for every badge */
  definitions: BadgeDefinition[];
  /** Badges the user has already earned */
  earnedBadges: EarnedBadge[];
  /** Convenience: IDs the user has earned */
  earnedIds: Set<string>;
  /** IDs of badges newly unlocked in the last check (cleared after display) */
  newlyUnlocked: string[];
  /** Clear the newlyUnlocked list once the UI has shown the celebration */
  clearNewlyUnlocked: () => void;
  /**
   * Run a full badge eligibility check against current app stats.
   * Call this after any state-changing action (add goal, add entry, etc.).
   */
  checkBadges: (input: BadgeCheckInput) => Promise<void>;
  /** Reload earned badges from AsyncStorage (e.g., on pull-to-refresh) */
  reload: () => Promise<void>;
}

const BadgesContext = createContext<BadgesContextType>({} as BadgesContextType);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BadgesProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const { goals, entries } = useGoals();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  // Prevent running the check before the initial load completes
  const initialized = useRef(false);

  // Load persisted badges on mount
  useEffect(() => {
    loadEarnedBadges().then(badges => {
      setEarnedBadges(badges);
      initialized.current = true;
    });
  }, []);

  const earnedIds = new Set(earnedBadges.map(b => b.id));

  const reload = useCallback(async () => {
    const saved = await loadEarnedBadges();
    setEarnedBadges(saved);
  }, []);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  // Build BadgeCheckInput from current goals + entries
  const buildInput = useCallback((): BadgeCheckInput => {
    const totalSavedAllGoals = goals.reduce(
      (sum, g) => sum + getTotalSaved(entries, g.id),
      0,
    );
    const completedGoals = goals.filter(
      g => getTotalSaved(entries, g.id) >= g.targetAmount,
    ).length;
    const entryDates = entries
      .map(e => e.date || e.createdAt)
      .sort();

    return {
      totalGoals: goals.length,
      completedGoals,
      totalSavedAllGoals,
      totalEntries: entries.length,
      entryDates,
    };
  }, [goals, entries]);

  // Auto-check whenever goals or entries change
  useEffect(() => {
    if (!initialized.current) return;
    const input = buildInput();
    _runCheck(input);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, entries]);

  const _runCheck = useCallback(
    async (input: BadgeCheckInput) => {
      const eligible = computeEligibleBadges(input);
      let current = await loadEarnedBadges();
      const freshIds = new Set(current.map(b => b.id));
      const toAward = eligible.filter(id => !freshIds.has(id));
      if (toAward.length === 0) return;

      for (const id of toAward) {
        current = await awardBadge(id, current, language);
      }
      setEarnedBadges(current);
      setNewlyUnlocked(prev => [...prev, ...toAward]);
    },
    [language],
  );

  const checkBadges = useCallback(
    async (input: BadgeCheckInput) => {
      await _runCheck(input);
    },
    [_runCheck],
  );

  return (
    <BadgesContext.Provider
      value={{
        definitions: BADGE_DEFINITIONS,
        earnedBadges,
        earnedIds,
        newlyUnlocked,
        clearNewlyUnlocked,
        checkBadges,
        reload,
      }}>
      {children}
    </BadgesContext.Provider>
  );
}

export const useBadges = () => useContext(BadgesContext);
