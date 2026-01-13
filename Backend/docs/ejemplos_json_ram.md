# Ejemplos JSON para Reporte RAM (Por Etapas)

Estos JSON están diseñados para probar la API `PUT /api/reporte-ram/:id`.
Recuerda que el `codigoALI` (o `codigo_ali`) es obligatorio en todas las peticiones para identificar el reporte.

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
    "controlBlancoEstado": "CUMPLE",
    "controlSiembra": "15",
    "controlSiembraEstado": "CUMPLE",
    "duplicadoAli": "1450",
    "duplicadoEstado": "CUMPLE"
  }
}
```

## Etapa 7: Cierre y Observaciones

```json
{
  "codigoALI": 1432,
  "estado": "FINALIZADO",
  "etapa7": {
    "observacionesFinales": "Muestra conforme a especificaciones.",
    "firmaCoordinador": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "observaciones_finales_analistas": "Sin observaciones adicionales por parte de analistas.",
    "formasCalculo": [
      {
        "id": 1,
        "seleccionado": true
      },
      {
        "id": 2,
        "seleccionado": false
      }
    ]
  }
}
```
