import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Button from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export default function UserNameModal({ visible, currentName, onSave, onCancel }: Props) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState(currentName);

  // Sync input when modal opens with an existing name
  useEffect(() => {
    if (visible) setName(currentName);
  }, [visible, currentName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0) onSave(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: COLORS.accent + '22' }]}>
            <FontAwesomeIcon icon={resolveIcon('faUser')} size={26} color={COLORS.accent} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {isRTL ? 'ما اسمك؟' : 'What\'s your name?'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {!isRTL ? 'We\'ll use it to personalise your dashboard greeting.' : 'سنستخدمه لتخصيص تحية لوحة القيادة الخاصة بك.'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
            placeholderTextColor={theme.textMuted}
            autoFocus
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.bg,
                borderColor: name.trim() ? COLORS.accent : theme.cardBorder,
              },
            ]}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Button label={isRTL ? 'إلغاء' : 'Cancel'} onPress={onCancel} variant="outline" style={styles.btn} />
            <Button
              label={isRTL ? 'حفظ' : 'Save'}
              onPress={handleSave}
              variant="primary"
              style={styles.btn}
              disabled={!name.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modal: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  icon: { fontSize: 26 },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  actions: { gap: SPACING.sm, width: '100%' },
  btn: { flex: 1 },
});