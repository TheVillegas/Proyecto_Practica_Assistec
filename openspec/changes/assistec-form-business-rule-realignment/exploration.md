# Exploración: assistec-form-business-rule-realignment

## Estado de la fuente y evidencia

**Política de fuente de verdad para este cambio:** el transcript detallado de la reunión es la fuente primaria de reglas de negocio. Los Excel reales y el código se usan como verificación operativa/técnica. `Estado_Actual.pdf` queda sólo como contexto general porque es incompleto para planificar formularios y flujos. Se intentó obtener transcripción directa del audio con Whisper/ASR, pero el intento fue abortado/no dejó un artefacto usable; por lo tanto, no se usa audio directo como evidencia semántica independiente.

**Jerarquía usada para esta exploración:**

1. **Transcript detallado de reunión** — fuente principal de decisiones, dudas y prioridad de trabajo.
2. **Excel reales** — verificación de estructura de formularios, etapas, controles, cálculos y términos usados por laboratorio.
3. **Código actual** — verificación de gates, rutas, generación de formularios y brechas implementadas.
4. **PDF `Estado_Actual.pdf`** — contexto general, no fuente principal de reglas.

**Evidencia técnica verificada:**

- `openspec/config.yaml` confirma stack activo: Angular 20 + Ionic 8, backend activo `AssisTec API/` con Node/Express/Prisma/PostgreSQL, TDD estricto y presupuesto de revisión de 400 líneas.
- `AssisTec API/src/services/solicitud.service.js` ya aplica gate de doble validación: sólo con Coordinación + Jefatura aprobadas se generan reportes/formularios; con aprobación parcial conserva estado `enviado`.
- `AssisTec API/src/services/formularioMicrobiologico.service.js` mapea `SAUREUS -> sau`, `COLIFORMES_TOTALES / COLIFORMES_FECALES / ECOLI_NCH3056 -> coli`, `SALMONELLA / SALMONELLA_ISO -> sal`; Enterobacterias no aparece en ese mapa.
- `AssisTec API/src/repositories/muestraAli.repository.js` mapea `SALMONELLA` a `/form-enterobacterias`, confirmando la brecha de ruta detectada en la reunión.
- `Frontend/src/app/app-routing.module.ts` registra `/form-coliformes`, `/form-s-aureus` y `/form-enterobacterias`, pero no registra `/form-salmonella`, aunque existe el módulo/página `form-salmonella`.
- Excel reales encontrados: `S.AUREUS.xlsx`, `Confirmaciòn y pruebas bioquimicas de Coliformes Totales Coliformes fecales y E coli NMP MAX.xlsx`, `SALMONELLA.xlsx`, `ENTEROBACTERIAS.xlsx` e ISO7218 NMP `.xlsm`. Sus hojas verificadas incluyen `saureus`, `Lista de Etapas`, `pag 1`, `Conf CT y CF`, `Conf E.coli`, `salm`, `Enterobacterias`, `Copia de conf entero`, `Especificaciones`.

## Resumen ejecutivo

Este cambio no debe tratarse como “limpieza visual de formularios”. La reunión redefine el trabajo como **realineación de reglas de negocio y flujos de laboratorio**: Ingreso crea solicitudes con submuestras/análisis; Jefatura y Coordinación validan antes de liberar trabajo; el analista necesita comanda por muestra/submuestra; y los formularios semi-listos deben reestructurarse con base en transcript + Excel reales, no en el PDF general.

La planificación posterior en Linear debe salir de este documento como grupos semanales demostrables para ciclos/sprints 1-7. Junio y julio deben enfocarse en corregir/reestructurar formularios semi-listos, definir fases, mapear flujos y usar reuniones semanales con cliente para feedback temprano. No conviene crear issues todavía: primero corresponde pasar a `sdd-propose` para fijar alcance, fuera de alcance, preguntas al cliente y cortes revisables.

## Hallazgos por módulo: Validación

**Conclusión:** Validación es un workflow propio de Jefatura/Coordinación, no una búsqueda decorada ni un paso implícito dentro de solicitudes.

- Ingreso crea solicitud con muestras/submuestras y análisis por submuestra. Ejemplo del transcript: una submuestra puede requerir E. coli + Salmonella y otra S. aureus.
- La solicitud enviada queda para revisión; el analista no debe ver formularios ejecutables hasta que existan **ambas aprobaciones**.
- Jefatura y Coordinación necesitan una sección/card dedicada de solicitudes pendientes de validar.
- La validación debe ser revisión de corrección: código ALI/solicitud no editable, datos de muestreo, termómetro, envases, notas y análisis seleccionados en modo lectura.
- Si se rechaza, las observaciones/motivo deben volver a Ingreso y aparecer en `solicitudes rechazadas` para corrección.
- Código actual acompaña la regla central: `solicitud.service.js` calcula `isFullyValidated` y genera formularios sólo si Coordinación y Jefatura aprobaron.
- Riesgo operativo: si el frontend muestra formularios en un estado “50%” o aprobación parcial, rompe la regla confirmada.

**Implicancia Linear:** primer grupo candidato debe estabilizar ciclo de vida: ingreso → validación doble → rechazo/corrección o generación → analista.

## Hallazgos por módulo: Comanda/Exportación

**Conclusión:** La comanda es un requerimiento operativo fuerte. El analista hoy puede no tener suficiente contexto para saber qué análisis corresponde a cada muestra/submuestra.

- La pregunta central del transcript: ¿cómo sabe el analista qué muestra/submuestra va a Staphylococcus, Coliformes, Salmonella, etc.?
- La comanda/exportación debe organizarse por **muestra/submuestra + análisis seleccionados**, no sólo por ALI global.
- Debe generarse desde datos validados (`SolicitudAnalisis`, muestras/submuestras), no desde arreglos hardcodeados del frontend.
- Conviene priorizar una salida práctica tipo “Solicitud de Ingreso / comanda” antes que muchos reportes aislados.
- La comanda debe estar disponible después de validación completa y servir como puente entre Ingreso/validación y formularios del analista.

**Implicancia Linear:** grupo propio temprano, porque desbloquea feedback del cliente y reduce ambigüedad para todos los formularios.

## Hallazgos por módulo: S. aureus

**Conclusión:** S. aureus necesita reestructuración de flujo, no sólo ajuste de etiquetas. Debe capturar cronológicamente el trabajo y dejar cálculos/resultados consolidados al final.

Hallazgos específicos desde transcript + Excel:

- Datos como analista, micropipeta/equipo y medios deben venir respaldados por base de datos/listas del sistema cuando corresponda, no ser texto libre repetido.
- El baño no debe ser checklist simple: se captura **inicio** y **fin**, y el sistema calcula duración.
- Las lecturas deben distinguir **placa 1** y **placa 2**; no usar términos incorrectos como colonia 1/2 para esa estructura.
- La ubicación del duplicado debe quedar bajo contexto de muestra/submuestra correspondiente, no como bloque ambiguo.
- Los controles deben separarse: positivo, negativo y blanco. No mezclar positivo/negativo como si fueran un único parámetro.
- Debe mantenerse captura cronológica: siembra, incubaciones, lecturas, confirmaciones/coagulasa cuando correspondan.
- La etapa final debe consolidar cálculo/resultados y evitar tablas grandes repetidas en fases intermedias.
- Si hay “sin desarrollo” en 24/48h, se debe saltar confirmación/coagulasa y cerrar el resultado según regla normativa aplicable; sin embargo, el transcript también marca que al superar umbral sí requiere confirmación. La condición exacta de umbral y expresión final (`<10`, u otra) debe confirmarse con cliente/norma antes de implementar.

Forma candidata de flujo:

1. Datos base + siembra.
2. Control de siembra/incubación y lecturas 24/48h.
3. Evaluación de desarrollo/umbral para habilitar confirmación.
4. Confirmación/coagulasa sólo cuando aplique.
5. Cálculo y resultado final consolidado.

**Implicancia Linear:** debe dividirse en cortes revisables: datos base/equipos, flujo cronológico, controles, regla de confirmación, cálculo final. No meter todo S. aureus en una sola tarea gigante.

## Hallazgos por módulo: Coliformes totales/fecales/E. coli

**Conclusión:** Hay base compartida, pero la UX final sigue abierta. El error sería duplicar captura de analista/datos iniciales tres veces o cerrar prematuramente una única tarjeta sin validación del cliente.

- CT, CF y E. coli comparten base, norma/estructura inicial y parte del flujo.
- El código ya sugiere un motor compartido: `COLIFORMES_TOTALES`, `COLIFORMES_FECALES` y `ECOLI_NCH3056` van a `coli`.
- El Excel tiene hojas separadas para confirmación CT/CF y E. coli, lo que respalda base común con ramas distintas.
- E. coli podría depender del camino de fecales; si se pide sólo E. coli, hay que confirmar si el proceso exige pasar por fecales antes de habilitar E. coli.
- Debe evitarse captura duplicada de analista, equipos, tiempos y datos base.
- Queda abierta la decisión de UX: **un formulario dinámico** vs **tres tarjetas visibles conectadas a una base compartida**.

**Implicancia Linear:** primero definir modelo/base compartida y pregunta de cliente; después implementar la forma visible elegida.

## Hallazgos por módulo: Salmonella

**Conclusión:** Salmonella existe como dominio/formulario, pero el flujo actual de app está mal conectado.

- Backend de generación reconoce Salmonella como `sal`.
- La tarjeta ALI actual en `muestraAli.repository.js` envía `SALMONELLA` a `/form-enterobacterias`.
- Frontend tiene módulo/página `form-salmonella`, pero `app-routing.module.ts` no registra ruta pública para `/form-salmonella`.
- Según transcript, número de acta/código ALI debe venir del sistema/listado, no como campo manual.
- Campos copiados como `mixta/homogénea` no deben arrastrarse si no aplican a Salmonella.
- Excel `SALMONELLA.xlsx` verifica un flujo específico, separado de Enterobacterias.

**Implicancia Linear:** tarea temprana de enrutamiento + fuente de datos sistémica + limpieza de campos no aplicables, antes de rediseño profundo.

## Hallazgos por módulo: Enterobacterias

**Conclusión:** Enterobacterias tiene evidencia real y ruta visible, pero falta confirmar cómo se genera desde selección de análisis.

- Existe `/form-enterobacterias` en frontend.
- Excel `ENTEROBACTERIAS.xlsx` respalda que es un flujo real con siembra, recuento, confirmaciones y cálculo/resultados.
- Backend `formularioMicrobiologico.service.js` no incluye Enterobacterias en `CODIGO_MAP`.
- La ruta no debe usarse como destino de Salmonella.
- Falta confirmar código/nombre de catálogo que debe activar Enterobacterias.

**Implicancia Linear:** separar corrección Salmonella→Salmonella de generación real Enterobacterias. No mezclar dominios por conveniencia técnica.

## Hallazgos por módulo: MOHOS

**Conclusión:** MOHOS queda como candidato pendiente, no como alcance implementable inmediato.

- El transcript/proyección lo menciona como parte del universo de formularios, pero esta exploración no tiene Excel/norma específica comparable a S. aureus, Coliformes, Salmonella o Enterobacterias.
- No se debe inventar flujo ni fases.
- Si entra en ciclos 1-7, primero debe ser discovery/documentación: fuente real, etapas, cálculo, controles y datos obligatorios.

**Implicancia Linear:** crear luego como actividad de levantamiento/validación de fuente, no como implementación de formulario.

## Decisiones confirmadas

- El transcript detallado de reunión manda sobre el PDF general para este cambio.
- Excel reales y código son evidencia de verificación, no reemplazan lo acordado en reunión.
- No se crean issues Linear en esta fase.
- Validación requiere doble aprobación: Coordinación + Jefatura antes de liberar analista/formularios.
- Rechazos deben devolver observaciones a Ingreso.
- La comanda/exportación por muestra/submuestra es necesaria para que el analista trabaje con contexto.
- S. aureus se planifica como reestructuración funcional: captura cronológica + cálculo final consolidado.
- Coliformes debe evitar entrada duplicada y compartir base entre CT/CF/E. coli.
- Salmonella no debe abrir Enterobacterias.
- Junio/julio deben trabajarse con incrementos demostrables y feedback semanal del cliente.
- Ciclos/sprints 1-7 deben representar cortes revisables, no reescrituras enormes.

## Decisiones abiertas para cliente

- Coliformes: ¿un único formulario dinámico o tres tarjetas visibles conectadas a base compartida?
- E. coli: si se solicita sólo E. coli, ¿debe ejecutarse/registrarse ruta de fecales como prerequisito?
- S. aureus: confirmar umbral exacto que obliga confirmación y regla final para “sin desarrollo”/cero a 24/48h.
- S. aureus: confirmar expresión final esperada (`<10` u otra) y fuente normativa.
- Comanda: campos exactos, formato y momento de generación: automática tras doble validación u on-demand.
- Enterobacterias: código/nombre de catálogo que debe activar generación.
- MOHOS: fuente real y si entra en ciclos 1-7 o queda para fase posterior.
- Rechazo/corrección: profundidad requerida ahora vs flujo completo posterior.

## Riesgos

- **Riesgo de fuente:** no hay transcripción directa usable de audio; se trabaja con transcript detallado como fuente primaria.
- **Riesgo de planificación:** tareas Linear existentes podrían estar basadas en PDF/prototipo y contradecir reunión.
- **Riesgo de alcance:** S. aureus + Coliformes + validación + comanda exceden claramente un PR de 400 líneas si no se trocean.
- **Riesgo normativo:** reglas de umbral/cálculo no deben inventarse; requieren confirmación cliente/norma.
- **Riesgo UX:** cerrar Coliformes como una sola tarjeta sin validar puede causar rework.
- **Riesgo técnico:** Salmonella/Enterobacterias están acopladas incorrectamente por ruta; corregir sin pruebas puede romper navegación de analista.
- **Riesgo operativo:** sin comanda, aunque los formularios existan, el analista seguirá sin saber qué submuestra ejecutar.

## Grupos candidatos para Linear y sprints semanales (sin crear issues)

Estos grupos son base para planificar actividades AsisTec en Linear, asignables luego a ciclos/sprints 1-7. Deben cortarse como incrementos demostrables para revisión semanal con cliente.

| Grupo candidato | Objetivo operativo | Sprint/ciclo sugerido | Demo esperada |
|---|---|---:|---|
| Validación doble + rechazo mínimo | Separar panel de validación, bloquear analista hasta doble aprobación y devolver observaciones a Ingreso | 1 | Solicitud validada/rechazada con estados visibles y sin formularios antes de doble aprobación |
| Comanda por muestra/submuestra | Dar contexto al analista desde solicitud validada | 1-2 | Export/vista de comanda con muestras, submuestras y análisis seleccionados |
| Salmonella vs Enterobacterias | Corregir rutas y evitar que Salmonella abra Enterobacterias | 2 | Tarjeta Salmonella abre formulario Salmonella; Enterobacterias queda separada |
| S. aureus — base cronológica | Reordenar datos base, analista/equipos/medios, tiempos y baño calculado | 2-3 | Primeras etapas capturan datos correctos con listas/valores del sistema |
| S. aureus — lecturas, controles y confirmación | Placa 1/2, duplicado, controles positivo/negativo/blanco y regla de confirmación | 3-4 | Flujo habilita/salta confirmación según desarrollo/umbral confirmado |
| S. aureus — cálculo final | Consolidar cálculo/resultados al final | 4 | Resultado final calculado desde datos capturados sin tablas repetidas intermedias |
| Coliformes — decisión + base compartida | Confirmar UX y evitar triple captura de datos base | 4-5 | Prototipo/base común con CT/CF/E. coli sin duplicar analista/datos iniciales |
| Coliformes — ramas de confirmación | Implementar diferencias CT/CF/E. coli según decisión cliente | 5-6 | Flujo demuestra ramas y dependencia E. coli/fecales si aplica |
| Enterobacterias | Confirmar catálogo y generación propia | 6 | Análisis Enterobacterias genera su formulario correcto |
| MOHOS discovery | Levantar fuente real antes de implementación | 6-7 | Documento/ficha de fuente aprobada o decisión de postergación |
| Cierre de realineación | Ajustar feedback semanal, pruebas y documentación | 7 | Flujo validado end-to-end con cliente: ingreso → validación → comanda → formularios priorizados |

**Regla de planificación:** cada sprint/ciclo debe entregar una pieza revisable por cliente. No agrupar “reescribir formulario completo” si no puede demostrarse y revisarse dentro de la semana.

## Recomendación siguiente: sdd-propose

Pasar a `sdd-propose` para convertir esta exploración en propuesta formal: problema, alcance, fuera de alcance, reglas confirmadas, preguntas al cliente, cortes por sprints 1-7 y estrategia de PRs encadenados. La propuesta debe dejar explícito que la base es transcript + Excel/código, no PDF-first.

## Affected Areas

- `openspec/changes/assistec-form-business-rule-realignment/exploration.md` — artifact de exploración actualizado en español.
- `AssisTec API/src/services/solicitud.service.js` — gate de doble validación y rechazo.
- `AssisTec API/src/services/formularioMicrobiologico.service.js` — mapa de generación microbiológica.
- `AssisTec API/src/repositories/muestraAli.repository.js` — tarjetas ALI y ruta incorrecta de Salmonella.
- `Frontend/src/app/app-routing.module.ts` — ruta faltante de Salmonella.
- `Frontend/src/app/components/header/header.component.ts` — reconocimiento de rutas de formularios.
- `Frontend/src/app/pages/validacion-solicitudes/*` — panel dedicado de validación.
- `Frontend/src/app/pages/solicitud-ingreso/*` — corrección/rechazo y selección muestra/submuestra/análisis.
- `Frontend/src/app/pages/form-s-aureus/*` — reestructuración mayor.
- `Frontend/src/app/pages/form-coliformes/*` — base compartida CT/CF/E. coli.
- `Frontend/src/app/pages/form-salmonella/*` — ruta y alineación de dominio.
- `Frontend/src/app/pages/form-enterobacterias/*` — separación de Salmonella y generación propia.

## Ready for Proposal

Sí. El siguiente paso debe formular el cambio como realineación de negocio guiada por reunión, con cortes semanales demostrables y base suficiente para crear/actualizar actividades Linear después, sin crear issues todavía.
