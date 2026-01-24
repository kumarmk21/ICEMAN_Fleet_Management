/*
  # Create Vehicle Documents Storage Bucket

  1. Storage Setup
    - Create a storage bucket for vehicle documents
    - Set up policies for authenticated users to upload and access files
    - File types allowed: jpg, jpeg, png, pdf
    - Max file size: 500KB (enforced in frontend)

  2. Security
    - Only authenticated users can upload documents
    - Only authenticated users can read documents
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload vehicle documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-documents');

CREATE POLICY "Authenticated users can read vehicle documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'vehicle-documents');

CREATE POLICY "Authenticated users can update vehicle documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicle-documents')
  WITH CHECK (bucket_id = 'vehicle-documents');

CREATE POLICY "Authenticated users can delete vehicle documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-documents');