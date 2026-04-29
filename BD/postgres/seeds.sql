-- =======================================================
-- SEEDS: DATOS MAESTROS Y USUARIOS
-- =======================================================

-- 1. Diluyentes
INSERT INTO diluyentes (nombre_diluyente, mililitros) VALUES 
('AP 0,1 90ml', '90 ml'),
('AP 0,1 99ml', '99 ml'),
('AP 0,1 450ml', '450 ml'),
('AP 0,1 225ml', '225 ml'),
('AP 0,1 500ml', '500 ml'),
('AP 0,1 tubosml', 'Tubos'),
('PBS 450 ml', '450 ml'),
('SPS 225 ml', '225 ml'),
('SPS Tubos', 'Tubos'),
('SPS sa 90ml', '90 ml'),
('SPS sa tubos', 'Tubos');

-- 2. Equipos Incubación
INSERT INTO equipos_incubacion (nombre_equipo, temperatura_ref) VALUES 
('Estufa 73-M (35+/-0,5C)', '35+/-0,5C'),
('Estufa 2-M(35.5+/-0,5C)', '35.5+/-0,5C');

-- 3. Equipos Lab
INSERT INTO equipos_lab (nombre_equipo, codigo_equipo) VALUES 
('Balanza 74-M', '74-M'),
('Camara Flujo laminar 8-M', '8-M'),
('Balanza 6-M', '6-M'),
('Meson de Transpaso', 'MES-TR'),
('Balanza 99-M', '99-M'),
('Balanza 108-M', '108-M'),
('Baño-5m', '5-M'),
('Homogenizador 12-m', '12-M'),
('Cuenta colonias 9-M', '9-M'),
('Cuenta Colonias 101-m', '101-M'),
('pHmetro 93-m', '93-M'),
('Pipetas desechables', 'Pip-Des');

-- 4. Instrumentos
INSERT INTO instrumentos (nombre_instrumento, codigo_instrumento) VALUES 
('Cuchara', 'cuchara'),
('Bisturí', 'bisturi'),
('Pinzas', 'pinzas'),
('Cuchillo', 'cuchillo');

-- 5. Lugares Almacenamiento
INSERT INTO lugares_almacenamiento (nombre_lugar, codigo_lugar) VALUES 
('Freezer 33-M', 'FR-33M'),
('Refrigerador 33-M', 'RF-33M'),
('Mesón Siembra', 'MES-SIEM'),
('Gabinete sala Transpaso', 'GAB-TRANS');

-- 6. Checklist Limpieza
INSERT INTO maestro_checklist_limpieza (id_item, nombre_item, def_seleccionado, def_bloqueado) VALUES 
(1, 'Mesón', 1, 1),
(2, 'Stomacher 12-M', 0, 0),
(3, 'Cámara Flujo laminar 8-M', 0, 0),
(4, 'Balanza 74-M/108-M', 0, 0),
(5, 'Balanza 6-M/99-M', 0, 0),
(6, 'Gabinete', 0, 0),
(7, 'Desinfectante en aerosol', 1, 1);

-- 7. Formas de Calculo
INSERT INTO maestro_formas_calculo (id_forma, nombre_forma, def_seleccionado) VALUES 
(1, 'Calculadora', 0),
(2, 'Plantillas Excel (Almacenar)', 0),
(3, 'Software', 1);

-- 8. Tipos de Analisis
INSERT INTO maestro_tipos_analisis (nombre_analisis) VALUES 
('Ram'),
('Hongos'),
('Ram Ruso');

-- 9. Material Siembra
INSERT INTO material_siembra (nombre_material, detalle_medida) VALUES 
('Puntas 1 ML', '1 ML'),
('Puntas 10ML', '10 ML'),
('Placas estériles 57cm2/150mm', '150mm'),
('Asas Drigalsky', 'Estándar'),
('Blender', 'Unidad'),
('Bolsas estériles', 'Unidad'),
('Probeta 250 ML', '250 ML'),
('Probeta 100 ML', '100 ML');

-- 10. Micropipetas
INSERT INTO micropipetas (nombre_pipeta, codigo_pipeta, capacidad) VALUES 
('Micropipeta 22-M', '22-M', '1 ML'),
('Micropipeta 23-M', '23-M', '1 ML'),
('Micropipeta 72-M', '72-M', '1 ML'),
('Micropipeta 98-M', '98-M', '1 ML'),
('Micropipeta 100-M', '100-M', '1 ML'),
('Micropipeta 102-M', '102-M', '1 ML'),
('Micropipeta 32-M', '32-M', '10 ML'),
('Micropipeta 75-M', '75-M', '10 ML'),
('Micropipeta 94-M', '94-M', '10 ML'),
('Micropipeta 103-M', '103-M', '10 ML'),
('Micropipeta 106-M', '106-M', '10 ML');

-- =======================================================
-- USUARIOS DE PRUEBA (Todos tienen clave '123456')
-- Hash bcrypt para '123456' es: $2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS
-- =======================================================
INSERT INTO usuarios (rut_usuario, nombre_apellido_usuario, correo_usuario, contrasena_usuario, rol_usuario, url_foto) VALUES 
('0-0', 'Analista Prueba', 'analista@lab.cl', '$2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS', 0, ''),
('1-1', 'Coordinadora Prueba', 'coord@lab.cl', '$2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS', 1, ''),
('2-2', 'Jefe de Area Prueba', 'jefe@lab.cl', '$2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS', 2, ''),
('3-3', 'Ingreso Prueba', 'ingreso@lab.cl', '$2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS', 3, '');
