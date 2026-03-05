import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { resolveIcon } from '../constants/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportOption {
  id: string;
  label: string;
  subtitle: string;
  icon: IconDefinition;
  iconColor: string;
  onPress: () => Promise<void> | void;
}

interface ExportBottomSheetProps {
  visible: boolean;
  title: string;
  options: ExportOption[];
  loadingId: string | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExportBottomSheet({
  visible,
  title,
  options,
  loadingId,
  onClose,
}: ExportBottomSheetProps) {
  const { theme } = useTheme();

  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 280,
          mass: 0.8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 500,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = () => {
    if (loadingId) return; // block dismiss while loading
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.card, transform: [{ translateY }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {options.map((opt, idx) => {
            const isLoading = loadingId === opt.id;
            const isDisabled = loadingId !== null && !isLoading;

            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionRow,
                  idx < options.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  },
                  isDisabled && styles.optionDisabled,
                ]}
                onPress={() => opt.onPress()}
                activeOpacity={0.65}
                disabled={!!loadingId}
              >
                {/* Icon badge */}
                <View style={[styles.iconBadge, { backgroundColor: opt.iconColor + '18' }]}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={opt.iconColor} />
                  ) : (
                    <FontAwesomeIcon icon={opt.icon} size={18} color={opt.iconColor} />
                  )}
                </View>

                {/* Label & subtitle */}
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isDisabled ? theme.textMuted : theme.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                    {isLoading ? 'Generating…' : opt.subtitle}
                  </Text>
                </View>

                {/* Arrow hint */}
                {!isLoading && (
                  <View style={[styles.arrowDot, { backgroundColor: theme.cardBorder }]}>
                    <Text style={[styles.arrowText, { color: theme.textMuted }]}>
                      <FontAwesomeIcon icon={resolveIcon('faChevronRight')} size={8} color={theme.textMuted} />
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cancel */}
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: theme.inputBg }]}
          onPress={handleClose}
          disabled={!!loadingId}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelText, { color: loadingId ? theme.textMuted : theme.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.xl + 4,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  optionsList: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 15,
  },
  arrowDot: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
  },
  cancelBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
