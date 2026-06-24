const { calcularUfcEnt } = require('../../src/calculators/ufcEnt.calculator');

describe('T-UEC-001: UFC/g Enterobacterias Calculator', () => {
    const VOLUMEN_DEFAULT = 1;

    describe('Priority 1 — Rango optimo (15-300 colonias)', () => {
        it('caso 1: debe calcular UFC/g para dilucion unica en rango optimo', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -1, colonias: [50, 55] } // promedio 52.5, factor 0.1
                ]
            });

            // UFC = 52.5 / (1 * 0.1) = 525
            expect(resultado.ufcPorG).toBe(525);
            expect(resultado.nEnterobacterias).toBe(525);
            expect(resultado.incongruenciaDetectada).toBe(false);
            expect(resultado.operador).toBe('=');
            expect(resultado.esEstimado).toBe(false);
            expect(resultado.casoAplicado).toBe('PRIORIDAD_1');
        });
    });

    describe('Priority 2 — Rango bajo (<15 colonias)', () => {
        it('caso 2: debe retornar limite inferior cuando todas las diluciones estan por debajo del optimo', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -2, colonias: [5, 7] } // promedio 6 < 15
                ]
            });

            // resultado = 15 / (1 * 0.01) = 1500
            expect(resultado.ufcPorG).toBe(1500);
            expect(resultado.operador).toBe('<');
            expect(resultado.esEstimado).toBe(false);
            expect(resultado.casoAplicado).toBe('PRIORIDAD_2');
        });
    });

    describe('Priority 3 — Rango exceso (>300 colonias)', () => {
        it('caso 3: debe retornar estimado cuando promedio excede pero es menor que MNPC', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -1, colonias: [350, 350] } // promedio 350, entre 300 y MNPC
                ]
            });

            expect(resultado.casoAplicado).toBe('PRIORIDAD_3A');
            expect(resultado.esEstimado).toBe(true);
            expect(resultado.operador).toBe('=');
            expect(resultado.ufcPorG).toBe(3500);
        });

        it('caso 4: debe retornar limite superior cuando promedio excede o iguala MNPC', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -1, colonias: [400, 400] } // promedio 400 >= MNPC
                ]
            });

            // resultado = MNPC / (1 * 0.1) = 4000
            expect(resultado.ufcPorG).toBe(4000);
            expect(resultado.operador).toBe('>');
            expect(resultado.esEstimado).toBe(false);
            expect(resultado.casoAplicado).toBe('PRIORIDAD_3B');
        });
    });

    describe('Priority 4 — Sin crecimiento', () => {
        it('caso 5: debe retornar limite inferior cuando no hay crecimiento', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -1, colonias: [0, 0] }
                ]
            });

            // resultado = 1 / (1 * 0.1) = 10
            expect(resultado.ufcPorG).toBe(10);
            expect(resultado.operador).toBe('<');
            expect(resultado.casoAplicado).toBe('PRIORIDAD_4');
        });
    });

    describe('Edge cases', () => {
        it('caso 6: debe retornar SIN_DATOS cuando no hay diluciones', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: []
            });

            expect(resultado.ufcPorG).toBeNull();
            expect(resultado.nEnterobacterias).toBeNull();
            expect(resultado.casoAplicado).toBe('SIN_DATOS');
            expect(resultado.incongruenciaDetectada).toBe(false);
        });
    });

    describe('Incongruencia detection', () => {
        it('caso 7: debe detectar incongruencia cuando hay 0 y >0 en placas duplicadas', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -1, colonias: [0, 50] }
                ]
            });

            expect(resultado.incongruenciaDetectada).toBe(true);
            expect(resultado.observacionIncongruencia).toContain('Incongruencia');
        });

        it('caso 8: debe detectar incongruencia cuando ratio max/min > 2', () => {
            const resultado = calcularUfcEnt({
                volumen: VOLUMEN_DEFAULT,
                diluciones: [
                    { dil: -1, colonias: [10, 50] } // ratio 5
                ]
            });

            expect(resultado.incongruenciaDetectada).toBe(true);
            expect(resultado.observacionIncongruencia).toContain('ratio');
        });
    });
});
