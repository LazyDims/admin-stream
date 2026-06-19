-- Create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dokumen', 'dokumen', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for 'dokumen' bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dokumen' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dokumen' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.has_role(auth.uid(), 'petugas') OR
    public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dokumen' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
