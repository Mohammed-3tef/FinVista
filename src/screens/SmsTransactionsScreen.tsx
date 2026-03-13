/**
 * SmsTransactionsScreen.tsx
 * Displays all processed bank SMS transactions with full details.
 * Supports: delete, block sender, filter by type.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  StatusBar,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSms } from '../contexts/SmsContext';
import { SmsTransaction } from '../constants/types';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

type FilterType = 'all' | 'deposit' | 'withdrawal';

export default function SmsTransactionsScreen() {
  const { theme } = useTheme();
  const { transactions, deleteTransaction, addToBlockList, blockList, scanInbox, reloadTransactions, hasPermission } = useSms();

  const { refreshProps } = usePullToRefresh(
    useCallback(async () => {
      if (hasPermission) {
        await scanInbox();
      } else {
        await reloadTransactions();
      }
    }, [hasPermission, scanInbox, reloadTransactions]),
    COLORS.accent,
    theme.card,
  );

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== 'all') list = list.filter(t => t.type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        t =>
          t.sender.toLowerCase().includes(q) ||
          t.rawMessage.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transactions, filter, search]);

  const handleDelete = (tx: SmsTransaction) => {
    Alert.alert(
      'Delete Transaction',
      `Remove this ${tx.type} of ${tx.amount.toFixed(2)} from ${tx.sender}?\n\nThis will allow it to be re-processed if scanned again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(tx.id),
        },
      ],
    );
  };

  const handleBlockSender = (sender: string) => {
    const alreadyBlocked = blockList.some(
      s => s.toLowerCase() === sender.toLowerCase(),
    );
    if (alreadyBlocked) {
      Alert.alert('Already Blocked', `"${sender}" is already on your block list.`);
      return;
    }
    Alert.alert(
      'Block Sender',
      `Add "${sender}" to your block list? Future messages from this sender will be ignored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => addToBlockList(sender),
        },
      ],
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: SmsTransaction }) => {
    const isDeposit = item.type === 'deposit';
    const isBlocked = blockList.some(
      s => s.toLowerCase() === item.sender.toLowerCase(),
    );

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderLeftColor: isDeposit ? COLORS.success : COLORS.danger,
          },
        ]}>
        {/* Top row: sender + type badge */}
        <View style={styles.cardHeader}>
          <View style={styles.senderRow}>
            <Text style={[styles.sender, { color: theme.text }]} numberOfLines={1}>
              {item.sender}
            </Text>
            {isBlocked && (
              <View style={[styles.blockedBadge, { backgroundColor: COLORS.danger + '22' }]}>
                <Text style={[styles.blockedBadgeTxt, { color: COLORS.danger }]}>Blocked</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isDeposit ? COLORS.success + '22' : COLORS.danger + '22' },
            ]}>
            <Text
              style={[
                styles.typeBadgeTxt,
                { color: isDeposit ? COLORS.success : COLORS.danger },
              ]}>
              {isDeposit ? '↓ Deposit' : '↑ Withdrawal'}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text
          style={[
            styles.amount,
            { color: isDeposit ? COLORS.success : COLORS.danger },
          ]}>
          {isDeposit ? '+' : '-'}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>

        {/* Date */}
        <Text style={[styles.date, { color: theme.textMuted }]}>
          {formatDate(item.smsDate)}
        </Text>

        {/* Message body */}
        <Text
          style={[styles.body, { color: theme.textSecondary }]}
          numberOfLines={2}>
          {item.rawMessage}
        </Text>

        {/* Allocations */}
        {item.allocations.length > 0 && (
          <View style={[styles.allocBox, { borderColor: theme.cardBorder }]}>
            <Text style={[styles.allocTitle, { color: theme.textSecondary }]}>
              Allocated to:
            </Text>
            {item.allocations.map((a, i) => (
              <View key={i} style={styles.allocRow}>
                <Text style={[styles.allocGoal, { color: theme.text }]}>
                  {a.goalName}
                </Text>
                <Text
                  style={[
                    styles.allocAmt,
                    { color: isDeposit ? COLORS.success : COLORS.danger },
                  ]}>
                  {isDeposit ? '+' : '-'}
                  {Math.abs(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleBlockSender(item.sender)}
            style={[styles.actionBtn, { borderColor: COLORS.danger + '66' }]}>
            <Text style={[styles.actionTxt, { color: COLORS.danger }]}>
              
              <FontAwesomeIcon icon={resolveIcon('faBan')} size={8} color={COLORS.danger} />
              {' '}Block Sender
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionBtn, { borderColor: theme.cardBorder }]}>
            <Text style={[styles.actionTxt, { color: theme.textMuted }]}>
              <FontAwesomeIcon icon={resolveIcon('faTrashCan')} size={8} color={theme.textMuted} />
              {' '}Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>SMS Transactions</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {filtered.length} of {transactions.length} records
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={{ color: theme.textMuted, marginRight: SPACING.xs }}>
          <FontAwesomeIcon icon={resolveIcon('faSearch')} size={14} color={theme.textSecondary} style={{ marginRight: SPACING.sm }} />
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search sender or message…"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: theme.textMuted }}>
              <FontAwesomeIcon icon={resolveIcon('faXmark')} size={14} color={theme.textMuted} />
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {(['all', 'deposit', 'withdrawal'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              { borderColor: theme.cardBorder },
              filter === f && { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
            ]}>
            <Text
              style={[
                styles.filterTxt,
                { color: filter === f ? COLORS.primary : theme.textSecondary },
              ]}>
              {f === 'all' ? 'All' : f === 'deposit' ? '↓ Deposits' : '↑ Withdrawals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshProps} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              <FontAwesomeIcon icon={resolveIcon('faInbox')} size={48} color={theme.textMuted} />
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No transactions yet
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
              Grant SMS permission and tap "Scan Inbox" in Settings to detect bank messages.
            </Text>
          </View>
        }
      />
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: 0 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  filterTxt: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.xs,
    marginRight: SPACING.sm,
  },
  sender: { fontSize: FONT_SIZE.md, fontWeight: '700', flexShrink: 1 },
  blockedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  blockedBadgeTxt: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  typeBadgeTxt: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  amount: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: 2 },
  date: { fontSize: FONT_SIZE.xs, marginBottom: SPACING.xs },
  body: { fontSize: FONT_SIZE.sm, lineHeight: 18, marginBottom: SPACING.sm },
  allocBox: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  allocTitle: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: 2 },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocGoal: { fontSize: FONT_SIZE.sm, flex: 1 },
  allocAmt: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  actionBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionTxt: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: SPACING.xl },
});
