-- 02_add_user_photo.sql
-- Agregar columna URL_FOTO a la tabla USUARIOS para soporte de perfil S3
ALTER TABLE USUARIOS
ADD COLUMN IF NOT EXISTS URL_FOTO VARCHAR(255);