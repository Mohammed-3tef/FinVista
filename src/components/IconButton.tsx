import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';
import { RADIUS } from '../constants/theme';

interface Props {
  icon: string;
  onPress: () => void;
  /** Icon tint color */
  color?: string;
  /** Button background color (including opacity, e.g. COLORS.danger + '22') */
  backgroundColor?: string;
  /** Width/height of the button square. Default: 40 */
  size?: number;
  /** Icon size in dp. Default: 16 */
  iconSize?: number;
  /** Border radius. Default: RADIUS.md */
  borderRadius?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function IconButton({
  icon,
  onPress,
  color,
  backgroundColor,
  size = 40,
  iconSize = 16,
  borderRadius = RADIUS.md,
  disabled,
  style,
}: Props) {
  const btnOpacity = disabled ? 0.45 : 1;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: backgroundColor ?? 'transparent',
          opacity: btnOpacity,
        },
        style,
      ]}>
      <FontAwesomeIcon icon={resolveIcon(icon)} size={iconSize} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});
