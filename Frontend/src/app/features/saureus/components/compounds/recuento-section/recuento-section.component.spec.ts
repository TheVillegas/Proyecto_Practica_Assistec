import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecuentoSectionComponent, Dilucion } from './recuento-section.component';
import { By } from '@angular/platform-browser';

describe('RecuentoSectionComponent', () => {
  let component: RecuentoSectionComponent;
  let fixture: ComponentFixture<RecuentoSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuentoSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RecuentoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formatDilucion', () => {
    it('formatea 10^-2 con superíndice correcto', () => {
      expect(component.formatDilucion(-2)).toBe('10⁻²');
    });

    it('formatea 10^-3 con superíndice correcto', () => {
      expect(component.formatDilucion(-3)).toBe('10⁻³');
    });

    it('formatea 10^-4 con superíndice correcto', () => {
      expect(component.formatDilucion(-4)).toBe('10⁻⁴');
    });
  });

  describe('emisión de cambios', () => {
    it('emite dilucionesChange al cambiar Placa A', () => {
      const nuevasDiluciones: Dilucion[] = [
        { dil: -2, colonias: [42, null] },
        { dil: -3, colonias: [null, null] }
      ];
      spyOn(component.dilucionesChange, 'emit');

      component.onPlacaAChange(0, 42);

      expect(component.dilucionesChange.emit).toHaveBeenCalledWith(nuevasDiluciones);
    });

    it('emite dilucionesChange al cambiar Placa B', () => {
      const nuevasDiluciones: Dilucion[] = [
        { dil: -2, colonias: [null, 35] },
        { dil: -3, colonias: [null, null] }
      ];
      spyOn(component.dilucionesChange, 'emit');

      component.onPlacaBChange(0, 35);

      expect(component.dilucionesChange.emit).toHaveBeenCalledWith(nuevasDiluciones);
    });

    it('emite coloniasPosiblesChange al cambiar colonias A', () => {
      spyOn(component.coloniasPosiblesChange, 'emit');

      component.onColoniasAChange(28);

      expect(component.coloniasPosiblesChange.emit).toHaveBeenCalledWith([28, null]);
    });

    it('emite coloniasPosiblesChange al cambiar colonias B', () => {
      spyOn(component.coloniasPosiblesChange, 'emit');

      component.onColoniasBChange(30);

      expect(component.coloniasPosiblesChange.emit).toHaveBeenCalledWith([null, 30]);
    });
  });

  describe('renderizado por defecto', () => {
    it('muestra filas para cada dilución', () => {
      const filas = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(filas.length).toBe(2);
    });

    it('muestra Placa A y Placa B en cada fila', () => {
      const inputsPlaca = fixture.debugElement.queryAll(By.css('app-placa-input'));
      // 2 diluciones × 2 placas + 2 coloniasPosibles (PA, PB) = 6
      expect(inputsPlaca.length).toBe(6);
    });
  });
});
