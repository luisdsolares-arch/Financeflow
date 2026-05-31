INSERT INTO usuarios (name, email, password_hash)
VALUES ('Andrea Ruiz', 'andrea@example.com', '$2b$12$demohash')
ON CONFLICT (email) DO NOTHING;
