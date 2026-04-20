import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/Theme';
import { getMatch, getInningsScore, getCurrentOverBalls, InningsScore } from '@/db/queries';
import { Match, Ball } from '@/db/schema';
import { InteractiveField } from '@/components/scoring/InteractiveField';

export default function SpectatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [score, setScore] = useState<InningsScore | null>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Animation for "Live" dot
  const liveAnim = useRef(new Animated.Value(0)).current;

  const refreshData = async () => {
    if (!id) return;
    const m = await getMatch(id);
    const s = await getInningsScore(id, m?.current_innings || 1);
    const b = await getCurrentOverBalls(id, m?.current_innings || 1);
    setMatch(m);
    setScore(s);
    setBalls(b);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    // Simulate real-time polling
    const interval = setInterval(refreshData, 3000);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(liveAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [id]);

  if (loading) return (
    <View style={styles.center}>
      <Text style={styles.loadingText}>Connecting to Live Stream...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.liveStatus}>
          <Animated.View style={[styles.liveDot, { opacity: liveAnim }]} />
          <Text style={styles.liveText}>LIVE SPECTATING</Text>
        </View>
        <Text style={styles.matchCode}>CODE: {match?.short_id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Score Card */}
        <View style={[styles.clayCard, styles.scoreCard]}>
          <Text style={styles.teamNames}>
            {match?.team_a_name} vs {match?.team_b_name}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={styles.mainScore}>{score?.totalRuns}-{score?.totalWickets}</Text>
            <Text style={styles.oversText}>({score?.totalOvers})</Text>
          </View>
          <View style={styles.rrRow}>
            <Text style={styles.rrText}>CRR: {score?.runRate}</Text>
            <Text style={styles.rrText}>Innings: {match?.current_innings}</Text>
          </View>
        </View>

        {/* 2D Field View (Read Only) */}
        <View style={[styles.clayCard, styles.fieldCard]}>
          <Text style={styles.sectionTitle}>LIVE FIELD VIEW</Text>
          <View style={styles.fieldWrapper}>
            <InteractiveField 
              balls={balls}
              readOnly={true}
            />
          </View>
        </View>

        {/* Recent Balls */}
        <View style={styles.recentBalls}>
          <Text style={styles.sectionTitle}>RECENT BALLS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ballScroll}>
            {balls.slice(-6).map((ball, i) => (
              <View key={i} style={[styles.ballCircle, ball.is_wicket ? styles.wicketBall : null]}>
                <Text style={[styles.ballText, ball.is_wicket ? styles.wicketText : null]}>
                  {ball.is_wicket ? 'W' : ball.runs_scored}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.clayCard, styles.infoCard]}>
          <Ionicons name="eye-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>You are watching this match in real-time.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { fontFamily: Typography.fontBold, color: Colors.textSecondary },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  backBtn: { padding: 4 },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dangerGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  liveText: { fontFamily: Typography.fontBlack, fontSize: 10, color: Colors.danger },
  matchCode: { fontFamily: Typography.fontBold, fontSize: 12, color: Colors.textMuted },

  scrollContent: { padding: Spacing.lg, gap: Spacing.lg },

  clayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },

  scoreCard: { alignItems: 'center' },
  teamNames: { fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textSecondary, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  mainScore: { fontFamily: Typography.fontBlack, fontSize: 48, color: Colors.textPrimary },
  oversText: { fontFamily: Typography.fontBold, fontSize: 20, color: Colors.textSecondary },
  rrRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  rrText: { fontFamily: Typography.fontFamily, fontSize: 14, color: Colors.textMuted },

  fieldCard: { padding: 0, overflow: 'hidden' },
  fieldWrapper: { height: 350, width: '100%' },

  sectionTitle: { 
    fontFamily: Typography.fontBlack, 
    fontSize: 12, 
    color: Colors.textMuted, 
    letterSpacing: 1, 
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },

  recentBalls: { marginBottom: Spacing.md },
  ballScroll: { flexDirection: 'row' },
  ballCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ballText: { fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textPrimary },
  wicketBall: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  wicketText: { color: Colors.textInverse },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    borderWidth: 1,
    padding: Spacing.md,
  },
  infoText: { fontFamily: Typography.fontFamily, fontSize: 13, color: Colors.primary, flex: 1 },
});
