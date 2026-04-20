// Scorecard View
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { 
  getBatterScorecard, 
  getBowlerScorecard, 
  getInningsScore, 
  getMatch,
  BatterScorecard, 
  BowlerScorecard, 
  InningsScore 
} from '@/db/queries';
import { Match } from '@/db/schema';

export default function ScorecardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [activeInnings, setActiveInnings] = useState(1);
  const [batters, setBatters] = useState<BatterScorecard[]>([]);
  const [bowlers, setBowlers] = useState<BowlerScorecard[]>([]);
  const [score, setScore] = useState<InningsScore | null>(null);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    (async () => {
      const m = await getMatch(id);
      setMatch(m);
      
      const s = await getInningsScore(id, activeInnings);
      const b = await getBatterScorecard(id, activeInnings);
      const bw = await getBowlerScorecard(id, activeInnings);
      setScore(s); setBatters(b); setBowlers(bw);
    })();
  }, [id, activeInnings]));

  const battingTeamName = activeInnings === 1
    ? (match?.team_a_name || 'Team A') : (match?.team_b_name || 'Team B');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Innings Toggle */}
      <View style={styles.inningsToggle}>
        {[1, 2].map(i => (
          <Text key={i}
            style={[styles.inningsTab, activeInnings === i && styles.inningsTabActive]}
            onPress={() => setActiveInnings(i)}>
            {i === 1 ? 'Innings 1' : 'Innings 2'}
          </Text>
        ))}
      </View>

      {/* Score Summary */}
      {score && (
        <View style={styles.scoreSummary}>
          <Text style={styles.summaryTeam}>{battingTeamName}</Text>
          <Text style={styles.summaryScore}>{score.totalRuns}/{score.totalWickets}</Text>
          <Text style={styles.summaryOvers}>({score.totalOvers} ov, RR: {score.runRate})</Text>
        </View>
      )}

      {/* Batting Table */}
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>BATTING</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Batter</Text>
          <Text style={styles.th}>R</Text>
          <Text style={styles.th}>B</Text>
          <Text style={styles.th}>4s</Text>
          <Text style={styles.th}>6s</Text>
          <Text style={styles.th}>SR</Text>
        </View>
        {batters.map((b, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.tdName}>{b.playerName}</Text>
              <Text style={styles.tdDismissal}>{b.dismissal}</Text>
            </View>
            <Text style={[styles.td, styles.tdBold]}>{b.runs}</Text>
            <Text style={styles.td}>{b.balls}</Text>
            <Text style={styles.td}>{b.fours}</Text>
            <Text style={styles.td}>{b.sixes}</Text>
            <Text style={styles.td}>{b.strikeRate}</Text>
          </View>
        ))}
        {batters.length === 0 && <Text style={styles.noData}>No batting data</Text>}
      </View>

      {/* Extras */}
      {score && (
        <View style={styles.extrasRow}>
          <Text style={styles.extrasLabel}>Extras: {score.extras.total}</Text>
          <Text style={styles.extrasDetail}>
            (w {score.extras.wides}, nb {score.extras.noBalls}, b {score.extras.byes}, lb {score.extras.legByes})
          </Text>
        </View>
      )}

      {/* Bowling Table */}
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>BOWLING</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Bowler</Text>
          <Text style={styles.th}>O</Text>
          <Text style={styles.th}>R</Text>
          <Text style={styles.th}>W</Text>
          <Text style={styles.th}>Econ</Text>
        </View>
        {bowlers.map((b, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tdName, { flex: 2 }]}>{b.playerName}</Text>
            <Text style={styles.td}>{b.overs}</Text>
            <Text style={styles.td}>{b.runsConceded}</Text>
            <Text style={[styles.td, styles.tdBold]}>{b.wickets}</Text>
            <Text style={styles.td}>{b.economy}</Text>
          </View>
        ))}
        {bowlers.length === 0 && <Text style={styles.noData}>No bowling data</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inningsToggle: {
    flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm,
  },
  inningsTab: {
    flex: 1, textAlign: 'center', paddingVertical: Spacing.md,
    borderRadius: Radius.md, fontSize: 13, fontWeight: '700',
    color: Colors.textMuted, backgroundColor: Colors.surface,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  inningsTabActive: {
    color: Colors.primary, backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  scoreSummary: {
    alignItems: 'center', padding: Spacing.lg,
  },
  summaryTeam: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  summaryScore: { fontSize: 40, fontWeight: '900', color: Colors.textPrimary },
  summaryOvers: { fontSize: 14, color: Colors.textSecondary },
  tableCard: {
    margin: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  tableTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm },
  tableHeader: {
    flexDirection: 'row', paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  th: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tdName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  tdDismissal: { fontSize: 11, color: Colors.textMuted },
  td: { flex: 1, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  tdBold: { fontWeight: '800', color: Colors.textPrimary },
  noData: { textAlign: 'center', color: Colors.textMuted, padding: Spacing.lg },
  extrasRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  extrasLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  extrasDetail: { fontSize: 13, color: Colors.textMuted },
});
