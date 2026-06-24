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

  it('debe iniciar en paso 1', () => {
    expect(component.pasoActual()).toBe(1);
  });

  it('debe avanzar y retroceder pasos', () => {
    component.avanzarPaso();
    expect(component.pasoActual()).toBe(2);
    component.retrocederPaso();
    expect(component.pasoActual()).toBe(1);
  });

  it('debe calcular progreso correctamente', () => {
    component.pasoActual.set(5);
    expect(component.progresoPorcentaje).toBe(44);
  });

  it('debe mapear paso a etapa visual', () => {
    component.pasoActual.set(2);
    expect(component.etapaVisualActual).toBe(1);
    component.pasoActual.set(6);
    expect(component.etapaVisualActual).toBe(2);
    component.pasoActual.set(9);
    expect(component.etapaVisualActual).toBe(3);
  });
});
