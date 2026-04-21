// GullyCric Database Query Functions
import { getDatabase, Match, MatchPlayer, Ball, MatchRules } from './schema';

// ─── UUID Generator ────────────────────────────────────────
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateShortId(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ─── Match Operations ──────────────────────────────────────

export async function createMatch(params: {
  teamAName: string;
  teamBName: string;
  rules: MatchRules;
  tossWinner?: string;
  tossDecision?: string;
  players: { name: string; team: 'A' | 'B'; isGuest: boolean }[];
}): Promise<string> {
  const db = await getDatabase();
  const matchId = generateId();
  const shortId = generateShortId();

  await db.runAsync(
    `INSERT INTO matches (id, short_id, team_a_name, team_b_name, rules_json, toss_winner, toss_decision, status, current_batting_team)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'live', ?)`,
    [
      matchId,
      shortId,
      params.teamAName,
      params.teamBName,
      JSON.stringify(params.rules),
      params.tossWinner || null,
      params.tossDecision || null,
      params.tossDecision === 'bat' ? params.tossWinner || 'A' : (params.tossWinner === 'A' ? 'B' : 'A'),
    ]
  );

  // Insert players
  for (let i = 0; i < params.players.length; i++) {
    const p = params.players[i];
    await db.runAsync(
      `INSERT INTO match_players (id, match_id, name, team, is_guest, batting_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId(), matchId, p.name, p.team, p.isGuest ? 1 : 0, i + 1]
    );
  }

  return matchId;
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Match>('SELECT * FROM matches WHERE id = ?', [matchId]);
}

export async function getMatchByShortId(shortId: string): Promise<Match | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Match>('SELECT * FROM matches WHERE short_id = ?', [shortId]);
}

export async function getMatchList(): Promise<Match[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Match>('SELECT * FROM matches ORDER BY created_at DESC');
}

export async function updateMatchStatus(matchId: string, status: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE matches SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, matchId]);
}

export async function updateMatchInnings(matchId: string, innings: number, battingTeam: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE matches SET current_innings = ?, current_batting_team = ?, updated_at = datetime('now') WHERE id = ?",
    [innings, battingTeam, matchId]
  );
}

// ─── Player Operations ─────────────────────────────────────

export async function getMatchPlayers(matchId: string): Promise<MatchPlayer[]> {
  const db = await getDatabase();
  return await db.getAllAsync<MatchPlayer>(
    'SELECT * FROM match_players WHERE match_id = ? ORDER BY team, batting_order',
    [matchId]
  );
}

export async function getLatestMatchPlayers(): Promise<MatchPlayer[]> {
  const db = await getDatabase();
  const lastMatch = await db.getFirstAsync<{id: string}>('SELECT id FROM matches ORDER BY created_at DESC LIMIT 1');
  if (!lastMatch) return [];
  return await db.getAllAsync<MatchPlayer>('SELECT * FROM match_players WHERE match_id = ?', [lastMatch.id]);
}

export async function getTeamPlayers(matchId: string, team: string): Promise<MatchPlayer[]> {
  const db = await getDatabase();
  return await db.getAllAsync<MatchPlayer>(
    'SELECT * FROM match_players WHERE match_id = ? AND team = ? ORDER BY batting_order',
    [matchId, team]
  );
}

// ─── Ball / Scoring Operations ─────────────────────────────

export async function recordBall(params: {
  matchId: string;
  innings: number;
  batterId: string;
  bowlerId: string;
  nonStrikerId?: string;
  runsScored?: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isBye?: boolean;
  isLegBye?: boolean;
  isWicket?: boolean;
  wicketType?: string;
  dismissedPlayerId?: string;
  trajectory?: { x: number; y: number }[];
}): Promise<Ball> {
  const db = await getDatabase();
  const ballId = generateId();

  // Get the match rules
  const match = await getMatch(params.matchId);
  if (!match) throw new Error('Match not found');
  const rules: MatchRules = JSON.parse(match.rules_json);

  // Calculate over and ball number
  const { overNumber, ballNumber } = await getNextBallPosition(
    params.matchId,
    params.innings,
    rules,
    params.isWide || false,
    params.isNoBall || false
  );

  await db.runAsync(
    `INSERT INTO balls (id, match_id, innings, over_number, ball_number, batter_id, bowler_id, non_striker_id,
      runs_scored, is_wide, is_no_ball, is_bye, is_leg_bye, is_wicket, wicket_type, dismissed_player_id, shot_trajectory_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ballId, params.matchId, params.innings, overNumber, ballNumber,
      params.batterId, params.bowlerId, params.nonStrikerId || null,
      params.runsScored || 0,
      params.isWide ? 1 : 0,
      params.isNoBall ? 1 : 0,
      params.isBye ? 1 : 0,
      params.isLegBye ? 1 : 0,
      params.isWicket ? 1 : 0,
      params.wicketType || null,
      params.dismissedPlayerId || null,
      params.trajectory ? JSON.stringify(params.trajectory) : null,
    ]
  );

  const ball = await db.getFirstAsync<Ball>('SELECT * FROM balls WHERE id = ?', [ballId]);
  return ball!;
}

async function getNextBallPosition(
  matchId: string,
  innings: number,
  rules: MatchRules,
  isWide: boolean,
  isNoBall: boolean
): Promise<{ overNumber: number; ballNumber: number }> {
  const db = await getDatabase();

  // Get the last ball
  const lastBall = await db.getFirstAsync<Ball>(
    `SELECT * FROM balls WHERE match_id = ? AND innings = ? ORDER BY over_number DESC, ball_number DESC LIMIT 1`,
    [matchId, innings]
  );

  if (!lastBall) {
    return { overNumber: 0, ballNumber: 1 };
  }

  // Count legal deliveries in current over
  const legalBallsInOver = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM balls WHERE match_id = ? AND innings = ? AND over_number = ?
     AND is_wide = 0 AND is_no_ball = 0`,
    [matchId, innings, lastBall.over_number]
  );

  // Also count wides that don't count as extra ball
  const widesNotExtraBall = rules.wideExtraBall ? 0 : await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM balls WHERE match_id = ? AND innings = ? AND over_number = ? AND is_wide = 1`,
    [matchId, innings, lastBall.over_number]
  ).then(r => r?.count || 0);

  const totalLegal = (legalBallsInOver?.count || 0) + (typeof widesNotExtraBall === 'number' ? widesNotExtraBall : 0);

  if (totalLegal >= 6) {
    // New over
    return { overNumber: lastBall.over_number + 1, ballNumber: 1 };
  }

  // Wides and no-balls: count differently based on rules
  if (isWide && rules.wideExtraBall) {
    // Extra ball granted — don't increment legal count
    return { overNumber: lastBall.over_number, ballNumber: lastBall.ball_number };
  }

  if (isNoBall) {
    // No-balls are always re-bowled
    return { overNumber: lastBall.over_number, ballNumber: lastBall.ball_number };
  }

  return { overNumber: lastBall.over_number, ballNumber: totalLegal + 1 };
}

export async function editBall(ballId: string, updates: Partial<Ball>, reason?: string): Promise<void> {
  const db = await getDatabase();
  const setClause: string[] = [];
  const values: any[] = [];

  if (updates.runs_scored !== undefined) { setClause.push('runs_scored = ?'); values.push(updates.runs_scored); }
  if (updates.is_wide !== undefined) { setClause.push('is_wide = ?'); values.push(updates.is_wide); }
  if (updates.is_no_ball !== undefined) { setClause.push('is_no_ball = ?'); values.push(updates.is_no_ball); }
  if (updates.is_wicket !== undefined) { setClause.push('is_wicket = ?'); values.push(updates.is_wicket); }
  if (updates.wicket_type !== undefined) { setClause.push('wicket_type = ?'); values.push(updates.wicket_type); }

  setClause.push('is_edited = 1');
  setClause.push('edit_reason = ?');
  values.push(reason || 'Edited by scorer');
  setClause.push("updated_at = datetime('now')");

  values.push(ballId);
  await db.runAsync(`UPDATE balls SET ${setClause.join(', ')} WHERE id = ?`, values);
}

export async function undoLastBall(matchId: string, innings: number): Promise<void> {
  const db = await getDatabase();
  const lastBall = await db.getFirstAsync<Ball>(
    'SELECT * FROM balls WHERE match_id = ? AND innings = ? ORDER BY created_at DESC LIMIT 1',
    [matchId, innings]
  );
  if (lastBall) {
    await db.runAsync('DELETE FROM balls WHERE id = ?', [lastBall.id]);
  }
}

// ─── Scorecard Queries ─────────────────────────────────────

export type InningsScore = {
  totalRuns: number;
  totalWickets: number;
  totalOvers: string;
  runRate: string;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
};

export async function getInningsScore(matchId: string, innings: number): Promise<InningsScore> {
  const db = await getDatabase();

  const match = await getMatch(matchId);
  const rules: MatchRules = match ? JSON.parse(match.rules_json) : { wideExtraRun: true };

  // Total runs scored by batters
  const batterRuns = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(runs_scored), 0) as total FROM balls
     WHERE match_id = ? AND innings = ? AND is_bye = 0 AND is_leg_bye = 0`,
    [matchId, innings]
  );

  // Wide extras
  const wideExtras = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM balls WHERE match_id = ? AND innings = ? AND is_wide = 1`,
    [matchId, innings]
  );

  // No-ball extras
  const noBallExtras = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM balls WHERE match_id = ? AND innings = ? AND is_no_ball = 1`,
    [matchId, innings]
  );

  // Bye runs
  const byeRuns = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(runs_scored), 0) as total FROM balls
     WHERE match_id = ? AND innings = ? AND is_bye = 1`,
    [matchId, innings]
  );

  // Leg bye runs
  const legByeRuns = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(runs_scored), 0) as total FROM balls
     WHERE match_id = ? AND innings = ? AND is_leg_bye = 1`,
    [matchId, innings]
  );

  // Total wickets
  const wickets = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM balls WHERE match_id = ? AND innings = ? AND is_wicket = 1`,
    [matchId, innings]
  );

  // Calculate overs (legal deliveries only)
  const legalDeliveries = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM balls WHERE match_id = ? AND innings = ?
     AND is_wide = 0 AND is_no_ball = 0`,
    [matchId, innings]
  );

  const legalCount = legalDeliveries?.count || 0;
  const completedOvers = Math.floor(legalCount / 6);
  const remainingBalls = legalCount % 6;
  const oversStr = `${completedOvers}.${remainingBalls}`;

  const wideRunsExtra = rules.wideExtraRun ? (wideExtras?.count || 0) : 0;
  const totalExtras = wideRunsExtra + (noBallExtras?.count || 0) + (byeRuns?.total || 0) + (legByeRuns?.total || 0);
  const totalRuns = (batterRuns?.total || 0) + totalExtras;

  const oversDecimal = completedOvers + remainingBalls / 6;
  const runRate = oversDecimal > 0 ? (totalRuns / oversDecimal).toFixed(2) : '0.00';

  return {
    totalRuns,
    totalWickets: wickets?.count || 0,
    totalOvers: oversStr,
    runRate,
    extras: {
      wides: wideExtras?.count || 0,
      noBalls: noBallExtras?.count || 0,
      byes: byeRuns?.total || 0,
      legByes: legByeRuns?.total || 0,
      total: totalExtras,
    },
  };
}

export type BatterScorecard = {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  isOut: boolean;
  dismissal: string;
};

export async function getBatterScorecard(matchId: string, innings: number): Promise<BatterScorecard[]> {
  const db = await getDatabase();

  // Get all batters who batted in this innings
  const batters = await db.getAllAsync<{ batter_id: string }>(
    `SELECT batter_id FROM balls WHERE match_id = ? AND innings = ?
     AND is_wide = 0 GROUP BY batter_id ORDER BY MIN(rowid)`,
    [matchId, innings]
  );

  const scorecards: BatterScorecard[] = [];

  for (const b of batters) {
    const player = await db.getFirstAsync<MatchPlayer>(
      'SELECT * FROM match_players WHERE id = ?',
      [b.batter_id]
    );

    const runs = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(runs_scored), 0) as total FROM balls
       WHERE match_id = ? AND innings = ? AND batter_id = ?
       AND is_wide = 0 AND is_bye = 0 AND is_leg_bye = 0`,
      [matchId, innings, b.batter_id]
    );

    const ballsFaced = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND batter_id = ?
       AND is_wide = 0`,
      [matchId, innings, b.batter_id]
    );

    const fours = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND batter_id = ? AND runs_scored = 4
       AND is_wide = 0 AND is_bye = 0 AND is_leg_bye = 0`,
      [matchId, innings, b.batter_id]
    );

    const sixes = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND batter_id = ? AND runs_scored = 6
       AND is_wide = 0 AND is_bye = 0 AND is_leg_bye = 0`,
      [matchId, innings, b.batter_id]
    );

    const dismissal = await db.getFirstAsync<Ball>(
      `SELECT * FROM balls
       WHERE match_id = ? AND innings = ? AND is_wicket = 1 AND dismissed_player_id = ?`,
      [matchId, innings, b.batter_id]
    );

    const totalRuns = runs?.total || 0;
    const totalBalls = ballsFaced?.count || 0;
    const sr = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : '0.0';

    scorecards.push({
      playerId: b.batter_id,
      playerName: player?.name || 'Unknown',
      runs: totalRuns,
      balls: totalBalls,
      fours: fours?.count || 0,
      sixes: sixes?.count || 0,
      strikeRate: sr,
      isOut: !!dismissal,
      dismissal: dismissal ? (dismissal.wicket_type || 'out') : 'not out',
    });
  }

  return scorecards;
}

export type BowlerScorecard = {
  playerId: string;
  playerName: string;
  overs: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: string;
};

export async function getBowlerScorecard(matchId: string, innings: number): Promise<BowlerScorecard[]> {
  const db = await getDatabase();

  const bowlers = await db.getAllAsync<{ bowler_id: string }>(
    `SELECT bowler_id FROM balls WHERE match_id = ? AND innings = ? GROUP BY bowler_id ORDER BY MIN(rowid)`,
    [matchId, innings]
  );

  const scorecards: BowlerScorecard[] = [];

  for (const b of bowlers) {
    const player = await db.getFirstAsync<MatchPlayer>(
      'SELECT * FROM match_players WHERE id = ?',
      [b.bowler_id]
    );

    const legalBalls = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND bowler_id = ?
       AND is_wide = 0 AND is_no_ball = 0`,
      [matchId, innings, b.bowler_id]
    );

    const runsConceded = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(runs_scored), 0) as total FROM balls
       WHERE match_id = ? AND innings = ? AND bowler_id = ?
       AND is_bye = 0 AND is_leg_bye = 0`,
      [matchId, innings, b.bowler_id]
    );

    // Add wide extras
    const wideRuns = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND bowler_id = ? AND is_wide = 1`,
      [matchId, innings, b.bowler_id]
    );

    const noBallRuns = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND bowler_id = ? AND is_no_ball = 1`,
      [matchId, innings, b.bowler_id]
    );

    const wickets = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM balls
       WHERE match_id = ? AND innings = ? AND bowler_id = ? AND is_wicket = 1`,
      [matchId, innings, b.bowler_id]
    );

    const legal = legalBalls?.count || 0;
    const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
    const totalRuns = (runsConceded?.total || 0) + (wideRuns?.count || 0) + (noBallRuns?.count || 0);
    const oversDecimal = Math.floor(legal / 6) + (legal % 6) / 6;
    const economy = oversDecimal > 0 ? (totalRuns / oversDecimal).toFixed(2) : '0.00';

    scorecards.push({
      playerId: b.bowler_id,
      playerName: player?.name || 'Unknown',
      overs,
      maidens: 0, // TODO: calculate maidens
      runsConceded: totalRuns,
      wickets: wickets?.count || 0,
      economy,
    });
  }

  return scorecards;
}

export async function getInningsBalls(matchId: string, innings: number): Promise<Ball[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Ball>(
    `SELECT * FROM balls WHERE match_id = ? AND innings = ? ORDER BY over_number, ball_number, created_at`,
    [matchId, innings]
  );
}

export async function getCurrentOverBalls(matchId: string, innings: number): Promise<Ball[]> {
  const db = await getDatabase();

  const lastBall = await db.getFirstAsync<Ball>(
    `SELECT * FROM balls WHERE match_id = ? AND innings = ? ORDER BY over_number DESC, created_at DESC LIMIT 1`,
    [matchId, innings]
  );

  if (!lastBall) return [];

  return await db.getAllAsync<Ball>(
    `SELECT * FROM balls WHERE match_id = ? AND innings = ? AND over_number = ? ORDER BY created_at`,
    [matchId, innings, lastBall.over_number]
  );
}

export async function getFallOfWickets(matchId: string, innings: number): Promise<{
  wicketNumber: number;
  score: number;
  overs: string;
  playerName: string;
}[]> {
  const db = await getDatabase();

  const wicketBalls = await db.getAllAsync<Ball>(
    `SELECT * FROM balls WHERE match_id = ? AND innings = ? AND is_wicket = 1 ORDER BY created_at`,
    [matchId, innings]
  );

  const results = [];
  for (let i = 0; i < wicketBalls.length; i++) {
    const wb = wicketBalls[i];
    const player = await db.getFirstAsync<MatchPlayer>(
      'SELECT * FROM match_players WHERE id = ?',
      [wb.dismissed_player_id || wb.batter_id]
    );

    // Calculate score at this wicket
    const scoreAtWicket = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(runs_scored), 0) as total FROM balls
       WHERE match_id = ? AND innings = ? AND created_at <= ?`,
      [matchId, innings, wb.created_at]
    );

    results.push({
      wicketNumber: i + 1,
      score: scoreAtWicket?.total || 0,
      overs: `${wb.over_number}.${wb.ball_number}`,
      playerName: player?.name || 'Unknown',
    });
  }

  return results;
}

export async function deleteMatch(matchId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM balls WHERE match_id = ?', [matchId]);
  await db.runAsync('DELETE FROM match_players WHERE match_id = ?', [matchId]);
  await db.runAsync('DELETE FROM matches WHERE id = ?', [matchId]);
}
