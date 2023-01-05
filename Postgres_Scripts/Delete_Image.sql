DELETE FROM public.image_table
WHERE img_hash_full = $1;