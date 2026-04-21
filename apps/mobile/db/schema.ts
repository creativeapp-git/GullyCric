// GullyCric SQLite Database Schema & Initialization
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('gullycric.db');
  // Enable WAL mode for concurrent reads/writes
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await initializeSchema(db);
  return db;
}

async function initializeSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      display_name TEXT,
      phone_number TEXT,
      batting_style TEXT DEFAULT 'right',
      bowling_style TEXT DEFAULT 'right-arm-medium',
      location_lat REAL,
      location_long REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      host_id TEXT,
      team_a_name TEXT DEFAULT 'Team A',
      team_b_name TEXT DEFAULT 'Team B',
      location_lat REAL,
      location_long REAL,
      status TEXT DEFAULT 'scheduled',
      is_public INTEGER DEFAULT 1,
      rules_json TEXT,
      toss_winner TEXT,
      toss_decision TEXT,
      current_innings INTEGER DEFAULT 1,
      current_batting_team TEXT DEFAULT 'A',
      short_id TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT,
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_players (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      is_guest INTEGER DEFAULT 0,
      batting_order INTEGER,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS balls (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      innings INTEGER DEFAULT 1,
      over_number INTEGER DEFAULT 0,
      ball_number INTEGER DEFAULT 0,
      batter_id TEXT NOT NULL,
      bowler_id TEXT NOT NULL,
      non_striker_id TEXT,
      runs_scored INTEGER DEFAULT 0,
      is_wide INTEGER DEFAULT 0,
      is_no_ball INTEGER DEFAULT 0,
      is_bye INTEGER DEFAULT 0,
      is_leg_bye INTEGER DEFAULT 0,
      is_wicket INTEGER DEFAULT 0,
      wicket_type TEXT,
      dismissed_player_id TEXT,
      fielder_id TEXT,
      is_edited INTEGER DEFAULT 0,
      edit_reason TEXT,
      shot_trajectory_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT
    );
  `);
}

export type MatchRules = {
  overLimit: number;
  wideExtraRun: boolean;
  wideExtraBall: boolean;
  noBallFreeHit: boolean;
  pitchType: 'rubber' | 'tennis' | 'hard-tennis' | 'leather';
};

export type MatchStatus = 'scheduled' | 'live' | 'completed';

export type Match = {
  id: string;
  host_id: string | null;
  team_a_name: string;
  team_b_name: string;
  location_lat: number | null;
  location_long: number | null;
  status: MatchStatus;
  is_public: number;
  rules_json: string;
  toss_winner: string | null;
  toss_decision: string | null;
  current_innings: number;
  current_batting_team: string;
  short_id: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};

export type MatchPlayer = {
  id: string;
  match_id: string;
  user_id: string | null;
  name: string;
  team: string;
  is_guest: number;
  batting_order: number | null;
};

export type Ball = {
  id: string;
  match_id: string;
  innings: number;
  over_number: number;
  ball_number: number;
  batter_id: string;
  bowler_id: string;
  non_striker_id: string | null;
  runs_scored: number;
  is_wide: number;
  is_no_ball: number;
  is_bye: number;
  is_leg_bye: number;
  is_wicket: number;
  wicket_type: string | null;
  dismissed_player_id: string | null;
  fielder_id: string | null;
  is_edited: number;
  edit_reason: string | null;
  shot_trajectory_json: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};
