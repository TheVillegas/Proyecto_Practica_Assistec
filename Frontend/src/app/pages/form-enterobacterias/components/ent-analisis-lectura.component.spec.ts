import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EntAnalisisLecturaComponent } from './ent-analisis-lectura.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntAnalisisLecturaComponent', () => {
  let component: EntAnalisisLecturaComponent;
  let fixture: ComponentFixture<EntAnalisisLecturaComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntAnalisisLecturaComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntAnalisisLecturaComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      fechaLectura24h: [''],
      horaLectura24h: [''],
      analistaLectura24h: [''],
      nMuestraLectura: [null],
      dilucion: [null],
      colonias: [null],
      equipoCuentaColonias: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render fechaLectura24h bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="fechaLectura24h"]'));
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
