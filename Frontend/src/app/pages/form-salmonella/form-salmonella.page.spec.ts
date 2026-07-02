import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormSalmonellaPage } from './form-salmonella.page';

describe('FormSalmonellaPage', () => {
  let component: FormSalmonellaPage;
  let fixture: ComponentFixture<FormSalmonellaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormSalmonellaPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '42' } } }
        }
      ]
    });

    fixture = TestBed.createComponent(FormSalmonellaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar en etapa 1', () => {
    expect(component.pasoActual()).toBe(1);
  });

  it('debe tener 8 etapas', () => {
    expect(component.TOTAL_ETAPAS).toBe(8);
    expect(component.NOMBRES_ETAPAS.length).toBe(8);
  });

  it('debe avanzar y retroceder etapas', () => {
    component.avanzarEtapa();
    expect(component.pasoActual()).toBe(2);
    component.retrocederEtapa();
    expect(component.pasoActual()).toBe(1);
  });

  it('no debe avanzar más allá de la última etapa', () => {
    component.pasoActual.set(8);
    component.avanzarEtapa();
    expect(component.pasoActual()).toBe(8);
  });

  it('no debe retroceder antes de la primera etapa', () => {
    component.pasoActual.set(1);
    component.retrocederEtapa();
    expect(component.pasoActual()).toBe(1);
  });

  it('debe calcular progreso correctamente', () => {
    component.pasoActual.set(8);
    expect(component.progresoPorcentaje).toBe(100);
  });

  it('debe permitir saltar a una etapa válida con irAEtapa', () => {
    component.irAEtapa(5);
    expect(component.pasoActual()).toBe(5);
    component.irAEtapa(99);
    expect(component.pasoActual()).toBe(5);
  });
});
