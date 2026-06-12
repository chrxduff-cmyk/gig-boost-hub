
CREATE POLICY "band-tracks public read" ON storage.objects FOR SELECT USING (bucket_id = 'band-tracks');
CREATE POLICY "band-tracks admin insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'band-tracks' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "band-tracks admin update" ON storage.objects FOR UPDATE USING (bucket_id = 'band-tracks' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "band-tracks admin delete" ON storage.objects FOR DELETE USING (bucket_id = 'band-tracks' AND has_role(auth.uid(), 'admin'::app_role));
