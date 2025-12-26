-- Yeni tarif oluşturan fonksiyon (tam versiyon)
DROP FUNCTION IF EXISTS create_new_recipe;

CREATE FUNCTION create_new_recipe(
  title_param TEXT,
  user_id_param UUID,
  ingredients_param JSONB DEFAULT NULL,
  instructions_param JSONB DEFAULT NULL,
  servings_param INTEGER DEFAULT NULL,
  prep_time_param INTEGER DEFAULT NULL,
  cook_time_param INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  created_user_id UUID,
  ingredients JSONB,
  instructions JSONB,
  servings INTEGER,
  prep_time INTEGER,
  cook_time INTEGER
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO recipes (title, created_user_id, ingredients, instructions, servings, prep_time, cook_time)
  VALUES (title_param, user_id_param, ingredients_param, instructions_param, servings_param, prep_time_param, cook_time_param)
  RETURNING id, title, image_url, created_at, created_user_id, ingredients, instructions, servings, prep_time, cook_time;
$$;
