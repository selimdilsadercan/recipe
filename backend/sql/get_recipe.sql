-- Tek bir tarifinTÜM detaylarını getiren fonksiyon
DROP FUNCTION IF EXISTS get_recipe;

CREATE FUNCTION get_recipe(recipe_id_param UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  created_user_id UUID,
  ingredients JSONB,
  instructions JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    title,
    image_url,
    created_at,
    created_user_id,
    ingredients,
    instructions
  FROM recipes
  WHERE id = recipe_id_param
  LIMIT 1;
$$;
