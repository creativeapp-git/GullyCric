// GullyCric Match State Store (Zustand)
import { create } from 'zustand';
import {
  createMatch,
  getMatch,
  getMatchPlayers,
  recordBall,
  editBall,
  undoLastBall,
  getInningsScore,
  getCurrentOverBalls,
  getTeamPlayers,
  updateMatchStatus,
  updateMatchInnings,
  InningsScore,
} from '../db/queries';
import { getDatabase, Ball, MatchPlayer, MatchRules } from '../db/schema';

export type MatchSetupData = {
  teamAName: string;
  teamBName: string;
  rules: MatchRules;
  tossWinner: string;
  tossDecision: string;
  players: { name: string; team: 'A' | 'B'; isGuest: boolean }[];
};

type MatchState = {
  // Active match
  matchId: string | null;
  matchStatus: 'scheduled' | 'live' | 'completed' | null;
  innings: number;
  battingTeam: string;
  rules: MatchRules | null;
  teamAName: string;
  teamBName: string;

  // Current state
  score: InningsScore | null;
  currentOverBalls: Ball[];
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  battingPlayers: MatchPlayer[];
  bowlingPlayers: MatchPlayer[];
  dismissedPlayers: string[];
  currentTrajectory: { x: number; y: number }[] | null;

  // Second innings target
  target: number | null;

  // Loading
  isLoading: boolean;

  // Actions
  startMatch: (setup: MatchSetupData) => Promise<string>;
  loadMatch: (matchId: string) => Promise<void>;
  setOpeners: (strikerId: string, nonStrikerId: string) => void;
  setBowler: (bowlerId: string) => void;
  setTrajectory: (trajectory: { x: number; y: number }[] | null) => void;
  scoreBall: (params: {
    runsScored?: number;
    isWide?: boolean;
    isNoBall?: boolean;
    isBye?: boolean;
    isLegBye?: boolean;
    isWicket?: boolean;
    wicketType?: string;
    dismissedPlayerId?: string;
    newBatterId?: string;
  }) => Promise<void>;
  undo: () => Promise<void>;
  editPreviousBall: (ballId: string, updates: Partial<Ball>, reason?: string) => Promise<void>;
  switchInnings: () => Promise<void>;
  endMatch: () => Promise<void>;
  refreshScore: () => Promise<void>;
  swapStrike: () => void;
  reset: () => void;
};

const initialState = {
  matchId: null as string | null,
  matchStatus: null as 'scheduled' | 'live' | 'completed' | null,
  innings: 1,
  battingTeam: 'A',
  rules: null as MatchRules | null,
  teamAName: 'Team A',
  teamBName: 'Team B',
  score: null as InningsScore | null,
  currentOverBalls: [] as Ball[],
  strikerId: null as string | null,
  nonStrikerId: null as string | null,
  bowlerId: null as string | null,
  battingPlayers: [] as MatchPlayer[],
  bowlingPlayers: [] as MatchPlayer[],
  dismissedPlayers: [] as string[],
  currentTrajectory: null as { x: number; y: number }[] | null,
  target: null as number | null,
  isLoading: false,
};

export const useMatchStore = create<MatchState>((set, get) => ({
  ...initialState,

  startMatch: async (setup) => {
    set({ isLoading: true });
    const matchId = await createMatch(setup);
    set({ isLoading: false });
    return matchId;
  },

  loadMatch: async (matchId) => {
    set({ isLoading: true });
    const match = await getMatch(matchId);
    if (!match) { set({ isLoading: false }); return; }

    const rules: MatchRules = JSON.parse(match.rules_json);
    const battingTeam = match.current_batting_team;
    const bowlingTeam = battingTeam === 'A' ? 'B' : 'A';

    const battingPlayers = await getTeamPlayers(matchId, battingTeam);
    const bowlingPlayers = await getTeamPlayers(matchId, bowlingTeam);
    const score = await getInningsScore(matchId, match.current_innings);
    const currentOverBalls = await getCurrentOverBalls(matchId, match.current_innings);

    // If second innings, calculate target from first innings
    let target = null;
    if (match.current_innings === 2) {
      const firstInningsScore = await getInningsScore(matchId, 1);
      target = firstInningsScore.totalRuns + 1;
    }

    set({
      matchId,
      matchStatus: match.status as 'scheduled' | 'live' | 'completed',
      innings: match.current_innings,
      battingTeam,
      rules,
      teamAName: match.team_a_name,
      teamBName: match.team_b_name,
      battingPlayers,
      bowlingPlayers,
      score,
      currentOverBalls,
      target,
      isLoading: false,
    });
  },

  setOpeners: (strikerId, nonStrikerId) => {
    set({ strikerId, nonStrikerId });
  },

  setBowler: (bowlerId) => {
    set({ bowlerId });
  },

  setTrajectory: (trajectory) => set({ currentTrajectory: trajectory }),

  scoreBall: async (params) => {
    const state = get();
    if (!state.matchId || !state.strikerId || !state.bowlerId) return;

    await recordBall({
      matchId: state.matchId,
      innings: state.innings,
      batterId: state.strikerId,
      bowlerId: state.bowlerId,
      nonStrikerId: state.nonStrikerId || undefined,
      trajectory: state.currentTrajectory || undefined,
      ...params,
    });

    // Clear trajectory after recording
    set({ currentTrajectory: null });

    // Auto-rotate strike on odd runs (1, 3)
    const runs = params.runsScored || 0;
    if (runs % 2 === 1 && !params.isWide) {
      set({ strikerId: state.nonStrikerId, nonStrikerId: state.strikerId });
    }

    // If wicket, clear striker (new batter needed)
    if (params.isWicket && params.newBatterId) {
      set({ strikerId: params.newBatterId });
    } else if (params.isWicket) {
      set({ strikerId: null });
    }

    // Refresh score
    await get().refreshScore();

    // Check for target reached in 2nd innings
    const s = get();
    if (s.innings === 2 && s.score && s.target && s.score.totalRuns >= s.target) {
      await s.endMatch();
      return;
    }

    // Check for all out (total players - 1 wickets)
    if (s.score && s.score.totalWickets >= Math.max(1, s.battingPlayers.length - 1)) {
      if (s.innings === 1) {
        await s.switchInnings();
      } else {
        await s.endMatch();
      }
      return;
    }

    // Check for over completion - rotate strike at end of over
    const overBalls = await getCurrentOverBalls(s.matchId!, s.innings);
    const legalInOver = overBalls.filter(b => !b.is_wide && !b.is_no_ball).length;
    if (legalInOver === 6) {
      // Over just completed, strike rotated
      set({ strikerId: s.nonStrikerId, nonStrikerId: s.strikerId, bowlerId: null });

      // Check for over limit
      if (s.score && s.rules && parseFloat(s.score.totalOvers) >= s.rules.overLimit) {
        if (s.innings === 1) {
          await s.switchInnings();
        } else {
          await s.endMatch();
        }
      }
    }
  },

  undo: async () => {
    const state = get();
    if (!state.matchId) return;
    await undoLastBall(state.matchId, state.innings);
    await get().refreshScore();
  },

  editPreviousBall: async (ballId, updates, reason) => {
    await editBall(ballId, updates, reason);
    await get().refreshScore();
  },

  switchInnings: async () => {
    const state = get();
    if (!state.matchId) return;

    const firstInningsScore = await getInningsScore(state.matchId, 1);
    const newBattingTeam = state.battingTeam === 'A' ? 'B' : 'A';

    await updateMatchInnings(state.matchId, 2, newBattingTeam);

    const battingPlayers = await getTeamPlayers(state.matchId, newBattingTeam);
    const bowlingPlayers = await getTeamPlayers(state.matchId, state.battingTeam);

    set({
      innings: 2,
      battingTeam: newBattingTeam,
      battingPlayers,
      bowlingPlayers,
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null,
      target: firstInningsScore.totalRuns + 1,
      score: {
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: '0.0',
        runRate: '0.00',
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
      },
      currentOverBalls: [],
    });
  },

  endMatch: async () => {
    const state = get();
    if (!state.matchId) return;
    await updateMatchStatus(state.matchId, 'completed');
    set({ matchStatus: 'completed' });
  },

  refreshScore: async () => {
    const state = get();
    if (!state.matchId) return;
    const score = await getInningsScore(state.matchId, state.innings);
    const currentOverBalls = await getCurrentOverBalls(state.matchId, state.innings);
    
    // Fetch dismissed players
    const db = await getDatabase();
    const dismissals = await db.getAllAsync(
      'SELECT dismissed_player_id FROM balls WHERE match_id = ? AND innings = ? AND is_wicket = 1 AND dismissed_player_id IS NOT NULL',
      [state.matchId, state.innings]
    );
    const dismissedPlayers = (dismissals as any[]).map((d: any) => d.dismissed_player_id);

    set({ score, currentOverBalls, dismissedPlayers });
  },

  swapStrike: () => {
    const state = get();
    set({ strikerId: state.nonStrikerId, nonStrikerId: state.strikerId });
  },

  reset: () => {
    set(initialState);
  },
}));
