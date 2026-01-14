# Ejemplos JSON para Reporte RAM (Por Etapas)

Estos JSON están diseñados para probar la API `PUT /api/reporte-ram/:id`.
Recuerda que el `codigoALI` (o `codigo_ali`) es obligatorio en todas las peticiones para identificar el reporte.

## Etapa 3: Cálculo y Diluciones

Existen dos formas de enviar los datos, dependiendo de si quieres que el sistema filtre automáticamente las placas incontables (MNPC).

### Opción A: Modo Manual (Legacy)
El analista decide qué diluciones usar y solo envía esas dos. El sistema calcula con lo que recibe.

```json
{
  "etapa3_repeticiones": [
    {
      "numeroMuestra": 1,
      "suspension_inicial": 10,
      "volumen_concentrado": 1,
      "dil_1": -3,
      "dil_2": -4,
      "numeroColonias": [42, 46, 0, 0]
    }
  ]
}
```

### Opción B: Modo Automático (Recomendado)
El sistema recibe todas las diluciones, filtra las "mnpc" (>300) y selecciona el mejor par consecutivo.

```json
{
  "etapa3_repeticiones": [
    {
      "numeroMuestra": 35,
      "suspension_inicial": 10,
      "volumen_concentrado": 1,
      "diluciones": [
         { "dil": -2, "colonias": [305, 310] }, // MNPC (>300) -> Se ignora
         { "dil": -3, "colonias": [42, 46] },   // Válida -> Se usa
         { "dil": -4, "colonias": [0, 0] }      // Válida -> Se usa
      ]
    }
  ]
}
```

## Etapa 4: Lectura y Controles

```json
{
  "codigoALI": 1432,
  "estado": "EN_PROCESO",
  "etapa4": {
    "horaInicio": "09:00",
    "horaFin": "09:30",
    "temperatura": 35.5,
    "blancoUfc": 0,
    "controlUfc": 15,
    "controlSiembraEcoli": 20,
    "controlAmbientalPesado": 0,
    "ufc": 1500
  }
}
```

## Etapa 5: Verificación y Entrega

```json
{
  "codigoALI": 1432,
  "estado": "EN_PROCESO",
  "etapa5": {
    "desfavorable": "NO",
    "mercado": "Nacional",
    "tablaPagina": "Tabla 1, Pág 5",
    "limite": "50000",
    "fechaEntrega": "2026-01-20",
    "horaEntrega": "15:00"
  }
}
```

## Etapa 6: Aseguramiento de Calidad

```json
{
  "codigoALI": 1432,
  "estado": "POR_VERIFICAR",
  "etapa6": {
    "analisis": "Recuento de Aerobios Mesófilos",
    "controlBlanco": "0",
    "controlMedia": "0",
    "resultado": "CONFORME"
  }
}
```
