INSERT INTO public.image_table (img_hash_full, img_data) 
VALUES ($1, $2) 
ON CONFLICT (img_hash_full) DO NOTHING
RETURNING img_hash_full