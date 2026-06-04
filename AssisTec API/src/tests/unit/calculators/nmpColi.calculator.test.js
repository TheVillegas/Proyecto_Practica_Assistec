const { calcularNMP } = require('../../../calculators/nmpColi.calculator');

describe('nmpColi.calculator', () => {
    describe('calcularNMP', () => {
        test('debe calcular coliformes totales con 3 tubos positivos en primera dilucion', () => {
            const input = {
                tubosPositivosPorDilucion: [3, 0, 0] // 3 positivos en 10ml, 0 en 1ml, 0 en 0.1ml
            };
            const result = calcularNMP('totales', input.tubosPositivosPorDilucion);
            expect(result).toBeGreaterThan(0);
            expect(typeof result).toBe('number');
        });

        test('debe retornar 0 cuando todos los tubos son negativos', () => {
            const result = calcularNMP('totales', [0, 0, 0]);
            expect(result).toBe(0);
        });

        test('debe calcular e.coli con combinacion mixta de positivos', () => {
            const result = calcularNMP('ecoli', [2, 1, 0]);
            expect(result).toBeGreaterThan(0);
            expect(typeof result).toBe('number');
        });

        test('debe manejar combinacion [1,0,0] para fecales', () => {
            const result = calcularNMP('fecales', [1, 0, 0]);
            expect(result).toBeGreaterThanOrEqual(0);
        });

        test('debe lanzar error con input invalido', () => {
            expect(() => calcularNMP('totales', [3, 3])).toThrow();
            expect(() => calcularNMP('totales', [])).toThrow();
            expect(() => calcularNMP('invalido', [1, 0, 0])).toThrow();
        });
    });
});
