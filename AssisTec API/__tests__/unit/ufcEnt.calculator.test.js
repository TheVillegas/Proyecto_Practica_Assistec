const { calcularUfcEnt } = require('../../src/calculators/ufcEnt.calculator');

describe('T-UEC-001: UFC/g Enterobacterias Calculator (NCh 2676.Of2002 — método de confirmación)', () => {
    describe('Cálculo por placa — caso feliz', () => {
        it('caso 1: calcula a por placa y N para una única dilución con 2 placas', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [
                    { dil: -1, colonias: 45, confirmA: 5, confirmB: 3 }, // a = 45*(3/5) = 27
                    { dil: -1, colonias: 50, confirmA: 5, confirmB: 4 }  // a = 50*(4/5) = 40
                ]
            });

            // sumaA = 67 ; n1=2, n2=0, d=0.1 ; divisor = 1*(2+0)*0.1 = 0.2
            // N = 67 / 0.2 = 335
            expect(resultado.sumaA).toBe(67);
            expect(resultado.n1).toBe(2);
            expect(resultado.n2).toBe(0);
            expect(resultado.d).toBeCloseTo(0.1);
            expect(resultado.nEnterobacterias).toBe(335);
            expect(resultado.ufcPorG).toBe(335);
            expect(resultado.operador).toBe('=');
            expect(resultado.esEstimado).toBe(false);
            expect(resultado.esSd).toBe(false);
            expect(resultado.casoAplicado).toBe('NCh2676_porPlaca');
            expect(resultado.incongruenciaDetectada).toBe(false);
            expect(resultado.detalle).toHaveLength(2);
            expect(resultado.detalle[0]).toMatchObject({ dil: -1, colonias: 45, A: 5, b: 3, a: 27 });
            expect(resultado.detalle[1]).toMatchObject({ dil: -1, colonias: 50, A: 5, b: 4, a: 40 });
        });
    });

    describe('Σa/N con 2 diluciones — ponderación n1 + 0.1*n2', () => {
        it('caso 2: combina dos diluciones aplicando el factor 0.1 sobre n2', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [
                    { dil: -1, colonias: 45, confirmA: 5, confirmB: 3 }, // a = 27
                    { dil: -1, colonias: 50, confirmA: 5, confirmB: 4 }, // a = 40
                    { dil: -2, colonias: 8, confirmA: 5, confirmB: 5 },  // a = 8
                    { dil: -2, colonias: 6, confirmA: 4, confirmB: 4 }   // a = 6
                ]
            });

            // sumaA = 27+40+8+6 = 81 ; n1=2, n2=2, d=0.1 (dilucion base -1)
            // divisor = 1*(2 + 0.1*2)*0.1 = 0.22 ; N = 81/0.22 = 368.18... -> 368
            expect(resultado.sumaA).toBe(81);
            expect(resultado.n1).toBe(2);
            expect(resultado.n2).toBe(2);
            expect(resultado.d).toBeCloseTo(0.1);
            expect(resultado.nEnterobacterias).toBe(368);
            expect(resultado.ufcPorG).toBe(368);
            expect(resultado.casoAplicado).toBe('NCh2676_porPlaca');
            expect(resultado.esSd).toBe(false);
        });
    });

    describe('Casos SD', () => {
        it('caso 3: SIN_DATOS cuando no hay placas', () => {
            const resultado = calcularUfcEnt({ volumen: 1, placas: [] });

            expect(resultado.ufcPorG).toBeNull();
            expect(resultado.nEnterobacterias).toBeNull();
            expect(resultado.esSd).toBe(true);
            expect(resultado.casoAplicado).toBe('SIN_DATOS');
            expect(resultado.incongruenciaDetectada).toBe(false);
        });

        it('caso 4: SIN_DESARROLLO cuando todas las placas tienen 0 colonias', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [
                    { dil: -1, colonias: 0, confirmA: 0, confirmB: 0 },
                    { dil: -1, colonias: 0, confirmA: 0, confirmB: 0 }
                ]
            });

            expect(resultado.ufcPorG).toBeNull();
            expect(resultado.esSd).toBe(true);
            expect(resultado.casoAplicado).toBe('SIN_DESARROLLO');
        });

        it('caso 5: SIN_CONFIRMACION cuando hay colonias pero Σa <= 0', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [
                    { dil: -1, colonias: 10, confirmA: 5, confirmB: 0 }
                ]
            });

            expect(resultado.sumaA).toBe(0);
            expect(resultado.ufcPorG).toBeNull();
            expect(resultado.esSd).toBe(true);
            expect(resultado.casoAplicado).toBe('SIN_CONFIRMACION');
        });
    });

    describe('Validaciones por placa', () => {
        it('caso 6: A > maxA (5) excluye la placa y agrega advertencia', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [{ dil: -1, colonias: 10, confirmA: 6, confirmB: 3 }]
            });

            expect(resultado.detalle[0].error).toMatch(/A>5/);
            expect(resultado.detalle[0].a).toBeNull();
            expect(resultado.advertencias.length).toBeGreaterThan(0);
            expect(resultado.casoAplicado).toBe('SIN_CONFIRMACION');
        });

        it('caso 7: b > A excluye la placa y agrega advertencia', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [{ dil: -1, colonias: 10, confirmA: 5, confirmB: 6 }]
            });

            expect(resultado.detalle[0].error).toMatch(/b>A/);
            expect(resultado.detalle[0].a).toBeNull();
            expect(resultado.casoAplicado).toBe('SIN_CONFIRMACION');
        });

        it('caso 8: A > colonias excluye la placa y agrega advertencia', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [{ dil: -1, colonias: 3, confirmA: 5, confirmB: 2 }]
            });

            expect(resultado.detalle[0].error).toMatch(/A>colonias/);
            expect(resultado.detalle[0].a).toBeNull();
            expect(resultado.casoAplicado).toBe('SIN_CONFIRMACION');
        });

        it('caso 9: colonias > 0 con A=0 excluye la placa (falta confirmación)', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [{ dil: -1, colonias: 10, confirmA: 0, confirmB: 0 }]
            });

            expect(resultado.detalle[0].error).toMatch(/falta confirmación/);
            expect(resultado.detalle[0].a).toBeNull();
            expect(resultado.casoAplicado).toBe('SIN_CONFIRMACION');
        });
    });

    describe('Error de divisor', () => {
        it('caso 10: ERROR_DIVISOR cuando volumen=0 anula el divisor', () => {
            const resultado = calcularUfcEnt({
                volumen: 0,
                placas: [{ dil: -1, colonias: 45, confirmA: 5, confirmB: 3 }]
            });

            expect(resultado.sumaA).toBeGreaterThan(0);
            expect(resultado.ufcPorG).toBeNull();
            expect(resultado.esSd).toBe(true);
            expect(resultado.casoAplicado).toBe('ERROR_DIVISOR');
        });
    });

    describe('Incongruencia entre placas duplicadas (QC ortogonal)', () => {
        it('caso 11: detecta incongruencia por ratio max/min > 2 sin alterar el cálculo', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [
                    { dil: -1, colonias: 10, confirmA: 5, confirmB: 3 }, // a = 6
                    { dil: -1, colonias: 50, confirmA: 5, confirmB: 3 }  // a = 30
                ]
            });

            expect(resultado.incongruenciaDetectada).toBe(true);
            expect(resultado.observacionIncongruencia).toContain('ratio');
            // sumaA = 36 ; divisor = 1*(2)*0.1 = 0.2 ; N = 180
            expect(resultado.sumaA).toBe(36);
            expect(resultado.ufcPorG).toBe(180);
            expect(resultado.casoAplicado).toBe('NCh2676_porPlaca');
        });

        it('caso 12: detecta incongruencia cuando una placa tiene 0 y la otra >0', () => {
            const resultado = calcularUfcEnt({
                volumen: 1,
                placas: [
                    { dil: -1, colonias: 0, confirmA: 0, confirmB: 0 },
                    { dil: -1, colonias: 50, confirmA: 5, confirmB: 3 }
                ]
            });

            expect(resultado.incongruenciaDetectada).toBe(true);
            expect(resultado.observacionIncongruencia).toContain('placa con 0 y placa con >0');
        });
    });
});
