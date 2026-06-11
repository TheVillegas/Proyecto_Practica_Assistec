import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { Etapa5CalculoComponent, MuestraData } from './etapa5-calculo.component';
import { CalculoService } from '../../../services/calculo.service';

describe('Etapa5CalculoComponent', () => {
  let component: Etapa5CalculoComponent;
  let fixture: ComponentFixture<Etapa5CalculoComponent>;
  let calculoServiceSpy: jasmine.SpyObj<CalculoService>;

  const createMuestraData = (overrides: Partial<MuestraData> = {}): MuestraData => ({
    diluciones: [
      { dil: 2, colonias: [null, null] },
      { dil: 3, colonias: [null, null] }
    ],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null],
    ...overrides
  });

  beforeEach(async () => {
    calculoServiceSpy = jasmine.createSpyObj('CalculoService', ['calcularMuestra', 'importarDuplicado']);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), Etapa5CalculoComponent],
      providers: [
        { provide: CalculoService, useValue: calculoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Etapa5CalculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('estructura de acordeones', () => {
    it('renderiza 6 acordeones para M1-M6', () => {
      const acordeones = fixture.debugElement.queryAll(By.css('ion-accordion'));
      expect(acordeones.length).toBe(6);
    });

    it('muestra header correcto para M1', () => {
      const labels = fixture.debugElement.queryAll(By.css('ion-accordion ion-label'));
      expect(labels[0].nativeElement.textContent).toContain('ETAPA 5 : Cálculo S. Aureus M1');
    });

    it('muestra header correcto para M6', () => {
      const labels = fixture.debugElement.queryAll(By.css('ion-accordion ion-label'));
      expect(labels[5].nativeElement.textContent).toContain('ETAPA 5 : Cálculo S. Aureus M6');
    });
  });

  describe('botones calcular', () => {
    it('renderiza 7 botones (6 muestras + 1 duplicado)', () => {
      const botones = fixture.debugElement.queryAll(By.css('ion-button'));
      expect(botones.length).toBe(7);
    });

    it('el botón de M1 muestra texto correcto', () => {
      const botones = fixture.debugElement.queryAll(By.css('ion-button'));
      expect(botones[0].nativeElement.textContent).toContain('Calcular S. Aureus M1');
    });

    it('el botón de duplicado muestra texto correcto', () => {
      const botones = fixture.debugElement.queryAll(By.css('ion-button'));
      expect(botones[6].nativeElement.textContent).toContain('Calcular Duplicado');
    });
  });

  describe('sección recuento', () => {
    it('muestra hint MNPC > 250 bajo Placa A de la primera dilución', () => {
      const hints = fixture.debugElement.queryAll(By.css('.text-\[10px\]'));
      const mnpcHint = hints.find(h => h.nativeElement.textContent.includes('MNPC > 250'));
      expect(mnpcHint).toBeTruthy();
    });

    it('muestra hint SD = 0 bajo Placa B de la primera dilución', () => {
      const hints = fixture.debugElement.queryAll(By.css('.text-\[10px\]'));
      const sdHint = hints.find(h => h.nativeElement.textContent.includes('SD = 0'));
      expect(sdHint).toBeTruthy();
    });
  });

  describe('duplicado integrado', () => {
    it('renderiza sección duplicado solo en el primer acordeón (M1)', () => {
      const duplicados = fixture.debugElement.queryAll(By.css('.border-dashed'));
      expect(duplicados.length).toBe(1);
    });

    it('muestra label "Duplicado" en el contenedor dashed', () => {
      const duplicadoLabel = fixture.debugElement.query(By.css('.border-dashed span'));
      expect(duplicadoLabel.nativeElement.textContent).toContain('Duplicado');
    });
  });

  describe('resultados', () => {
    it('muestra resultado S. aureus cuando está disponible', () => {
      component.muestras[0].data.resultado = {
        textoReporte: '2,4 x 10^3 UFC/g',
        esSd: false,
        ufc: 2400,
        sumaA: 48,
        factorDilucion: 0.01
      };
      fixture.detectChanges();

      const resultado = fixture.debugElement.query(By.css('.text-blue-700'));
      expect(resultado.nativeElement.textContent).toContain('2,4 x 10^3 UFC/g');
    });
  });

  describe('formularioBloqueado', () => {
    it('deshabilita inputs cuando formularioBloqueado=true', () => {
      component.formularioBloqueado = true;
      fixture.detectChanges();

      const inputs = fixture.debugElement.queryAll(By.css('ion-input'));
      const disabledCount = inputs.filter(i => i.nativeElement.disabled === true || i.attributes['disabled'] !== undefined).length;
      expect(disabledCount).toBeGreaterThan(0);
    });
  });
});
