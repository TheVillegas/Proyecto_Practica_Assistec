import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EntPesadoComponent } from './ent-pesado.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntPesadoComponent', () => {
  let component: EntPesadoComponent;
  let fixture: ComponentFixture<EntPesadoComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntPesadoComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntPesadoComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      codigoALI: ['ALI-2025-00421'],
      nActa: [''],
      tipoMuestra: [''],
      nMuestra10g90ml: [null],
      nMuestra50g450ml: [null],
      fechaInicio: [''],
      horaInicio: [''],
      analistaInicio: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render codigoALI bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="codigoALI"]'));
    expect(input).toBeTruthy();
  });

  it('should emit subetapaCompleta', () => {
    crearFixture();
    const spy = jasmine.createSpy('subetapaCompleta');
    component.subetapaCompleta.subscribe(spy);
    component.onSubetapaCompleta();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
