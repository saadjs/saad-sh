-- Proof-of-consent log for newsletter double opt-in.
--
-- One row per confirmed subscription. This is the evidence trail for a GDPR
-- access request or a spam complaint: which address consented, when, and from
-- where. Rows are append-only -- a re-confirmation after unsubscribing writes a
-- new row rather than updating the old one, so the history stays intact.

CREATE TABLE IF NOT EXISTS consent_records (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  confirmed_at   TEXT NOT NULL, -- ISO-8601 UTC
  ip             TEXT,          -- CF-Connecting-IP at confirm time, null if absent
  user_agent     TEXT,
  country        TEXT,          -- CF request.cf.country
  token_issued_at TEXT          -- ISO-8601 UTC, derived from the token's exp
);

CREATE INDEX IF NOT EXISTS idx_consent_records_email
  ON consent_records (email);

CREATE INDEX IF NOT EXISTS idx_consent_records_confirmed_at
  ON consent_records (confirmed_at);

-- Single-use confirmation tokens. A token hash lands here the first time it is
-- redeemed; a second redemption of the same token is rejected as already-used.
-- `expires_at` mirrors the token's own 48h TTL so the table can be swept.
CREATE TABLE IF NOT EXISTS used_tokens (
  token_hash  TEXT PRIMARY KEY, -- SHA-256 of the token, hex. Never the raw token.
  used_at     TEXT NOT NULL,    -- ISO-8601 UTC
  expires_at  TEXT NOT NULL     -- ISO-8601 UTC
);

CREATE INDEX IF NOT EXISTS idx_used_tokens_expires_at
  ON used_tokens (expires_at);
