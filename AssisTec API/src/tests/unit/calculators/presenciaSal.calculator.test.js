const { determinarPresenciaAusencia } = require('../../../calculators/presenciaSal.calculator');

describe('presenciaSal.calculator', () => {
    describe('determinarPresenciaAusencia', () => {
        test('debe retornar Presencia cuando cualquier agar muestra crecimiento tipico', () => {
            const lecturas = {
                resXld24hSelenito: 'tipico',
                resSs24hSelenito: 'atipico',
                resXld48hSelenito: 'sin_crecimiento',
                resSs48hSelenito: 'atipico',
                resXld24hRappaport: 'atipico',
                resSs24hRappaport: 'sin_crecimiento',
                resXld48hRappaport: 'atipico',
                resSs48hRappaport: 'atipico'
            };
            expect(determinarPresenciaAusencia(lecturas)).toBe('Presencia');
        });

        test('debe retornar Ausencia cuando todos los agares muestran ausencia de crecimiento', () => {
            const lecturas = {
                resXld24hSelenito: 'sin_crecimiento',
                resSs24hSelenito: 'sin_crecimiento',
                resXld48hSelenito: 'sin_crecimiento',
                resSs48hSelenito: 'sin_crecimiento',
                resXld24hRappaport: 'sin_crecimiento',
                resSs24hRappaport: 'sin_crecimiento',
                resXld48hRappaport: 'sin_crecimiento',
                resSs48hRappaport: 'sin_crecimiento'
            };
            expect(determinarPresenciaAusencia(lecturas)).toBe('Ausencia');
        });

        test('debe retornar Presencia cuando todos los agares muestran crecimiento tipico', () => {
            const lecturas = {
                resXld24hSelenito: 'tipico',
                resSs24hSelenito: 'tipico',
                resXld48hSelenito: 'tipico',
                resSs48hSelenito: 'tipico',
                resXld24hRappaport: 'tipico',
                resSs24hRappaport: 'tipico',
                resXld48hRappaport: 'tipico',
                resSs48hRappaport: 'tipico'
            };
            expect(determinarPresenciaAusencia(lecturas)).toBe('Presencia');
        });

        test('debe retornar Ausencia cuando todos son atipicos', () => {
            const lecturas = {
                resXld24hSelenito: 'atipico',
                resSs24hSelenito: 'atipico',
                resXld48hSelenito: 'atipico',
                resSs48hSelenito: 'atipico',
                resXld24hRappaport: 'atipico',
                resSs24hRappaport: 'atipico',
                resXld48hRappaport: 'atipico',
                resSs48hRappaport: 'atipico'
            };
            expect(determinarPresenciaAusencia(lecturas)).toBe('Ausencia');
        });

        test('debe retornar Presencia con mezcla tipico y atipico', () => {
            const lecturas = {
                resXld24hSelenito: 'atipico',
                resSs24hSelenito: 'tipico',
                resXld48hSelenito: 'atipico',
                resSs48hSelenito: 'atipico',
                resXld24hRappaport: 'atipico',
                resSs24hRappaport: 'atipico',
                resXld48hRappaport: 'atipico',
                resSs48hRappaport: 'atipico'
            };
            expect(determinarPresenciaAusencia(lecturas)).toBe('Presencia');
        });

        test('debe manejar valores nulos o undefined como ausencia', () => {
            const lecturas = {
                resXld24hSelenito: null,
                resSs24hSelenito: undefined,
                resXld48hSelenito: 'sin_crecimiento',
                resSs48hSelenito: 'sin_crecimiento',
                resXld24hRappaport: 'sin_crecimiento',
                resSs24hRappaport: 'sin_crecimiento',
                resXld48hRappaport: 'sin_crecimiento',
                resSs48hRappaport: 'sin_crecimiento'
            };
            expect(determinarPresenciaAusencia(lecturas)).toBe('Ausencia');
        });
    });
});
