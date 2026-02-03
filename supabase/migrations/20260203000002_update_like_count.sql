-- Add function to update like count when users like/unlike
CREATE OR REPLACE FUNCTION update_like_count(project_id TEXT, delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.projects
  SET like_count = GREATEST(0, like_count + delta)
  WHERE id = project_id::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;