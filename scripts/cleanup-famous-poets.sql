-- Cleanup script for famous poets before re-import
-- Run this if you want to start fresh

-- Famous poet IDs
-- 2: Hafez, 3: Khayyam, 4: Ferdowsi, 5: Molavi, 6: Nezami, 7: Saadi, 
-- 9: Attar, 10: Sanai, 11: Khaju, 12: Rudaki, 20: Owhadi, 26: Abu-Said, 28: Baba Taher

-- Option 1: Delete all data for famous poets (nuclear option)
-- WARNING: This will delete all poets, categories, and poems

/*
DELETE FROM poems WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);
DELETE FROM categories WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);
DELETE FROM poets WHERE id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);
*/

-- Option 2: Reset poem_count only (safer, just fix counts)
UPDATE categories
SET poem_count = 0
WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);

-- Option 3: Delete poems only (keep categories, re-import poems)
/*
DELETE FROM poems WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);
UPDATE categories SET poem_count = 0 WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);
*/

-- Verify cleanup
SELECT 
  'Poets' as table_name,
  COUNT(*) as count
FROM poets
WHERE id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177)

UNION ALL

SELECT 
  'Categories' as table_name,
  COUNT(*) as count
FROM categories
WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177)

UNION ALL

SELECT 
  'Poems' as table_name,
  COUNT(*) as count
FROM poems
WHERE poet_id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177);

