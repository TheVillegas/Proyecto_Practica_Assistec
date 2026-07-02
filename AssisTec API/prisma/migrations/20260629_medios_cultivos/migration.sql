CREATE TABLE IF NOT EXISTS "medios_cultivos" (
  "id_medio_cultivo"  SERIAL PRIMARY KEY,
  "nombre"            VARCHAR(100) NOT NULL UNIQUE,
  "descripcion"       TEXT,
  "temperatura_uso"   DECIMAL(4,1),
  "norma_relacionada" VARCHAR(50),
  "activo"            BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "medios_cultivos" ("nombre", "temperatura_uso", "norma_relacionada") VALUES
  ('Caldo Lauril simple', 35.0, 'NCh 2635/1'),
  ('Tween 80', NULL, 'NCh 2635/1');
