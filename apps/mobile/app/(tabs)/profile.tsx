// Profile Screen — Basic profile placeholder
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/Theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.name}>Gully Cricketer</Text>
        <Text style={styles.handle}>@local_player</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Matches', value: '—' },
          { label: 'Runs', value: '—' },
          { label: 'Wickets', value: '—' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings List */}
      <View style={styles.settingsSection}>
        {[
          { icon: 'person-circle-outline' as const, label: 'Edit Profile' },
            { icon: 'baseball-outline' as const, label: 'Batting Style' },
            { icon: 'settings-outline' as const, label: 'Settings' },
            { icon: 'information-circle-outline' as const, label: 'About GullyCric' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.settingRow} activeOpacity={0.7}>
            <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>GullyCric v1.0.0 — Built for the streets 🏏</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2, borderColor: Colors.primary,
  },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  handle: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  settingsSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  version: {
    textAlign: 'center', fontSize: 12, color: Colors.textMuted,
    marginTop: 'auto', paddingVertical: Spacing['2xl'],
  },
});
