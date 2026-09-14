INSERT INTO posts (slug, title, description, date, tags, published, body, created_at, updated_at)
VALUES ('sample-post', 'Sample post', 'A local development example.', '2026-01-01', '["Development"]', 1,
'# Hello

Edit this sample in /admin.', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO posts (slug, title, description, date, tags, published, body, created_at, updated_at)
VALUES ('sample-unpublished', 'Unpublished sample', 'An unpublished local example.', '2026-01-02', '[]', 0,
'This post is not published.', '2026-01-02T00:00:00.000Z', '2026-01-02T00:00:00.000Z')
ON CONFLICT(slug) DO NOTHING;
