import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SaureusMuestraCardComponent, MuestraData } from './saureus-muestra-card.component';

describe('SaureusMuestraCardComponent', () => {
  let component: SaureusMuestraCardComponent;
  let fixture: ComponentFixture<SaureusMuestraCardComponent>;

  const createMuestraData = (overrides: Partial<MuestraData> = {}): MuestraData => ({
    diluciones: [
      { dil: -2, colonias: [null, null] },
      { dil: -3, colonias: [null, null] }
    ],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null],
    ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaureusMuestraCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SaureusMuestraCardComponent);
    component = fixture.componentInstance;
    component.muestraId = 'M1';
    component.numero = 1;
    component.muestraData = createMuestraData();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('renderizado de título y badge', () => {
    it('muestra "MUESTRA 1" cuando no es duplicado', () => {
      component.esDuplicado = false;
      component.numero = 1;
      fixture.detectChanges();

      const titulo = fixture.debugElement.query(By.css('.card-title'));
      expect(titulo.nativeElement.textContent).toContain('MUESTRA 1');
    });

    it('muestra "DUPLICADO 7" cuando es duplicado (numero 7 = idx DUP)', () => {
      component.esDuplicado = true;
      component.numero = 7;
      fixture.detectChanges();

      const titulo = fixture.debugElement.query(By.css('.card-title'));
      expect(titulo.nativeElement.textContent).toContain('DUPLICADO 7');
    });

    it('muestra badge "✓" cuando hay resultado calculado exitoso', () => {
      component.muestraData = createMuestraData({
        resultado: {
          textoReporte: '2,4 × 10³ UFC/g',
          esSd: false,
          ufc: 2400
        }
      });
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.card-badge'));
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent.trim()).toBe('✓');
    });

    it('muestra badge "SD" cuando resultado esSd=true', () => {
      component.muestraData = createMuestraData({
        resultado: {
          textoReporte: 'SD',
          esSd: true
        }
      });
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.card-badge'));
      expect(badge.nativeElement.textContent.trim()).toBe('SD');
    });

    it('muestra badge "< 10" cuando ufc < 10 (NCh2676 8.2.3)', () => {
      component.muestraData = createMuestraData({
        resultado: {
          textoReporte: '5 UFC/g',
          esSd: false,
          ufc: 5
        }
      });
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.card-badge'));
      expect(badge.nativeElement.textContent.trim()).toBe('< 10');
    });
  });

  describe('botón calcular (integración)', () => {
    it('emite el muestraId al hacer click en "Calcular muestra"', () => {
      spyOn(component.calcular, 'emit');

      const btn = fixture.debugElement.query(By.css('.btn-calcular'));
      btn.nativeElement.click();

      expect(component.calcular.emit).toHaveBeenCalledWith('M1');
    });

    it('deshabilita el botón mientras isLoading=true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.btn-calcular'));
      expect(btn.nativeElement.disabled).toBeTrue();
      expect(btn.nativeElement.textContent).toContain('Calculando...');
    });

    it('muestra "Calcular muestra" cuando isLoading=false', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.btn-calcular'));
      expect(btn.nativeElement.textContent).toContain('Calcular muestra');
    });
  });

  describe('integración de 3 secciones', () => {
    it('renderiza recuento-section, confirmacion-section y resultado-section', () => {
      const recuento = fixture.debugElement.query(By.css('app-recuento-section'));
      const confirmacion = fixture.debugElement.query(By.css('app-confirmacion-coagulasa-section'));
      const resultado = fixture.debugElement.query(By.css('app-resultado-calculo-section'));

      expect(recuento).toBeTruthy();
      expect(confirmacion).toBeTruthy();
      expect(resultado).toBeTruthy();
    });
  });

  describe('propagación de cambios', () => {
    it('emite muestraDataChange al cambiar diluciones', () => {
      spyOn(component.muestraDataChange, 'emit');
      const nuevasDil = [{ dil: -2, colonias: [10, 20] as [number | null, number | null] }];

      component.onDilucionesChange(nuevasDil);

      expect(component.muestraDataChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ diluciones: nuevasDil })
      );
    });

    it('emite muestraDataChange al cambiar coloniasPosibles', () => {
      spyOn(component.muestraDataChange, 'emit');

      component.onColoniasPosiblesChange([28, 30]);

      expect(component.muestraDataChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ coloniasPosibles: [28, 30] })
      );
    });
  });
});
