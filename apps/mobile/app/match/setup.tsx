// Match Setup Wizard — Multi-step match creation with Gully Rules
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Alert, KeyboardAvoidingView, Platform,
  Animated, Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/Theme';
import { useMatchStore, MatchSetupData } from '@/store/matchStore';
import { MatchRules } from '@/db/schema';
import { getLatestMatchPlayers } from '@/db/queries';

type Player = { name: string; team: 'A' | 'B'; isGuest: boolean };

const PITCH_TYPES = ['rubber', 'tennis', 'hard-tennis', 'leather'] as const;
const STEPS = ['Teams', 'Rules', 'Toss', 'Review'];

export default function MatchSetupScreen() {
  const router = useRouter();
  const { startMatch } = useMatchStore();

  const [step, setStep] = useState(0);

  useEffect(() => {
    async function loadPrevPlayers() {
      try {
        const prevPlayers = await getLatestMatchPlayers();
        if (prevPlayers.length > 0) {
          setPlayers(prevPlayers.map(p => ({
            name: p.name,
            team: p.team as 'A' | 'B',
            isGuest: p.is_guest === 1
          })));
        }
      } catch (e) {
        console.error('Failed to load prev players', e);
      }
    }
    loadPrevPlayers();
  }, []);

  // Teams
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');

  // Rules
  const [overLimit, setOverLimit] = useState('6');
  const [wideExtraRun, setWideExtraRun] = useState(true);
  const [wideExtraBall, setWideExtraBall] = useState(true);
  const [noBallFreeHit, setNoBallFreeHit] = useState(false);
  const [pitchType, setPitchType] = useState<MatchRules['pitchType']>('tennis');

  // Toss
  const [tossMode, setTossMode] = useState<'manual' | 'app'>('manual');
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'A' | 'B' | null>(null);
  const [teamACalls, setTeamACalls] = useState<'heads' | 'tails'>('heads');
  const coinAnim = useRef(new Animated.Value(0)).current;

  const flipCoin = () => {
    setCoinFlipping(true);
    setCoinResult(null);
    coinAnim.setValue(0);
    Animated.timing(coinAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const isHeads = Math.random() > 0.5;
      const winner = (isHeads && teamACalls === 'heads') || (!isHeads && teamACalls === 'tails') ? 'A' : 'B';
      setCoinResult(winner);
      setTossWinner(winner);
      setCoinFlipping(false);
    });
  };

  const coinSpin = coinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1800deg'],
  });

  const teamAPlayers = players.filter(p => p.team === 'A');
  const teamBPlayers = players.filter(p => p.team === 'B');

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    setPlayers([...players, { name: newPlayerName.trim(), team: activeTeam, isGuest: true }]);
    setNewPlayerName('');
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return teamAPlayers.length >= 2 && teamBPlayers.length >= 2;
      case 1: return parseInt(overLimit) > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleStart = async () => {
    const setup: MatchSetupData = {
      teamAName: teamAName || 'Team A',
      teamBName: teamBName || 'Team B',
      rules: {
        overLimit: parseInt(overLimit) || 6,
        wideExtraRun,
        wideExtraBall,
        noBallFreeHit,
        pitchType,
      },
      tossWinner: tossWinner,
      tossDecision,
      players,
    };

    try {
      const matchId = await startMatch(setup);
      router.replace(`/match/${matchId}/live`);
    } catch (e) {
      Alert.alert('Error', 'Failed to create match');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Step Indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
              ) : (
                <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {/* STEP 0: Teams */}
        {step === 0 && (
          <>
            <Text style={styles.title}>Set Up Teams</Text>
            <Text style={styles.subtitle}>Add players to each team. Squads can be any size!</Text>

            {/* Team Names */}
            <View style={styles.teamNamesRow}>
              <View style={styles.teamNameInput}>
                <Text style={styles.inputLabel}>TEAM A</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Street Kings"
                  placeholderTextColor={Colors.textMuted}
                  value={teamAName}
                  onChangeText={setTeamAName}
                />
              </View>
              <Text style={styles.vs}>VS</Text>
              <View style={styles.teamNameInput}>
                <Text style={styles.inputLabel}>TEAM B</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Gully Boys"
                  placeholderTextColor={Colors.textMuted}
                  value={teamBName}
                  onChangeText={setTeamBName}
                />
              </View>
            </View>

            {/* Team Tabs */}
            <View style={styles.teamTabs}>
              {(['A', 'B'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.teamTab, activeTeam === t && styles.teamTabActive]}
                  onPress={() => setActiveTeam(t)}
                >
                  <Text style={[styles.teamTabText, activeTeam === t && styles.teamTabTextActive]}>
                    {t === 'A' ? (teamAName || 'Team A') : (teamBName || 'Team B')}
                    {' '}({t === 'A' ? teamAPlayers.length : teamBPlayers.length})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Player */}
            <View style={styles.addPlayerRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Player name"
                placeholderTextColor={Colors.textMuted}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                onSubmitEditing={addPlayer}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
                <Ionicons name="add" size={22} color={Colors.textInverse} />
              </TouchableOpacity>
            </View>

            {/* Player List */}
            {(activeTeam === 'A' ? teamAPlayers : teamBPlayers).map((p, i) => {
              const globalIndex = players.indexOf(p);
              return (
                <View key={i} style={styles.playerRow}>
                  <View style={styles.playerNum}>
                    <Text style={styles.playerNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <TouchableOpacity onPress={() => removePlayer(globalIndex)}>
                    <Ionicons name="close-circle" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* STEP 1: Rules */}
        {step === 1 && (
          <>
            <Text style={styles.title}>Gully Rules ⚡</Text>
            <Text style={styles.subtitle}>Customize the rules for your match</Text>

            <View style={styles.ruleCard}>
              <Text style={styles.ruleLabel}>Over Limit</Text>
              <TextInput
                style={styles.ruleInput}
                value={overLimit}
                onChangeText={setOverLimit}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            <View style={styles.ruleCard}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Wide = Extra Run?</Text>
                <Text style={styles.ruleDesc}>Each wide adds 1 run to the total</Text>
              </View>
              <Switch
                value={wideExtraRun}
                onValueChange={setWideExtraRun}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.primaryGlow }}
                thumbColor={wideExtraRun ? Colors.primary : Colors.textMuted}
              />
            </View>

            <View style={styles.ruleCard}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>Wide = Extra Ball?</Text>
                <Text style={styles.ruleDesc}>Wide doesn't count as a legal delivery</Text>
              </View>
              <Switch
                value={wideExtraBall}
                onValueChange={setWideExtraBall}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.primaryGlow }}
                thumbColor={wideExtraBall ? Colors.primary : Colors.textMuted}
              />
            </View>

            <View style={styles.ruleCard}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleLabel}>No Ball = Free Hit?</Text>
                <Text style={styles.ruleDesc}>Next ball after no-ball is a free hit</Text>
              </View>
              <Switch
                value={noBallFreeHit}
                onValueChange={setNoBallFreeHit}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.primaryGlow }}
                thumbColor={noBallFreeHit ? Colors.primary : Colors.textMuted}
              />
            </View>

            <Text style={styles.inputLabel}>PITCH TYPE</Text>
            <View style={styles.pitchRow}>
              {PITCH_TYPES.map(pt => (
                <TouchableOpacity
                  key={pt}
                  style={[styles.pitchChip, pitchType === pt && styles.pitchChipActive]}
                  onPress={() => setPitchType(pt)}
                >
                  <Text style={[styles.pitchChipText, pitchType === pt && styles.pitchChipTextActive]}>
                    {pt.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 2: Toss */}
        {step === 2 && (
          <>
            <Text style={styles.title}>Toss 🪙</Text>
            <Text style={styles.subtitle}>Do the toss in real life or flip it in the app!</Text>

            {/* Toss Mode Toggle */}
            <View style={styles.tossModeRow}>
              <TouchableOpacity
                style={[styles.tossModeBtn, tossMode === 'manual' && styles.tossModeBtnActive]}
                onPress={() => { setTossMode('manual'); setCoinResult(null); }}
              >
                <Ionicons name="hand-left-outline" size={18} color={tossMode === 'manual' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.tossModeText, tossMode === 'manual' && styles.tossModeTextActive]}>Real World</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tossModeBtn, tossMode === 'app' && styles.tossModeBtnActive]}
                onPress={() => setTossMode('app')}
              >
                <Ionicons name="phone-portrait-outline" size={18} color={tossMode === 'app' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.tossModeText, tossMode === 'app' && styles.tossModeTextActive]}>In-App Flip</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Toss */}
            {tossMode === 'manual' && (
              <>
                <Text style={styles.tossSectionLabel}>Who won the toss?</Text>
                <View style={styles.tossRow}>
                  {(['A', 'B'] as const).map(t => (
                    <TouchableOpacity key={t}
                      style={[styles.tossCard, tossWinner === t && styles.tossCardActive]}
                      onPress={() => setTossWinner(t)}>
                      <Text style={styles.tossEmoji}>🏆</Text>
                      <Text style={[styles.tossTeamName, tossWinner === t && styles.tossTeamNameActive]}>
                        {t === 'A' ? (teamAName || 'Team A') : (teamBName || 'Team B')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* In-App Coin Toss */}
            {tossMode === 'app' && (
              <>
                <Text style={styles.tossSectionLabel}>{teamAName || 'Team A'} calls...</Text>
                <View style={styles.tossRow}>
                  {(['heads', 'tails'] as const).map(c => (
                    <TouchableOpacity key={c}
                      style={[styles.tossCard, teamACalls === c && styles.tossCardActive]}
                      onPress={() => { setTeamACalls(c); setCoinResult(null); }}>
                      <Text style={styles.tossEmoji}>{c === 'heads' ? '👑' : '🦅'}</Text>
                      <Text style={[styles.tossTeamName, teamACalls === c && styles.tossTeamNameActive]}>
                        {c.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Coin */}
                <View style={styles.coinArea}>
                  <Animated.View style={[styles.coin, { transform: [{ rotateY: coinSpin }] }]}>
                    <Text style={styles.coinFace}>{coinResult ? (coinResult === 'A' ? '👑' : '🦅') : '🪙'}</Text>
                  </Animated.View>
                  {!coinFlipping && !coinResult && (
                    <TouchableOpacity style={styles.flipBtn} onPress={flipCoin}>
                      <Ionicons name="refresh" size={20} color={Colors.textInverse} />
                      <Text style={styles.flipBtnText}>Flip Coin</Text>
                    </TouchableOpacity>
                  )}
                  {coinFlipping && <Text style={styles.flippingText}>Flipping...</Text>}
                  {coinResult && (
                    <View style={styles.coinResultBox}>
                      <Text style={styles.coinResultText}>
                        🎉 {coinResult === 'A' ? (teamAName || 'Team A') : (teamBName || 'Team B')} wins the toss!
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Decision */}
            <Text style={[styles.tossSectionLabel, { marginTop: Spacing['2xl'] }]}>
              {(tossWinner === 'A' ? teamAName || 'Team A' : teamBName || 'Team B')} chose to...
            </Text>
            <View style={styles.tossRow}>
              {(['bat', 'bowl'] as const).map(d => (
                <TouchableOpacity key={d}
                  style={[styles.tossCard, tossDecision === d && styles.tossCardActive]}
                  onPress={() => setTossDecision(d)}>
                  <Text style={styles.tossEmoji}>{d === 'bat' ? '🏏' : '🎯'}</Text>
                  <Text style={[styles.tossTeamName, tossDecision === d && styles.tossTeamNameActive]}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <>
            <Text style={styles.title}>Ready to Go! 🚀</Text>
            <Text style={styles.subtitle}>Review your match settings</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>MATCH</Text>
              <Text style={styles.reviewValue}>
                {teamAName || 'Team A'} vs {teamBName || 'Team B'}
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>SQUADS</Text>
              <Text style={styles.reviewValue}>
                {teamAPlayers.length} vs {teamBPlayers.length} players
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>OVERS</Text>
              <Text style={styles.reviewValue}>{overLimit}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>RULES</Text>
              <Text style={styles.reviewValue}>
                {[
                  wideExtraRun && 'Wide +1 run',
                  wideExtraBall && 'Wide = re-bowl',
                  noBallFreeHit && 'Free hit on no-ball',
                ].filter(Boolean).join(' • ') || 'Standard'}
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>PITCH</Text>
              <Text style={styles.reviewValue}>{pitchType.replace('-', ' ')}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>TOSS</Text>
              <Text style={styles.reviewValue}>
                {tossWinner === 'A' ? teamAName || 'Team A' : teamBName || 'Team B'} won, chose to {tossDecision}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={() => step < 3 ? setStep(step + 1) : handleStart()}
          disabled={!canProceed()}
        >
          <Text style={styles.nextBtnText}>
            {step === 3 ? '🏏 Start Match' : 'Next'}
          </Text>
          {step < 3 && <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Step Indicator
  stepBar: {
    flexDirection: 'row', justifyContent: 'center',
    paddingVertical: Spacing.lg, gap: Spacing['2xl'],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepNumActive: { color: Colors.textInverse },
  stepLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  stepLabelActive: { color: Colors.primary },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.lg, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing['2xl'] },

  // Team Names
  teamNamesRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  teamNameInput: { flex: 1 },
  vs: { fontSize: 14, fontWeight: '800', color: Colors.textMuted, paddingBottom: Spacing.md },
  inputLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1, marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },

  // Team Tabs
  teamTabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  teamTab: {
    flex: 1, paddingVertical: Spacing.md,
    borderRadius: Radius.md, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  teamTabActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  teamTabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  teamTabTextActive: { color: Colors.primary },

  // Add Player
  addPlayerRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  addBtn: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  playerNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  playerNumText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  playerName: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },

  // Rules
  ruleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  ruleInfo: { flex: 1, marginRight: Spacing.md },
  ruleLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  ruleDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ruleInput: {
    width: 60, textAlign: 'center', fontSize: 20, fontWeight: '800',
    color: Colors.primary, backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md, padding: Spacing.sm,
  },
  pitchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  pitchChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  pitchChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  pitchChipText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textTransform: 'capitalize' },
  pitchChipTextActive: { color: Colors.primary },

  // Toss
  tossModeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  tossModeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    borderRadius: Radius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tossModeBtnActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  tossModeText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tossModeTextActive: { color: Colors.primary },
  tossSectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.md },
  tossRow: { flexDirection: 'row', gap: Spacing.md },
  tossCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing['2xl'], borderWidth: 2, borderColor: Colors.border,
  },
  tossCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  tossEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  tossTeamName: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  tossTeamNameActive: { color: Colors.primary },
  coinArea: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  coin: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  coinFace: { fontSize: 44 },
  flipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md, borderRadius: Radius.full,
  },
  flipBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },
  flippingText: { fontSize: 16, fontWeight: '600', color: Colors.accent },
  coinResultBox: {
    backgroundColor: Colors.primaryGlow, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.primary,
  },
  coinResultText: { fontSize: 16, fontWeight: '700', color: Colors.primary, textAlign: 'center' },

  // Review
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  reviewLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  reviewValue: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg, borderRadius: Radius.lg,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
