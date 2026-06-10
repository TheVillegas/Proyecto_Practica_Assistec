import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmacionCoagulasaSectionComponent } from './confirmacion-coagulasa-section.component';

describe('ConfirmacionCoagulasaSectionComponent', () => {
  let component: ConfirmacionCoagulasaSectionComponent;
  let fixture: ComponentFixture<ConfirmacionCoagulasaSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmacionCoagulasaSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmacionCoagulasaSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('totalConfirmar (validación máx. 5)', () => {
    it('suma ambas placas correctamente cuando hay datos', () => {
      component.colConfirmar = [3, 2];
      expect(component.totalConfirmar).toBe(5);
    });

    it('totalConfirmar = 0 cuando ambos son null', () => {
      component.colConfirmar = [null, null];
      expect(component.totalConfirmar).toBe(0);
    });

    it('totalConfirmar > 5 dispara la advertencia (NCh2676 bloquea)', () => {
      component.colConfirmar = [3, 3];
      expect(component.totalConfirmar).toBe(6);

      fixture.detectChanges();
      const warning = fixture.debugElement.query(By.css('.max-warning'));
      expect(warning).toBeTruthy();
      expect(warning.nativeElement.textContent).toContain('6');
    });

    it('no muestra advertencia cuando totalConfirmar <= 5', () => {
      component.colConfirmar = [2, 3];
      fixture.detectChanges();

      const warning = fixture.debugElement.query(By.css('.max-warning'));
      expect(warning).toBeNull();
    });
  });

  describe('isCoagulasa4hPositive (resolución 4h vs 24h)', () => {
    it('es positivo si coagulasa 4h placa A > 0', () => {
      component.coagulasa4h = [1, 0];
      expect(component.isCoagulasa4hPositive).toBeTrue();
    });

    it('es positivo si coagulasa 4h placa B > 0', () => {
      component.coagulasa4h = [0, 1];
      expect(component.isCoagulasa4hPositive).toBeTrue();
    });

    it('es negativo si ambas placas coagulasa 4h son 0 o null', () => {
      component.coagulasa4h = [0, 0];
      expect(component.isCoagulasa4hPositive).toBeFalse();
    });
  });

  describe('emisión de cambios', () => {
    it('emite colConfirmarChange al cambiar A confirmar A', () => {
      spyOn(component.colConfirmarChange, 'emit');
      component.onColConfirmarAChange(3);
      expect(component.colConfirmarChange.emit).toHaveBeenCalledWith([3, null]);
    });

    it('emite coagulasa4hChange al cambiar coag 4h placa A', () => {
      spyOn(component.coagulasa4hChange, 'emit');
      component.onCoagulasa4hAChange(1);
      expect(component.coagulasa4hChange.emit).toHaveBeenCalledWith([1, null]);
    });

    it('emite coagulasa24hChange al cambiar coag 24h placa B', () => {
      spyOn(component.coagulasa24hChange, 'emit');
      component.onCoagulasa24hBChange(2);
      expect(component.coagulasa24hChange.emit).toHaveBeenCalledWith([null, 2]);
    });
  });

  describe('renderizado', () => {
    it('muestra etiqueta "Lectura usada" si coagulasaUsada está definida', () => {
      component.coagulasaUsada = '4 hrs';
      fixture.detectChanges();

      const info = fixture.debugElement.query(By.css('.coagulasa-info'));
      expect(info).toBeTruthy();
      expect(info.nativeElement.textContent).toContain('4 hrs');
    });

    it('no muestra etiqueta de lectura usada si coagulasaUsada es null', () => {
      component.coagulasaUsada = null;
      fixture.detectChanges();

      const info = fixture.debugElement.query(By.css('.coagulasa-info'));
      expect(info).toBeNull();
    });
  });
});
