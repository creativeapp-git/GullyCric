import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            // The RootLayout will handle the redirect
          }
        },
      ]
    );
  };

  const SettingItem = ({ icon, label, value, onPress, color = Colors.textPrimary }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceElevated }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.itemLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={[styles.clayCard, styles.profileCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Gully Player'}</Text>
          <Text style={styles.profileContact}>{user?.email || user?.phone || 'No contact info'}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Settings Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.clayCard}>
          <SettingItem icon="notifications-outline" label="Notifications" value="On" />
          <SettingItem icon="color-palette-outline" label="Theme" value="Light Clay" />
          <SettingItem icon="language-outline" label="Language" value="English" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.clayCard}>
          <SettingItem icon="shield-checkmark-outline" label="Privacy & Security" />
          <SettingItem icon="cloud-upload-outline" label="Data Sync" value="Manual" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>APP</Text>
        <View style={styles.clayCard}>
          <SettingItem icon="information-circle-outline" label="About GullyCric" />
          <SettingItem icon="star-outline" label="Rate the App" />
          <SettingItem icon="help-circle-outline" label="Help & Support" />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.clayCard, styles.logoutCard]} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
        <Text style={styles.logoutText}>Logout from Device</Text>
      </TouchableOpacity>

      <Text style={styles.version}>GullyCric v1.0.4 - Premium Edition</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  
  clayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  avatarText: {
    fontFamily: Typography.fontBlack,
    fontSize: 24,
    color: Colors.textInverse,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontFamily: Typography.fontBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  profileContact: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontBlack,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },

  // Items
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontFamily: Typography.fontBold,
    fontSize: 16,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemValue: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Logout
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  logoutText: {
    fontFamily: Typography.fontBold,
    fontSize: 16,
    color: Colors.danger,
  },
  version: {
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xl,
  },
});
