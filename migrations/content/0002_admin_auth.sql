CREATE TABLE IF NOT EXISTS credentials (
  id            TEXT PRIMARY KEY,        -- credential ID, base64url
  public_key    TEXT NOT NULL,           -- COSE public key, base64url
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT,                    -- JSON array, hints for the browser
  nickname      TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL,
  last_used_at  TEXT
);

CREATE TABLE IF NOT EXISTS auth_challenges (
  challenge  TEXT PRIMARY KEY,  -- base64url
  purpose    TEXT NOT NULL,     -- 'register' | 'authenticate'
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at
  ON auth_challenges (expires_at);

CREATE TABLE IF NOT EXISTS enrollment_tokens (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash       TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  user_agent    TEXT,
  ip            TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  at         TEXT NOT NULL,
  action     TEXT NOT NULL,
  slug       TEXT,
  detail     TEXT,
  ip         TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_at
  ON audit_log (at DESC);
