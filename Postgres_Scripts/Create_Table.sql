CREATE TABLE IF NOT EXISTS image_table (
    img_hash_full VARCHAR PRIMARY KEY,
    img_data BYTEA NOT NULL
);