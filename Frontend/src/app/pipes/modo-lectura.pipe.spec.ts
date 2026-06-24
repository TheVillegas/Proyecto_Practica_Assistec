import { ModoLecturaPipe } from './modo-lectura.pipe';

describe('ModoLecturaPipe', () => {
  let pipe: ModoLecturaPipe;

  beforeEach(() => {
    pipe = new ModoLecturaPipe();
  });

  it('SHALL return false for rol 0 (Analista) — edición permitida', () => {
    expect(pipe.transform(0)).toBe(false);
  });

  it('SHALL return false for rol 4 (Admin) — edición permitida', () => {
    expect(pipe.transform(4)).toBe(false);
  });

  it('SHALL return true for rol 1 (Coordinadora) — solo lectura', () => {
    expect(pipe.transform(1)).toBe(true);
  });

  it('SHALL return true for rol 2 (Jefe Área) — solo lectura', () => {
    expect(pipe.transform(2)).toBe(true);
  });

  it('SHALL return true for rol 3 (Ingreso) — solo lectura', () => {
    expect(pipe.transform(3)).toBe(true);
  });

  it('SHALL return true for roles desconocidos', () => {
    expect(pipe.transform(99)).toBe(true);
  });
});
