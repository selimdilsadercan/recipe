-- Tarif güncelleyen fonksiyon (sadece tarifi oluşturan kullanıcı güncelleyebilir)
DROP FUNCTION IF EXISTS update_recipe;

CREATE FUNCTION update_recipe(
  recipe_id_param UUID,
  user_id_param UUID,
  title_param TEXT,
  ingredients_param JSONB,
  instructions_param JSONB
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  created_user_id UUID,
  ingredients JSONB,
  instructions JSONB
)
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  RETURN QUERY
  UPDATE recipes
  SET 
    title = title_param,
    ingredients = ingredients_param,
    instructions = instructions_param
  WHERE recipes.id = recipe_id_param
    AND recipes.created_user_id = user_id_param
  RETURNING 
    recipes.id,
    recipes.title,
    recipes.image_url,
    recipes.created_at,
    recipes.created_user_id,
    recipes.ingredients,
    recipes.instructions;
END;
$$;
