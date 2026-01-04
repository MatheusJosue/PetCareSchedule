-- Migration: Storage Buckets and Policies
-- Created: 2026-01-03

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Bucket for pet photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos',
  'pet-photos',
  TRUE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR PET PHOTOS
-- ============================================

-- Anyone can view pet photos (public bucket)
CREATE POLICY "pet_photos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Users can upload photos for their own pets
CREATE POLICY "pet_photos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own pet photos
CREATE POLICY "pet_photos_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own pet photos
CREATE POLICY "pet_photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all pet photos
CREATE POLICY "pet_photos_admin"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'pet-photos'
    AND public.is_admin()
  );

-- ============================================
-- STORAGE POLICIES FOR AVATARS
-- ============================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
