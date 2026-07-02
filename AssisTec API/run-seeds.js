const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HASH_123456 = '$2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedIfEmpty(model, label, data) {
  const count = await model.count();
  if (count === 0) {
    await model.createMany({ data });
    console.log(`  [+] ${label}: ${data.length} registros insertados`);
  } else {
    console.log(`  [=] ${label}: ya tiene datos (${count} registros), se omite`);
  }
}

// ─── Catálogos base ───────────────────────────────────────────────────────────

async function seedDiluyentes() {
  await seedIfEmpty(prisma.diluyente, 'Diluyentes', [
    { nombreDiluyente: 'AP 0,1 90ml',    mililitros: '90 ml'  },
    { nombreDiluyente: 'AP 0,1 99ml',    mililitros: '99 ml'  },
    { nombreDiluyente: 'AP 0,1 450ml',   mililitros: '450 ml' },
    { nombreDiluyente: 'AP 0,1 225ml',   mililitros: '225 ml' },
    { nombreDiluyente: 'AP 0,1 500ml',   mililitros: '500 ml' },
    { nombreDiluyente: 'AP 0,1 tubosml', mililitros: 'Tubos'  },
    { nombreDiluyente: 'PBS 450 ml',     mililitros: '450 ml' },
    { nombreDiluyente: 'SPS 225 ml',     mililitros: '225 ml' },
    { nombreDiluyente: 'SPS Tubos',      mililitros: 'Tubos'  },
    { nombreDiluyente: 'SPS sa 90ml',    mililitros: '90 ml'  },
    { nombreDiluyente: 'SPS sa tubos',   mililitros: 'Tubos'  },
  ]);
}

async function seedEquiposIncubacion() {
  await seedIfEmpty(prisma.equipoIncubacion, 'Equipos Incubacion', [
    { nombreEquipo: 'Estufa 73-M (35+/-0,5C)',   temperaturaRef: '35+/-0,5C'   },
    { nombreEquipo: 'Estufa 2-M(35.5+/-0,5C)',   temperaturaRef: '35.5+/-0,5C' },
  ]);
}

async function seedBanosTermicos() {
  await seedIfEmpty(prisma.banoTermico, 'Baños Termicos', [
    { nombreEquipo: 'Baño 30-M', temperaturaRef: '41 a 42.5°C' },
    { nombreEquipo: '96-M',      temperaturaRef: '41 a 42.5°C' },
  ]);
}

async function seedEquiposLab() {
  await seedIfEmpty(prisma.equipoLab, 'Equipos Lab', [
    { nombreEquipo: 'Balanza 74-M',                codigoEquipo: '74-M'    },
    { nombreEquipo: 'Camara Flujo laminar 8-M',    codigoEquipo: '8-M'     },
    { nombreEquipo: 'Balanza 6-M',                 codigoEquipo: '6-M'     },
    { nombreEquipo: 'Meson de Transpaso',           codigoEquipo: 'MES-TR'  },
    { nombreEquipo: 'Balanza 99-M',                codigoEquipo: '99-M'    },
    { nombreEquipo: 'Balanza 108-M',               codigoEquipo: '108-M'   },
    { nombreEquipo: 'Bano-5m',                     codigoEquipo: '5-M'     },
    { nombreEquipo: 'Homogenizador 12-m',          codigoEquipo: '12-M'    },
    { nombreEquipo: 'Cuenta colonias 9-M',         codigoEquipo: '9-M'     },
    { nombreEquipo: 'Cuenta Colonias 101-m',       codigoEquipo: '101-M'   },
    { nombreEquipo: 'pHmetro 93-m',                codigoEquipo: '93-M'    },
    { nombreEquipo: 'Pipetas desechables',         codigoEquipo: 'Pip-Des' },
    { nombreEquipo: 'Termometro',                  codigoEquipo: '10-T-I'  },
    { nombreEquipo: 'Refrigerador 2-I',            codigoEquipo: '2-I'     },
  ]);
}

async function seedInstrumentos() {
  await seedIfEmpty(prisma.instrumento, 'Instrumentos', [
    { nombreInstrumento: 'Cuchara',  codigoInstrumento: 'cuchara'  },
    { nombreInstrumento: 'Bisturi',  codigoInstrumento: 'bisturi'  },
    { nombreInstrumento: 'Pinzas',   codigoInstrumento: 'pinzas'   },
    { nombreInstrumento: 'Cuchillo', codigoInstrumento: 'cuchillo' },
  ]);
}

async function seedLugaresAlmacenamiento() {
  await seedIfEmpty(prisma.lugarAlmacenamiento, 'Lugares Almacenamiento', [
    { nombreLugar: 'Freezer 33-M',          codigoLugar: 'FR-33M'    },
    { nombreLugar: 'Refrigerador 33-M',     codigoLugar: 'RF-33M'    },
    { nombreLugar: 'Refrigerador 2-I',      codigoLugar: '2-I'       },
    { nombreLugar: 'Meson Siembra',         codigoLugar: 'MES-SIEM'  },
    { nombreLugar: 'Gabinete sala Transpaso', codigoLugar: 'GAB-TRANS' },
  ]);
}

async function seedMaestroChecklistLimpieza() {
  const items = [
    { idItem: 1, nombreItem: 'Meson',                      defSeleccionado: 1, defBloqueado: 1 },
    { idItem: 2, nombreItem: 'Stomacher 12-M',             defSeleccionado: 0, defBloqueado: 0 },
    { idItem: 3, nombreItem: 'Camara Flujo laminar 8-M',   defSeleccionado: 0, defBloqueado: 0 },
    { idItem: 4, nombreItem: 'Balanza 74-M/108-M',         defSeleccionado: 0, defBloqueado: 0 },
    { idItem: 5, nombreItem: 'Balanza 6-M/99-M',           defSeleccionado: 0, defBloqueado: 0 },
    { idItem: 6, nombreItem: 'Gabinete',                   defSeleccionado: 0, defBloqueado: 0 },
    { idItem: 7, nombreItem: 'Desinfectante en aerosol',   defSeleccionado: 1, defBloqueado: 1 },
  ];
  for (const item of items) {
    await prisma.maestroChecklistLimpieza.upsert({
      where: { idItem: item.idItem },
      update: {},
      create: item,
    });
  }
  console.log('  [+] Maestro Checklist Limpieza: 7 registros');
}

async function seedMaestroFormasCalculo() {
  const formas = [
    { idForma: 1, nombreForma: 'Calculadora',               defSeleccionado: 0 },
    { idForma: 2, nombreForma: 'Plantillas Excel (Almacenar)', defSeleccionado: 0 },
    { idForma: 3, nombreForma: 'Software',                  defSeleccionado: 1 },
  ];
  for (const forma of formas) {
    await prisma.maestroFormasCalculo.upsert({
      where: { idForma: forma.idForma },
      update: {},
      create: forma,
    });
  }
  console.log('  [+] Maestro Formas Calculo: 3 registros');
}

async function seedMaestroTiposAnalisis() {
  await seedIfEmpty(prisma.maestroTiposAnalisis, 'Maestro Tipos Analisis', [
    { nombreAnalisis: 'Ram'      },
    { nombreAnalisis: 'Hongos'   },
    { nombreAnalisis: 'Ram Ruso' },
  ]);
}

async function seedMaterialSiembra() {
  await seedIfEmpty(prisma.materialSiembra, 'Material Siembra', [
    { nombreMaterial: 'Puntas 1 ML',                  detalleMedida: '1 ML'   },
    { nombreMaterial: 'Puntas 10ML',                  detalleMedida: '10 ML'  },
    { nombreMaterial: 'Placas esteriles 57cm2/150mm', detalleMedida: '150mm'  },
    { nombreMaterial: 'Asas Drigalsky',               detalleMedida: 'Estandar' },
    { nombreMaterial: 'Blender',                      detalleMedida: 'Unidad' },
    { nombreMaterial: 'Bolsas esteriles',             detalleMedida: 'Unidad' },
    { nombreMaterial: 'Probeta 250 ML',               detalleMedida: '250 ML' },
    { nombreMaterial: 'Probeta 100 ML',               detalleMedida: '100 ML' },
  ]);
}

async function seedMicropipetas() {
  await seedIfEmpty(prisma.micropipeta, 'Micropipetas', [
    { nombrePipeta: 'Micropipeta 22-M',  codigoPipeta: '22-M',  capacidad: '1 ML'  },
    { nombrePipeta: 'Micropipeta 23-M',  codigoPipeta: '23-M',  capacidad: '1 ML'  },
    { nombrePipeta: 'Micropipeta 72-M',  codigoPipeta: '72-M',  capacidad: '1 ML'  },
    { nombrePipeta: 'Micropipeta 98-M',  codigoPipeta: '98-M',  capacidad: '1 ML'  },
    { nombrePipeta: 'Micropipeta 100-M', codigoPipeta: '100-M', capacidad: '1 ML'  },
    { nombrePipeta: 'Micropipeta 102-M', codigoPipeta: '102-M', capacidad: '1 ML'  },
    { nombrePipeta: 'Micropipeta 32-M',  codigoPipeta: '32-M',  capacidad: '10 ML' },
    { nombrePipeta: 'Micropipeta 75-M',  codigoPipeta: '75-M',  capacidad: '10 ML' },
    { nombrePipeta: 'Micropipeta 94-M',  codigoPipeta: '94-M',  capacidad: '10 ML' },
    { nombrePipeta: 'Micropipeta 103-M', codigoPipeta: '103-M', capacidad: '10 ML' },
    { nombrePipeta: 'Micropipeta 106-M', codigoPipeta: '106-M', capacidad: '10 ML' },
  ]);
}

// ─── Catálogos del nuevo esquema ─────────────────────────────────────────────

async function seedCategorias() {
  const nombres = [
    'Productos Hidrobiologicos', 'Harina de pescado', 'Alimento', 'Conservas',
    'Aceite de pescado', 'Aguas', 'Manipuladores', 'Superficie',
    'CECINAS BIANCHINI', 'Compost', 'Cliente Knop',
  ];
  let insertados = 0;
  for (const nombre of nombres) {
    const existe = await prisma.categoriaProducto.findFirst({ where: { nombre } });
    if (!existe) {
      await prisma.categoriaProducto.create({ data: { nombre } });
      insertados++;
    }
  }
  console.log(`  [+] Categorias Producto: ${insertados} insertadas (${nombres.length - insertados} ya existian)`);
}

async function seedSubcategorias() {
  const subcategorias = [
    { categoria: 'Productos Hidrobiologicos', nombre: 'Pescado Fresco' },
    { categoria: 'Productos Hidrobiologicos', nombre: 'Pescado Congelado' },
    { categoria: 'Productos Hidrobiologicos', nombre: 'Mariscos' },
    { categoria: 'Productos Hidrobiologicos', nombre: 'Algas' },
    { categoria: 'Harina de pescado', nombre: 'Harina de Pescado' },
    { categoria: 'Alimento', nombre: 'Lacteos' },
    { categoria: 'Alimento', nombre: 'Carnicos' },
    { categoria: 'Alimento', nombre: 'Vegetales' },
    { categoria: 'Alimento', nombre: 'Frutas' },
    { categoria: 'Alimento', nombre: 'Cereales' },
    { categoria: 'Conservas', nombre: 'Atun en conserva' },
    { categoria: 'Aceite de pescado', nombre: 'Aceite Crudo' },
    { categoria: 'Aceite de pescado', nombre: 'Aceite Refinado' },
    { categoria: 'Aguas', nombre: 'Agua Potable' },
    { categoria: 'Aguas', nombre: 'Agua de Pozo' },
    { categoria: 'Aguas', nombre: 'Agua Superficial' },
    { categoria: 'Aguas', nombre: 'Agua Residual' },
    { categoria: 'Aguas', nombre: 'Agua de Mar' },
    { categoria: 'Manipuladores', nombre: 'Hisopado de Manipuladores' },
    { categoria: 'Superficie', nombre: 'Hisopado de Superficie' },
    { categoria: 'CECINAS BIANCHINI', nombre: 'Cecinas' },
    { categoria: 'Compost', nombre: 'Compost' },
    { categoria: 'Cliente Knop', nombre: 'Muestra Cliente Knop' },
  ];

  const categorias = await prisma.categoriaProducto.findMany({
    select: { idCategoria: true, nombre: true }
  });
  const categoriaIds = new Map(categorias.map((categoria) => [categoria.nombre, categoria.idCategoria]));

  const existentes = await prisma.subcategoriaProducto.findMany({
    select: { idCategoria: true, nombre: true }
  });
  const existentesSet = new Set(
    existentes.map((subcategoria) => `${String(subcategoria.idCategoria)}::${subcategoria.nombre.toLowerCase()}`)
  );

  let insertados = 0;
  let omitidos = 0;
  const faltantes = new Set();

  for (const subcategoria of subcategorias) {
    const idCategoria = categoriaIds.get(subcategoria.categoria);
    if (!idCategoria) {
      faltantes.add(subcategoria.categoria);
      continue;
    }

    const key = `${String(idCategoria)}::${subcategoria.nombre.toLowerCase()}`;
    if (existentesSet.has(key)) {
      omitidos++;
      continue;
    }

    await prisma.subcategoriaProducto.create({
      data: {
        nombre: subcategoria.nombre,
        idCategoria
      }
    });
    existentesSet.add(key);
    insertados++;
  }

  console.log(`  [+] Subcategorias Producto: ${insertados} insertadas (${omitidos} ya existian)`);
  if (faltantes.size > 0) {
    console.warn(`  [!] Subcategorias omitidas por categorias faltantes: ${Array.from(faltantes).join(', ')}`);
  }
}

async function seedFormularios() {
  const formularios = [
    { codigo: 'TPA',              nombreAnalisis: 'Tecnica Placa Aerobia',      area: 'Microbiologia',          generaTpaDefault: true  },
    { codigo: 'RAM35',            nombreAnalisis: 'RAM 35C',                    area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'ECOLI_NCH3056',    nombreAnalisis: 'E. coli (NCh3056)',          area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'VIBRIO',           nombreAnalisis: 'Vibrio',                     area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'SAUREUS',          nombreAnalisis: 'Staphylococcus aureus',      area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'LISTERIA_PA_NCH',  nombreAnalisis: 'Listeria P/A NCh',          area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'LISTERIA_PA_ISO',  nombreAnalisis: 'Listeria P/A ISO',          area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'LISTERIA_UFC',     nombreAnalisis: 'Listeria ufc',              area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'SALMONELLA',       nombreAnalisis: 'Salmonella',                area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'SALMONELLA_ISO',   nombreAnalisis: 'Salmonella ISO',            area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'COLIFORMES_TOTALES',  nombreAnalisis: 'Coliformes totales',     area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'COLIFORMES_FECALES',  nombreAnalisis: 'Coliformes fecales',     area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'ENTEROBACTERIAS',     nombreAnalisis: 'Enterobacterias',        area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'HONGOS_LEVADURAS',    nombreAnalisis: 'Hongos y Levaduras',     area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'BACILLUS',            nombreAnalisis: 'Bacillus',               area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'CLOSTRIDIUM',         nombreAnalisis: 'Clostridium',            area: 'Microbiologia',          generaTpaDefault: false },
    { codigo: 'METALES',             nombreAnalisis: 'Metales',                area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'HUMEDAD',             nombreAnalisis: 'Humedad',                area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'HISTAMINA',           nombreAnalisis: 'Histamina',              area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'SODIO',               nombreAnalisis: 'Sodio',                  area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'HIERRO',              nombreAnalisis: 'Hierro',                 area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'CALCIO',              nombreAnalisis: 'Calcio',                 area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'NBVT',                nombreAnalisis: 'NBVT',                   area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'NTMA',                nombreAnalisis: 'NTMA',                   area: 'Quimica',                generaTpaDefault: false },
    { codigo: 'EVAL_ENVASE',         nombreAnalisis: 'Evaluacion de envase',   area: 'Fisico-Organoleptica',   generaTpaDefault: false },
    { codigo: 'SENSORIAL',           nombreAnalisis: 'Sensorial',              area: 'Fisico-Organoleptica',   generaTpaDefault: false },
  ];
  let insertados = 0;
  for (const f of formularios) {
    const existe = await prisma.formularioAnalisis.findFirst({ where: { codigo: f.codigo } });
    if (!existe) {
      await prisma.formularioAnalisis.create({ data: f });
      insertados++;
    }
  }
  console.log(`  [+] Formularios Analisis: ${insertados} insertados (${formularios.length - insertados} ya existian)`);
}

async function seedAcreditaciones() {
  const acreditaciones = [
    { idAcreditacion: 261n, codigo: 'LE 261', area: 'Microbiologia para productos hidrobiologicos',                         subarea: 'Convenio INN-Sernapesca',                    fechaVigenciaDesde: new Date('2024-11-20'), fechaVigenteHasta: new Date('2029-11-20'), urlCertificado: '' },
    { idAcreditacion: 262n, codigo: 'LE 262', area: 'Quimica para productos hidrobiologicos',                               subarea: 'Convenio INN-Sernapesca',                    fechaVigenciaDesde: new Date('2024-11-20'), fechaVigenteHasta: new Date('2029-11-20'), urlCertificado: '' },
    { idAcreditacion: 263n, codigo: 'LE 263', area: 'Fisico-Organoleptica para productos hidrobiologicos',                  subarea: 'Convenio INN-Sernapesca',                    fechaVigenciaDesde: new Date('2024-11-20'), fechaVigenteHasta: new Date('2029-11-20'), urlCertificado: '' },
    { idAcreditacion: 264n, codigo: 'LE 264', area: 'Microbiologia y muestreo para alimentos',                             subarea: 'Alimentos y raciones servidas',              fechaVigenciaDesde: new Date('2024-11-20'), fechaVigenteHasta: new Date('2029-11-20'), urlCertificado: '' },
    { idAcreditacion: 265n, codigo: 'LE 265', area: 'Quimica y muestreo para alimentos',                                   subarea: 'Raciones servidas y alimentos',              fechaVigenciaDesde: new Date('2024-11-20'), fechaVigenteHasta: new Date('2029-11-20'), urlCertificado: '' },
    { idAcreditacion: 692n, codigo: 'LE 692', area: 'Microbiologia y muestreo para aguas',                                 subarea: 'Agua bebida, cruda y residuales',            fechaVigenciaDesde: new Date('2024-11-20'), fechaVigenteHasta: new Date('2029-11-20'), urlCertificado: '' },
    { idAcreditacion: 1516n,codigo: 'LE 1516',area: 'Microbiologia y muestreo para utensilios/superficie/ambiente/manipuladores', subarea: '-',                               fechaVigenciaDesde: new Date('2021-10-07'), fechaVigenteHasta: new Date('2026-10-07'), urlCertificado: '' },
  ];
  for (const a of acreditaciones) {
    await prisma.acreditacionInn.upsert({
      where: { idAcreditacion: a.idAcreditacion },
      update: { codigo: a.codigo, area: a.area, subarea: a.subarea, fechaVigenciaDesde: a.fechaVigenciaDesde, fechaVigenteHasta: a.fechaVigenteHasta },
      create: a,
    });
  }
  console.log('  [+] Acreditaciones INN: 7 registros');
}

// Los tiempos y alcances usan JOINs entre tablas — se ejecutan como SQL idempotente
async function seedTiemposYAlcances() {
  await prisma.$executeRawUnsafe(`
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
        ('Productos Hidrobiologicos','HISTAMINA',2637,5,5),
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
        ('Alimento','SODIO',0,6,6),
        ('Alimento','HIERRO',0,9,9),
        ('Alimento','CALCIO',0,8,8),
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
    SELECT c.id_categoria, f.id_formularios_analisis, t.metodologia_norma, t.dias_negativo, t.dias_confirmacion
    FROM tiempos t
    JOIN categorias_producto c ON c.nombre = t.categoria
    JOIN formularios_analisis f ON f.codigo = t.codigo_formulario
    WHERE NOT EXISTS (
      SELECT 1 FROM tiempos_por_categoria x
      WHERE x.id_categoria_producto = c.id_categoria
        AND x.id_formulario_analisis = f.id_formularios_analisis
    )
  `);
  console.log('  [+] Tiempos por Categoria: insertados (idempotente)');

  await prisma.$executeRawUnsafe(`
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
    )
  `);
  console.log('  [+] Alcance Acreditacion: insertados (idempotente)');
}

// ─── Usuarios de prueba ───────────────────────────────────────────────────────

async function seedUsuarios() {
  const usuarios = [
    { rutUsuario: '0-0', nombreApellidoUsuario: 'Analista Prueba',       correoUsuario: 'analista@lab.cl', contrasenaUsuario: HASH_123456, rolUsuario: 0, urlFoto: '' },
    { rutUsuario: '1-1', nombreApellidoUsuario: 'Coordinadora Prueba',   correoUsuario: 'coord@lab.cl',    contrasenaUsuario: HASH_123456, rolUsuario: 1, urlFoto: '' },
    { rutUsuario: '2-2', nombreApellidoUsuario: 'Jefe de Area Prueba',   correoUsuario: 'jefe@lab.cl',     contrasenaUsuario: HASH_123456, rolUsuario: 2, urlFoto: '' },
    { rutUsuario: '3-3', nombreApellidoUsuario: 'Ingreso Prueba',        correoUsuario: 'ingreso@lab.cl',  contrasenaUsuario: HASH_123456, rolUsuario: 3, urlFoto: '' },
    { rutUsuario: '4-4', nombreApellidoUsuario: 'Administrador Prueba',  correoUsuario: 'admin@lab.cl',    contrasenaUsuario: HASH_123456, rolUsuario: 4, urlFoto: '' },
  ];
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { rutUsuario: u.rutUsuario }, update: {}, create: u });
  }
  console.log('  [+] Usuarios: 5 registros (analista, coord, jefe, ingreso, admin)');
}

async function seedUsuarioRoles() {
  // Ensure every user has a primary role in usuario_roles (backfill-compatible)
  const usuarios = await prisma.usuario.findMany({ select: { rutUsuario: true, rolUsuario: true } });
  let insertados = 0;
  for (const u of usuarios) {
    if (u.rolUsuario == null) continue;
    const existe = await prisma.usuarioRol.findUnique({
      where: { rutUsuario_rol: { rutUsuario: u.rutUsuario, rol: u.rolUsuario } }
    });
    if (!existe) {
      await prisma.usuarioRol.create({
        data: { rutUsuario: u.rutUsuario, rol: u.rolUsuario, isPrimary: true }
      });
      insertados++;
    }
  }
  if (insertados > 0) {
    console.log(`  [+] UsuarioRoles: ${insertados} registros nuevos desde rolUsuario`);
  } else {
    console.log('  [=] UsuarioRoles: ya sincronizados');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Ejecutando seeds...');

  // Catalogos base (legacy + nuevo backend)
  await seedDiluyentes();
  await seedEquiposIncubacion();
  await seedBanosTermicos();
  await seedEquiposLab();
  await seedInstrumentos();
  await seedLugaresAlmacenamiento();
  await seedMaestroChecklistLimpieza();
  await seedMaestroFormasCalculo();
  await seedMaestroTiposAnalisis();
  await seedMaterialSiembra();
  await seedMicropipetas();

  // Catalogos del nuevo esquema (solicitud de ingreso)
  await seedCategorias();
  await seedSubcategorias();
  await seedFormularios();
  await seedAcreditaciones();
  await seedTiemposYAlcances();

  // Usuarios de prueba
  await seedUsuarios();
  await seedUsuarioRoles();

  console.log('Seeds completados.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
