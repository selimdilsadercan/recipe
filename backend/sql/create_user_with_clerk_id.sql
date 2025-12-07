-- Yeni kullanıcı oluşturan veya mevcut olanı döndüren fonksiyon (Clerk ID ile)
DROP FUNCTION IF EXISTS create_user_with_clerk_id;

CREATE FUNCTION create_user_with_clerk_id(clerk_id_param TEXT)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO users (clerk_id)
  VALUES (clerk_id_param)
  ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = EXCLUDED.clerk_id
  RETURNING id, clerk_id, created_at;
$$;
