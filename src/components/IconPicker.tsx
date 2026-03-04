import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { CATEGORIES } from '../constants/strings';

interface Props {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
  isRTL?: boolean;
}

export default function IconPicker({ value, onChange, label = 'Icon', isRTL }: Props) {
  const { theme, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const handleSelect = (icon: string) => {
    onChange(icon);
    setVisible(false);
  };

  return (
    <View style={[styles.container, { marginBottom: SPACING.md }]}>
      <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {label}
      </Text>

      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.inputBg,
            borderColor: isDark ? '#243460' : '#E8EDF8',
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}>
        <View style={[styles.iconPreview, { backgroundColor: COLORS.accent + '22' }]}>
          <Text style={styles.iconPreviewEmoji}>{value}</Text>
        </View>
        <Text style={[styles.triggerText, { color: theme.textSecondary }]}>
          Tap to change icon
        </Text>
        <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>

            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: isDark ? '#334' : '#ddd' }]} />

            {/* Header */}
            <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Choose Icon</Text>
              <TouchableOpacity onPress={() => setVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.closeTxt, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Selected preview */}
            <View style={[styles.selectedPreview, { backgroundColor: COLORS.accent + '15' }]}>
              <Text style={styles.selectedEmoji}>{value}</Text>
            </View>

            {/* Category tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
              style={styles.tabsScroll}>
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setActiveCategory(i)}
                  style={[
                    styles.tab,
                    { backgroundColor: activeCategory === i ? COLORS.accent : theme.inputBg },
                  ]}>
                  <Text style={[
                    styles.tabTxt,
                    { color: activeCategory === i ? COLORS.primary : theme.textSecondary },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Icon grid */}
            <FlatList
              data={CATEGORIES[activeCategory].icons}
              keyExtractor={(item) => item}
              numColumns={5}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: value === item ? COLORS.accent + '30' : theme.inputBg,
                      borderColor: value === item ? COLORS.accent : 'transparent',
                    },
                  ]}>
                  <Text style={styles.iconEmoji}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: 6 },
  trigger: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  iconPreview: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPreviewEmoji: { fontSize: 22 },
  triggerText: { flex: 1, fontSize: FONT_SIZE.md },
  chevron: { fontSize: 22, fontWeight: '300' },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sheetTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { fontSize: 14, fontWeight: '600' },
  selectedPreview: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  selectedEmoji: { fontSize: 36 },
  tabsScroll: { flexGrow: 0 },
  tabs: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  tabTxt: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  grid: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  iconBtn: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 28 },
});