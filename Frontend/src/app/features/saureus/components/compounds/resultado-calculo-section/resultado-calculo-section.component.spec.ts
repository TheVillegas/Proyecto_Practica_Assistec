import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ResultadoCalculoSectionComponent, ResultadoCalculo } from './resultado-calculo-section.component';

describe('ResultadoCalculoSectionComponent', () => {
  let component: ResultadoCalculoSectionComponent;
  let fixture: ComponentFixture<ResultadoCalculoSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadoCalculoSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResultadoCalculoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formatDilucion (formato UFC/g)', () => {
    it('formatea 0.01 como 10⁻²', () => {
      expect(component.formatDilucion(0.01)).toBe('10⁻² (0.01)');
    });

    it('formatea 0.001 como 10⁻³', () => {
      expect(component.formatDilucion(0.001)).toBe('10⁻³ (0.001)');
    });

    it('devuelve "—" si el factor es undefined', () => {
      expect(component.formatDilucion(undefined)).toBe('—');
    });

    it('devuelve "—" si el factor es 0', () => {
      expect(component.formatDilucion(0)).toBe('—');
    });
  });

  describe('calcularPrevias (fórmula previo)', () => {
    it('calcula (seleccionadas/total) × sumaA', () => {
      component.resultado = {
        textoReporte: '2,4 × 10³ UFC/g',
        esSd: false,
        coloniasSeleccionadas: 2,
        coloniasPosiblesTotal: 5,
        sumaA: 58
      };
      // (2/5) × 58 = 23.2
      expect(component.calcularPrevias()).toBeCloseTo(23.2, 1);
    });

    it('devuelve null si faltan datos', () => {
      component.resultado = {
        textoReporte: 'SD',
        esSd: true
      };
      expect(component.calcularPrevias()).toBeNull();
    });

    it('devuelve null si no hay resultado', () => {
      component.resultado = null;
      expect(component.calcularPrevias()).toBeNull();
    });
  });

  describe('getBadgeStatus (estado del badge)', () => {
    it('devuelve "pending" si no hay resultado', () => {
      component.resultado = null;
      expect(component.getBadgeStatus()).toBe('pending');
    });

    it('devuelve "sd" si esSd=true', () => {
      component.resultado = {
        textoReporte: 'SD',
        esSd: true
      };
      expect(component.getBadgeStatus()).toBe('sd');
    });

    it('devuelve "warning" si ufc < 10 (NCh2676 8.2.3)', () => {
      component.resultado = {
        textoReporte: '8 UFC/g',
        esSd: false,
        ufc: 8
      };
      expect(component.getBadgeStatus()).toBe('warning');
    });

    it('devuelve "calculated" si ufc >= 10', () => {
      component.resultado = {
        textoReporte: '2,4 × 10³ UFC/g',
        esSd: false,
        ufc: 2400
      };
      expect(component.getBadgeStatus()).toBe('calculated');
    });
  });

  describe('renderizado condicional', () => {
    it('muestra "Sin calcular" si no hay resultado', () => {
      component.resultado = null;
      fixture.detectChanges();

      const sinResultado = fixture.debugElement.query(By.css('.sin-resultado'));
      expect(sinResultado).toBeTruthy();
      expect(sinResultado.nativeElement.textContent).toContain('Sin calcular');
    });

    it('muestra textoReporte cuando hay resultado', () => {
      component.resultado = {
        textoReporte: '1,2 × 10³ UFC/g',
        esSd: false,
        aPlacaA: 9,
        aPlacaB: 15,
        sumaA: 24
      };
      fixture.detectChanges();

      const ne = fixture.debugElement.queryAll(By.css('.calc-row'))[5]; // NE row
      expect(ne.nativeElement.textContent).toContain('1,2 × 10³ UFC/g');
    });
  });
});
