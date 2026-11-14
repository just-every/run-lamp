-- Preserve the directory's oldest-first pages without sorting every subscriber.
-- The id also makes equal join times stable across page sizes and requests.
CREATE INDEX IF NOT EXISTS subscribers_directory_order_idx ON subscribers(created_at, id);
