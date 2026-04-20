// Match Info Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '@/constants/Theme';
import { getMatch, getMatchPlayers } from '@/db/queries';
import { Match, MatchPlayer, MatchRules } from '@/db/schema';

export default function InfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    (async () => {
      const m = await getMatch(id);
      const p = await getMatchPlayers(id);
      setMatch(m); setPlayers(p);
    })();
  }, [id]));

  if (!match) return <View style={s.container}><Text style={s.loading}>Loading...</Text></View>;

  let rules: MatchRules | null = null;
  try { rules = JSON.parse(match.rules_json); } catch {}

  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.label}>STATUS</Text>
        <Text style={[s.value, { color: match.status === 'live' ? Colors.live : Colors.textPrimary }]}>
          {match.status.toUpperCase()}
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>DATE</Text>
        <Text style={s.value}>{new Date(match.created_at).toLocaleString('en-IN')}</Text>
      </View>

      {rules && (
        <View style={s.card}>
          <Text style={s.label}>RULES</Text>
          <Text style={s.value}>Overs: {rules.overLimit}</Text>
          <Text style={s.rule}>Wide = Extra Run: {rules.wideExtraRun ? '✅' : '❌'}</Text>
          <Text style={s.rule}>Wide = Extra Ball: {rules.wideExtraBall ? '✅' : '❌'}</Text>
          <Text style={s.rule}>No Ball = Free Hit: {rules.noBallFreeHit ? '✅' : '❌'}</Text>
          <Text style={s.rule}>Pitch: {rules.pitchType}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>TOSS</Text>
        <Text style={s.value}>
          {match.toss_winner === 'A' ? match.team_a_name : match.team_b_name} won, chose to {match.toss_decision}
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>{match.team_a_name} ({teamA.length})</Text>
        {teamA.map((p, i) => (
          <Text key={i} style={s.playerName}>
            {i + 1}. {p.name} {p.is_guest ? '(Guest)' : ''}
          </Text>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.label}>{match.team_b_name} ({teamB.length})</Text>
        {teamB.map((p, i) => (
          <Text key={i} style={s.playerName}>
            {i + 1}. {p.name} {p.is_guest ? '(Guest)' : ''}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { color: Colors.textMuted, textAlign: 'center', marginTop: 100 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  label: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.xs },
  value: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  rule: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  playerName: { fontSize: 14, color: Colors.textPrimary, paddingVertical: 4 },
});
