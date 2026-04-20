import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/Theme';
import { getMatchList, getMatchByShortId } from '@/db/queries';
import { Match } from '@/db/schema';

export default function HomeScreen() {
  const router = useRouter();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [range, setRange] = useState(10);

  const loadMatches = useCallback(async () => {
    try {
      const matches = await getMatchList();
      setRecentMatches(matches);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        </View>
        <Text style={styles.greeting}>Hey there, Gully Player 👋</Text>
      </View>

      {/* Search & Location Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.clayCard, styles.searchBar]}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Enter Match Code (e.g. A1B2C3)" 
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text.toUpperCase());
              if (text.length === 6) {
                // Auto-search if code length is reached
                (async () => {
                  const match = await getMatchByShortId(text.toUpperCase());
                  if (match) {
                    router.push(`/match/spectate/${match.id}` as any);
                  }
                })();
              }
            }}
            maxLength={6}
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity 
          style={[styles.clayCard, styles.locationBtn]}
          onPress={() => setShowLocationModal(true)}
        >
          <Ionicons name="location" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.clayCard, styles.modalContent]}>
            <Text style={styles.modalTitle}>Find matches nearby</Text>
            <Text style={styles.modalSubtitle}>Select range from your location</Text>
            
            <View style={styles.rangeRow}>
              {[5, 10, 20, 50].map((r) => (
                <TouchableOpacity 
                  key={r}
                  style={[styles.rangeOption, range === r && styles.rangeOptionActive]}
                  onPress={() => setRange(r)}
                >
                  <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}km</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Matches List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LATEST MATCHES</Text>
        
        {recentMatches.length === 0 ? (
          <View style={[styles.clayCard, styles.emptyState]}>
            <Ionicons name="tennisball-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptySubtitle}>Go to MySpace to host your first match!</Text>
          </View>
        ) : (
          recentMatches.map(match => (
            <TouchableOpacity
              key={match.id}
              style={[styles.clayCard, styles.matchCard]}
              onPress={() => router.push(match.status === 'live' ? `/match/${match.id}/live` : `/match/${match.id}/scorecard`)}
              activeOpacity={0.8}
            >
              <View style={styles.matchCardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: match.status === 'live' ? Colors.dangerGlow : Colors.primaryGlow }]}>
                  {match.status === 'live' && <View style={styles.liveBadgeDot} />}
                  <Text style={[styles.statusText, { color: match.status === 'live' ? Colors.danger : Colors.primary }]}>
                    {match.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.matchMeta}>
                  {new Date(match.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.matchTeams}>
                {match.team_a_name} <Text style={{color: Colors.textMuted}}>vs</Text> {match.team_b_name}
              </Text>
              <Text style={styles.matchSubText}>
                Innings {match.current_innings} • {match.status === 'live' ? 'Playing now' : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderRadius: Radius.full,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  locationBtn: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  rangeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rangeOptionActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  rangeText: {
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
  },
  rangeTextActive: {
    color: Colors.primary,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Shadows.glow,
  },
  applyBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 16,
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
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  matchTeams: {
    fontFamily: Typography.fontBold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  matchSubText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  matchMeta: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
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
});
