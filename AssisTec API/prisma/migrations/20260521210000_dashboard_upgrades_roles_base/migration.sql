CREATE TABLE IF NOT EXISTS "usuario_roles" (
    "rut_usuario" VARCHAR(255) NOT NULL,
    "rol" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("rut_usuario", "rol"),
    CONSTRAINT "usuario_roles_rut_usuario_fkey"
        FOREIGN KEY ("rut_usuario") REFERENCES "usuarios"("rut_usuario")
        ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "usuario_roles" ("rut_usuario", "rol", "is_primary")
SELECT "rut_usuario", "rol_usuario", true
FROM "usuarios"
ON CONFLICT ("rut_usuario", "rol") DO NOTHING;
