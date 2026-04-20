import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function FixturesScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.title}>Upcoming Fixtures</Text>
      <Text style={styles.subtitle}>No upcoming matches scheduled. Host a match to get started!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fontBold,
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
