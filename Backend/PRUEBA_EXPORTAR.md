# Script de Prueba - Exportación de Reporte TPA

Este script permite probar el endpoint de exportación de reportes TPA.

## Endpoint

```
POST http://localhost:3000/AsisTec/Exportar/tpa
```

## Uso con cURL

```bash
curl -X POST http://localhost:3000/AsisTec/Exportar/tpa \
  -H "Content-Type: application/json" \
  -d @test-data-tpa.json \
  --output reporte-test.xlsx
```

## Uso con PowerShell

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/AsisTec/Exportar/tpa" `
  -Method POST `
  -ContentType "application/json" `
  -InFile "test-data-tpa.json" `
  -OutFile "reporte-test.xlsx"
```

## Verificación

1. El archivo `reporte-test.xlsx` debe generarse en el directorio actual
2. También se guarda una copia en `Backend/outputs/`
3. Abrir el archivo Excel y verificar:
   - **Etapa 1**: Marca "√" en la fila correspondiente a "Mesón Siembra"
   - **Etapa 1**: Observaciones en celda H6
   - **Etapa 2**: Dos filas de datos (filas 13 y 14)
   - **Etapa 2**: Primera fila con "√" en columna A (Retiro)
   - **Etapa 2**: Segunda fila con "√" en columna B (Pesado)
   - **Checklist Equipos**: Marcas "√" en columna R para los equipos mencionados

## Listar Reportes Generados

```bash
curl http://localhost:3000/AsisTec/Exportar/listar
```
