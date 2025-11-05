-- Ganjeh Search Database Schema for Supabase
-- This schema stores Persian poetry data for fast full-text search

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS unaccent; -- For accent-insensitive search

-- Poets table
CREATE TABLE IF NOT EXISTS poets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  poet_id INTEGER NOT NULL REFERENCES poets(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url_slug TEXT,
  poem_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poems table with full verses
CREATE TABLE IF NOT EXISTS poems (
  id INTEGER PRIMARY KEY,
  poet_id INTEGER NOT NULL REFERENCES poets(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  verses TEXT NOT NULL, -- All verses joined with spaces for search
  verses_array TEXT[], -- Individual verses for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_poets_name ON poets USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_poet_id ON categories(poet_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_title ON categories USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_poems_poet_id ON poems(poet_id);
CREATE INDEX IF NOT EXISTS idx_poems_category_id ON poems(category_id);
CREATE INDEX IF NOT EXISTS idx_poems_title ON poems USING gin(title gin_trgm_ops);

-- Full-text search indexes (GIN for fast search)
-- Using both tsvector (standard full-text) and trigram (fuzzy/typo-tolerant)
CREATE INDEX IF NOT EXISTS idx_poems_verses_fulltext ON poems USING gin(to_tsvector('simple', verses));
CREATE INDEX IF NOT EXISTS idx_poems_verses_trigram ON poems USING gin(verses gin_trgm_ops);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_poems_poet_category ON poems(poet_id, category_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_poets_updated_at BEFORE UPDATE ON poets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poems_updated_at BEFORE UPDATE ON poems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for famous poets (cache for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS famous_poets AS
SELECT p.*, COUNT(DISTINCT po.id) as poem_count
FROM poets p
LEFT JOIN poems po ON p.id = po.poet_id
GROUP BY p.id
ORDER BY p.id
LIMIT 20;

CREATE UNIQUE INDEX IF NOT EXISTS idx_famous_poets_id ON famous_poets(id);

-- Function to refresh famous poets view
CREATE OR REPLACE FUNCTION refresh_famous_poets()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY famous_poets;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE poets IS 'Persian poets metadata';
COMMENT ON TABLE categories IS 'Poem categories/collections (divan, ghazal, etc)';
COMMENT ON TABLE poems IS 'Individual poems with full verses for search';
COMMENT ON COLUMN poems.verses IS 'All verses joined as single text for full-text search';
COMMENT ON COLUMN poems.verses_array IS 'Individual verses as array for display';

