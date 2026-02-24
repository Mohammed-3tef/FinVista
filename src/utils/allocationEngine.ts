/**
 * allocationEngine.ts
 * Pure, fully-dynamic goal allocation logic.
 *
 * Supports deposit (add money) and withdrawal (remove money) operations.
 * Priority is loaded at runtime — zero hardcoded allocation order.
 */

import { AllocationPriority, GoalAllocation } from '../constants/types';
import { Goal, SavingsEntry, getTotalSaved } from './calculations';

// ─── Priority Sorter ──────────────────────────────────────────────────────────
/**
 * Returns a comparator function for the given priority.
 * Goals are sorted so that the *first* item in the array is the one that
 * should receive money first.
 */
function buildSorter(
  priority: AllocationPriority,
): (a: Goal, b: Goal) => number {
  switch (priority) {
    case 'lowest_target_first':
      return (a, b) => a.targetAmount - b.targetAmount;

    case 'highest_target_first':
      return (a, b) => b.targetAmount - a.targetAmount;

    case 'oldest_goal_first':
      return (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    case 'newest_goal_first':
      return (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    case 'nearest_deadline_first':
      return (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

    default:
      // Exhaustive check — if a new priority is added but sorter is missing,
      // fall back to oldest-first so the app doesn't crash.
      return (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
}

// ─── Core Allocation Function ─────────────────────────────────────────────────
/**
 * Distributes `amount` across `goals` according to `priority`.
 *
 * For **deposit**: cascades through goals until the full amount is allocated
 *   or all goals are complete.
 * For **withdrawal**: cascades through goals removing money until the full
 *   amount is deducted or goals reach zero.
 *
 * @param goals       Current list of Goal objects (not mutated).
 * @param entries     All savings entries (used to calculate current balances).
 * @param amount      Positive number — the SMS transaction amount.
 * @param type        'deposit' | 'withdrawal'
 * @param priority    Selected AllocationPriority rule.
 * @returns           Array of GoalAllocation describing how much each goal receives/loses.
 */
export function allocateToGoals(
  goals: Goal[],
  entries: SavingsEntry[],
  amount: number,
  type: 'deposit' | 'withdrawal',
  priority: AllocationPriority,
): GoalAllocation[] {
  if (!goals.length || amount <= 0) return [];

  // Build snapshot of each goal's current state
  interface GoalSnapshot {
    goal: Goal;
    saved: number;
    remaining: number; // positive = needs more money; negative = over-saved (clamped to 0)
  }

  const snapshots: GoalSnapshot[] = goals.map(goal => {
    const saved = getTotalSaved(entries, goal.id);
    const remaining = Math.max(0, goal.targetAmount - saved);
    return { goal, saved, remaining };
  });

  // Sort by priority
  const sorter = buildSorter(priority);
  const sorted = [...snapshots].sort((a, b) => sorter(a.goal, b.goal));

  const result: GoalAllocation[] = [];
  let leftover = amount;

  if (type === 'deposit') {
    for (const snap of sorted) {
      if (leftover <= 0) break;
      if (snap.remaining <= 0) continue; // already completed

      const give = Math.min(snap.remaining, leftover);
      result.push({ goalId: snap.goal.id, goalName: snap.goal.name, amount: give });
      leftover -= give;
    }
  } else {
    // withdrawal — remove money starting from priority order
    for (const snap of sorted) {
      if (leftover <= 0) break;
      if (snap.saved <= 0) continue; // nothing saved here

      const take = Math.min(snap.saved, leftover);
      result.push({ goalId: snap.goal.id, goalName: snap.goal.name, amount: -take });
      leftover -= take;
    }
  }

  return result;
}

// ─── Helper: net change per goal ─────────────────────────────────────────────
/**
 * Returns a map of goalId → net amount change (positive = add, negative = deduct)
 * from a list of GoalAllocation records.
 */
export function allocationToMap(
  allocations: GoalAllocation[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of allocations) {
    map.set(a.goalId, (map.get(a.goalId) ?? 0) + a.amount);
  }
  return map;
}
