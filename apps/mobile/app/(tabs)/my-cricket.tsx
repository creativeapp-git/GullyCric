// GullyCric MySpace Screen — Claymorphism Aesthetic
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/Theme';
import { getMatchList } from '@/db/queries';
import { Match } from '@/db/schema';

export default function MySpaceScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    try {
      const dbMatches = await getMatchList();
      setMatches(dbMatches);
    } catch (e) {
      console.log('Error loading matches:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header (No Search) */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </View>
          <Text style={styles.greeting}>Hey there, Gully Player 👋</Text>
        </View>

        {/* History of Matches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY HISTORY</Text>
          
          {matches.length === 0 ? (
            <View style={[styles.clayCard, styles.emptyState]}>
              <Ionicons name="stats-chart" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No History</Text>
              <Text style={styles.emptySubtitle}>You haven't played any matches yet.</Text>
            </View>
          ) : (
            matches.map(match => (
              <TouchableOpacity
                key={match.id}
                style={[styles.clayCard, styles.matchCard, match.status === 'live' && styles.liveCard]}
                onPress={() => router.push(match.status === 'live' ? `/match/${match.id}/live` : `/match/${match.id}/scorecard`)}
                activeOpacity={0.8}
              >
                <View style={styles.matchCardHeader}>
                  <Text style={styles.matchTeams}>
                    {match.team_a_name} <Text style={{color: Colors.textMuted}}>vs</Text> {match.team_b_name}
                  </Text>
                </View>
                <View style={styles.matchCardFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: match.status === 'live' ? Colors.dangerGlow : Colors.surfaceElevated }]}>
                    <Text style={[styles.statusText, { color: match.status === 'live' ? Colors.danger : Colors.textSecondary }]}>
                      {match.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.matchMeta}>
                    {new Date(match.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button for Host a Match */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/match/setup')}
      >
        <Ionicons name="add" size={32} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  greeting: {
    fontFamily: Typography.fontBold,
    fontSize: 20,
    color: Colors.textPrimary,
  },

  // Clay Card Base
  clayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontBlack,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },

  // Match Cards
  matchCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  liveCard: {
    borderWidth: 1,
    borderColor: Colors.dangerGlow,
  },
  matchCardHeader: {
    marginBottom: Spacing.md,
  },
  matchTeams: {
    fontFamily: Typography.fontBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  matchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchMeta: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontFamily: Typography.fontBold,
    fontSize: 10,
    letterSpacing: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
});
