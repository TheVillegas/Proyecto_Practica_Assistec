-- Seeds idempotentes para Solicitud de Ingreso ASISTEC.
-- Fuentes: PDFs entregados por ASISTEC:
-- - Dias de Calculoo.xlsx - Hojas de calculo de Google.pdf
-- - Acreditaciones.pdf
-- - Alcance Acreditaciones.pdf

INSERT INTO equipos_lab (nombre_equipo, codigo_equipo)
SELECT v.nombre, v.codigo
FROM (VALUES
  ('Balanza 74-M', '74-M'),
  ('Camara Flujo laminar 8-M', '8-M'),
  ('Balanza 6-M', '6-M'),
  ('Meson de Transpaso', 'MES-TR'),
  ('Balanza 99-M', '99-M'),
  ('Balanza 108-M', '108-M'),
  ('Bano-5m', '5-M'),
  ('Homogenizador 12-m', '12-M'),
  ('Cuenta colonias 9-M', '9-M'),
  ('Cuenta Colonias 101-m', '101-M'),
  ('pHmetro 93-m', '93-M'),
  ('Pipetas desechables', 'Pip-Des'),
  ('Termometro', '10-T-I'),
  ('Refrigerador 2-I', '2-I')
) AS v(nombre, codigo)
WHERE NOT EXISTS (SELECT 1 FROM equipos_lab e WHERE e.codigo_equipo = v.codigo);

INSERT INTO lugares_almacenamiento (nombre_lugar, codigo_lugar)
SELECT v.nombre, v.codigo
FROM (VALUES
  ('Refrigerador 2-I', '2-I')
) AS v(nombre, codigo)
WHERE NOT EXISTS (SELECT 1 FROM lugares_almacenamiento l WHERE l.codigo_lugar = v.codigo);

INSERT INTO categorias_producto (nombre)
SELECT v.nombre
FROM (VALUES
  ('Productos Hidrobiologicos'),
  ('Harina de pescado'),
  ('Alimento'),
  ('Conservas'),
  ('Aceite de pescado'),
  ('Aguas'),
  ('Manipuladores'),
  ('Superficie'),
  ('CECINAS BIANCHINI'),
  ('Compost'),
  ('Cliente Knop')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM categorias_producto c WHERE c.nombre = v.nombre);

INSERT INTO formularios_analisis (codigo, nombre_analisis, area, genera_tpa_default)
SELECT v.codigo, v.nombre, v.area, v.tpa
FROM (VALUES
  ('TPA', 'Tecnica Placa Aerobia', 'Microbiologia', TRUE),
  ('RAM35', 'RAM 35C', 'Microbiologia', FALSE),
  ('ECOLI_NCH3056', 'E. coli (NCh3056)', 'Microbiologia', FALSE),
  ('VIBRIO', 'Vibrio', 'Microbiologia', FALSE),
  ('SAUREUS', 'Staphylococcus aureus', 'Microbiologia', FALSE),
  ('LISTERIA_PA_NCH', 'Listeria P/A NCh', 'Microbiologia', FALSE),
  ('LISTERIA_PA_ISO', 'Listeria P/A ISO', 'Microbiologia', FALSE),
  ('LISTERIA_UFC', 'Listeria ufc', 'Microbiologia', FALSE),
  ('SALMONELLA', 'Salmonella', 'Microbiologia', FALSE),
  ('SALMONELLA_ISO', 'Salmonella ISO', 'Microbiologia', FALSE),
  ('COLIFORMES_TOTALES', 'Coliformes totales', 'Microbiologia', FALSE),
  ('COLIFORMES_FECALES', 'Coliformes fecales', 'Microbiologia', FALSE),
  ('ENTEROBACTERIAS', 'Enterobacterias', 'Microbiologia', FALSE),
  ('HONGOS_LEVADURAS', 'Hongos y Levaduras', 'Microbiologia', FALSE),
  ('BACILLUS', 'Bacillus', 'Microbiologia', FALSE),
  ('CLOSTRIDIUM', 'Clostridium', 'Microbiologia', FALSE),
  ('METALES', 'Metales', 'Quimica', FALSE),
  ('HUMEDAD', 'Humedad', 'Quimica', FALSE),
  ('HISTAMINA', 'Histamina', 'Quimica', FALSE),
  ('SODIO', 'Sodio', 'Quimica', FALSE),
  ('HIERRO', 'Hierro', 'Quimica', FALSE),
  ('CALCIO', 'Calcio', 'Quimica', FALSE),
  ('NBVT', 'NBVT', 'Quimica', FALSE),
  ('NTMA', 'NTMA', 'Quimica', FALSE),
  ('EVAL_ENVASE', 'Evaluacion de envase', 'Fisico-Organoleptica', FALSE),
  ('SENSORIAL', 'Sensorial', 'Fisico-Organoleptica', FALSE)
) AS v(codigo, nombre, area, tpa)
WHERE NOT EXISTS (SELECT 1 FROM formularios_analisis f WHERE f.codigo = v.codigo);

INSERT INTO accreditaciones_inn
  (id_acreditacion, codigo, area, subarea, fecha_vigencia_desde, fecha_vigente_hasta, url_certificado)
VALUES
  (261, 'LE 261', 'Microbiologia para productos hidrobiologicos', 'Convenio INN-Sernapesca', '2024-11-20', '2029-11-20', ''),
  (262, 'LE 262', 'Quimica para productos hidrobiologicos', 'Convenio INN-Sernapesca', '2024-11-20', '2029-11-20', ''),
  (263, 'LE 263', 'Fisico-Organoleptica para productos hidrobiologicos', 'Convenio INN-Sernapesca', '2024-11-20', '2029-11-20', ''),
  (264, 'LE 264', 'Microbiologia y muestreo para alimentos', 'Alimentos y raciones servidas', '2024-11-20', '2029-11-20', ''),
  (265, 'LE 265', 'Quimica y muestreo para alimentos', 'Raciones servidas y alimentos', '2024-11-20', '2029-11-20', ''),
  (692, 'LE 692', 'Microbiologia y muestreo para aguas', 'Agua bebida, cruda y residuales', '2024-11-20', '2029-11-20', ''),
  (1516, 'LE 1516', 'Microbiologia y muestreo para utensilios/superficie/ambiente/manipuladores', '-', '2021-10-07', '2026-10-07', '')
ON CONFLICT (id_acreditacion) DO UPDATE SET
  codigo = EXCLUDED.codigo,
  area = EXCLUDED.area,
  subarea = EXCLUDED.subarea,
  fecha_vigencia_desde = EXCLUDED.fecha_vigencia_desde,
  fecha_vigente_hasta = EXCLUDED.fecha_vigente_hasta;

WITH tiempos(categoria, codigo_formulario, metodologia_norma, dias_negativo, dias_confirmacion) AS (
  VALUES
    ('Productos Hidrobiologicos','RAM35',2659,2,2),
    ('Productos Hidrobiologicos','ECOLI_NCH3056',3056,1,2),
    ('Productos Hidrobiologicos','VIBRIO',21872,2,6),
    ('Productos Hidrobiologicos','SAUREUS',2671,2,4),
    ('Productos Hidrobiologicos','LISTERIA_PA_NCH',2657,1,11),
    ('Productos Hidrobiologicos','LISTERIA_PA_ISO',11290,4,11),
    ('Productos Hidrobiologicos','LISTERIA_UFC',2657,2,9),
    ('Productos Hidrobiologicos','SALMONELLA',2675,4,7),
    ('Productos Hidrobiologicos','SALMONELLA_ISO',6579,3,6),
    ('Productos Hidrobiologicos','COLIFORMES_TOTALES',2635,2,4),
    ('Productos Hidrobiologicos','ENTEROBACTERIAS',2676,1,3),
    ('Productos Hidrobiologicos','HISTAMINA',2637,5,NULL),
    ('Alimento','RAM35',2659,2,2),
    ('Alimento','ECOLI_NCH3056',3056,1,2),
    ('Alimento','VIBRIO',21872,2,6),
    ('Alimento','SAUREUS',2671,2,4),
    ('Alimento','LISTERIA_PA_NCH',2657,1,11),
    ('Alimento','LISTERIA_UFC',2657,4,9),
    ('Alimento','LISTERIA_PA_ISO',11290,4,6),
    ('Alimento','SALMONELLA',2675,4,7),
    ('Alimento','COLIFORMES_TOTALES',2635,2,4),
    ('Alimento','ENTEROBACTERIAS',2676,1,3),
    ('Alimento','CLOSTRIDIUM',0,1,7),
    ('Alimento','BACILLUS',0,1,7),
    ('Alimento','SODIO',0,6,NULL),
    ('Alimento','HIERRO',0,9,NULL),
    ('Alimento','CALCIO',0,8,NULL),
    ('Aguas','COLIFORMES_TOTALES',9221,2,4),
    ('Aguas','COLIFORMES_FECALES',9221,3,3),
    ('Aguas','ECOLI_NCH3056',9221,2,3),
    ('Aguas','RAM35',9215,1,1),
    ('Manipuladores','RAM35',0,2,2),
    ('Manipuladores','HONGOS_LEVADURAS',0,5,5),
    ('Manipuladores','ECOLI_NCH3056',2636,2,11),
    ('Manipuladores','SAUREUS',2671,2,6),
    ('Manipuladores','ENTEROBACTERIAS',2676,1,3),
    ('Superficie','LISTERIA_PA_NCH',2657,4,11)
)
INSERT INTO tiempos_por_categoria
  (id_categoria_producto, id_formulario_analisis, metodologia_norma, dias_negativo, dias_confirmacion)
SELECT c.id_categoria, f.id_formularios_analisis, t.metodologia_norma, t.dias_negativo, COALESCE(t.dias_confirmacion, t.dias_negativo)
FROM tiempos t
JOIN categorias_producto c ON c.nombre = t.categoria
JOIN formularios_analisis f ON f.codigo = t.codigo_formulario
WHERE NOT EXISTS (
  SELECT 1 FROM tiempos_por_categoria x
  WHERE x.id_categoria_producto = c.id_categoria
    AND x.id_formulario_analisis = f.id_formularios_analisis
);

WITH alcances(codigo_le, categoria, codigo_formulario, norma, texto) AS (
  VALUES
    ('LE 261','Productos Hidrobiologicos','COLIFORMES_TOTALES','NCh2635/1.Of2001','Determinacion de Coliformes totales'),
    ('LE 261','Productos Hidrobiologicos','LISTERIA_PA_ISO','ISO 11290-1:2017','Deteccion de Listeria monocytogenes'),
    ('LE 261','Productos Hidrobiologicos','SALMONELLA_ISO','ISO 6579-1:2017','Deteccion de Salmonella spp.'),
    ('LE 261','Productos Hidrobiologicos','SAUREUS','ISO 6888-3:2003 / GOST 31746-2012','Deteccion de Staphylococcus aureus'),
    ('LE 261','Productos Hidrobiologicos','VIBRIO','ISO 21872-1:2017','Deteccion de Vibrio parahaemolyticus'),
    ('LE 261','Productos Hidrobiologicos','RAM35','NCh2659.Of2002','Determinacion de aerobios mesofilos 35C'),
    ('LE 261','Productos Hidrobiologicos','ECOLI_NCH3056','NCh3056.Of2007','Determinacion de Escherichia coli'),
    ('LE 262','Productos Hidrobiologicos','HISTAMINA','NCh2637.Of2001','Histamina'),
    ('LE 262','Productos Hidrobiologicos','HUMEDAD','NCh2670.Of2001 Metodo A y B','Humedad'),
    ('LE 263','Productos Hidrobiologicos','EVAL_ENVASE','Manual Inocuidad Sernapesca','Evaluacion del envase'),
    ('LE 264','Alimento','LISTERIA_PA_ISO','ISO 11290-1:2017','Deteccion de Listeria monocytogenes'),
    ('LE 264','Alimento','SALMONELLA_ISO','NCh2675.Of2002','Deteccion de Salmonella spp.'),
    ('LE 264','Alimento','RAM35','NCh2659.Of2002','Determinacion de aerobio mesofilo a 35C'),
    ('LE 264','Alimento','BACILLUS','FDA BAM Cap. 14, 2001','Determinacion de Bacillus cereus'),
    ('LE 264','Alimento','CLOSTRIDIUM','FDA BAM Cap. 16, 2001','Determinacion de Clostridium perfringens'),
    ('LE 264','Alimento','COLIFORMES_TOTALES','NCh2635/1.Of2001','Determinacion de Coliformes totales'),
    ('LE 264','Alimento','ENTEROBACTERIAS','NCh2676.Of2002','Determinacion de Enterobacteriaceae'),
    ('LE 264','Alimento','ECOLI_NCH3056','NCh2636.Of2001','Determinacion de Escherichia coli'),
    ('LE 264','Alimento','HONGOS_LEVADURAS','NCh2734.Of2002','Determinacion de hongos y levaduras'),
    ('LE 264','Alimento','SAUREUS','NCh2671.Of2002','Determinacion de Staphylococcus aureus'),
    ('LE 265','Alimento','SODIO','MET-DSEAA-Q rev05 / AOAC 985.35 (2016)','Sodio'),
    ('LE 692','Aguas','RAM35','Standard Methods 24th Ed. 2023 9215B','Bacterias heterotrofas'),
    ('LE 692','Aguas','COLIFORMES_FECALES','Standard Methods 24th Ed. 2023 9221 E-1 Medio EC','Coliformes fecales'),
    ('LE 1516','Manipuladores','RAM35','Metodo interno ASISTEC','Aerobios'),
    ('LE 1516','Superficie','LISTERIA_PA_NCH','NCh2657.Of2001','Listeria en superficie')
)
INSERT INTO alcance_acreditacion
  (id_acreditacion, id_formulario_analisis, id_categoria_producto, norma_especifica, texto_alcance_original, excepciones)
SELECT a.id_acreditacion, f.id_formularios_analisis, c.id_categoria, al.norma, al.texto, ''
FROM alcances al
JOIN accreditaciones_inn a ON a.codigo = al.codigo_le
JOIN categorias_producto c ON c.nombre = al.categoria
JOIN formularios_analisis f ON f.codigo = al.codigo_formulario
WHERE NOT EXISTS (
  SELECT 1 FROM alcance_acreditacion x
  WHERE x.id_acreditacion = a.id_acreditacion
    AND x.id_formulario_analisis = f.id_formularios_analisis
    AND x.id_categoria_producto = c.id_categoria
    AND x.norma_especifica = al.norma
);
