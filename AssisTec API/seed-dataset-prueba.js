/**
 * LAB-22: Dataset mínimo de prueba para Incremento 3
 * 
 * Crea una solicitud completa con muestras y análisis para:
 * - Coliformes Totales, Fecales, E. coli
 * - Enterobacterias
 * - Salmonella
 * - S. Aureus
 * 
 * Uso: node seed-dataset-prueba.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔬 Creando dataset de prueba LAB-22...\n');

  // 1. Buscar o crear cliente de prueba
  let cliente = await prisma.cliente.findFirst({ where: { nombre: 'Laboratorio Demo' } });
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nombre: 'Laboratorio Demo',
        rut: '11111111-1',
        email: 'demo@assistec.local',
        telefono: '+56911111111',
        activo: 'S'
      }
    });
    console.log('  ✅ Cliente creado: Laboratorio Demo');
  } else {
    console.log('  [=] Cliente ya existe: Laboratorio Demo');
  }

  let direccion = await prisma.direccionCliente.findFirst({ where: { idCliente: cliente.idCliente, alias: 'Demo Principal' } });
  if (!direccion) {
    direccion = await prisma.direccionCliente.create({
      data: {
        idCliente: cliente.idCliente,
        alias: 'Demo Principal',
        direccion: 'Av. Prueba 123',
        solicitadoPorDefault: 'Demo Tester',
        activo: true
      }
    });
    console.log('  ✅ Dirección cliente creada');
  }

  // 2. Buscar usuario analista
  const analista = await prisma.usuario.findFirst({ where: { rutUsuario: '11111111-1' } })
    || await prisma.usuario.findFirst({ where: { rolUsuario: 0 } });

  // 3. Buscar categoría
  let categoria = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Alimento' } });
  if (!categoria) {
    categoria = await prisma.categoriaProducto.create({ data: { idCategoria: 'cat-alimento', nombre: 'Alimento' } });
  }

  // 4. Buscar formularios para los análisis
  const formularios = await prisma.formularioAnalisis.findMany({
    where: {
      codigo: { in: ['COLIFORMES_TOTALES', 'COLIFORMES_FECALES', 'ECOLI_NCH3056', 'ENTEROBACTERIAS', 'SALMONELLA_ISO', 'SAUREUS'] }
    }
  });
  const formMap = {};
  for (const f of formularios) {
    formMap[f.codigo] = f;
  }
  console.log(`  [=] Formularios encontrados: ${Object.keys(formMap).length}`);

  const termometro = await prisma.equipoLab.findFirst();
  const lugar = await prisma.lugarAlmacenamiento.findFirst();
  const now = new Date();

  // 5. Crear solicitud de ingreso
  const anio = new Date().getFullYear();
  const numeroAli = Number(String(Date.now()).slice(-6));
  const codigoDemo = `ALI-DEMO-${Date.now().toString(36).toUpperCase()}`;
  const solicitud = await prisma.solicitudIngreso.create({
    data: {
      numeroAli,
      numeroActa: 'ACTA-DEMO-001',
      codigoExterno: codigoDemo,
      fechaRecepcion: new Date(),
      temperaturaRecepcion: 4.5,
      anioIngreso: anio,
      fechaInicioMuestreo: new Date(),
      fechaTerminoMuestreo: new Date(),
      categoriaId: categoria.idCategoria,
      idCliente: cliente.idCliente,
      idDireccion: direccion.idDireccion,
      idTermometro: termometro.idEquipo,
      lugarMuestreo: 'Laboratorio Central',
      instructivoMuestreo: 'Instructivo Demo LAB-22',
      cantidadMuestras: 6,
      cantEnvases: 6,
      envasesSuministradosPor: 'Cliente',
      idLugar: lugar.idLugar,
      muestraCompartidaQuimica: true,
      observacionesGenerales: 'Dataset de prueba LAB-22',
      observacionesCliente: 'Sin observaciones',
      notasDelCliente: 'Seed de prueba',
      estado: 'borrador',
      rutResponsableIngreso: analista?.rutUsuario || '0-0',
      rutCoordinaroraRecepcion: analista?.rutUsuario || '0-0',
      rutJefaArea: analista?.rutUsuario || '11111111-1',
      responsableMuestreo: 'Demo Tester',
      fechaEnvioValidacion: now,
      fechaEntregaRevisionJefeLab: now,
      motivoDevolucion: '',
      fechaHoraRecepcionCoordinadora: now,
      fechaEntregaResultadoNegativoMicro: now,
      diasHabilesResultadoNegativo: 2,
      fechaEntregaResultadoPositivoMicro: now,
      diasHabilesResultadoPositivo: 3,
      fechaHoraRetiroMuestrasSala: now,
      fechaRecepcionAnalista: now,
      fechaSolicitadaEntregaAnalista: now,
      fechaEnvioInformePositivo: now,
      fechaEnvioInformeNegativo: now,
      createdAt: now,
      updatedAt: now,
      createdBy: analista?.rutUsuario || '0-0'
    }
  });
  console.log(`  ✅ Solicitud creada: ${codigoDemo} (id: ${solicitud.idSolicitud})`);

  // 6. Crear muestras
  const muestrasData = [];
  for (let i = 1; i <= 6; i++) {
    muestrasData.push({
      idSolicitud: solicitud.idSolicitud
    });
  }
  await prisma.solicitudMuestra.createMany({ data: muestrasData });
  const muestras = await prisma.solicitudMuestra.findMany({
    where: { idSolicitud: solicitud.idSolicitud },
    orderBy: { idSolicitudMuestra: 'asc' }
  });
  console.log(`  ✅ ${muestras.length} muestras creadas`);

  // 7. Crear análisis para cada tipo
  const tiposAnalisis = [
    { codigo: 'COLIFORMES_TOTALES', nombre: 'Coliformes Totales' },
    { codigo: 'COLIFORMES_FECALES', nombre: 'Coliformes Fecales' },
    { codigo: 'ECOLI_NCH3056', nombre: 'E. coli' },
    { codigo: 'ENTEROBACTERIAS', nombre: 'Enterobacterias' },
    { codigo: 'SALMONELLA_ISO', nombre: 'Salmonella' },
    { codigo: 'SAUREUS', nombre: 'S. Aureus' },
  ];

  const analisisCreados = [];
  let currentAnalisisMax = await prisma.solicitudAnalisis.aggregate({ _max: { idSolicitudAnalisis: true } });
  let nextAnalisisId = currentAnalisisMax._max.idSolicitudAnalisis ? BigInt(currentAnalisisMax._max.idSolicitudAnalisis) + 1n : 1n;
  for (const tipo of tiposAnalisis) {
    const formulario = formMap[tipo.codigo];
    if (!formulario) {
      console.log(`  ⚠️  Formulario no encontrado para ${tipo.codigo}, saltando...`);
      continue;
    }
    // Crear un análisis para la primera muestra
    const muestra = muestras[0];
    const analisis = await prisma.solicitudAnalisis.create({
      data: {
        idSolicitudAnalisis: nextAnalisisId,
        idSolicitudMuestra: muestra.idSolicitudMuestra,
        idFormularioAnalisis: formulario.idFormularioAnalisis,
        metodologiaNorma: `Demo ${tipo.codigo}`
      }
    });
    nextAnalisisId += 1n;
    analisisCreados.push({ ...analisis, tipo: tipo.nombre, codigo: tipo.codigo });
    console.log(`  ✅ Análisis creado: ${tipo.nombre} (id: ${analisis.idSolicitudAnalisis})`);
  }

  // 8. Actualizar solicitud a estado validada para que se creen formularios
  await prisma.solicitudIngreso.update({
    where: { idSolicitud: solicitud.idSolicitud },
    data: { estado: 'validada' }
  });
  console.log(`\n  ✅ Solicitud validada: ${codigoDemo}`);

  // 9. Crear formularios microbiológicos manualmente (findOrCreate ya lo maneja,
  //    pero los creamos explícitamente para el seed)
  console.log('\n📋 Creando formularios microbiológicos...');
  
  for (const a of analisisCreados) {
    try {
      const bigIntId = BigInt(a.idSolicitudAnalisis);
      const muestraId = muestras[0].idSolicitudMuestra;

      if (a.codigo === 'COLIFORMES_TOTALES' || a.codigo === 'COLIFORMES_FECALES' || a.codigo === 'ECOLI_NCH3056') {
        const existente = await prisma.coliFormulario.findFirst({ where: { idSolicitudAnalisis: bigIntId } });
        if (!existente) {
          await prisma.coliFormulario.create({
            data: {
              idSolicitudAnalisis: bigIntId,
              estado: 'NO_REALIZADO',
              muestras: {
                create: {
                  idSolicitudMuestra: muestraId,
                  numeroMuestra: '1',
                  esDuplicado: false,
                  pesoMuestraTipo: '10g/90ml',
                  orden: 1
                }
              }
            }
          });
          console.log(`  ✅ Formulario Coliformes creado para ${a.tipo}`);
        }
      } else if (a.codigo === 'ENTEROBACTERIAS') {
        const existente = await prisma.entFormulario.findFirst({ where: { idSolicitudAnalisis: bigIntId } });
        if (!existente) {
          await prisma.entFormulario.create({
            data: {
              idSolicitudAnalisis: bigIntId,
              estado: 'en_proceso',
              etapaActual: 1,
              subetapaActual: 1,
              muestras: {
                create: {
                  idSolicitudMuestra: muestraId,
                  numeroMuestra: '1',
                  esDuplicado: false,
                  pesoMuestraTipo: '10g/90ml',
                  orden: 1
                }
              }
            }
          });
          console.log(`  ✅ Formulario Enterobacterias creado para ${a.tipo}`);
        }
      } else if (a.codigo === 'SALMONELLA_ISO') {
        const existente = await prisma.salFormulario.findFirst({ where: { idSolicitudAnalisis: bigIntId } });
        if (!existente) {
          await prisma.salFormulario.create({
            data: {
              idSolicitudAnalisis: bigIntId,
              estado: 'NO_REALIZADO',
              muestras: {
                create: {
                  idSolicitudMuestra: muestraId,
                  numeroMuestra: '1',
                  esDuplicado: false,
                  orden: 1
                }
              }
            }
          });
          console.log(`  ✅ Formulario Salmonella creado para ${a.tipo}`);
        }
      } else if (a.codigo === 'SAUREUS') {
        const existente = await prisma.sauFormulario.findFirst({ where: { idSolicitudAnalisis: bigIntId } });
        if (!existente) {
          await prisma.sauFormulario.create({
            data: {
              idSolicitudAnalisis: bigIntId,
              estado: 'NO_REALIZADO',
              muestras: {
                create: {
                  idSolicitudMuestra: muestraId,
                  numeroMuestra: '1',
                  esDuplicado: false,
                  orden: 1
                }
              }
            }
          });
          console.log(`  ✅ Formulario S. Aureus creado para ${a.tipo}`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Error creando formulario ${a.tipo}: ${err.message}`);
    }
  }

  console.log('\n🎉 Dataset de prueba LAB-22 creado exitosamente.');
  console.log(`   ALI: ${codigoDemo}`);
  console.log(`   Solicitud ID: ${solicitud.idSolicitud}`);
  console.log(`   Análisis creados: ${analisisCreados.length}`);
  console.log('\n   IDs de SolicitudAnalisis:');
  for (const a of analisisCreados) {
    console.log(`     ${a.tipo}: ${a.idSolicitudAnalisis}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
