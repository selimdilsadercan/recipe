-- Tüm tarifleri döndüren fonksiyon
DROP FUNCTION IF EXISTS get_all_recipes;

CREATE FUNCTION get_all_recipes()
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    title,
    image_url,
    created_at
  FROM recipes
  ORDER BY created_at DESC;
$$;
