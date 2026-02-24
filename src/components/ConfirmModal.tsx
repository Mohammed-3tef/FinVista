import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Button from './Button';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({ visible, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel, danger = true }: Props) {
  const { theme, isDark } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Button label={cancelLabel} onPress={onCancel} variant="outline" style={styles.btn} />
            <Button label={confirmLabel} onPress={onConfirm} variant={danger ? 'danger' : 'primary'} style={styles.btn} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: SPACING.lg },
  modal: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1 },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: SPACING.sm },
  message: { fontSize: FONT_SIZE.md, lineHeight: 22, marginBottom: SPACING.lg },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  btn: { flex: 1 },
});
