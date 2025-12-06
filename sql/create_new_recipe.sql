-- Yeni tarif oluşturan fonksiyon
DROP FUNCTION IF EXISTS create_new_recipe;

CREATE FUNCTION create_new_recipe(title_param TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO recipes (title)
  VALUES (title_param)
  RETURNING id, title, image_url, created_at;
$$;
