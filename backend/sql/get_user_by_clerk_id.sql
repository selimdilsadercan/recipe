-- Clerk ID ile kullanıcı bulan fonksiyon
DROP FUNCTION IF EXISTS get_user_by_clerk_id;

CREATE FUNCTION get_user_by_clerk_id(clerk_id_param TEXT)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    clerk_id,
    created_at
  FROM users
  WHERE clerk_id = clerk_id_param
  LIMIT 1;
$$;
