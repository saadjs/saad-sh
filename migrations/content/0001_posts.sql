CREATE TABLE IF NOT EXISTS posts (
  slug           TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  date           TEXT NOT NULL,              -- ISO date, 'YYYY-MM-DD'
  tags           TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  image          TEXT,
  published      INTEGER NOT NULL DEFAULT 0,
  body           TEXT NOT NULL,              -- markdown
  hast           TEXT,                       -- JSON, rendered from body
  render_version INTEGER,
  created_at     TEXT NOT NULL,              -- ISO-8601 UTC
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT                        -- soft delete; NULL when live
);

CREATE INDEX IF NOT EXISTS idx_posts_published_date
  ON posts (published, date DESC);

CREATE TABLE IF NOT EXISTS drafts (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]',
  image       TEXT,
  body        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  date        TEXT NOT NULL,
  tags        TEXT NOT NULL,
  image       TEXT,
  published   INTEGER NOT NULL,
  body        TEXT NOT NULL,
  note        TEXT NOT NULL, -- 'autosave' | 'manual' | 'publish' | 'restore'
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_revisions_slug
  ON post_revisions (slug, created_at DESC);
