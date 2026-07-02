const fs = require('fs');
const path = require('path');

describe('Operational bootstrap alignment (Phase 2)', () => {
  const repoRoot = path.resolve(__dirname, '../../..');
  const apiDir = path.join(repoRoot, 'AssisTec API');
  const docsDir = path.join(repoRoot, 'docs');
  const entrypointFile = path.join(apiDir, 'docker-entrypoint.sh');
  const makefileFile = path.join(repoRoot, 'Makefile');
  const migrationsGuideFile = path.join(docsDir, 'database-migrations-guide.md');
  const databaseDocFile = path.join(docsDir, 'database.md');

  function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  describe('2.1 docker-entrypoint.sh conditional test seed', () => {
    test('loads dev-test-seed.sql via psql only when LOAD_TEST_SEED=true', () => {
      const script = readFile(entrypointFile);

      expect(script).toMatch(/\$LOAD_TEST_SEED/);
      expect(script).toMatch(/dev-test-seed\.sql/);
      expect(script).toMatch(/psql/);
      expect(script).toMatch(/if\s*\[\s*"\$LOAD_TEST_SEED"\s*=\s*"true"\s*\]/);
    });

    test('runs migrate deploy before seeds and app startup', () => {
      const script = readFile(entrypointFile);
      const migrateIndex = script.indexOf('prisma migrate deploy');
      const seedIndex = script.indexOf('node run-seeds.js');
      const testSeedIndex = script.indexOf('dev-test-seed.sql');
      const appIndex = script.indexOf('node app.js');

      expect(migrateIndex).toBeGreaterThanOrEqual(0);
      expect(seedIndex).toBeGreaterThan(migrateIndex);
      expect(testSeedIndex).toBeGreaterThan(seedIndex);
      expect(appIndex).toBeGreaterThan(testSeedIndex);
    });

    test('does not reference prisma db push', () => {
      const script = readFile(entrypointFile);
      expect(script).not.toMatch(/db push/);
    });
  });

  describe('2.2 Makefile dev-test target', () => {
    test('no longer runs duplicate migrate deploy inside dev-test', () => {
      const makefile = readFile(makefileFile);
      const devTestMatch = makefile.match(/dev-test:[\s\S]*?(?=\n\n|\n# ══|$)/);
      expect(devTestMatch).toBeTruthy();

      const devTestBody = devTestMatch[0];
      expect(devTestBody).not.toMatch(/migrate deploy/);
      expect(devTestBody).not.toMatch(/run-seeds\.js/);
    });

    test('passes LOAD_TEST_SEED=true to compose up', () => {
      const makefile = readFile(makefileFile);
      const devTestMatch = makefile.match(/dev-test:[\s\S]*?(?=\n\n|\n# ══|$)/);
      const devTestBody = devTestMatch[0];

      expect(devTestBody).toMatch(/LOAD_TEST_SEED=true/);
    });

    test('does not duplicate test-seed loading in dev-test target', () => {
      const makefile = readFile(makefileFile);
      const devTestMatch = makefile.match(/dev-test:[\s\S]*?(?=\n\n|\n# ══|$)/);
      const devTestBody = devTestMatch[0];

      expect(devTestBody).not.toMatch(/psql/);
      expect(devTestBody).not.toMatch(/dev-test-seed\.sql/);
    });
  });

  describe('2.3 Makefile db-push deprecation', () => {
    test('prints deprecation warning before running db push', () => {
      const makefile = readFile(makefileFile);
      const dbPushMatch = makefile.match(/db-push:[\s\S]*?(?=\n\n|\n# ══|$)/);
      expect(dbPushMatch).toBeTruthy();

      const dbPushBody = dbPushMatch[0];
      expect(dbPushBody).toMatch(/DEPRECATED/i);
      expect(dbPushBody).toMatch(/db push/i);
    });
  });

  describe('2.4 Makefile migrate-resolve-baseline target', () => {
    test('exists and runs prisma migrate resolve --applied for the baseline', () => {
      const makefile = readFile(makefileFile);

      expect(makefile).toMatch(/migrate-resolve-baseline:/);
      expect(makefile).toMatch(/prisma migrate resolve --applied 0_baseline_20260521000000/);
    });

    test('is listed in help via description comment', () => {
      const makefile = readFile(makefileFile);
      expect(makefile).toMatch(/migrate-resolve-baseline:.*?##/);
    });
  });

  describe('3.1 database migrations guide', () => {
    test('exists and contains all required sections', () => {
      expect(fs.existsSync(migrationsGuideFile)).toBe(true);
      const guide = readFile(migrationsGuideFile);

      expect(guide).toMatch(/# .*Migraciones/i);
      expect(guide).toMatch(/Arquitectura/i);
      expect(guide).toMatch(/Workflow/i);
      expect(guide).toMatch(/Baseline/i);
      expect(guide).toMatch(/Bootstrap/i);
      expect(guide).toMatch(/Troubleshooting/i);
      expect(guide).toMatch(/Golden/i);
      expect(guide).toMatch(/db push/i);
    });

    test('explicitly forbids db push in production', () => {
      const guide = readFile(migrationsGuideFile);
      const productionSection = guide.match(/producción|produccion|production/i);
      expect(productionSection).toBeTruthy();
      expect(guide).toMatch(/NO USAR .*db push/i);
    });
  });

  describe('3.2 database.md db push removal', () => {
    test('no longer presents db push as an active workflow', () => {
      const doc = readFile(databaseDocFile);
      const lines = doc.split('\n');

      const dbPushLines = lines.filter(line => line.includes('db push'));
      const hasInstructionalDbPush = dbPushLines.some(line =>
        line.includes('usa') || line.includes('usa `') || line.includes('sincronizar')
      );

      expect(hasInstructionalDbPush).toBe(false);
    });

    test('references the new migrations guide', () => {
      const doc = readFile(databaseDocFile);
      expect(doc).toMatch(/database-migrations-guide\.md/);
    });
  });
});
