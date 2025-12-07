-- Belirli kullanıcının tariflerini döndüren fonksiyon
DROP FUNCTION IF EXISTS get_user_recipes;

CREATE FUNCTION get_user_recipes(user_id_param UUID)
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
  WHERE created_user_id = user_id_param
  ORDER BY created_at DESC;
$$;
