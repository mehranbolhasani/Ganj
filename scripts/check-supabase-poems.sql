-- Check if poems exist for Hafez (poet_id = 2)
SELECT 
  category_id,
  COUNT(*) as poem_count
FROM poems
WHERE poet_id = 2
GROUP BY category_id
ORDER BY category_id;

-- Check total poems for Hafez
SELECT COUNT(*) as total_poems
FROM poems
WHERE poet_id = 2;

-- Check sample poems
SELECT id, title, category_id
FROM poems
WHERE poet_id = 2
LIMIT 10;

