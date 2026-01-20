const ReporteRAM = require('./models/reporteRAMModel.js');

const mockData = {
    volumen: 1,
    diluciones: [
        { dil: -1, colonias: [10, 0] }, // Promedio 5? No, sum 10 (one is 0).
        // Wait, logic says: 
        // 0 -> sinCrecimiento
        // 10 -> bajas (<25)
        // So this should trigger RANGO_BAJO ??
        // clasificarDiluciones logic:
        // sinCrecimiento: push(0)
        // bajas: push(10)
        // If optimas empty, and bajas > 0 -> RANGO_BAJO.
    ]
};

// Case for correct P2:
const mockDataP2 = {
    volumen: 1,
    diluciones: [
        { dil: -1, colonias: [15, 20] } // Both < 25. > 0.
        // Bajas: [15, 20]
        // Tipo: RANGO_BAJO
    ]
};

const result = ReporteRAM.calcularRecuentoColonias(mockDataP2);
console.log("Input:", JSON.stringify(mockDataP2));
console.log("Result:", JSON.stringify(result, null, 2));

if (result.casoAplicado === 'PRIORIDAD_2' && result.textoRPES && result.textoRPES.includes('<')) {
    console.log("PASS: Correction applied.");
} else {
    console.log("FAIL: Check logic.");
}
