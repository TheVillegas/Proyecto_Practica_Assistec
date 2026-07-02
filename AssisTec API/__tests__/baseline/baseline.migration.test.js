const fs = require('fs');
const path = require('path');

describe('Baseline migration (Phase 1)', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const prismaDir = path.join(repoRoot, 'prisma');
  const migrationsDir = path.join(prismaDir, 'migrations');
  const baselineName = '0_baseline_20260521000000';
  const baselineDir = path.join(migrationsDir, baselineName);
  const migrationFile = path.join(baselineDir, 'migration.sql');
  const lockFile = path.join(migrationsDir, 'migration_lock.toml');
  const schemaFile = path.join(prismaDir, 'schema.prisma');

  function parseSchemaTables() {
    const schema = fs.readFileSync(schemaFile, 'utf8');
    const modelRegex = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
    const tables = [];

    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      const modelName = match[1];
      const body = match[2];
      const mapMatch = body.match(/@@map\("([^"]+)"\)/);
      tables.push(mapMatch ? mapMatch[1] : modelName);
    }

    return tables;
  }

  describe('1.1 baseline SQL generation', () => {
    test('baseline migration file exists and is non-empty', () => {
      expect(fs.existsSync(migrationFile)).toBe(true);
      const stats = fs.statSync(migrationFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('baseline SQL contains CREATE TABLE for every Prisma model', () => {
      const tables = parseSchemaTables();
      const sql = fs.readFileSync(migrationFile, 'utf8');

      expect(tables.length).toBeGreaterThanOrEqual(40);

      for (const table of tables) {
        expect(sql).toMatch(new RegExp(`CREATE TABLE "${table}"`));
      }
    });

    test('baseline SQL starts with public schema creation', () => {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS "public"/);
    });
  });

  describe('1.2 scope correctness review', () => {
    test('excluded legacy TPA_ETAPA and RAM_ETAPA tables are absent', () => {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      expect(sql).not.toMatch(/TPA_ETAPA/i);
      expect(sql).not.toMatch(/RAM_ETAPA/i);
    });

    test('table names use snake_case maps from schema.prisma', () => {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      expect(sql).toMatch(/CREATE TABLE "usuarios"/);
      expect(sql).toMatch(/CREATE TABLE "muestras_ali"/);
      expect(sql).not.toMatch(/CREATE TABLE "USUARIOS"/);
      expect(sql).not.toMatch(/CREATE TABLE "MUESTRAS_ALI"/);
    });

    test('foreign key references are valid and present', () => {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      const fkCount = (sql.match(/ADD CONSTRAINT\s+"[^"]+"\s+FOREIGN KEY/g) || []).length;

      expect(fkCount).toBeGreaterThan(0);
      expect(sql).toMatch(/REFERENCES "usuarios"\("rut_usuario"\)/);
      expect(sql).toMatch(/REFERENCES "muestras_ali"\("codigo_ali"\)/);
    });
  });

  describe('1.3 bridge objects appended', () => {
    test('ali_imagenes table is defined with FK to muestras_ali', () => {
      const sql = fs.readFileSync(migrationFile, 'utf8');

      expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS ali_imagenes/i);
      expect(sql).toMatch(/id_imagen/i);
      expect(sql).toMatch(/codigo_ali/i);
      expect(sql).toMatch(/url_imagen/i);
      expect(sql).toMatch(/tipo_imagen/i);
      expect(sql).toMatch(/REFERENCES muestras_ali\(codigo_ali\)/i);
    });

    test('v_catalogo_unificado view unions instrumentos and micropipetas', () => {
      const sql = fs.readFileSync(migrationFile, 'utf8');

      expect(sql).toMatch(/CREATE OR REPLACE VIEW v_catalogo_unificado/i);
      expect(sql).toMatch(/UNION ALL/i);
      expect(sql).toMatch(/FROM instrumentos/i);
      expect(sql).toMatch(/FROM micropipetas/i);
    });
  });

  describe('1.4 migration lock consistency', () => {
    test('baseline timestamp is ordered before first real migration', () => {
      expect(baselineName.localeCompare('20260521210000_dashboard_upgrades_roles_base')).toBeLessThan(0);
    });

    test('migration_lock.toml exists and declares postgresql provider', () => {
      expect(fs.existsSync(lockFile)).toBe(true);
      const lock = fs.readFileSync(lockFile, 'utf8');
      expect(lock).toMatch(/provider\s*=\s*"postgresql"/);
    });
  });
});
