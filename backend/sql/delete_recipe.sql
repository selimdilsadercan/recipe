-- Tarif silen fonksiyon (sadece tarifi oluşturan kullanıcı silebilir)
DROP FUNCTION IF EXISTS delete_recipe;

CREATE FUNCTION delete_recipe(
  recipe_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM recipes
  WHERE id = recipe_id_param
    AND created_user_id = user_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;
