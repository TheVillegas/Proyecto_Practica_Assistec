const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Dropping old constraint...");
    await prisma.$executeRawUnsafe(`ALTER TABLE lotes_reactivo DROP CONSTRAINT IF EXISTS lotes_reactivo_tipo_check;`);
    
    console.log("Adding new constraint...");
    await prisma.$executeRawUnsafe(`ALTER TABLE lotes_reactivo ADD CONSTRAINT lotes_reactivo_tipo_check CHECK (tipo IN ('agar_vrbg', 'tween_80', 'agar_baird_parker', 'caldo_bhi'));`);
    
    console.log("Inserting Agar Baird Parker...");
    await prisma.$executeRawUnsafe(`
      INSERT INTO lotes_reactivo (tipo, codigo_lote, fecha_vencimiento, activo) 
      VALUES ('agar_baird_parker', 'BP-LOTE-001', '2026-12-31', true) 
      ON CONFLICT (codigo_lote) DO NOTHING;
    `);
    
    console.log("Done!");
  } catch (error) {
    console.error("Error updating DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
