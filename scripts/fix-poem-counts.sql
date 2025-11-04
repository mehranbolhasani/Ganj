-- Fix poem_count for all categories
-- This updates the poem_count column based on actual poems in the database

UPDATE categories
SET poem_count = (
  SELECT COUNT(*)
  FROM poems
  WHERE poems.category_id = categories.id
);

-- Verify the fix for Hafez (poet_id = 2)
SELECT 
  id,
  title,
  poet_id,
  poem_count,
  (SELECT COUNT(*) FROM poems WHERE poems.category_id = categories.id) as actual_count
FROM categories
WHERE poet_id = 2
ORDER BY id;

-- Summary for all famous poets
SELECT 
  p.id,
  p.name,
  COUNT(DISTINCT c.id) as category_count,
  COUNT(pm.id) as poem_count
FROM poets p
LEFT JOIN categories c ON c.poet_id = p.id
LEFT JOIN poems pm ON pm.poet_id = p.id
WHERE p.id IN (2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 26, 28, 35, 177)
GROUP BY p.id, p.name
ORDER BY p.name;

