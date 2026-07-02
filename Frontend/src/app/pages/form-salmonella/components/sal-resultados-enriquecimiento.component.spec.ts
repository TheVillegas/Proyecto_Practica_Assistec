import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SalResultadosEnriquecimientoComponent } from './sal-resultados-enriquecimiento.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';
import { MuestraResEnriquecimiento } from '../form-salmonella.page';

describe('SalResultadosEnriquecimientoComponent', () => {
  let component: SalResultadosEnriquecimientoComponent;
  let fixture: ComponentFixture<SalResultadosEnriquecimientoComponent>;

  const muestraBase: MuestraResEnriquecimiento = {
    id: '1',
    idSalMuestra: 1,
    esDuplicado: false,
    label: 'Muestra 1',
    caldoApt: false,
    selenito: false,
    rappaport: false,
    ctrlPositivoSEnteritidis: false,
    ctrlNegativoKPneumoniae: false,
    ctrlBlanco: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SalResultadosEnriquecimientoComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule, IonicModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SalResultadosEnriquecimientoComponent);
    component = fixture.componentInstance;
    component.muestras = [{ ...muestraBase }];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle a boolean field and emit muestrasChange', () => {
    const spy = jasmine.createSpy('muestrasChange');
    component.muestrasChange.subscribe(spy);
    const muestra = component.muestras[0];

    component.toggleCelda(muestra, 'caldoApt');

    expect(muestra.caldoApt).toBeTrue();
    expect(spy).toHaveBeenCalledWith(component.muestras);
  });

  it('should toggle back to false on a second click', () => {
    const muestra = component.muestras[0];
    component.toggleCelda(muestra, 'selenito');
    component.toggleCelda(muestra, 'selenito');
    expect(muestra.selenito).toBeFalse();
  });
});
