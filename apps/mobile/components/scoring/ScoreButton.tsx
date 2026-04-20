import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Typography, Shadows } from '@/constants/Theme';

interface ScoreButtonProps {
  label: string;
  type?: 'run' | 'dot' | 'wicket' | 'extra' | 'undo';
  onPress: () => void;
  disabled?: boolean;
}

export function ScoreButton({ label, type = 'run', onPress, disabled }: ScoreButtonProps) {
  const getGradientColors = (): [string, string] => {
    if (disabled) return [Colors.surfaceElevated, Colors.surface];
    switch (type) {
      case 'run': return ['#003344', '#001A22']; // Deep cyan gradient
      case 'dot': return [Colors.surfaceElevated, Colors.surface];
      case 'wicket': return ['#440011', '#220008']; // Deep crimson gradient
      case 'extra': return ['#440022', '#220011']; // Deep pink gradient
      case 'undo': return [Colors.surfaceElevated, Colors.surface];
      default: return [Colors.surface, Colors.surface];
    }
  };

  const getBorderColor = () => {
    if (disabled) return Colors.border;
    switch (type) {
      case 'run': return Colors.primary;
      case 'dot': return Colors.border;
      case 'wicket': return Colors.danger;
      case 'extra': return Colors.secondary;
      case 'undo': return Colors.border;
      default: return Colors.border;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    switch (type) {
      case 'run': return Colors.primary;
      case 'dot': return Colors.textSecondary;
      case 'wicket': return Colors.danger;
      case 'extra': return Colors.secondary;
      case 'undo': return Colors.textMuted;
      default: return Colors.textPrimary;
    }
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        disabled && styles.disabled,
        !disabled && type !== 'undo' && type !== 'dot' && Shadows.glow
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderColor: getBorderColor() }
        ]}
      >
        <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    aspectRatio: 1,
    minHeight: 64,
    margin: 4,
    borderRadius: Radius.lg,
  },
  gradient: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Typography.fontBlack,
    fontSize: 22,
  },
  disabled: {
    opacity: 0.5,
  },
});
