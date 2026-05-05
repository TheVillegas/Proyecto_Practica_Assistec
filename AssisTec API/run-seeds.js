const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HASH_123456 = '$2a$10$PyOv/5AsWJFcyPn0l7Eg0uNZtrqdWfh.hiKDftNeTlW5H6/pYZCuS';

const usuarios = [
  { rutUsuario: '0-0', nombreApellidoUsuario: 'Analista Prueba',     correoUsuario: 'analista@lab.cl', contrasenaUsuario: HASH_123456, rolUsuario: 0, urlFoto: '' },
  { rutUsuario: '1-1', nombreApellidoUsuario: 'Coordinadora Prueba', correoUsuario: 'coord@lab.cl',    contrasenaUsuario: HASH_123456, rolUsuario: 1, urlFoto: '' },
  { rutUsuario: '2-2', nombreApellidoUsuario: 'Jefe de Area Prueba', correoUsuario: 'jefe@lab.cl',     contrasenaUsuario: HASH_123456, rolUsuario: 2, urlFoto: '' },
  { rutUsuario: '3-3', nombreApellidoUsuario: 'Ingreso Prueba',      correoUsuario: 'ingreso@lab.cl',  contrasenaUsuario: HASH_123456, rolUsuario: 3, urlFoto: '' },
];

async function main() {
  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { rutUsuario: u.rutUsuario },
      update: {},
      create: u,
    });
  }
  console.log('Seeds ejecutados correctamente');
}

main().catch(console.error).finally(() => prisma.$disconnect());
