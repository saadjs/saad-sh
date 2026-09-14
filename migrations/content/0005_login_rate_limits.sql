-- Atomic admission for anonymous login challenges. Expired buckets are removed
-- on the next login-options request, so the limiter has no permanent IP history.
CREATE TABLE IF NOT EXISTS login_rate_limits (
  ip         TEXT PRIMARY KEY,
  attempts   INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_rate_limits_expires_at
  ON login_rate_limits (expires_at);
