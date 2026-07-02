import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { SalControlesCalidadComponent } from './sal-controles-calidad.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('SalControlesCalidadComponent', () => {
  let component: SalControlesCalidadComponent;
  let fixture: ComponentFixture<SalControlesCalidadComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SalControlesCalidadComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule, IonicModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(SalControlesCalidadComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      descripcionCtrlAnalisis: [''],
      resultadoCtrlAnalisis: [''],
      ctrlPositivoBlancoAli: [''],
      resultadoCtrlPositivo: [''],
      ctrlSiembraAli: [''],
      resultadoCtrlSiembra: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render resultadoCtrlAnalisis radios bound to form control', () => {
    crearFixture();
    const radios = fixture.debugElement.queryAll(By.css('[formControlName="resultadoCtrlAnalisis"]'));
    expect(radios.length).toBe(2);
  });

  it('campoInvalido should return false for a valid untouched control', () => {
    crearFixture();
    expect(component.campoInvalido('descripcionCtrlAnalisis')).toBeFalse();
  });

  it('campoInvalido should return false for a control that does not exist', () => {
    crearFixture();
    expect(component.campoInvalido('inexistente')).toBeFalse();
  });
});
