const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('T-001: Schema Prisma', () => {
    const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
    let schemaContent;

    beforeAll(() => {
        schemaContent = fs.readFileSync(schemaPath, 'utf8');
    });

    it('debe contener modelos SauFormulario, ColiFormulario, SalFormulario', () => {
        expect(schemaContent).toContain('model SauFormulario');
        expect(schemaContent).toContain('model ColiFormulario');
        expect(schemaContent).toContain('model SalFormulario');
    });

    it('debe contener todas las etapas/fases hijas', () => {
        const requiredModels = [
            'SauMuestra', 'SauEtapa1', 'SauEtapa2', 'SauEtapa3', 'SauEtapa4',
            'SauEtapa5Resultado', 'SauEtapa6Cierre',
            'ColiMuestra', 'ColiFase1', 'ColiFase2', 'ColiFase3',
            'ColiFase35Controles', 'ColiFase4Resultado',
            'SalMuestra', 'SalFase1', 'SalFase2a', 'SalFase2b', 'SalFase2c',
            'SalFase3a', 'SalFase3b', 'SalFase3cLectura', 'SalFase4a',
            'SalFase4bLectura', 'SalFase5Resultado'
        ];
        for (const model of requiredModels) {
            expect(schemaContent).toContain(`model ${model}`);
        }
    });

    it('todas las tablas hijas de etapa/fase deben tener @updatedAt', () => {
        const childModels = [
            'SauEtapa1', 'SauEtapa2', 'SauEtapa3', 'SauEtapa4',
            'SauEtapa6Cierre',
            'ColiFase1', 'ColiFase2', 'ColiFase3',
            'ColiFase35Controles',
            'SalFase1', 'SalFase2a', 'SalFase2b', 'SalFase2c',
            'SalFase3a', 'SalFase3b', 'SalFase4a'
        ];
        for (const model of childModels) {
            const modelRegex = new RegExp(`model\\s+${model}\\s*\\{[\\s\\S]*?\\}`, 'm');
            const match = schemaContent.match(modelRegex);
            expect(match).toBeTruthy();
            expect(match[0]).toContain('@updatedAt');
        }
    });

    it('debe tener @@index([rutAnalista]) en formularios', () => {
        for (const form of ['SauFormulario', 'ColiFormulario', 'SalFormulario']) {
            const regex = new RegExp(`model\\s+${form}\\s*\\{[\\s\\S]*?@@index\\(\\[rutAnalista\\]\\)[\\s\\S]*?\\}`, 'm');
            expect(schemaContent).toMatch(regex);
        }
    });

    it('debe tener completada Boolean @default(false) en etapas/fases', () => {
        const models = [
            'SauEtapa1', 'SauEtapa2', 'SauEtapa3', 'SauEtapa4', 'SauEtapa6Cierre',
            'ColiFase1', 'ColiFase2', 'ColiFase3', 'ColiFase35Controles',
            'SalFase1', 'SalFase2a', 'SalFase2b', 'SalFase2c',
            'SalFase3a', 'SalFase3b', 'SalFase4a'
        ];
        for (const model of models) {
            const regex = new RegExp(`model\\s+${model}\\s*\\{[\\s\\S]*?completada\\s+Boolean\\s+@default\\(false\\)[\\s\\S]*?\\}`, 'm');
            expect(schemaContent).toMatch(regex);
        }
    });

    it('SalFase5Resultado.resultadoFinal debe ser enum PresenciaAusencia', () => {
        expect(schemaContent).toMatch(/enum\s+PresenciaAusencia\s*\{/m);
        expect(schemaContent).toMatch(/Presencia\s*\n\s*Ausencia/);
    });

    it('prisma validate debe pasar', () => {
        const apiDir = path.join(__dirname, '../..');
        const output = execSync('npx prisma validate', { cwd: apiDir, encoding: 'utf8', stdio: 'pipe' });
        expect(output).toContain('The schema at prisma/schema.prisma is valid');
    });
});
