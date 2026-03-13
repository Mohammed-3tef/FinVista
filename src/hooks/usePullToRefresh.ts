import { useState, useCallback } from 'react';
import { RefreshControlProps } from 'react-native';

/**
 * Encapsulates pull-to-refresh state and logic.
 *
 * @param onRefresh  Async function that reloads the screen's data.
 * @param tintColor  Spinner colour — should match the active theme accent.
 * @param progressBackgroundColor  Background of the refresh indicator bubble (Android).
 *
 * @returns `refreshing` flag and `refreshProps` to spread onto a ScrollView / FlatList.
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  tintColor: string,
  progressBackgroundColor?: string,
): {
  refreshing: boolean;
  refreshProps: Pick<RefreshControlProps, 'refreshing' | 'onRefresh' | 'tintColor' | 'colors' | 'progressBackgroundColor'>;
} {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return {
    refreshing,
    refreshProps: {
      refreshing,
      onRefresh: handleRefresh,
      tintColor,
      colors: [tintColor],
      progressBackgroundColor,
    },
  };
}
