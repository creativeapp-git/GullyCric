import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { ScoreButton } from '@/components/scoring/ScoreButton';
import { InteractiveField } from '@/components/scoring/InteractiveField';

export default function LiveScoringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMatchStore();
  
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [selectType, setSelectType] = useState<'striker' | 'nonStriker' | 'bowler' | null>(null);
  const [enable2DTracking, setEnable2DTracking] = useState(false);

  // When match loads, check if we need to select openers or bowler
  useEffect(() => {
    if (!store.isLoading && store.matchId && store.matchStatus !== 'completed') {
      if (!store.strikerId || !store.nonStrikerId || !store.bowlerId) {
        setShowPlayerSelect(true);
        if (!store.strikerId) setSelectType('striker');
        else if (!store.nonStrikerId) setSelectType('nonStriker');
        else if (!store.bowlerId) setSelectType('bowler');
      } else {
        setShowPlayerSelect(false);
        setSelectType(null);
      }
    }
  }, [store.isLoading, store.matchId, store.matchStatus, store.strikerId, store.nonStrikerId, store.bowlerId]);

  const handleScore = (runs: number) => {
    store.scoreBall({ runsScored: runs });
  };

  const handleExtra = (type: 'wide' | 'noBall' | 'bye' | 'legBye') => {
    store.scoreBall({
      isWide: type === 'wide',
      isNoBall: type === 'noBall',
      isBye: type === 'bye',
      isLegBye: type === 'legBye',
    });
  };

  const handleWicket = () => {
    // In a full implementation, this would open a modal to select wicket type
    store.scoreBall({
      isWicket: true,
      wicketType: 'bowled',
      dismissedPlayerId: store.strikerId || undefined,
    });
  };

  const selectPlayer = (playerId: string) => {
    if (selectType === 'striker') {
      store.setOpeners(playerId, store.nonStrikerId!);
    } else if (selectType === 'nonStriker') {
      store.setOpeners(store.strikerId!, playerId);
    } else if (selectType === 'bowler') {
      store.setBowler(playerId);
    }
  };

  const striker = store.battingPlayers.find(p => p.id === store.strikerId);
  const nonStriker = store.battingPlayers.find(p => p.id === store.nonStrikerId);
  const bowler = store.bowlingPlayers.find(p => p.id === store.bowlerId);

  if (store.isLoading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textSecondary }}>Loading Match...</Text>
      </View>
    );
  }

  if (store.matchStatus === 'completed') {
    return (
      <View style={styles.center}>
        <Ionicons name="trophy" size={64} color={Colors.primary} style={{marginBottom: 16}} />
        <Text style={{ color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>Match Completed!</Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Check the scorecard for full stats.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Score Header */}
      <LinearGradient 
        colors={[Colors.surfaceElevated, Colors.background]} 
        style={styles.headerCard}
      >
        <View style={styles.scoreRow}>
          <Text style={styles.battingTeam}>{store.battingTeam === 'A' ? store.teamAName : store.teamBName}</Text>
          <Text style={styles.targetText}>
            {store.target ? `Target: ${store.target}` : '1st Innings'}
          </Text>
        </View>
        <View style={styles.mainScoreRow}>
          <Text style={styles.scoreText}>
            {store.score?.totalRuns}-{store.score?.totalWickets}
          </Text>
          <Text style={styles.oversText}>({store.score?.totalOvers})</Text>
        </View>
        <View style={styles.rrRow}>
          <Text style={styles.rrText}>CRR: {store.score?.runRate}</Text>
          {store.target && store.score && (
            <Text style={styles.rrText}>
              REQ: {((store.target - store.score.totalRuns) / 
                (store.rules!.overLimit - parseFloat(store.score.totalOvers))).toFixed(2)}
            </Text>
          )}
        </View>
      </LinearGradient>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Enable 2D Tracking</Text>
        <Switch
          value={enable2DTracking}
          onValueChange={setEnable2DTracking}
          trackColor={{ false: Colors.surfaceElevated, true: Colors.primary }}
          thumbColor={enable2DTracking ? '#fff' : Colors.textMuted}
        />
      </View>

      <ScrollView style={{ flex: 1 }}>
        {enable2DTracking && <InteractiveField />}

        {/* 2. Current Over Strip */}
        <View style={styles.overStripContainer}>
          <Text style={styles.sectionTitle}>This Over</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overStrip}>
            {store.currentOverBalls.length === 0 ? (
              <Text style={styles.placeholderText}>No balls bowled yet</Text>
            ) : (
              store.currentOverBalls.map((b, i) => (
                <View key={i} style={[
                  styles.ballBadge, 
                  b.is_wicket === 1 && styles.ballBadgeWicket,
                  (b.runs_scored === 4 || b.runs_scored === 6) && styles.ballBadgeBoundary
                ]}>
                  <Text style={[
                    styles.ballBadgeText,
                    b.is_wicket === 1 && styles.ballBadgeTextWicket,
                    (b.runs_scored === 4 || b.runs_scored === 6) && styles.ballBadgeTextBoundary
                  ]}>
                    {b.is_wicket === 1 ? 'W' : 
                     b.is_wide === 1 ? `${b.runs_scored + 1}Wd` : 
                     b.is_no_ball === 1 ? `${b.runs_scored + 1}Nb` : 
                     b.runs_scored}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* 3. Batting & Bowling Cards */}
        <View style={styles.playersRow}>
          <View style={styles.battingCard}>
            <View style={styles.playerRow}>
              <Text style={[styles.playerName, styles.strikerName]}>{striker?.name || 'Striker'}*</Text>
            </View>
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>{nonStriker?.name || 'Non-Striker'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.swapBtn} 
              onPress={store.swapStrike}
            >
              <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bowlingCard}>
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>{bowler?.name || 'Bowler'} (B)</Text>
            </View>
            <TouchableOpacity 
              style={styles.changeBowlerBtn} 
              onPress={() => {
                setSelectType('bowler');
                setShowPlayerSelect(true);
              }}
            >
              <Text style={styles.changeBowlerText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 4. Scoring Grid */}
      <View style={styles.scoringGrid}>
        <View style={styles.gridRow}>
          <ScoreButton label="0" type="dot" onPress={() => handleScore(0)} />
          <ScoreButton label="1" type="run" onPress={() => handleScore(1)} />
          <ScoreButton label="2" type="run" onPress={() => handleScore(2)} />
          <ScoreButton label="3" type="run" onPress={() => handleScore(3)} />
        </View>
        <View style={styles.gridRow}>
          <ScoreButton label="4" type="run" onPress={() => handleScore(4)} />
          <ScoreButton label="6" type="run" onPress={() => handleScore(6)} />
          <ScoreButton label="Wd" type="extra" onPress={() => handleExtra('wide')} />
          <ScoreButton label="Nb" type="extra" onPress={() => handleExtra('noBall')} />
        </View>
        <View style={styles.gridRow}>
          <ScoreButton label="W" type="wicket" onPress={handleWicket} />
          <ScoreButton label="LB" type="extra" onPress={() => handleExtra('legBye')} />
          <ScoreButton label="B" type="extra" onPress={() => handleExtra('bye')} />
          <ScoreButton label="Undo" type="undo" onPress={store.undo} />
        </View>
      </View>

      {/* Player Selection Modal */}
      <Modal visible={showPlayerSelect} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            Select {selectType === 'striker' ? 'Striker' : selectType === 'nonStriker' ? 'Non-Striker' : 'Bowler'}
          </Text>
          <ScrollView style={styles.playerList}>
            {(selectType === 'bowler' ? store.bowlingPlayers : store.battingPlayers).map(p => {
              const isOut = store.dismissedPlayers.includes(p.id);
              const isActive = p.id === store.strikerId || p.id === store.nonStrikerId || p.id === store.bowlerId;
              const isDisabled = isActive || (selectType !== 'bowler' && isOut);

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerItem, isDisabled && styles.playerItemDisabledBg]}
                  onPress={() => selectPlayer(p.id)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.playerItemText,
                    isDisabled && styles.playerItemDisabled
                  ]}>
                    {p.name}
                  </Text>
                  {p.id === store.strikerId && <Text style={styles.badge}>Striker</Text>}
                  {p.id === store.nonStrikerId && <Text style={styles.badge}>Non-Striker</Text>}
                  {p.id === store.bowlerId && <Text style={styles.badge}>Bowler</Text>}
                  {isOut && !isActive && selectType !== 'bowler' && <Text style={styles.badgeOut}>Out</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  // Header Score
  headerCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  battingTeam: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  targetText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  mainScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.xs },
  scoreText: { fontSize: 48, fontWeight: '900', color: Colors.textPrimary },
  oversText: { fontSize: 24, fontWeight: '600', color: Colors.textMuted },
  rrRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rrText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  // Over Strip
  overStripContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.md },
  overStrip: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  ballBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  ballBadgeBoundary: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  ballBadgeWicket: { backgroundColor: Colors.danger + '22', borderColor: Colors.danger },
  ballBadgeText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  ballBadgeTextBoundary: { color: Colors.primary },
  ballBadgeTextWicket: { color: Colors.danger },
  placeholderText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },

  // Players Row
  playersRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  battingCard: {
    flex: 1, backgroundColor: Colors.surface, padding: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    position: 'relative',
  },
  bowlingCard: {
    flex: 1, backgroundColor: Colors.surface, padding: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'space-between',
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  playerName: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  strikerName: { color: Colors.primary, fontWeight: '800' },
  swapBtn: {
    position: 'absolute', right: Spacing.md, top: '50%',
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  changeBowlerBtn: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  changeBowlerText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  // Scoring Grid
  scoringGrid: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xl },
  playerList: { flex: 1 },
  playerItem: {
    flexDirection: 'row', justifyContent: 'space-between',    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerItemDisabledBg: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.6,
  },
  playerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  playerItemDisabled: { color: Colors.textMuted },
  badge: {
    backgroundColor: Colors.primaryGlow,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  badgeOut: {
    backgroundColor: Colors.dangerGlow,
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});
